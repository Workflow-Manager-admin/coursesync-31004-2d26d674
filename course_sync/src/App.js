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
    setManualDomain("");
    setDomainInput("");
    setExtracting(false);
    setDomainLoading(false);
  }

  /**
   * PUBLIC_INTERFACE
   * Extract keyphrases from plain text using a robust approach:
   * - Uses "keyword-extractor" for noun/expression extraction (English)
   * - Further filters stopwords with a custom academic list
   * - Applies stemming/lemmatization via 'natural' to group related words/phrases
   * - Prefers multi-word phrases but ensures best high-signal single words included
   * - Handles text from both PDF and DOCX sources
   * @param {string} text
   * @param {number} count Number of keyphrases to return (default 7)
   * @returns {Promise<string[]>}
   */
  async function extractKeywordsFromText(text, count = 7) {
    // Extra academic/common stopwords to filter
    const COMMON_WORDS = new Set([
      "introduction", "outline", "objectives", "module", "chapter", "syllabus",
      "student", "teacher", "course", "university", "college", "teacher", "learning", 
      "study", "week", "unit", "assessment", "instruction", "assignment", "project", 
      "exam", "lesson", "evaluation", "reference", "textbook", "references"
    ]);
    let keyphrases = [];
    try {
      // Use keyword-extractor for phrase and keyword extraction
      const extractor = await import("keyword-extractor");
      let natural = null;
      try {
        natural = await import("natural");
      } catch {
        // Fallback skip stemming if not present
      }

      let phrases = extractor.default.extract(text, {
        language: "english",
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: false
      });

      // Filter out very short/single-letter words and extra common words
      phrases = phrases
        .map(phrase => phrase.trim())
        .filter(k =>
          k && k.length > 2 && !/^[a-z]$/.test(k) &&
          !COMMON_WORDS.has(k) && k.match(/[a-z]/i)
        );

      // Stopword filtering (keyword-extractor's + academic extra)
      const STOPWORDS = new Set(extractor.default.getStopwords("english"));
      phrases = phrases.filter(
        k => !STOPWORDS.has(k) && !COMMON_WORDS.has(k)
      );

      // Stemming/lemmatization for grouping: use natural.PorterStemmer if available
      let lemmaMap = {};
      let groupedCounts = {};
      let stemFunc = natural && natural.PorterStemmer
        ? natural.PorterStemmer.stem
        : (x => x);

      for (const phrase of phrases) {
        let lemma;
        if (phrase.trim().split(/\s+/).length > 1) {
          lemma = phrase.trim()
            .split(/\s+/)
            .map(w => stemFunc(w))
            .join(" ");
        } else {
          lemma = stemFunc(phrase);
        }
        lemmaMap[phrase] = lemma;
        groupedCounts[lemma] = (groupedCounts[lemma] || 0) + 1;
      }

      // Rank: longer (multi-word) > single, then by frequency
      let phraseCandidates = Object.entries(lemmaMap)
        .sort((a, b) => {
          let alen = a[0].split(" ").length, blen = b[0].split(" ").length;
          if (blen !== alen) return blen - alen;
          return groupedCounts[b[1]] - groupedCounts[a[1]];
        });

      // Remove duplicates (grouped by lemma)
      let usedLemmas = new Set();
      let bestPhrases = [];
      for (let [orig, lemma] of phraseCandidates) {
        if (!usedLemmas.has(lemma)) {
          usedLemmas.add(lemma);
          bestPhrases.push(orig);
        }
      }

      // Sorted by frequency
      let rankedByCount = bestPhrases.sort((a, b) => groupedCounts[lemmaMap[b]] - groupedCounts[lemmaMap[a]]);
      // Separate multi-word from single
      const multiword = rankedByCount.filter(p => p.split(" ").length > 1);
      const singleword = rankedByCount.filter(p => p.split(" ").length === 1);

      // Take top multiword/then singles, dedup
      keyphrases = [
        ...multiword.slice(0, Math.ceil(count / 2)),
        ...singleword.slice(0, count)
      ].filter((v, idx, arr) => arr.indexOf(v) === idx).slice(0, count);

      if (keyphrases.length === 0 && text.length > 0) throw new Error("No keyphrases found");
    } catch (e) {
      // Fallback: basic freq-based after filtering and stemming if possible
      let words = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter(w =>
          w.length > 3 &&
          !["this", "that", "will", "with", "from", "which", "have", "been", "very", "upon"].includes(w) &&
          !COMMON_WORDS.has(w)
        );
      const extractor = await import("keyword-extractor");
      const STOPWORDS = new Set(extractor.default.getStopwords("english"));
      const freq = {};
      let natural = null;
      try { natural = await import("natural"); } catch {}
      let stemFunc = natural && natural.PorterStemmer ? natural.PorterStemmer.stem : (x => x);
      words.forEach(w => {
        if (!STOPWORDS.has(w) && !COMMON_WORDS.has(w)) {
          let lemma = stemFunc(w);
          freq[lemma] = (freq[lemma] || 0) + 1;
        }
      });
      keyphrases = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => k)
        .slice(0, count);
    }
    return keyphrases;
  }

  // Extract text from a PDF file using pdfjs-dist and locally bundled worker
  async function extractTextFromPDF(file) {
    try {
      /*
       * Use standard synchronous import so worker is bundled.
       * pdfjs-dist is installed, so we import the local minified worker and assign it to GlobalWorkerOptions.workerSrc.
       */
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
      // The following import syntax with .default ensures compatibility with CommonJS/ESM interop
      let pdfjsWorker;
      try {
        // Try ESM import
        pdfjsWorker = (await import("pdfjs-dist/build/pdf.worker.min.js")).default;
      } catch (err) {
        // Fallback to require (should only happen in CommonJS contexts, but left as secondary fallback)
        pdfjsWorker = require("pdfjs-dist/build/pdf.worker.min.js");
      }
      // Assign locally bundled worker script so that we do not rely on CDN or dynamic import
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        text += " " + pageText;
      }
      return text;
    } catch (e) {
      throw new Error("Failed to extract from PDF: " + e.message);
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
    setExtracting(true);
    setIsExtracted(false);

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
                    Don&apos;t have a syllabus? Try entering your domain below!
                  </b>
                </>
              ) : (
                <>
                  <span>
                    Type your field of study, e.g. &quot;Computer Science&quot;, &quot;Business Management&quot;, &quot;Biology&quot;, etc.<br />
                    <b>
                      Want more accurate results? Try uploading a syllabus!
                    </b>
                  </span>
                </>
              )}
            </div>
          </section>
          {/* EXTRACTED KEYWORDS/TOPICS */}
          {isExtracted && extractedKeywords.length > 0 && (
            <section className="cs-keywords-section">
              <h3 className="cs-section-subtitle">{
                inputMode === "file"
                  ? "Extracted Topics & Keywords"
                  : "Domain Topics"
              }</h3>
              <div className="cs-keywords-list">
                {extractedKeywords.map((key, idx) => (
                  <span className="cs-keyword" key={idx}>{key}</span>
                ))}
              </div>
            </section>
          )}

          {/* TABS SECTION */}
          {isExtracted && extractedKeywords.length > 0 && (
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

export default App;
