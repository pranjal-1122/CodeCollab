import { useState, useEffect, useRef, useCallback } from 'react';
import { firestore } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

// Helper for debouncing (waiting for user to stop typing)
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export const useLiveMentor = (problemId, code, language, problemData) => {
  // --- STATE ---
  const [feedback, setFeedback] = useState(null); // { type: 'hint'|'praise'|'neutral', message: string, line: number }
  const [guide, setGuide] = useState(null); // The rules loaded from Firestore
  const [loading, setLoading] = useState(false);
  
  // Track the *previous* mistake to give "Correction Praise"
  const previousMistakeRef = useRef(null);

  // Debounce the code input (2 seconds wait)
  const debouncedCode = useDebounce(code, 2000);

  // --- 1. LOAD OR SEED THE GUIDE (The "Lazy Loader") ---
  useEffect(() => {
    if (!problemId || !problemData) return;

    const loadGuide = async () => {
      const guideRef = doc(firestore, 'problemGuides', problemId);
      const guideSnap = await getDoc(guideRef);

      if (guideSnap.exists()) {
        // Case A: Guide exists. Load it.
        console.log("📚 Guide loaded from Firestore");
        setGuide(guideSnap.data());
      } else {
        // Case B: Guide missing. Generate it (Lazy Seed).
        console.log("🌱 Guide missing. Triggering Mega-Seed...");
        setLoading(true);
        try {
          const response = await fetch('/api/seedProblemGuide', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              problemId,
              title: problemData.problemTitle,
              description: problemData.description,
              language: language
            })
          });
          const data = await response.json();
          
          if (data.guide) {
            // Save the new guide to Firestore for next time
            await setDoc(guideRef, data.guide);
            setGuide(data.guide);
          }
        } catch (err) {
          console.error("Seeding failed:", err);
        }
        setLoading(false);
      }
    };

    loadGuide();
  }, [problemId, problemData, language]);


  // --- 2. THE LOGIC ENGINE (Runs when debounced code changes) ---
  useEffect(() => {
    if (!debouncedCode || !guide) return;

    const analyzeCode = async () => {
      // Reset feedback initially (unless we find something)
      setFeedback(null);

      // --- STATE 1: CORRECTION PRAISE ---
      // Did they just fix the specific mistake we warned them about?
      if (previousMistakeRef.current) {
        const { regex } = previousMistakeRef.current;
        const stillHasMistake = new RegExp(regex, 's').test(debouncedCode);
        
        if (!stillHasMistake) {
          setFeedback({
            type: 'praise',
            message: "Nice fix! That logic looks much better now."
          });
          previousMistakeRef.current = null; // Clear it
          return;
        }
      }

      // --- STATE 2: KNOWN MISTAKES (The "Fast Hint") ---
      // Check against our local list of bad patterns
      for (const mistake of guide.known_mistakes || []) {
        try {
          const regex = new RegExp(mistake.regex, 's'); // 's' flag for multiline matching
          if (regex.test(debouncedCode)) {
            setFeedback({
              type: 'hint',
              message: mistake.hint_msg
            });
            previousMistakeRef.current = mistake; // Remember this for correction check
            return; // Stop here, don't call API
          }
        } catch (e) {
          console.warn("Invalid regex in guide:", mistake.regex);
        }
      }

      // --- STATE 3: OPTIMAL PATTERN (The "Milestone Praise") ---
      if (guide.optimal_pattern) {
        try {
          const regex = new RegExp(guide.optimal_pattern.regex, 's');
          if (regex.test(debouncedCode)) {
            setFeedback({
              type: 'praise',
              message: guide.optimal_pattern.praise_msg
            });
            return; // Stop here
          }
        } catch (e) { console.warn("Invalid optimal regex"); }
      }

      // --- STATE 4: NOVELTY (The "Feedback Loop") ---
      // If we got here, no local rules matched. Ask Gemini.
      console.log("🤔 No local match. Calling AI Feedback Loop...");
      setLoading(true);
      try {
        const response = await fetch('/api/getAiLiveFeedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: debouncedCode,
            language,
            problemTitle: problemData.problemTitle
          })
        });
        const data = await response.json();

        if (data.status === 'praise') {
          setFeedback({ type: 'praise', message: data.message });
        } 
        else if (data.status === 'new_mistake') {
          // !!! THIS IS THE SELF-LEARNING MAGIC !!!
          setFeedback({ type: 'hint', message: data.new_pattern.hint_msg });
          
          // Update Firestore so we don't have to ask Gemini next time
          const guideRef = doc(firestore, 'problemGuides', problemId);
          await updateDoc(guideRef, {
            known_mistakes: arrayUnion(data.new_pattern)
          });
          
          // Update local state immediately
          setGuide(prev => ({
            ...prev,
            known_mistakes: [...(prev.known_mistakes || []), data.new_pattern]
          }));
        }
        // If 'neutral', do nothing (leave feedback as null)

      } catch (err) {
        console.error("Live Loop Error:", err);
      }
      setLoading(false);
    };

    analyzeCode();

  }, [debouncedCode, guide, problemId, language, problemData]);

  return { feedback, loading };
};