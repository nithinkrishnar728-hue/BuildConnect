import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { protect } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /api/ai/suggest-materials
 * Accepts project details and returns AI-generated material suggestions.
 * Requires authentication – the API key is NEVER exposed to the frontend.
 */
router.post('/suggest-materials', protect, asyncHandler(async (req, res) => {
  const { projectDetails } = req.body;

  if (!projectDetails) {
    throw new AppError('Project details are required.', 400);
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('AI service is not configured on the server.', 503);
  }

  // Use gemini-2.5-flash
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an expert construction consultant working in India. Based on the following project details, suggest a list of suitable construction materials.

Format your response clearly with:
1. A brief overview of your recommendations
2. A categorised list of materials (e.g., Structural, Finishing, Plumbing, Electrical) with bullet points
3. For each material: name, why it is suitable, and estimated cost range in Indian Rupees (₹) if possible
4. One or two sustainability/eco-friendly alternatives if relevant

Project Details:
${JSON.stringify(projectDetails, null, 2)}

Keep the suggestions practical, locally available in India, and appropriate for the project scale and budget.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  res.json({ success: true, suggestions: text });
}));

/**
 * POST /api/ai/generate-contract
 * Generates a plain-text independent contractor agreement based on job details.
 */
router.post('/generate-contract', protect, asyncHandler(async (req, res) => {
  const { clientName, providerName, projectName, role, budget, startDate, endDate } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('AI service is not configured on the server.', 503);
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an expert legal aide for the construction industry in India.
Generate a concise, professional Independent Contractor Agreement (3-4 short paragraphs).
Do NOT include any markdown formatting (no asterisks, no hashes, no HTML), just plain text with standard line breaks.

Details:
- Client: ${clientName || 'The Client'}
- Contractor: ${providerName || 'The Contractor'}
- Role: ${role || 'Construction Professional'}
- Project: ${projectName || 'Construction Project'}
- Compensation: ₹${budget || 'TBD'}
- Timeline: ${startDate ? new Date(startDate).toLocaleDateString() : 'TBD'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'TBD'}

Include:
1. Services: Contractor agrees to provide services for the project.
2. Payment: Client agrees to pay the compensation.
3. Independent Contractor Status & Liability.

Keep it direct, professional, and ready to be signed.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  res.json({ success: true, contract: text.replace(/\*/g, '').trim() }); // strip any lingering markdown
}));

/**
 * POST /api/ai/analyze-project
 * Analyzes construction project health based on budget and timeline metrics.
 */
router.post('/analyze-project', protect, asyncHandler(async (req, res) => {
  const { projectName, metrics } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('AI service is not configured on the server.', 503);
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an expert Senior Construction Project Manager.
Analyze the health of the project "${projectName || 'Construction Project'}" based on these metrics:
${JSON.stringify(metrics, null, 2)}

Write a concise, punchy 2-paragraph health assessment. 
Paragraph 1: Summary of progress and budget status (are they overspending, underspending, or on track?).
Paragraph 2: Identify any risks (e.g. lots of overdue tasks, budget nearly exhausted but stages remain) and give one actionable piece of advice.

Do NOT include any markdown formatting (no asterisks, no hashes, no HTML), just plain text with standard line breaks.
Keep it direct, professional, and readable for a client dashboard.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  res.json({ success: true, analysis: text.replace(/\*/g, '').trim() });
}));

/**
 * POST /api/ai/parse-request
 * Parses a natural language input string into structured JSON for the Create Request form.
 */
router.post('/parse-request', protect, asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('AI service is not configured on the server.', 503);
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an AI assistant that extracts structured data from natural language construction requests.
Given the user input below, extract the following fields and return ONLY a valid JSON object matching this structure:
{
  "title": "A short, professional title",
  "description": "A fleshed out description based on the input",
  "budget": number (extract the price as an integer, or 0 if not mentioned),
  "category": "Must be ONE OF exactly: structural, electrical, plumbing, painting, carpentry, masonry, roofing, general-labor, other",
  "location": "Extract city or location if mentioned, or empty string",
  "urgent": boolean (true if words like tomorrow, asap, urgent are used)
}

User Input: "${text}"

Return ONLY the raw JSON object. Do not wrap it in markdown code blocks (\`\`\`).`;

  const result = await model.generateContent(prompt);
  let responseText = result.response.text().trim();
  
  // Clean up any markdown json formatting if Gemini includes it
  if (responseText.startsWith('\`\`\`json')) {
      responseText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
  } else if (responseText.startsWith('\`\`\`')) {
      responseText = responseText.replace(/\`\`\`/g, '').trim();
  }

  let parsedData;
  try {
      parsedData = JSON.parse(responseText);
  } catch (e) {
      throw new AppError('Failed to parse AI response into structured data.', 500);
  }

  res.json({ success: true, data: parsedData });
}));

export default router;
