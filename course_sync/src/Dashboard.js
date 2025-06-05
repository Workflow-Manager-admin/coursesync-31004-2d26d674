import React, { useState, useEffect } from "react";
import "./App.css";

// Utility functions for localStorage (favorites)
const FAVORITES_KEY = "cs_favorites";

// PUBLIC_INTERFACE
/**
 * Get all saved favorites from localStorage.
 * @returns {Array} Favorite items
 */
export function loadFavorites() {
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// PUBLIC_INTERFACE
/**
 * Save favorites array to localStorage.
 * @param {Array} favs - Array of favorite items
 */
export function saveFavorites(favs) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

// PUBLIC_INTERFACE
/**
 * Dashboard component for managing and viewing user's saved/favorite recommendations.
 * Displays all favorite items, allows removing, and basic detail view.
 */
export default function Dashboard({ onClose }) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  // Remove favorite by its unique key
  function removeFavorite(key) {
    const filtered = favorites.filter(item => item._fvKey !== key);
    setFavorites(filtered);
    saveFavorites(filtered);
  }

  return (
    <div style={{
      position: "fixed",
      top: "70px",
      left: 0,
      width: "100vw",
      minHeight: "calc(100vh - 70px)",
      background: "rgba(27,39,34,0.15)",
      zIndex: 100,
      overflow: "auto"
    }}>
      <div style={{
        background: "#fff",
        maxWidth: 600,
        margin: "40px auto",
        borderRadius: "14px",
        boxShadow: "0 4px 24px rgba(75,46,37,0.13)",
        padding: "32px 30px 32px 30px",
        position: "relative"
      }}>
        <button
          style={{
            position: "absolute",
            right: 16,
            top: 14,
            background: "none",
            border: "none",
            fontSize: "1.65em",
            cursor: "pointer",
            color: "#7C4F37"
          }}
          aria-label="Close dashboard"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 style={{marginTop: 0}} className="cs-section-title">
          Your Saved Favorites
        </h2>
        {favorites.length === 0 ? (
          <div style={{margin: "35px 0 0 0", color: "#7C4F37", textAlign: "center"}}>
            You haven't saved any recommendations yet.
          </div>
        ) : (
          <ul style={{listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "18px"}}>
            {favorites.map(item => (
              <li key={item._fvKey}>
                <div className="rec-card" style={{
                  width: "100%",
                  minWidth: "unset",
                  position: "relative",
                  paddingRight: 42,
                  background: "#E6D5C3", // highlight-text bg for favs
                  border: "1.5px solid #D8BFAA"
                }}>
                  <div className="rec-title" style={{ color: "#7C4F37" }}>{item.title}</div>
                  <div className="rec-summary" style={{ color: "#2B1F1A" }}>{item.summary}</div>
                  <div className="rec-meta">{item.meta}</div>
                  {item.resourceLink ? (
                    <a
                      className="rec-action"
                      href={item.resourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#7C4F37", fontWeight: 700, textDecoration: "underline" }}
                    >
                      {item.action}
                    </a>
                  ) : (
                    <div className="rec-action" style={{ color: "#7C4F37" }}>{item.action}</div>
                  )}
                  <button
                    aria-label="Remove from favorites"
                    onClick={() => removeFavorite(item._fvKey)}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: 12,
                      background: "#D6C7A1", // cta-green
                      color: "#4B2E25",      // header-bg
                      border: "none",
                      borderRadius: "5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.96em",
                      padding: "6px 12px"
                    }}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
