const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. Initialize the Gemini client
// The API key is automatically read from Vercel's environment variables
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

/**
 * [Vercel Serverless Function]
 * This is the main handler for our API.
 * Vercel automatically turns this into an API endpoint.
 *
 * @param {object} req - The incoming request object (from the frontend).
 * @param {object} res - The outgoing response object (to the frontend).
 */
export default async function handler(req, res) {
  // 1. We only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. We check for a (simulated) user.
  // Note: Vercel doesn't have Firebase's `context.auth`
  // We'll rely on our React app to only call this if the user is logged in.
  // We could add full auth checks later, but this is fine for now.

  const { code, language } = req.body;

  // 3. Validate input data
  if (!code || !language) {
    return res.status(400).json({
      error: "The function must be called with 'code' and 'language' arguments.",
    });
  }

  // 4. Construct the prompt (same as before)
  const prompt = `
    Analyze this ${language} code snippet. Provide feedback in a clear, mentor-like tone.
    Structure your response with the following sections (if applicable):
    
    1.  **Optimization:** Suggestions to improve the time or space complexity.
    2.  **Bug Detection:** Potential runtime errors or logic flaws.
    3.  **Best Practices:** Tips on code style, readability, or language conventions.

    Here is the code:
    \`\`\`${language}
    ${code}
    \`\`\`
  `;

  try {
    // 5. Call the Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestions = response.text();

    // 6. Send the successful response back to the React app
    return res.status(200).json({ suggestions });

  } catch (error) {
    // 7. Handle errors gracefully
    console.error("Gemini API error:", error);
    return res.status(500).json({
      error: "An error occurred while getting AI suggestions.",
    });
  }
}