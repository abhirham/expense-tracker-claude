import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import { AuthUser, AuthState } from '../types';

interface AuthContextType extends AuthState {
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  });

  const convertFirebaseUser = (firebaseUser: FirebaseUser): AuthUser => ({
    uid: firebaseUser.uid,
    email: firebaseUser.email!,
    displayName: firebaseUser.displayName || undefined,
    emailVerified: firebaseUser.emailVerified,
    createdAt: new Date(firebaseUser.metadata.creationTime!)
  });

  const loginWithGoogle = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      console.log('Starting Google sign-in...');
      const userCredential = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful:', userCredential.user.email);

      // Create or update user document in Firestore
      const userDoc = {
        fullName: userCredential.user.displayName || 'Google User',
        email: userCredential.user.email!,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc, { merge: true });
      console.log('User document created/updated in Firestore');

      // Note: Don't set auth state here - let onAuthStateChanged handle it
      // This prevents race conditions between manual state setting and Firebase listener
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed';
      setAuthState({ user: null, isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setAuthState({ user: null, isLoading: false, error: null });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setAuthState(prev => ({ ...prev, error: errorMessage }));
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');

      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            console.log('Creating new user document...');
            // Create user document if it doesn't exist
            const userData = {
              fullName: firebaseUser.displayName || 'Google User',
              email: firebaseUser.email!,
              createdAt: new Date(),
              lastLogin: new Date()
            };
            await setDoc(userDocRef, userData);
          } else {
            console.log('Updating existing user document...');
            // Update last login time
            await setDoc(userDocRef, { lastLogin: new Date() }, { merge: true });
          }

          const authUser = convertFirebaseUser(firebaseUser);
          console.log('Setting auth state with user:', authUser.email);
          setAuthState({ user: authUser, isLoading: false, error: null });
        } catch (error: unknown) {
          console.error('Error loading user data:', error);
          setAuthState({ user: null, isLoading: false, error: error instanceof Error ? error.message : 'Authentication error' });
        }
      } else {
        console.log('No user - setting auth state to null');
        setAuthState({ user: null, isLoading: false, error: null });
      }
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    ...authState,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};