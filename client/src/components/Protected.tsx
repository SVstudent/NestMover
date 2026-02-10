import { Navigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import React from "react";

interface ProtectedProps {
  children: React.ReactNode;
}

const Protected = ({ children }: ProtectedProps) => {
  const auth = UserAuth();

  // Wait for auth state to be determined
  if (auth?.loading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Loading...</div>;
  }

  if (!auth?.user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default Protected;
