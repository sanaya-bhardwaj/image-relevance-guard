require('dotenv').config();

async function listModels() {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
  );
  const data = await res.json();

  if (data.models) {
    data.models
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .forEach(m => console.log(m.name));
  } else {
    console.log(data);
  }
}

listModels();