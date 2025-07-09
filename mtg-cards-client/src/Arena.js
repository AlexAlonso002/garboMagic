// src/Arena.js
import React, { useEffect, useState , useRef} from "react";
import { useLocation } from "react-router-dom";
import "./App.css";
import { io } from "socket.io-client";

const CARD_BACK = "/cardback.jpeg";

function Arena() {
  const location = useLocation();
  const deckId = location.state?.deckId;
  const [showHand, setShowHand] = useState(false);
  // State for zones
  const [blueDeck, setBlueDeck] = useState([]);
  const [blueDiscard, setBlueDiscard] = useState([]);
  const [blueHand, setBlueHand] = useState([]);
  const [blueLand, setBlueLand] = useState([]);
  const [blueArtifact, setBlueArtifact] = useState([]);
  const [blueCreature, setBlueCreature] = useState([]);

  // tapping
  const [rotatedCards, setRotatedCards] = useState({});
  const [selectedCardZone, setSelectedCardZone] = useState(null); // to know what zone it came from

  const [redDeck, setRedDeck] = useState([]);
  const [redDiscard, setRedDiscard] = useState([]);
  const [redLand, setRedLand] = useState([]);
  const [redArtifact, setredArtifact] = useState([]);
  const [redCreature, setredCreature] = useState([]);
  // Modal & drag states
  const [modalCard, setModalCard] = useState(null);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedFrom, setDraggedFrom] = useState(null);
  const [socketID, setsocketID] = useState(null);
  const socketIDRef = useRef(null);
  const socket = useRef(null);
  // Shuffle helper
  const shuffle = (array) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  useEffect(() => {
    if (!deckId) return;
    fetch(`http://localhost:8080/deck/${deckId}`)
      .then((res) => res.json())
      .then((data) => {
        const cards = Array.isArray(data.cards) ? data.cards : [];
        const shuffled = shuffle(cards);
        setBlueDeck(shuffled);
        setRedDeck([...shuffled]);
        setBlueDiscard([]);
        setBlueHand([]);
        setBlueLand([]);
        setBlueArtifact([]);
        setBlueCreature([]);
        setRedDiscard([]);
        setRedLand([]);
      })
      .catch((err) => console.error("Failed to load deck", err));
  }, [deckId]);

  useEffect(() => {
    socket.current = io("http://localhost:8080"); // your server URL

    socket.current.on("connect", () => {
      socketIDRef.current = socket.current.id; // immediate update
      setsocketID(socket.current.id);          // state update triggers re-render
    });
    // Receive board updates (card moved)
    socket.current.on("broadcast", ({ user, image, area }) => {
      console.log(user)
      console.log(socketIDRef.current)
      if(user === socketIDRef.current){
        console.log("I send it")
        return ; 
      }
      console.log("Received board update", user, area);
  
      if (area === "blueLand") {
        setRedLand((prev) => [...prev, image]);
      } else if (area === "blueCreature") {
        setredCreature((prev) => [...prev, image]);
      }
      else if (area === "blueArtifact"){
        setredArtifact((prev) => [...prev , image])
      }
      else if (area === "blueDiscard"){
        setRedDiscard((prev) => [...prev , image])
      }
      
    });
     // receive removed update
     socket.current.on("broadcast3", ({ user, image, area }) => {
      if(user === socketIDRef.current){
        console.log("I send it")
        return ; 
      }
      console.log("remove board update", user, area);
    
      if (area === "land") {
        setRedLand((prev) => prev.filter((c) => c !== image));
      } else if (area === "creature") {
        setredCreature((prev) => prev.filter((c) => c !== image));
      } else if (area === "artifact") {
        setredArtifact((prev) => prev.filter((c) => c !== image));
      } else if (area === "discard") {
        setRedDiscard((prev) => prev.filter((c) => c !== image));
      }
    });

    // Receive tap updates (card rotated)
    socket.current.on("broadcast2", ({ user, image, area }) => {
       if(user === socketIDRef.current){
        console.log("I send it")
        return ; 
      }
      console.log("Received tap update", user, image, area);
      setRotatedCards((prev) => ({
        ...prev,
        [image]: !prev[image],
      }));
    });
  
    return () => {
      socket.current.disconnect();
      setsocketID(null);
      socketIDRef.current = null;
    };
  }, []);
  

  const drawCard = () => {
    if (blueDeck.length === 0) return;
    const drawnCard = blueDeck[0];
    setBlueDeck((prev) => prev.slice(1));
    setBlueHand((prev) => [...prev, drawnCard]);
  };

  // Drag and Drop Handlers
  const handleDragStart = (card, fromZone) => (e) => {
    setDraggedCard(card);
    setDraggedFrom(fromZone);
  };

  const handleDrop = (toZone) => (e) => {
    e.preventDefault();
    if (!draggedCard || !draggedFrom) return;

    const zones = {
      blueHand: [setBlueHand, blueHand],
      blueDiscard: [setBlueDiscard, blueDiscard],
      blueLand: [setBlueLand, blueLand],
      blueArtifact: [setBlueArtifact, blueArtifact],
      blueCreature: [setBlueCreature, blueCreature],
      redHand: [/* add if needed */],
      redDiscard: [setRedDiscard, redDiscard],
      redLand: [setRedLand, redLand],
    };

    // Remove card from source
    if (zones[draggedFrom]) {
      zones[draggedFrom][0](zones[draggedFrom][1].filter((c) => c !== draggedCard));
    }

    // Add card to destination
    if (zones[toZone]) {
      zones[toZone][0]([...zones[toZone][1], draggedCard]);
    }

    socket.current.emit("board", draggedCard, toZone);
    socket.current.emit("remove", draggedCard, draggedFrom);

    setDraggedCard(null);
    setDraggedFrom(null);
  };

  const allowDrop = (e) => e.preventDefault();

  return (
    <div className="arena-container">
      {/* RED Top Half */}
      <div className="red-top-half">
        {/* Red Deck */}
        <div className="red-deck">
          <h3>Opponent Deck</h3>
          <img
            src={CARD_BACK}
            alt="Opponent Deck"
          />
        </div>

        {/* Red Land Area (top right) */}
        <div
          className="red-land-area"
        >
          <p>Red Land Area</p>
          {redLand.map((card, idx) => (
            <img
              key={idx}
              src={card}
              alt={`Red Land Card ${idx}`}
              onClick={() => setModalCard(card)}
              style={{ cursor: "grab" }}
            />
          ))}
        </div>
              {/* Red Discard Pile Top Card */}
        {/* Artifact Area */}
        <div
          className="red-artifact-area"
        >
          <p>Red Artifact Area</p>
          {redArtifact.map((card, idx) => (
            <img
              key={idx}
              src={card}
              alt={`Red Artifact Card ${idx}`}
            />
          ))}
        </div>
        {/* Creature Area */}
        <div
          className="red-creature-area"
        >
          <p>Red Creature Area</p>
          {redCreature.map((card, idx) => (
            <img
              key={idx}
              src={card}
              alt={`Red Creature Card ${idx}`}
              className={rotatedCards[card] ? "rotated" : ""}
            />
          ))}
        </div>
        {/* Red Discard Pile Top Card */}
        <div
          className="red-discard-pile"
          title="Red Discard Pile"
        >
          <p>Red Discard</p>
          {redDiscard.length > 0 ? (
            <img
              src={redDiscard[redDiscard.length - 1]}
              alt="Top Red Discard Card"
              draggable
              onDragStart={handleDragStart(redDiscard[redDiscard.length - 1], "redDiscard")}
              onClick={() => setModalCard(redDiscard[redDiscard.length - 1])}
            />
          ) : (
            <div className="red-discard-empty" />
          )}
        </div>
      </div>

      {/* BLUE Bottom Half */}
      <div className="blue-bottom-half">
        {/* Left Side: Land Area (bottom left) */}
        <div
          className="blue-land-area"
          onDrop={handleDrop("blueLand")}
          onDragOver={allowDrop}
        >
          <p>Blue Land Area</p>
          {blueLand.map((card, idx) => (
            <img
              key={idx}
              src={card}
              alt={`Blue Land Card ${idx}`}
              draggable
              onDragStart={handleDragStart(card, "blueLand")}
              onClick={() => {
                setModalCard(card);
                setSelectedCardZone("blueLand");
              }}
              className={rotatedCards[card] ? "rotated" : ""}
            />
          ))}
        </div>

        {/* Artifact Area */}
        <div
          className="blue-artifact-area"
          onDrop={handleDrop("blueArtifact")}
          onDragOver={allowDrop}
        >
          <p>Blue Artifact Area</p>
          {blueArtifact.map((card, idx) => (
            <img
              key={idx}
              src={card}
              alt={`Blue Artifact Card ${idx}`}
              draggable
              onDragStart={handleDragStart(card, "blueArtifact")}
              onClick={() => {
                setModalCard(card);
                setSelectedCardZone("blueArtifact");
              }}
              className={rotatedCards[card] ? "rotated" : ""}
            />
          ))}
        </div>

        {/* Creature Area */}
        <div
          className="blue-creature-area"
          onDrop={handleDrop("blueCreature")}
          onDragOver={allowDrop}
        >
          <p>Blue Creature Area</p>
          {blueCreature.map((card, idx) => (
            <img
              key={idx}
              src={card}
              alt={`Blue Creature Card ${idx}`}
              draggable
              onDragStart={handleDragStart(card, "blueCreature")}
              onClick={() => {
                setModalCard(card);
                setSelectedCardZone("blueCreature");
              }}
              className={rotatedCards[card] ? "rotated" : ""}
            />
          ))}
        </div>

        {/* Battlefield Area */}
        <div className="battlefield-area" onDrop={handleDrop("blueBattlefield")} onDragOver={allowDrop}>
          <p>Battlefield Area</p>
        </div>

        {/* Deck Controls */}
        <div className="deck-controls">
          {/* Blue Discard Pile */}
          <div
            className="blue-discard-pile"
            onDrop={handleDrop("blueDiscard")}
            onDragOver={allowDrop}
            title="Blue Discard Pile"
            onClick={() => {
              if (blueDiscard.length > 0) setShowDiscardModal(true);
            }}
          >
            <p>Blue Discard</p>
            {blueDiscard.length > 0 ? (
              <img
                src={blueDiscard[blueDiscard.length - 1]}
                alt="Top Blue Discard Card"
                draggable
                onDragStart={handleDragStart(blueDiscard[blueDiscard.length - 1], "blueDiscard")}
                onClick={(e) => {
                  e.stopPropagation();
                  setModalCard(blueDiscard[blueDiscard.length - 1]);
                }}
              />
            ) : (
              <div className="blue-discard-empty" />
            )}
          </div>

          {/* Deck */}
          <img
            src={CARD_BACK}
            alt="Your Deck"
            className={`deck-image ${blueDeck.length === 0 ? "deck-disabled" : ""}`}
            onClick={() => {
              if (blueDeck.length > 0) setShowDeckModal(true);
            }}
          />

          {/* Buttons */}
          <button
            onClick={drawCard}
            disabled={blueDeck.length === 0}
            className={`deck-button draw-button ${blueDeck.length === 0 ? "disabled" : ""}`}
          >
            Draw
          </button>
          <button
            onClick={() => setShowDeckModal(true)}
            disabled={blueDeck.length === 0}
            className={`deck-button open-deck-button ${blueDeck.length === 0 ? "disabled" : ""}`}
          >
            Open Deck
          </button>
          <button
            onClick={() => setShowDiscardModal(true)}
            disabled={blueDiscard.length === 0}
            className={`deck-button open-discard-button ${blueDiscard.length === 0 ? "disabled" : ""}`}
          >
            Open Discard
          </button>
          <button
            onClick={() => setShowHand(prev => !prev)}
            className="deck-button toggle-hand-button"
          >
            {showHand ? "Hide Hand" : "Show Hand"}
          </button>
        </div>
      </div>

      {/* Hand Display */}
      {showHand && (
  <div className="hand-display">
    {blueHand.map((card, idx) => (
      <img
        key={idx}
        src={card}
        alt={`Card ${idx}`}
        draggable
        onDragStart={handleDragStart(card, "blueHand")}
        onClick={() => setModalCard(card)}
      />
    ))}
  </div>
)}

      {modalCard && (
  <div
    className="modal-backdrop"
    onClick={() => {
      setModalCard(null);
      setSelectedCardZone(null);
    }}
  >
    <img
      src={modalCard}
      className={`modal-card-image ${rotatedCards[modalCard] ? "rotated" : ""}`}
    />
    <button
      className="tap-button"
      onClick={(e) => {
        e.stopPropagation(); // Prevent modal from closing
        setRotatedCards((prev) => ({
          ...prev,
          [modalCard]: !prev[modalCard],
        }));
        if (socket.current && socket.current.connected) {
          socket.current.emit("tap", modalCard, selectedCardZone);
          }
      }}
    >
      {rotatedCards[modalCard] ? "Untap" : "Tap (Rotate)"}
    </button>
  </div>
)}


      {/* Deck Modal */}
      {showDeckModal && (
        <div className="deck-discard-modal" onClick={() => setShowDeckModal(false)}>
          {blueDeck.map((card, idx) => (
            <img key={idx} src={card} alt={`Deck Card ${idx}`} onClick={() => setModalCard(card)} />
          ))}
        </div>
      )}

      {/* Discard Modal */}
      {showDiscardModal && (
        <div className="deck-discard-modal" onClick={() => setShowDiscardModal(false)}>
          {blueDiscard.map((card, idx) => (
            <img key={idx} src={card} alt={`Discard Card ${idx}`} onClick={() => setModalCard(card)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Arena;
