require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const { parseImageTags } = require('../schemas/imageTag.schema');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

async function classifyImage(filePath, mimeType = 'image/jpeg') {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  const imagePart = imageToGenerativePart(filePath, mimeType);

  const result = await model.generateContent([TAGGING_PROMPT, imagePart]);
  const rawText = result.response.text();

  // Gemini sometimes wraps JSON in ```json fences despite instructions — strip them
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