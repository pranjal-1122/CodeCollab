import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini client
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * [Vercel Serverless Function]
 * This is the main handler for our API.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --- 1. GET NEW PARAMETERS ---
  // We now accept the user's message and the chat history
  const { code, language, message, history = [] } = req.body;

  // Validate input
  if (!code || !language || !message) {
    return res.status(400).json({
      error: "Missing 'code', 'language', or 'message' field.",
    });
  }

  // --- 2. CREATE A NEW, SMARTER PROMPT ---
  // This prompt is designed for conversation and concise answers.
  const systemPrompt = `
    You are an expert ${language} coding mentor.
    Your tone is helpful, encouraging, and a little bit fun.
    You are chatting with a student who is looking at this code:

    \`\`\`${language}
    ${code}
    \`\`\`

    **Your Rules:**
    1.  **Be CONCISE.** If the code is simple (like "print('Hello World')"), just give a short, one-sentence acknowledgment. DO NOT give a long, multi-point analysis for simple code.
    2.  If this is the *first* message ("Get AI Help"), provide a *brief* (2-3 sentences) analysis of the code. Look for optimization, bugs, or best practices.
    3.  If this is a *follow-up* message, answer the user's question directly, using the code and chat history for context.
    4.  Use Markdown (like **bold** and *italics*) for formatting.
    5.  Do not repeat the code back to the user unless they ask for it.
  `;

  // --- 3. CONFIGURE THE MODEL FOR CHAT ---
  const chat = model.startChat({
    // We pass the new system prompt and the existing history
    history: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Got it! I'm ready to help with the code." }] },
      // Now, add all the previous messages from the chat
      ...history,
    ],
    generationConfig: {
      maxOutputTokens: 1000,
    },
  });

  try {
    // --- 4. SEND THE USER'S NEW MESSAGE ---
    const result = await chat.sendMessage(message);
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