import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function runTest() {
  try {
    const key = process.env.GEMINI_API_KEY;
    console.log('Testing model: gemini-2.5-flash');
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent('Reply with exactly "Hello"');
    console.log('✅ SUCCESS:', result.response.text());

  } catch (error) {
    console.error('❌ FAILED:');
    console.error(error.message);
  }
}

runTest();
