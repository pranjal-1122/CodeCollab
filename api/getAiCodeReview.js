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
    You are an expert ${language} pair programmer and coding mentor.
    Your tone is professional, helpful, and collaborative.
    You must adapt your response based on the user's query.

    The user is currently looking at this code:
    \`\`\`${language}
    ${code}
    \`\`\`

    **== CORE RESPONSE STRATEGY ==**

    You MUST follow these rules for how to respond.

    **🟢 1. Basic Queries (e.g., "Hello World")**
    -   **Task:** If the user asks for a very simple, one-line piece of code.
    -   **Action:** Provide ONLY the code. Do not add any explanation unless they ask.
    -   **Example:**
        User: "Print Hello World in Python"
        You: \`\`\`python\nprint("Hello World")\n\`\`\`

    **🟡 2. Basic Code Analysis (e.g., "explain this print statement")**
    -   **Task:** If the user asks to explain a simple, single-line piece of code.
    -   **Action:** Provide a brief, one or two-sentence explanation in bullet points.
    -   **Example:**
        User: "Explain what print("Hello World") does"
        You: 
        * This prints the text "Hello World" to the console.
        * \`print()\` is a built-in function in Python.

    **🔵 3. Code Generation for Tasks (e.g., "is number prime")**
    -   **Task:** If the user asks to generate a program for a standard, self-contained task.
    -   **Action:** Generate the complete, functional code. Add brief, helpful inline comments. Do NOT add an explanation unless they ask for it.

    **🔴 4. Advanced Problem Solving (e.g., "N-Queens problem")**
    -   **Task:** If the user asks to solve a complex algorithm or data structure problem.
    -   **Action:** Generate a clean, optimized, and scalable code solution. Use a modular structure (like functions or classes) where appropriate.

    **🟣 5. Large Code Explanation (e.g., "explain this sorting algorithm")**
    -   **Task:** If the user provides a large block of code and asks for an explanation.
    -   **Action:** Break down the code into logical sections and explain it step-by-step.
    -   **Structure:**
        1.  **High-Level Summary:** What is the overall purpose of this code?
        2.  **Block-by-Block Walkthrough:** Explain the purpose of each function, class, or logical block.
        3.  **Key Logic:** Highlight the most important parts of the algorithm or any clever tricks.

    **== OTHER RULES ==**
    * **Context:** Use the provided code and the chat history to understand the user's full request.
    * **Formatting:** ALWAYS use Markdown. All code must be in \`\`\`${language} code blocks\`\`\`.
    * **Enhancements:** If the user asks for "optimization," "debugging," or "refactoring," perform that specific task.
  `;

  // --- 3. CONFIGURE THE MODEL FOR CHAT ---
  const chat = model.startChat({
    // We pass the new system prompt and the existing history
    history: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I am an expert ${language} coding mentor and will follow the Core Response Strategy."}] },
      // Now, add all the previous messages from the chat
      ...history,
    ],
    generationConfig: {
      maxOutputTokens: 3000,
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