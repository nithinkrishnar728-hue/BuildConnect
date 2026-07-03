import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key);
    const data = await res.json();
    console.log("AVAILABLE MODELS:");
    if (data.models) {
        data.models.forEach(m => console.log(m.name));
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error fetching models:', error);
  }
}

listModels();
