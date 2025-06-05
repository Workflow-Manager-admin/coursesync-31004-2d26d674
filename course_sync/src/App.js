import React, { useRef, useState } from "react";
import "./App.css";

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

  // Example: Recommendation state (future features)
  // const [recommendations, setRecommendations] = useState([]);

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
            <a href="#" className="cs-nav-link active">Home</a>
            <a href="#" className="cs-nav-link">Dashboard</a>
            <a href="#" className="cs-nav-link">About</a>
          </div>
        </div>
      </nav>
      {/* MAIN CONTENT CONTAINER */}
      <main className="cs-main">
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
              <Tabs />
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

// PUBLIC_INTERFACE
/**
 * Tabs component - UI for recommendations under three tabs:
 * Internships, Certifications, Project Ideas (with mock data for each).
 */
function Tabs() {
  const tabList = ["Internships", "Certifications", "Project Ideas"];
  const [activeIdx, setActiveIdx] = useState(0);

  // Some mock data
  const recommendations = [
    // Internships
    [
      {
        title: "Backend Intern — FinTech Co.",
        summary: "Develop microservices in Node.js for payment systems.",
        meta: "Remote | 2 months | Paid",
        action: "Apply on Internshala",
      },
      {
        title: "AI Research Intern — NLP Lab",
        summary: "Help train large language models for text summarization.",
        meta: "Onsite | 3 months | Stipend",
        action: "View details",
      },
      {
        title: "Software Engineering Intern — HealthTech",
        summary: "Build end-to-end cloud solutions for hospitals.",
        meta: "Hybrid | 6 months",
        action: "Apply via LinkedIn",
      },
    ],
    // Certifications
    [
      {
        title: "Coursera: Deep Learning Specialization",
        summary: "Master neural networks and AI concepts from Andrew Ng.",
        meta: "Coursera | Beginner to Advanced",
        action: "See on Coursera",
      },
      {
        title: "Udemy: The Complete Node.js Developer Course",
        summary: "Hands-on course for making Node.js web apps.",
        meta: "Udemy | Self-paced",
        action: "Explore Udemy",
      },
      {
        title: "edX: Software Engineering Essentials",
        summary: "Key skills for software project management.",
        meta: "edX | Free Option",
        action: "Start Learning",
      },
    ],
    // Project Ideas
    [
      {
        title: "Smart Campus Messenger",
        summary: "Build a cross-platform chat app for students using NLP moderation.",
        meta: "Tech: React, Node, NLP API",
        action: "View idea details",
      },
      {
        title: "Personal Expense Tracker with AI Insights",
        summary: "Track spending, get smart suggestions with ML analysis.",
        meta: "Tech: Django, Pandas, ML",
        action: "See more",
      },
      {
        title: "Resume Analyzer Bot",
        summary: "Analyze and summarize CVs, match to job profiles using LLM.",
        meta: "Python, OpenAI API",
        action: "Explore guide",
      },
    ],
  ];

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
        {recommendations[activeIdx].map((rec, i) => (
          <div className="rec-card" key={i}>
            <div className="rec-title">{rec.title}</div>
            <div className="rec-summary">{rec.summary}</div>
            <div className="rec-meta">{rec.meta}</div>
            <div className="rec-action">{rec.action}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


export default App;
