import React, { useEffect, useState } from "react";
import "./App.css"; // reuse styles or create your own
import { useNavigate } from "react-router-dom";

function Play() {
  const [decks, setDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const navigate = useNavigate(); // <-- initialize navigate here

  useEffect(() => {
    fetch("https://garbomagic.onrender.com/decks2")
      .then((res) => res.json())
      .then(setDecks)
      .catch((err) => console.error("Failed to fetch decks", err));
  }, []);

  const handleSelectDeck = (id) => {
    setSelectedDeckId(id);
  };

  const enterArena = () => {
    navigate("/Arena", { state: { deckId: selectedDeckId } }); // only send deckId
  };

  return (
    <div className="play-container" style={{ padding: "2rem" }}>
      <h1>Select a Deck</h1>

      <div className="deck-grid" style={{ marginTop: "1rem" }}>
        {decks.map((deck) => (
          <div
            key={deck.id}
            onClick={() => handleSelectDeck(deck.id)}
            className={`deck-card ${selectedDeckId === deck.id ? "selected" : ""}`}
            style={{
              cursor: "pointer",
              border: selectedDeckId === deck.id ? "3px solid #007bff" : "1px solid #ccc",
              padding: "1rem",
              borderRadius: "6px",
              marginBottom: "1rem",
              maxWidth: "300px",
              userSelect: "none",
            }}
          >
            <h3>{deck.name}</h3>
            <div className="deck-preview" style={{ display: "flex", gap: "5px" }}>
              {deck.cards.slice(0, 4).map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt="Preview"
                  style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={enterArena}
        disabled={!selectedDeckId}
        style={{
          marginTop: "2rem",
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          borderRadius: "6px",
          border: "none",
          backgroundColor: selectedDeckId ? "#007bff" : "#aaa",
          color: "#fff",
          cursor: selectedDeckId ? "pointer" : "not-allowed",
          userSelect: "none",
        }}
      >
        Enter Arena
      </button>
    </div>
  );
}

export default Play;
