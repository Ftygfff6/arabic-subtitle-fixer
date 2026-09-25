const OpenAI = require("openai");
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 86400 });

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

/**
 * الوضع 1: تصحيح ترجمة عربية موجودة
 */
async function correctArabic(texts) {
  const cacheKey = `correct_${hash(texts.join(""))}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const prompt = `أنت مصحح ترجمات عربية محترف.
لديك قائمة ترجمات عربية من فيلم/مسلسل، بعضها فيه أخطاء إملائية أو نحوية أو ترجمة ركيكة.

مهمتك:
1. صحح الأخطاء الإملائية والنحوية
2. حسّن الصياغة لتكون فصحى سهلة وطبيعية
3. حافظ على المعنى الأصلي بالضبط
4. لا تحذف أو تضيف أسطراً
5. أرجع نفس عدد الأسطر بنفس الترتيب

أرجع JSON فقط بالشكل: {"corrected": ["نص1", "نص2", ...]}

المدخلات:
${JSON.stringify(texts.map((t, i) => ({ id: i, text: t })))}`;

  const response = await client.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [
      { role: "system", content: "أرجع JSON فقط، بدون شرح." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(response.choices[0].message.content);
  const corrected = result.corrected || [];
  
  cache.set(cacheKey, corrected);
  return corrected;
}

/**
 * الوضع 2: ترجمة من الإنجليزية إلى العربية
 */
async function translateToArabic(texts) {
  const cacheKey = `trans_${hash(texts.join(""))}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const prompt = `أنت مترجم محترف من الإنجليزية إلى العربية.

مهمتك:
1. ترجم كل سطر إلى عربية فصحى طبيعية
2. حافظ على الأسلوب والنبرة
3. لا تترجم الأسماء الخاصة
4. حافظ على التعبيرات الشائعة بمعناها
5. أرجع نفس عدد الأسطر بنفس الترتيب

أرجع JSON فقط بالشكل: {"translated": ["نص1", "نص2", ...]}

المدخلات:
${JSON.stringify(texts.map((t, i) => ({ id: i, text: t })))}`;

  const response = await client.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [
      { role: "system", content: "أرجع JSON فقط، بدون شرح." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(response.choices[0].message.content);
  const translated = result.translated || [];
  
  cache.set(cacheKey, translated);
  return translated;
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

module.exports = { correctArabic, translateToArabic };
