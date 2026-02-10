import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import React from "react";
import {
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase.config";
import User from "../models/UserModel";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  googleSignIn: () => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthContextProviderProps {
  children: ReactNode;
}

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email || "null");

      if (firebaseUser) {
        const { displayName, email, uid, photoURL, metadata } = firebaseUser;

        setUser({
          id: uid,
          name: displayName || "",
          email: email || "",
          photoURL: photoURL || "",
          createdAt: new Date(metadata.creationTime || ""),
          lastLogin: new Date(metadata.lastSignInTime || ""),
          homeAddress: "",
          workAddress: "",
          birthday: null,
          gender: "",
        });
        console.log("User set:", email);
      } else {
        setUser(null);
        console.log("User cleared");
      }

      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/user.birthday.read");
    provider.addScope("https://www.googleapis.com/auth/user.gender.read");
    provider.addScope("https://www.googleapis.com/auth/drive");

    setLoading(true);
    try {
      console.log("Starting Google sign in with popup...");
      const result = await signInWithPopup(auth, provider);
      console.log("Sign in successful:", result.user.email);

      // Get the access token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        localStorage.setItem("accessToken", credential.accessToken);
        console.log("Token stored successfully!");
      }
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      // Handle specific errors
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("User closed the popup");
      }
      setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    localStorage.removeItem("accessToken");
    await signOut(auth);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, googleSignIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
