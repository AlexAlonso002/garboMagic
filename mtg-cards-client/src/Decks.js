import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css"; // for styling

function Decks() {
  const [decks, setDecks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://garbomagic.onrender.com/decks2")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched decks:", data[0]?.id);
        setDecks(data);
      })
      .catch((err) => console.error("Failed to load decks", err));
  }, []);

  return (
    <div className="deck-list-container">
      <h1>Saved Decks</h1>
      
      {/* Create Deck Button */}
      <button 
        className="create-deck-button"
        onClick={() => navigate("/builder")}
        style={{ marginBottom: "1rem", padding: "0.5rem 1rem", fontSize: "1rem", cursor: "pointer" }}
      >
        Create Deck
      </button>

      <div className="deck-grid">
        {decks.map((deck) => (
          <div key={deck.id} className="deck-card">
            <h3>{deck.name}</h3>
            <div className="deck-preview">
              {deck.cards.slice(0, 4).map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt="Preview"
                  className="deck-preview-image"
                />
              ))}
            </div>
            <button onClick={() => navigate(`/edit/${deck.id}`)}>
              Edit Deck
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Decks;
