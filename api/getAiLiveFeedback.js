import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --- 1. GET DESCRIPTION ---
  const { code, language, problemTitle, problemDescription } = req.body;

  if (!code) return res.status(400).json({ error: "Missing code." });

  const systemPrompt = `
    You are an elite Coding Mentor. 
    
    **CONTEXT:**
    - Problem: "${problemTitle}"
    - Language: ${language}
    - Description: "${problemDescription ? problemDescription.substring(0, 500) + "..." : "N/A"}"
    
    **USER CODE:**
    \`\`\`${language}
    ${code}
    \`\`\`

    **YOUR TASK:**
    Categorize the code into ONE status.
    *CRITICAL:* Compare the code's Time/Space Complexity against the Problem Description's implied constraints.
    
    **PRIORITY 1: SYNTAX_ERROR**
    - Major syntax crashes (missing brackets, type errors).
    - Ignore minor "typing in progress" states (NEUTRAL).
    
    **PRIORITY 2: LOGIC_MISTAKE**
    - Wrong Algorithm (e.g., O(n^2) when O(n) is needed).
    - Fails edge cases mentioned in description.
    - **ACTION:** Generate a variable-agnostic Regex (use \\w+, \\s*).
    
    **PRIORITY 3: SUGGESTION**
    - Code style, variable naming, readability.
    
    **PRIORITY 4: PRAISE**
    - Optimal solution that matches requirements.

    **OUTPUT JSON:**
    {
      "status": "syntax_error" | "logic_mistake" | "suggestion" | "praise" | "neutral",
      "message": "Short feedback message.",
      "new_pattern": { "id": "slug", "regex": "REGEX", "hint_msg": "Hint" } // Only for logic_mistake
    }
  `;

  try {
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return res.status(200).json(JSON.parse(text));
  } catch (error) {
    console.error("AI Error:", error);
    return res.status(200).json({ status: "neutral" });
  }
}