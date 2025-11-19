import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * [Vercel Serverless Function]
 * THE MEGA-SEED GENERATOR
 * * This function analyzes a coding problem and generates a "Logic Guide"
 * containing Regex patterns for the Optimal Solution and Common Anti-Patterns.
 * * It DOES NOT save to Firestore directly. It returns the JSON to the client,
 * which then saves it to the 'problemGuides' collection.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { problemId, title, description, language = "python" } = req.body;

  if (!description || !title) {
    return res.status(400).json({ error: "Missing problem description or title." });
  }

  // --- THE GOD PROMPT ---
  // This prompts the AI to act as a Senior Engineer and output strict JSON.
  const systemPrompt = `
    You are a Senior Algorithm Engineer and Regex Expert.
    
    **TASK:**
    Analyze the coding problem below and generate a "Logic Guide" used to provide automated, real-time feedback to students.
    
    **PROBLEM:** "${title}"
    **DESCRIPTION:** ${description.substring(0, 1000)}... (truncated for brevity)
    **TARGET LANGUAGE:** ${language}

    **OUTPUT REQUIREMENT:**
    Return a SINGLE, raw JSON object. Do NOT use Markdown formatting (no \`\`\`).
    
    The JSON must follow this EXACT schema:
    {
      "problemId": "${problemId}",
      "optimal_pattern": {
        "name": "String", // e.g., "HashMap Approach" or "Two-Pointer"
        "regex": "String", // A simple, robust regex to detect this approach in ${language}
        "praise_msg": "String" // Short, encouraging praise (max 15 words)
      },
      "known_mistakes": [
        {
          "id": "String", // unique slug, e.g., "nested_loops"
          "regex": "String", // Regex to detect this specific mistake
          "hint_msg": "String" // Helpful hint explaining why this is wrong (max 20 words)
        }
        // Provide 2-3 common mistakes (e.g., Brute Force O(n^2), misuse of types)
      ]
    }

    **REGEX RULES:**
    1. Make regexes flexible (allow whitespace).
    2. For Python, look for things like 'for.*in.*for' (nested loops).
    3. For 'optimal_pattern', look for key data structures (e.g., 'dict', 'set', 'HashMap') or specific method calls.
  `;

  try {
    // 1. Call Gemini
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text();

    // 2. CLEANUP: Remove Markdown if Gemini adds it (e.g., ```json ... ```)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // 3. Parse JSON
    const guideData = JSON.parse(text);

    // 4. Return the structured guide
    return res.status(200).json({ guide: guideData });

  } catch (error) {
    console.error("Mega-Seed Generation Error:", error);
    return res.status(500).json({ 
      error: "Failed to generate guide.", 
      details: error.message 
    });
  }
}