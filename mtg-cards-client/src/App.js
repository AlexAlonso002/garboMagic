import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import "./App.css";

const LIMIT = 150;
const MAX_DECK_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 1500;

function App() {
  const { id: deckId } = useParams(); // get deck id if editing
  console.log("Deck ID from URL params:", deckId);
  const [images, setImages] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deck, setDeck] = useState([]);
  const [deckName, setDeckName] = useState("Your Deck");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [loadingDeck, setLoadingDeck] = useState(false);

  const loaderRef = useRef();
  const debounceTimeout = useRef();

  // Fetch deck if editing
  useEffect(() => {
    if (deckId) {
      setLoadingDeck(true);
      fetch(`http://localhost:8080/deck/${deckId}`)
        .then((res) => res.json())
        .then((deckData) => {
          setDeckName(deckData.name || "Your Deck");
          setDeck(deckData.cards || []);
          setLoadingDeck(false);
          // Reset gallery for editing (optional)
          setImages([]);
          setOffset(0);
          setHasMore(true);
        })
        .catch(() => {
          alert("Failed to load deck for editing.");
          setLoadingDeck(false);
        });
    }
  }, [deckId]);

  // Fetch cards (gallery), supports offset/limit and search by name
  const fetchImages = useCallback(
    (reset = false) => {
      if (loadingDeck) return; // don't fetch gallery while loading deck

      let url = "";
      if (searchTerm.trim()) {
        url = `https://garbomagic.onrender.com/cards/search?name=${encodeURIComponent(
          searchTerm.trim()
        )}&limit=${LIMIT}&offset=${reset ? 0 : offset}`;
      } else {
        url = `http://localhost:8080/cards?limit=${LIMIT}&offset=${reset ? 0 : offset}`;
      }

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (reset) {
            setImages(data);
            setOffset(data.length);
            setHasMore(data.length === LIMIT);
          } else {
            setImages((prev) => [...prev, ...data]);
            setOffset((prev) => prev + data.length);
            if (data.length < LIMIT) setHasMore(false);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch cards", err);
          if (reset) {
            setImages([]);
            setHasMore(false);
          }
        });
    },
    [offset, searchTerm, loadingDeck]
  );

  // Initial load or on offset change / search change
  useEffect(() => {
    fetchImages(true);
  }, [fetchImages]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !searchActive) {
          fetchImages();
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [fetchImages, hasMore, searchActive]);

  // Debounce search input changes
  const onSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      setSearchActive(val.trim().length > 0);
      setOffset(0);
      fetchImages(true);
    }, SEARCH_DEBOUNCE_MS);
  };

  // Modal handlers
  const closeModal = () => setSelectedImage(null);

  const addToDeck = () => {
    if (!selectedImage) return;
    if (deck.length >= MAX_DECK_SIZE) {
      alert(`Deck limit reached! Max ${MAX_DECK_SIZE} cards.`);
      return;
    }
    if (!deck.includes(selectedImage.url)) {
      setDeck((prev) => [...prev, selectedImage.url]);
    }
    closeModal();
  };

  const removeFromDeck = () => {
    if (!selectedImage) return;
    setDeck((prev) => prev.filter((url) => url !== selectedImage.url));
    closeModal();
  };

  // Save deck to backend
  const saveDeck = () => {
    if (deck.length !== MAX_DECK_SIZE) {
      alert(`Deck must contain exactly ${MAX_DECK_SIZE} cards to save.`);
      return;
    }
    if (!deckName.trim()) {
      alert("Please enter a deck name.");
      return;
    }
    // If editing, update deck by id, else create new
    const endpoint = deckId ? `https://garbomagic.onrender.com/saveDeck/${deckId}` : "https://garbomagic.onrender.com/saveDeck";

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: deckName.trim(), cards: deck }),
    })
      .then((res) => {
        if (res.ok) alert("Deck saved successfully!");
        else alert("Failed to save deck.");
      })
      .catch(() => alert("Error saving deck."));
  };

  return (
    <div className="app-container">
      {/* Left gallery */}
      <div className="gallery-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search cards by name..."
          onChange={onSearchChange}
          value={searchTerm}
          disabled={loadingDeck} // disable search while loading deck
        />

        <div className="card-grid">
          {images.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`card-${idx}`}
              className="card-image"
              onClick={() => setSelectedImage({ url, fromDeck: false })}
              loading="lazy"
            />
          ))}
        </div>

        <div ref={loaderRef} style={{ height: 20, marginTop: 10 }}>
          {hasMore && !searchActive ? (
            <p className="loading-text">Loading more cards...</p>
          ) : (
            <p className="no-more-text">
              {images.length === 0 ? "No cards found." : "No more cards."}
            </p>
          )}
        </div>
      </div>

      {/* Right deck sidebar */}
      <div className="deck-sidebar">
        <input
          className="deck-name-input"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          placeholder="Enter deck name"
          disabled={loadingDeck}
        />
        <h2 className="deck-title">
          {deckName} ({deck.length}/{MAX_DECK_SIZE})
        </h2>
        {deck.length === 0 && <p className="deck-empty-text">No cards added yet.</p>}

        <div>
          {deck.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`deck-card-${idx}`}
              className="deck-image"
              onClick={() => setSelectedImage({ url, fromDeck: true })}
              loading="lazy"
            />
          ))}
        </div>

        <button className="save-deck-button" onClick={saveDeck} disabled={loadingDeck}>
          Save Deck
        </button>
      </div>

      {/* Modal */}
      {selectedImage && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="modal-close-button"
              onClick={closeModal}
              aria-label="Close modal"
            >
              &times;
            </button>

            <img
              src={selectedImage.url}
              alt="Full view"
              className="modal-image"
              loading="lazy"
            />

            {!selectedImage.fromDeck ? (
              <button className="modal-add-button" onClick={addToDeck}>
                Add to Deck
              </button>
            ) : (
              <button className="modal-remove-button" onClick={removeFromDeck}>
                Remove from Deck
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
