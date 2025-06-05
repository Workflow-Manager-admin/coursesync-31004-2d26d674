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
 * Lets user upload a syllabus file or enter a domain,
 * triggers recommendations from either.
 */
function App() {
  // File input ref
  const fileInputRef = useRef();

  // UI state: input method mode
  const [inputMode, setInputMode] = useState("file"); // "file" or "domain"
  // For uploaded file
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [extracting, setExtracting] = useState(false);
  // For domain manual input
  const [manualDomain, setManualDomain] = useState("");
  const [domainInput, setDomainInput] = useState("");
  const [domainLoading, setDomainLoading] = useState(false);

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

  // Mutually exclusive input method handlers
  function handleInputModeChange(mode) {
    setInputMode(mode);
    setFileName("");
    setSelectedFile(null);
    setExtractedKeywords([]);
    setIsExtracted(false);
    setEditedKeywords(null);
    setManualDomain("");
    setDomainInput("");
    setExtracting(false);
    setDomainLoading(false);
  }

  /**
   * PUBLIC_INTERFACE
   * Extract keyphrases from plain text using an advanced, robust approach:
   * - Uses "keyword-extractor" for English noun/phrase extraction.
   * - Further filters out stopwords & a curated academic/common words list.
   * - Performs stemming via "natural" for grouping.
   * - Prefers multi-word phrases, but strong single words may also appear.
   * - Handles text from both PDF and DOCX sources robustly.
   * @param {string} text - the corpus to extract from (unicode, student syllabus)
   * @param {number} count - max phrases to return (default: 7)
   * @returns {Promise<string[]>} - extracted suggestions, deduped, best-to-least ranked
   */
  async function extractKeywordsFromText(text, count = 7) {
    // Additional academic and common (meta) terms to exclude
    const COMMON_WORDS = new Set([
      "introduction", "outline", "objectives", "overview", "details",
      "module", "chapter", "section", "syllabus", "student", "teacher", "professor",
      "course", "university", "college", "learning", "study", "week", "unit",
      "assessment", "instruction", "assignment", "homework", "project", "exam",
      "lesson", "evaluation", "reference", "textbook", "references", "topic", "topics"
    ]);

    let keyphrases = [];

    try {
      // (1) Load NLP helpers dynamically
      const extractor = await import("keyword-extractor");
      let natural;
      try {
        natural = await import("natural");
      } catch {
        natural = null;
      }

      // (2) Use phrase extraction: prefer expressions, not just words
      let phrases = extractor.default.extract(text, {
        language: "english",
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: false
      });

      // (3) Clean/filter each phrase, remove trivial/short and all meta words
      const STOPWORDS = new Set(extractor.default.getStopwords("english"));
      phrases = phrases
        .map(phrase => phrase.trim().replace(/[-_]+/g, " "))
        .filter(w =>
          !!w &&
          w.length > 2 &&
          !/^[a-z]$/.test(w) &&
          !STOPWORDS.has(w) &&
          !COMMON_WORDS.has(w) &&
          /[a-z]/i.test(w)
        );

      // (4) Apply stemming for grouping
      let stemFunc = natural && natural.PorterStemmer
        ? natural.PorterStemmer.stem
        : (w => w);
      let lemmaMap = {};
      let lemmaFreq = {};

      for (const phrase of phrases) {
        let lemma;
        if (phrase.split(/\s+/).length > 1) {
          // For multiword, stem each word
          lemma = phrase
            .split(/\s+/)
            .map(token => stemFunc(token))
            .join(" ");
        } else {
          lemma = stemFunc(phrase);
        }
        lemmaMap[phrase] = lemma;
        lemmaFreq[lemma] = (lemmaFreq[lemma] || 0) + 1;
      }

      // (5) Candidate ranking: prefer longest/multi-token, then by frequency
      let sortedEntries = Object.entries(lemmaMap)
        .sort((a, b) => {
          let alen = a[0].split(" ").length, blen = b[0].split(" ").length;
          if (blen !== alen) return blen - alen;
          return lemmaFreq[b[1]] - lemmaFreq[a[1]];
        });

      // (6) Remove repeated stems
      let usedStems = new Set();
      let deduped = [];
      for (const [orig, lemma] of sortedEntries) {
        if (!usedStems.has(lemma)) {
          usedStems.add(lemma);
          deduped.push(orig);
        }
      }
      // Select n multiword, then singles (with no repeats)
      const multi = deduped.filter(w => w.split(" ").length > 1);
      const single = deduped.filter(w => w.split(" ").length === 1);
      keyphrases = [
        ...multi.slice(0, Math.ceil(count / 2)),
        ...single
      ].filter((v, idx, arr) => arr.indexOf(v) === idx).slice(0, count);

      // Force at least some output if text present
      if (keyphrases.length === 0 && text.length > 0) {
        throw new Error("No keyphrases found");
      }
    } catch (err) {
      // Fallback: freq-based, robust for all sources
      const extractor = await import("keyword-extractor");
      const STOPWORDS = new Set(extractor.default.getStopwords("english"));
      let natural;
      try {
        natural = await import("natural");
      } catch {
        natural = null;
      }
      let stemFunc = natural && natural.PorterStemmer
        ? natural.PorterStemmer.stem
        : (x => x);
      let tokens = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter(w =>
          w.length > 3 &&
          !STOPWORDS.has(w) &&
          !COMMON_WORDS.has(w)
        );

      let counts = {};
      tokens.forEach(w => {
        let s = stemFunc(w);
        counts[s] = (counts[s] || 0) + 1;
      });
      keyphrases = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => k)
        .slice(0, count);
    }
    return keyphrases;
  }

  // PUBLIC_INTERFACE
  /**
   * Extracts all text content from a PDF file using pdfjs-dist v5+ (no manual workerSrc required).
   * Catches and handles fake worker warnings/errors robustly.
   * Shows user-friendly error messages if parsing fails.
   * @param {File} file - the PDF file (from input element)
   * @returns {Promise<string>} - extracted plain text contents
   */
  async function extractTextFromPDF(file) {
    try {
      // Import PDF.js v5+ (legacy build).
      // DO NOT set workerSrc for v5+. Default behavior is to attempt worker, fall back to fake worker and log a warning.
      // If fakeWorker error is thrown (rare), catch below and present a user-friendly alert.
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");

      /*
       * No need to assign pdfjsLib.GlobalWorkerOptions.workerSrc.
       * See discussion: https://github.com/mozilla/pdf.js/issues/16847#issuecomment-1875701104
       * PDF.js v5+ attempts to launch a real worker automatically, else falls back to single-thread/fake worker.
       * If user gets a fakeWorker warning, extraction usually still works unless on very large PDFs.
       */

      const arrayBuffer = await file.arrayBuffer();
      let pdf;
      try {
        // Try loading the PDF document (returns promise, may warn about fake worker).
        pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      } catch (err) {
        // Sometimes, pdfjs-dist throws a fake worker related error here.
        if (err?.message && err.message.match(/fakeworker|worker.*missing|Cannot launch.*worker/i)) {
          throw new Error(
            "PDF extraction failed due to browser security restrictions or missing worker support. " +
            "Try a different browser, or use a smaller PDF file. " +
            "Ask your administrator to enable SharedArrayBuffer support."
          );
        }
        throw err;
      }

      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(" ");
          text += " " + pageText;
        } catch (pageErr) {
          // Gracefully skip unreadable pages but note problem
          text += " [Unreadable page]";
        }
      }
      return text;
    } catch (e) {
      // Provide a clear generic error for user, differentiating fake worker issues
      if (e.message && e.message.includes("Failed to extract from PDF")) {
        throw e; // Already user-friendly
      }
      throw new Error(
        /fakeworker|worker.*missing|Cannot launch.*worker/i.test(e.message || '')
          ? "Failed to extract from PDF: This browser may not support PDF parsing without a real web worker. Try uploading a smaller file, or use a recent Chrome/Firefox version."
          : "Failed to extract from PDF: " + (e.message || e.toString())
      );
    }
  }

  // Extract text from DOCX using mammoth
  async function extractTextFromDOCX(file) {
    try {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer });
      return value;
    } catch (e) {
      throw new Error("Failed to extract from DOCX: " + e.message);
    }
  }

  // Extract text from DOC (not robust in-browser, fallback)
  async function extractTextFromDOC(file) {
    // No reliable client-side DOC parser; fallback to empty/notice
    return "";
  }

  // When uploading a file
  async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
    setExtractedKeywords([]);
    setIsExtracted(false);
    setEditedKeywords(null);
    setExtracting(true);

    let text = "";
    let errorMsg = "";

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === "pdf") {
        text = await extractTextFromPDF(file);
      } else if (ext === "docx") {
        text = await extractTextFromDOCX(file);
      } else if (ext === "doc") {
        // Best-effort, but real .doc extraction needs server-side library! Warn user.
        text = await extractTextFromDOC(file);
        errorMsg = "DOC format parsing is limited in-browser. Please use PDF or DOCX for best results.";
      } else {
        errorMsg = "Unsupported file type. Please upload a PDF or DOCX.";
      }
      if (text && text.trim().length > 0) {
        const keywords = await extractKeywordsFromText(text);
        setExtractedKeywords(keywords);
      } else {
        setExtractedKeywords([]);
        errorMsg = errorMsg || "Could not extract readable text from this file.";
      }
      setIsExtracted(true);
    } catch (err) {
      setExtractedKeywords([]);
      setIsExtracted(false);
      setEditedKeywords(null);
      errorMsg = err.message || "Failed to extract keywords!";
    }
    setExtracting(false);
    if (errorMsg) {
      setTimeout(() => {
        alert(errorMsg);
      }, 330);
    }
  }

  // PUBLIC_INTERFACE
  function showFileDialog() {
    fileInputRef.current.click();
  }
  
  // When user submits domain instead of uploading a file
  function handleDomainSubmit(e) {
    e.preventDefault();
    const trimmed = domainInput.trim();
    if (trimmed.length < 2) return;
    setExtractedKeywords([]);
    setIsExtracted(false);
    setEditedKeywords(null);
    setDomainLoading(true);
    setManualDomain(trimmed);
    // Simulate AI keyword extraction: just use the domain as the single topic (for demo)
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

  // Clean up input fields when toggling modes
  // (Already done via handleInputModeChange.)

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
          {/* Choice: File upload or Domain input */}
          <section className="cs-upload-section">
            <h2 className="cs-section-title">Get Personalized Recommendations</h2>
            <div style={{display: "flex", gap: "14px", marginBottom: 14}}>
              <button
                type="button"
                className={`btn cs-btn-accent${inputMode === "file" ? " active" : ""}`}
                aria-pressed={inputMode === "file"}
                style={{
                  background: inputMode === "file" ? "#4B2E25" : "",
                  color: inputMode === "file" ? "#FFD9BF" : ""
                }}
                onClick={() => handleInputModeChange("file")}
              >
                Upload Syllabus
              </button>
              <button
                type="button"
                className={`btn cs-btn-accent${inputMode === "domain" ? " active" : ""}`}
                aria-pressed={inputMode === "domain"}
                style={{
                  background: inputMode === "domain" ? "#4B2E25" : "",
                  color: inputMode === "domain" ? "#FFD9BF" : ""
                }}
                onClick={() => handleInputModeChange("domain")}
              >
                Enter Domain
              </button>
            </div>
            {/* Depending on the input method: */}
            {inputMode === "file" ? (
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
            ) : (
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
            )}
            <div className="cs-helper-text">
              {inputMode === "file" ? (
                <>
                  Supports PDF, DOC, DOCX.<br />
                  <b>
                    Don't have a syllabus? Try entering your domain below!
                  </b>
                </>
              ) : (
                <>
                  <span>
                    Type your field of study, e.g. "Computer Science", "Business Management", "Biology", etc.<br />
                    <b>
                      Want more accurate results? Try uploading a syllabus!
                    </b>
                  </span>
                </>
              )}
            </div>
          </section>
          {/* EXTRACTED KEYWORDS/TOPICS */}
          {isExtracted && extractedKeywords.length > 0 && !Array.isArray(editedKeywords) && (
            <section className="cs-keywords-section">
              <h3 className="cs-section-subtitle">
                {inputMode === "file"
                  ? "Review & Edit Extracted Topics/Keywords"
                  : "Review & Edit Topics"}
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
                  Upload your syllabus <b>or</b> enter a domain to discover tailored
                  internships, certifications, and project ideas matched to your learning!
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
