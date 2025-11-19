import { useState, useEffect, useRef } from 'react';
import { firestore } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export const useLiveMentor = (problemId, code, language, problemData) => {
  const [feedback, setFeedback] = useState(null);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(false);
  const previousMistakeRef = useRef(null);
  const debouncedCode = useDebounce(code, 2000);

  // --- 1. Load Guide (Unchanged) ---
  useEffect(() => {
    if (!problemId || !problemData) return;
    const loadGuide = async () => {
      const guideRef = doc(firestore, 'problemGuides', problemId);
      const guideSnap = await getDoc(guideRef);
      if (guideSnap.exists()) {
        setGuide(guideSnap.data());
      } else {
        setLoading(true);
        try {
          await fetch('/api/seedProblemGuide', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              problemId, title: problemData.problemTitle, description: problemData.description, language
            })
          });
          // Retry load after seed
          const retrySnap = await getDoc(guideRef);
          if (retrySnap.exists()) setGuide(retrySnap.data());
        } catch (err) { console.error(err); }
        setLoading(false);
      }
    };
    loadGuide();
  }, [problemId, problemData, language]);

  // --- 2. The "Selective Learning" Engine ---
  useEffect(() => {
    if (!debouncedCode || !guide) return;

    const analyzeCode = async () => {
      setFeedback(null);

      // A. Local Check (Fast & Free)
      // We check logic patterns first because they are fastest
      if (previousMistakeRef.current) {
         try {
            const { regex } = previousMistakeRef.current;
            if (!new RegExp(regex, 's').test(debouncedCode)) {
               setFeedback({ type: 'praise', message: "Nice fix!" });
               previousMistakeRef.current = null;
               return;
            }
         } catch(e) {}
      }

      for (const mistake of guide.known_mistakes || []) {
        try {
          if (new RegExp(mistake.regex, 's').test(debouncedCode)) {
            setFeedback({ type: 'hint', message: mistake.hint_msg });
            previousMistakeRef.current = mistake;
            return;
          }
        } catch (e) { console.warn("Bad regex:", mistake.regex); }
      }

      // B. The AI Feedback Loop (The All-Rounder)
      setLoading(true);
      try {
        const response = await fetch('/api/getAiLiveFeedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code: debouncedCode, 
            language, 
            problemTitle: problemData?.problemTitle,
            problemDescription: problemData?.description
          })
        });
        const data = await response.json();

        // --- CATEGORY HANDLING ---
        
        // 1. CRITICAL: Syntax Error (Show, Don't Save)
        if (data.status === 'syntax_error') {
            setFeedback({ type: 'error', message: data.message }); 
        } 
        // 2. INFO: Style Suggestion (Show, Don't Save)
        else if (data.status === 'suggestion') {
            setFeedback({ type: 'info', message: data.message }); 
        }
        // 3. PRAISE (Show, Don't Save)
        else if (data.status === 'praise') {
            setFeedback({ type: 'praise', message: data.message });
        }
        // 4. LOGIC: The Only Thing We "Learn"
        else if (data.status === 'logic_mistake' && data.new_pattern) {
            setFeedback({ type: 'hint', message: data.new_pattern.hint_msg });
            
            // SAVE TO DB (Only logic is worth remembering)
            await updateDoc(doc(firestore, 'problemGuides', problemId), {
                known_mistakes: arrayUnion(data.new_pattern)
            });
            setGuide(prev => ({
                ...prev,
                known_mistakes: [...(prev.known_mistakes || []), data.new_pattern]
            }));
        }
        
      } catch (err) { console.error(err); }
      setLoading(false);
    };

    analyzeCode();
  }, [debouncedCode, guide, problemId, language, problemData]);

  return { feedback, loading };
};