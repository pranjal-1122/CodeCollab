import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, firestore } from '../services/firebase'; // Import firestore
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // <-- NEW: State for firestore data
  const [loading, setLoading] = useState(true);

  function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

    // ADD THIS NEW FUNCTION
  async function updateProfile(uid, data) {
    const userDocRef = doc(firestore, 'users', uid);
    try {
      await updateDoc(userDocRef, data); // Update the document
      // Re-fetch the user profile to update our app's state
      const updatedDocSnap = await getDoc(userDocRef);
      setUserProfile(updatedDocSnap.data());
      return true; // Indicate success
    } catch (err) {
      console.error("Error updating profile:", err);
      return false; // Indicate failure
    }
  }

  // This function runs when a user logs in (or on page load)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is logged in, check/create their profile in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          // New user: Create a new profile document
          try {
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              avatar: user.photoURL,
              createdAt: serverTimestamp(),
              isProfileComplete: false, // <-- IMPORTANT
              skillLevel: 'Beginner', // Default
            });
            // Get the new doc and set it
            const newDocSnap = await getDoc(userDocRef);
            setUserProfile(newDocSnap.data());

          } catch (err) {
            console.error("Error creating user document:", err);
          }
        } else {
          // Existing user: Just set their profile data
          setUserProfile(userDocSnap.data());
        }
        setCurrentUser(user);
      } else {
        // User is logged out
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile, // <-- NEW: Expose profile data
    loading,     // <-- NEW: Expose loading state
    signInWithGoogle,
    updateProfile, // <-- EXPOSE THE NEW FUNCTION
  };

  // Render children only when not loading
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}