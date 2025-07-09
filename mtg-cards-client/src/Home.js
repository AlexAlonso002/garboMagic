// src/Home.js
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "2rem", textAlign: "center", fontFamily: "Arial" }}>
      <h1>Welcome to Magic Deck Builder</h1>
      <button
        style={buttonStyle}
        onClick={() => navigate("/decks")}
      >
        Deck Builder
      </button>
      <button
        style={{ ...buttonStyle, backgroundColor: "#007bff" }}
        onClick={() => navigate("/play")}
      >
        Play
      </button>
    </div>
  );
}

const buttonStyle = {
  padding: "1rem 2rem",
  fontSize: "1.2rem",
  margin: "1rem",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  backgroundColor: "#28a745",
  color: "#fff",
};
