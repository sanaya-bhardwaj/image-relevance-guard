require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('../db');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const EMBEDDING_MODEL = 'gemini-embedding-001';

async function embedText(text) {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values; // array of floats
}

module.exports = { embedText };