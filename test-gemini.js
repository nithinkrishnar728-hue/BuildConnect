import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function runTest() {
  try {
    const key = process.env.GEMINI_API_KEY;
    console.log('Testing Gemini API...');
    console.log('Using Key:', key ? key.substring(0, 10) + '...' : 'UNDEFINED');
    
    if (!key) {
      console.error('FAIL: No API key found in .env');
      return;
    }

    const genAI = new GoogleGenerativeAI(key);
    
    console.log('Attempting to use model: gemini-1.5-flash');
    const model1 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    try {
      const result1 = await model1.generateContent('Reply with exactly "Hello"');
      console.log('✅ gemini-1.5-flash SUCCESS:', result1.response.text());
      return;
    } catch (e) {
      console.error('❌ gemini-1.5-flash FAILED:', e.message);
    }

    console.log('\nAttempting to use model: gemini-pro');
    const model2 = genAI.getGenerativeModel({ model: 'gemini-pro' });
    try {
      const result2 = await model2.generateContent('Reply with exactly "Hello"');
      console.log('✅ gemini-pro SUCCESS:', result2.response.text());
      return;
    } catch (e) {
      console.error('❌ gemini-pro FAILED:', e.message);
    }

  } catch (error) {
    console.error('CRITICAL ERROR:', error);
  }
}

runTest();
