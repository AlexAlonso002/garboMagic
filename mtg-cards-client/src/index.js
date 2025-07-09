// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import App from "./App";
import Decks from "./Decks";
import DeckSel from "./Play";
import Arena from "./Arena";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/builder" element={<App />} />
      <Route path="/decks" element={<Decks />} />
      <Route path="/edit/:id" element={<App />} />
      <Route path="/play" element={<DeckSel />} />       {/* lowercase path */}
      <Route path="/arena" element={<Arena />} />        {/* added arena route */}
    </Routes>
  </BrowserRouter>
);
