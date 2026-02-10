import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleTryDemo = () => {
    navigate("/login");
  };

  const handleRequestBeta = () => {
    navigate("/login");
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "6rem", marginBottom: "2rem" }}>Nested</h1>
      <p>
        Moving is stressful. Nested, powered by AI, helps you find the perfect
        places in your new city – from gyms and grocery stores to hidden gems –
        all based on your preferences.
      </p>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          marginTop: "2rem",
        }}
      >
        <Button color="success" variant="contained" onClick={handleTryDemo}>
          Try a Demo
        </Button>
        <Button color="success" variant="outlined" onClick={handleRequestBeta}>
          Request Beta Access
        </Button>
      </div>
    </div>
  );
};

export default WelcomePage;
