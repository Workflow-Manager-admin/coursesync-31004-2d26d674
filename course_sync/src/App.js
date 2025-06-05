import React, { useRef, useState, useEffect } from "react";
import "./App.css";
import {
  fetchInternships,
  fetchCertifications,
  fetchProjectIdeas
} from "./utils/recommendations";
import Dashboard, { loadFavorites, saveFavorites } from "./Dashboard";

// PUBLIC_INTERFACE
/**
 * Main container for CourseSync app.
 * Handles syllabus upload, simulates AI keyword/topic extraction, and renders extracted data attractively.
 */
function App() {
  // File input ref
  const fileInputRef = useRef();

  // State management for file and extraction
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractedKeywords, setExtractedKeywords] = useState([]);
  const [isExtracted, setIsExtracted] = useState(false);

  // Dashboard/favorites management
  const [showDashboard, setShowDashboard] = useState(false);
  const [favorites, setFavorites] = useState(() => loadFavorites());

  // Checks if an item is favorited (returns its _fvKey if so, or undefined)
  function isFavorite(item) {
    return favorites.find(fav =>
      fav.title === item.title && fav.summary === item.summary && fav.meta === item.meta
    )?._fvKey;
  }

  // Add a recommendation to favorites (if not present)
  function handleSaveFavorite(item, type) {
    const key = `${type}:${item.title}:${item.meta}`;
    if (!isFavorite(item)) {
      const updated = [
        ...favorites,
        { ...item, _fvKey: key, _favType: type }
      ];
      setFavorites(updated);
      saveFavorites(updated);
    }
  }

  // Remove a favorite by key (used for dashboard)
  function handleRemoveFavorite(key) {
    const filtered = favorites.filter(fav => fav._fvKey !== key);
    setFavorites(filtered);
    saveFavorites(filtered);
  }

  // For navigation UI highlight
  function navClass(name) {
    if (showDashboard && name === "Dashboard") return "cs-nav-link active";
    if (!showDashboard && name === "Home") return "cs-nav-link active";
    return "cs-nav-link";
  }


  // PUBLIC_INTERFACE
  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
    setExtracting(true);
    setIsExtracted(false);
    // Simulate async extraction (e.g., backend call)
    setTimeout(() => {
      // Mock extracted topics/keywords (can randomize for realism)
      const mockKeywords = [
        "Distributed Systems",
        "Software Engineering",
        "Natural Language Processing",
        "Database Design",
        "Project Management",
        "Cybersecurity",
        "Computer Vision",
      ];
      setExtractedKeywords(mockKeywords);
      setExtracting(false);
      setIsExtracted(true);
    }, 1400);
  }

  // PUBLIC_INTERFACE
  function showFileDialog() {
    fileInputRef.current.click();
  }

  return (
    <div className="app cs-theme">
      {/* NAVBAR */}
      <nav className="navbar cs-navbar">
        <div className="container navbar-inner">
          <div className="cs-logo">
            <span className="cs-logo-symbol">&#127891;</span>
            <span className="cs-logo-text">CourseSync</span>
          </div>
          <div className="cs-nav-links">
            <a
              href="#"
              className={navClass("Home")}
              onClick={e => {
                e.preventDefault();
                setShowDashboard(false);
              }}
            >
              Home
            </a>
            <a
              href="#"
              className={navClass("Dashboard")}
              onClick={e => {
                e.preventDefault();
                setShowDashboard(true);
              }}
              aria-label="Show favorites dashboard"
            >
              Dashboard
              {favorites.length > 0 && (
                <span style={{
                  background: "#D6C7A1", // cta-green
                  color: "#4B2E25",      // header-bg
                  fontWeight: 700,
                  fontSize: "0.91em",
                  borderRadius: "56px",
                  padding: "2px 9px",
                  marginLeft: 6
                }}>{favorites.length}</span>
              )}
            </a>
            <a href="#" className="cs-nav-link">
              About
            </a>
          </div>
        </div>
      </nav>
      {/* Dashboard modal overlay */}
      {showDashboard && (
        <Dashboard
          onClose={() => setShowDashboard(false)}
        />
      )}
      {/* MAIN CONTENT CONTAINER */}
      <main className="cs-main" role="main">
        <div className="container cs-main-container">
          {/* UPLOAD SECTION */}
          <section className="cs-upload-section">
            <h2 className="cs-section-title">Upload your Syllabus</h2>
            <div className="cs-upload-box">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                ref={fileInputRef}
                style={{display: "none"}}
                onChange={handleFileSelect}
              />
              <button className="btn cs-btn-accent" onClick={showFileDialog}>
                {fileName ? "Change File" : "Select File"}
              </button>
              <span className="cs-upload-filename">
                {fileName}
              </span>
              {extracting && <span className="cs-extracting-msg">Analyzing document with AI...</span>}
            </div>
            <div className="cs-helper-text">
              Supports PDF, DOC, DOCX.<br />
              <b>
                Don&apos;t have a syllabus? Try a demo to preview features!
              </b>
            </div>
          </section>
          {/* EXTRACTED KEYWORDS/TOPICS */}
          {isExtracted && (
            <section className="cs-keywords-section">
              <h3 className="cs-section-subtitle">Extracted Topics &amp; Keywords</h3>
              <div className="cs-keywords-list">
                {extractedKeywords.map((key, idx) => (
                  <span className="cs-keyword" key={idx}>{key}</span>
                ))}
              </div>
            </section>
          )}

          {/* TABS SECTION */}
          {isExtracted && (
            <section className="cs-tabs-section">
              <Tabs
                extractedKeywords={extractedKeywords}
                onSaveFavorite={handleSaveFavorite}
                favorites={favorites}
              />
            </section>
          )}

          {!isExtracted && (
            <section className="cs-welcome-prompt">
              <div className="cs-brand-hero">
                <h1 className="cs-app-title">Empower Your Degree Journey</h1>
                <div className="cs-app-desc">
                  Upload your university syllabus to discover tailored internships,
                  online certifications, and project ideas that match your coursework.
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Tabs component - UI for recommendations under three tabs:
 * Uses async fetchers to retrieve each tab's recommendations based on topics.
 * @param {Object} props
 * @param {string[]} props.extractedKeywords
 * @param {function} [props.onSaveFavorite]   Called with (item, type)
 * @param {Array} [props.favorites]
 */
function Tabs({ extractedKeywords = [], onSaveFavorite, favorites }) {
  const tabList = ["Internships", "Certifications", "Project Ideas"];
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState([]);
  const [err, setErr] = useState(null);

  // Fetch recommendations
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);

    let fetchFn =
      activeIdx === 0
        ? fetchInternships
        : activeIdx === 1
        ? fetchCertifications
        : fetchProjectIdeas;
    fetchFn(extractedKeywords)
      .then(datas => {
        if (!cancelled) setRecs(datas);
      })
      .catch(e => {
        if (!cancelled) setErr("Failed to load recommendations.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeIdx, extractedKeywords]);

  // Utility to know if item favorited
  function isFavorited(item) {
    if (!favorites) return false;
    return favorites.some(
      f => f.title === item.title && f.summary === item.summary && f.meta === item.meta
    );
  }

  // Prefer a label consistent with current tab
  function favType() {
    return tabList[activeIdx].replace(/\s/g, "");
  }

  return (
    <div>
      <div className="cs-tabs" role="tablist">
        {tabList.map((tab, idx) => (
          <button
            key={tab}
            className={`cs-tab-btn${activeIdx === idx ? " active" : ""}`}
            aria-selected={activeIdx === idx}
            aria-controls={`tab-panel-${idx}`}
            id={`tab-btn-${idx}`}
            onClick={() => setActiveIdx(idx)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>
      <div
        className="cs-tab-content"
        role="tabpanel"
        id={`tab-panel-${activeIdx}`}
        aria-labelledby={`tab-btn-${activeIdx}`}
      >
        {loading ? (
          <div style={{ margin: "30px auto", color: "#40916C" }}>
            Loading recommendations...
          </div>
        ) : err ? (
          <div style={{ color: "red", margin: "25px auto" }}>{err}</div>
        ) : recs.length === 0 ? (
          <div style={{ margin: "25px auto", color: "#314d36" }}>
            No recommendations found.
          </div>
        ) : (
          recs.map((rec, i) => (
            <div className="rec-card" key={i}>
              <div className="rec-title">{rec.title}</div>
              <div className="rec-summary">{rec.summary}</div>
              <div className="rec-meta">{rec.meta}</div>
              <div className="rec-action">{rec.action}</div>
              {onSaveFavorite && (
                isFavorited(rec) ? (
                  <span style={{
                    background: "#FFD166",
                    color: "#aaa",
                    fontWeight: 700,
                    borderRadius: 5,
                    marginTop: 7,
                    fontSize: "0.97em",
                    padding: "3.5px 11px",
                    alignSelf: "flex-start"
                  }}>Saved</span>
                ) : (
                  <button
                    className="btn cs-btn-accent"
                    style={{
                      marginTop: 8,
                      padding: "7px 17px",
                      alignSelf: "flex-start",
                      fontSize: "0.98em"
                    }}
                    onClick={() => onSaveFavorite(rec, favType())}
                    aria-label="Add to favorites"
                  >
                    Save
                  </button>
                )
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
