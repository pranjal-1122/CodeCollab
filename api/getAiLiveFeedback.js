import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * [Vercel Serverless Function]
 * THE SELF-LEARNING FEEDBACK LOOP
 * * Context: This is called when the client's local Regex Guide found NO matches.
 * Task: Analyze the code. If it's a specific mistake, generate a NEW regex 
 * so the system can "learn" and catch it locally next time.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { 
    code, 
    language = "python", 
    problemTitle, 
    problemDescription 
  } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Missing code." });
  }

  // --- THE FEEDBACK LOOP PROMPT ---
  // We ask Gemini to categorize the code into one of 3 states:
  // 1. PRAISE (Good/Optimal code)
  // 2. NEW_MISTAKE (A logical flaw we should add to our library)
  // 3. NEUTRAL (Incomplete code, just typing)
  const systemPrompt = `
    You are a Senior Coding Mentor.
    The user is solving: "${problemTitle}".
    
    **USER'S CODE (${language}):**
    \`\`\`
    ${code}
    \`\`\`

    **YOUR TASK:**
    Analyze the logic. Since this code didn't match our existing patterns, determine what it is.
    
    **SCENARIO A: It is a Logical Mistake or Anti-Pattern.**
    If the code has a clear flaw (e.g., wrong complexity, infinite loop bug, misuse of API), you MUST generate a Regex to catch this specific *type* of mistake in the future.
    
    **SCENARIO B: It is Correct/Optimal.**
    If the logic is sound or a good milestone.
    
    **SCENARIO C: It is Incomplete/Neutral.**
    If they are just typing and haven't finished a thought yet.

    **OUTPUT REQUIREMENT:**
    Return a SINGLE, raw JSON object (no markdown).
    
    Schema:
    {
      "status": "new_mistake" | "praise" | "neutral",
      
      // IF status is 'new_mistake':
      "new_pattern": {
        "id": "short_slug", // e.g. "recursive_no_base_case"
        "regex": "String", // A flexible regex to catch this pattern
        "hint_msg": "String" // 1 sentence hint
      },
      
      // IF status is 'praise':
      "message": "String" // Short praise
    }
  `;

  try {
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text();

    // Cleanup Markdown if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const feedbackData = JSON.parse(text);

    return res.status(200).json(feedbackData);

  } catch (error) {
    console.error("Live Feedback Error:", error);
    // Fallback to neutral if AI fails, so we don't break the user flow
    return res.status(200).json({ status: "neutral" });
  }
}