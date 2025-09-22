import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AuthUser, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
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

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const authUser = convertFirebaseUser(userCredential.user);
      setAuthState({ user: authUser, isLoading: false, error: null });
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setAuthState({ user: null, isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with display name
      await updateProfile(userCredential.user, { displayName: fullName });

      // Create user document in Firestore
      const userDoc = {
        fullName,
        email,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);

      const authUser = convertFirebaseUser(userCredential.user);
      setAuthState({ user: authUser, isLoading: false, error: null });
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      setAuthState({ user: null, isLoading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setAuthState({ user: null, isLoading: false, error: null });
    } catch (error: any) {
      const errorMessage = error.message || 'Logout failed';
      setAuthState(prev => ({ ...prev, error: errorMessage }));
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // Create user document if it doesn't exist
            const userData = {
              fullName: firebaseUser.displayName || 'Unknown User',
              email: firebaseUser.email!,
              createdAt: new Date(),
              lastLogin: new Date()
            };
            await setDoc(userDocRef, userData);
          }

          const authUser = convertFirebaseUser(firebaseUser);
          setAuthState({ user: authUser, isLoading: false, error: null });
        } catch (error: any) {
          console.error('Error loading user data:', error);
          setAuthState({ user: null, isLoading: false, error: error.message });
        }
      } else {
        setAuthState({ user: null, isLoading: false, error: null });
      }
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};