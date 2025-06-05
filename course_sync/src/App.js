import React, { useState, useEffect } from "react";
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
 * Accepts only domain input and presents recommendation tabs.
 */
function App() {
  // For domain manual input
  const [domainInput, setDomainInput] = useState("");
  const [domainLoading, setDomainLoading] = useState(false);
  const [manualDomain, setManualDomain] = useState("");

  // Canonical topics/keywords source
  const [extractedKeywords, setExtractedKeywords] = useState([]);
  const [isExtracted, setIsExtracted] = useState(false);

  // For user-reviewed, final keywords
  const [editedKeywords, setEditedKeywords] = useState(null);

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

  // Reset state when going "home"
  function handleHome() {
    setShowDashboard(false);
    setExtractedKeywords([]);
    setIsExtracted(false);
    setEditedKeywords(null);
    setDomainInput("");
    setDomainLoading(false);
    setManualDomain("");
  }

  // When user submits domain
  function handleDomainSubmit(e) {
    e.preventDefault();
    const trimmed = domainInput.trim();
    if (trimmed.length < 2) return;
    setExtractedKeywords([]);
    setIsExtracted(false);
    setEditedKeywords(null);
    setDomainLoading(true);
    setManualDomain(trimmed);
    // Simulate AI keyword extraction: just use the domain as the single topic (demo)
    setTimeout(() => {
      // For real case, extract subtopics from backend; here use domain and simple expansions
      const generatedKeywords = [trimmed];
      // Optionally, add some pre-fixed/related expansions for certain known domains
      if (/computer|cs|ai|data/i.test(trimmed)) {
        generatedKeywords.push(
          "Artificial Intelligence",
          "Software Engineering",
          "Data Science",
          "Machine Learning"
        );
      } else if (/business|mgmt|finance|account/i.test(trimmed)) {
        generatedKeywords.push(
          "Management",
          "Finance",
          "Entrepreneurship",
          "Marketing"
        );
      } else if (/biology|life/i.test(trimmed)) {
        generatedKeywords.push(
          "Genetics",
          "Biochemistry",
          "Biotech",
          "Ecology"
        );
      }
      setExtractedKeywords(generatedKeywords);
      setDomainLoading(false);
      setIsExtracted(true);
    }, 900);
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
                handleHome();
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
          {/* Only Domain input */}
          <section className="cs-upload-section">
            <h2 className="cs-section-title">Get Personalized Recommendations</h2>
            <form
              onSubmit={handleDomainSubmit}
              style={{ display: "flex", alignItems: "center", gap: "17px", width: "100%", marginBottom: 2 }}
            >
              <input
                type="text"
                value={domainInput}
                onChange={e => setDomainInput(e.target.value)}
                placeholder="Type a domain (e.g. Computer Science, Business...)"
                style={{
                  fontSize: "1.04em",
                  padding: "9px 16px",
                  borderRadius: "7px",
                  border: "1.4px solid #D8BFAA",
                  minWidth: 0,
                  width: "300px",
                  flex: 1
                }}
                disabled={domainLoading}
                aria-label="Type a domain for recommendations"
                required
              />
              <button
                type="submit"
                className="btn cs-btn-accent"
                style={{ minWidth: 99 }}
                disabled={domainLoading || !domainInput.trim()}
              >
                {domainLoading ? "Analyzing..." : "Recommend"}
              </button>
            </form>
            <div className="cs-helper-text">
              <span>
                Type your field of study, e.g. "Computer Science", "Business Management", "Biology", etc.
              </span>
            </div>
          </section>
          {/* EXTRACTED KEYWORDS/TOPICS */}
          {isExtracted && extractedKeywords.length > 0 && !Array.isArray(editedKeywords) && (
            <section className="cs-keywords-section">
              <h3 className="cs-section-subtitle">
                Review & Edit Topics
              </h3>
              <KeywordEditor
                initialKeywords={extractedKeywords}
                onConfirm={setEditedKeywords}
                confirmed={false}
              />
            </section>
          )}

          {/* TABS SECTION */}
          {isExtracted && Array.isArray(editedKeywords) && editedKeywords.length > 0 && (
            <>
              <section className="cs-keywords-section">
                <h3 className="cs-section-subtitle">
                  Finalized Topics/Keywords
                </h3>
                <KeywordEditor
                  initialKeywords={editedKeywords}
                  onConfirm={() => {}}
                  confirmed={true}
                />
              </section>
              <section className="cs-tabs-section">
                <Tabs
                  extractedKeywords={editedKeywords}
                  onSaveFavorite={handleSaveFavorite}
                  favorites={favorites}
                />
              </section>
            </>
          )}

          {!isExtracted && (
            <section className="cs-welcome-prompt">
              <div className="cs-brand-hero">
                <h1 className="cs-app-title">Empower Your Degree Journey</h1>
                <div className="cs-app-desc">
                  Enter a domain to discover tailored internships, certifications, and project ideas matched to your learning!
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
              {rec.resourceLink ? (
                <a
                  className="rec-action"
                  href={rec.resourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: 700, color: "#7C4F37", textDecoration: "underline" }}
                  aria-label={rec.action}
                >
                  {rec.action}
                </a>
              ) : (
                <div className="rec-action">{rec.action}</div>
              )}
              {onSaveFavorite && (
                isFavorited(rec) ? (
                  <span style={{
                    background: "#D6C7A1", // cta-green
                    color: "#4B2E25",      // header-bg
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
                      fontSize: "0.98em",
                      background: "#7C4F37",
                      color: "#E6D5C3"
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

/**
 * KeywordEditor component.
 * Lets users review, remove, or add keywords before proceeding to recommendations.
 * Props:
 *  - initialKeywords: string[] (required)
 *  - onConfirm: function(newList: string[]) => void (required)
 *  - confirmed: boolean (whether user already confirmed; disables editing)
 */
function KeywordEditor({ initialKeywords = [], onConfirm, confirmed }) {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [newKeyword, setNewKeyword] = useState("");
  const [error, setError] = useState(null);

  // Keep local state in sync if the source changes
  useEffect(() => {
    setKeywords(initialKeywords || []);
    setError(null);
    setNewKeyword("");
  }, [initialKeywords]);

  // Remove a keyword by index
  function handleRemove(idx) {
    setKeywords(ks => ks.filter((_, i) => i !== idx));
  }
  // Add a keyword (with cleaning, no duplicates)
  function handleAdd() {
    let candidate = newKeyword.trim();
    if (!candidate) return;
    // Only allow letters, spaces, hyphens
    if (!/^[\w -]{2,100}$/.test(candidate)) {
      setError("Invalid keyword.");
      return;
    }
    if (keywords.map(k => k.toLowerCase()).includes(candidate.toLowerCase())) {
      setError("Already exists.");
      return;
    }
    if (keywords.length >= 12) {
      setError("Maximum 12 keywords allowed.");
      return;
    }
    setKeywords([...keywords, candidate]);
    setNewKeyword("");
    setError(null);
  }
  // Confirm & lock-in the user's keywords, then proceed.
  function handleConfirm() {
    // Must have at least one
    if (keywords.length === 0) {
      setError("Please enter at least one keyword.");
      return;
    }
    onConfirm && onConfirm(keywords);
  }

  return (
    <div>
      <div className="cs-keywords-list" style={{marginBottom: 10}}>
        {keywords.length === 0 ? (
          <span style={{color: "#7C4F37", fontWeight: 500}}>No keywords. Add at least one to continue.</span>
        ) : (
          keywords.map((key, idx) => (
            <span className="cs-keyword" key={key + idx} style={{display: "flex", alignItems: "center", gap: 6}}>
              {key}
              {!confirmed && (
                <button
                  type="button"
                  aria-label={`Remove "${key}"`}
                  style={{
                    marginLeft: 6,
                    background: "transparent",
                    color: "#FFD166",
                    border: "none",
                    fontWeight: "bold",
                    fontSize: "1.1em",
                    cursor: "pointer"
                  }}
                  onClick={() => handleRemove(idx)}
                  tabIndex={0}
                >
                  ×
                </button>
              )}
            </span>
          ))
        )}
      </div>
      {!confirmed && (
        <>
          <div style={{display: "flex", gap: 8, alignItems: "center", marginBottom: 10}}>
            <input
              type="text"
              value={newKeyword}
              disabled={confirmed}
              maxLength={80}
              onChange={e => {
                setNewKeyword(e.target.value.replace(/[^\w \-]/g, ""));
                setError(null);
              }}
              onKeyDown={e => {
                if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
              }}
              placeholder="Add keyword"
              style={{
                fontSize: "1.01em",
                padding: "7px 12px",
                borderRadius: "7px",
                border: "1.2px solid #D8BFAA",
                flex: 1,
                minWidth: 0,
                maxWidth: 188
              }}
              aria-label="Add a keyword"
            />
            <button
              className="btn cs-btn-accent"
              style={{maxWidth: 62, minHeight: 33}}
              type="button"
              disabled={confirmed}
              onClick={handleAdd}
            >Add</button>
          </div>
          <div style={{ marginBottom: 8, minHeight: 18 }}>
            {error && <span style={{ color: "#B02E25" }}>{error}</span>}
          </div>
          <button
            className="btn cs-btn-accent"
            style={{
              background: "#4B2E25",
              color: "#FFD9BF",
              minWidth: 130,
              fontWeight: 700
            }}
            type="button"
            onClick={handleConfirm}
            disabled={keywords.length === 0}
            aria-label="Proceed to recommendations"
          >
            Proceed to Recommendations
          </button>
        </>
      )}
      {confirmed && (
        <div style={{marginTop: 5, color: "#D6C7A1", fontWeight: 700}}>✓ Confirmed. Recommendations loaded below.</div>
      )}
    </div>
  );
}

export default App;
