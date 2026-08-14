require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const { parseImageTags } = require('../schemas/imageTag.schema');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = 'gemini-flash-latest';

const TAGGING_PROMPT = `
Analyze this image and respond with ONLY a JSON object (no markdown, no code fences, no extra text) in exactly this shape:

{
  "subject": "the main subject, e.g. red fox",
  "category": "general category, e.g. animal",
  "attributes": ["array", "of", "descriptive", "attributes"],
  "caption": "one sentence describing the image",
  "confidence": 0.0 to 1.0, how confident you are in this classification
}
`;

function imageToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: fs.readFileSync(filePath).toString('base64'),
      mimeType,
    },
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGeminiWithRetry(model, promptParts, maxRetries = 4) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(promptParts);
      return result;
    } catch (err) {
      lastError = err;
      const isRetryable = err.status === 503 || err.status === 429;
      if (!isRetryable || attempt === maxRetries) throw err;

      const backoffMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s, 8s
      console.log(`Attempt ${attempt} failed (${err.status}), retrying in ${backoffMs}ms...`);
      await sleep(backoffMs);
    }
  }
  throw lastError;
}

async function classifyImage(filePath, mimeType = 'image/jpeg') {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const imagePart = imageToGenerativePart(filePath, mimeType);

  const result = await callGeminiWithRetry(model, [TAGGING_PROMPT, imagePart]);
  const rawText = result.response.text();
  const cleaned = rawText.replace(/```json|```/g, '').trim();

  let parsedJson;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch (err) {
    return { valid: false, errors: { message: 'Model did not return valid JSON', raw: rawText }, data: null };
  }

  return parseImageTags(parsedJson);
}

module.exports = { classifyImage };