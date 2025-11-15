import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini client
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * [Vercel Serverless Function]
 * This function generates a progressive, harness-aware hint for a DSA problem.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --- 1. Get all the context from the frontend ---
  const { 
    problemDescription, 
    functionTemplate, 
    userCode, 
    previousHints = [] // This includes the static hint + any previous AI hints
  } = req.body;

  // Validate input
  if (!problemDescription || !functionTemplate || !userCode) {
    return res.status(400).json({
      error: "Missing 'problemDescription', 'functionTemplate', or 'userCode'.",
    });
  }

  // --- 2. Construct the detailed, harness-aware prompt ---
  // This is the "magic" that ensures valid hints.
  const prompt = `
    You are an expert DSA tutor. A student is stuck on the following problem.

    **PROBLEM:**
    ${problemDescription}

    **REQUIRED HARNESS:**
    The student's solution MUST fit inside this code structure:
    \`\`\`
    ${functionTemplate}
    \`\`\`

    **STUDENT'S CURRENT CODE:**
    \`\`\`
    ${userCode}
    \`\`\`

    **PREVIOUS HINTS GIVEN:**
    ${previousHints.map((hint, i) => `${i + 1}. ${hint}`).join('\n') || 'None yet.'}

    **YOUR TASK:**
    Provide the *next* logical, 1-2 sentence hint to help the student.
    
    **RULES:**
    1.  **DO NOT** give the full solution.
    2.  **DO NOT** repeat a hint they have already received.
    3.  Your hint **MUST** be compatible with the **REQUIRED HARNESS**.
    4.  Your hint should be progressive. If they have no code, give a high-level approach. If they have some code, guide them on the next step or fix a bug.
    5.  Be encouraging, like a helpful tutor.
  `;

  try {
    // 3. Call the Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const newHint = response.text();

    // 4. Send the successful response back
    return res.status(200).json({ newHint });

  } catch (error) {
    console.error("Gemini API error (getAiHint):", error);
    return res.status(500).json({
      error: "An error occurred while getting an AI hint.",
    });
  }
}