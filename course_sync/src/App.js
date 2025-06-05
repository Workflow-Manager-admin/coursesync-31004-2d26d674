import React, { useRef, useState } from "react";
import "./App.css";

/**
 * Colors (based on palette):
 * --primary: #2D6A4F (deep green)
 * --secondary: #40916C (vivid green)
 * --accent: #FFD166 (yellow)
 */

// PUBLIC_INTERFACE
function App() {
  // Upload and parsing state
  const fileInputRef = useRef();
  const [fileName, setFileName] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [keywords, setKeywords] = useState([
    // Example/mock keywords for initial UI; will be set by actual parser
    "Data Structures", "Algorithms", "Machine Learning"
  ]);
  const [activeTab, setActiveTab] = useState("internships");

  // Placeholder recommendations
  const recommendations = {
    internships: [
      { title: "Software Engineering Intern", org: "TechCorp", link: "#", summary: "Work on backend APIs." },
      { title: "AI Research Intern", org: "AI Labs", link: "#", summary: "Research ML models." }
    ],
    certifications: [
      { title: "Coursera: ML Foundations", provider: "Coursera", link: "#", summary: "Intro to Machine Learning." },
      { title: "AWS Cloud Practitioner", provider: "AWS", link: "#", summary: "Cloud fundamentals." }
    ],
    projects: [
      { title: "Course Outcome Tracker", link: "#", summary: "Web app tracking curriculum competency." },
      { title: "Syllabus Visualizer", link: "#", summary: "Visualize concepts covered in PDFs." }
    ]
  };

  // PUBLIC_INTERFACE
  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setExtracting(true);
    setTimeout(() => {
      // Simulate parsing delay; in reality, call backend/parser here
      setExtracting(false);
      setExtracted(true);
      setKeywords(["Operating Systems", "DBMS", "Cloud Computing", "NLP", "Project Management"]);
    }, 1500);
  }

  // PUBLIC_INTERFACE
  function triggerFileDialog() {
    fileInputRef.current.click();
  }

  // PUBLIC_INTERFACE
  function renderRecommendationCard(item, idx, tab) {
    // Card content varies with tab
    return (
      <div className="rec-card" key={idx}>
        <div className="rec-title">{item.title}</div>
        <div className="rec-summary">{item.summary}</div>
        {tab === "internships" && <div className="rec-meta">{item.org}</div>}
        {tab === "certifications" && <div className="rec-meta">{item.provider}</div>}
        <a
          href={item.link}
          className="rec-action"
          target="_blank"
          rel="noopener noreferrer"
        >
          Details
        </a>
      </div>
    );
  }

  return (
    <div className="app cs-theme">
      {/* Navigation Bar */}
      <nav className="navbar cs-navbar">
        <div className="container navbar-inner">
          <div className="cs-logo">
            <span className="cs-logo-symbol">&#127891;</span> {/* Graduation Cap Unicode */}
            <span className="cs-logo-text">CourseSync</span>
          </div>
          <div className="cs-nav-links">
            <a href="#" className="cs-nav-link active">
              Home
            </a>
            <a href="#" className="cs-nav-link">
              Dashboard
            </a>
            <a href="#" className="cs-nav-link">
              About
            </a>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="cs-main">
        <div className="container cs-main-container">
          {/* Upload & Extract Section */}
          <section className="cs-upload-section">
            <h2 className="cs-section-title">Upload your Syllabus</h2>
            <div className="cs-upload-box">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button className="btn cs-btn-accent" onClick={triggerFileDialog}>
                {fileName ? "Change File" : "Select File"}
              </button>
              <span className="cs-upload-filename">{fileName}</span>
              {extracting && <span className="cs-extracting-msg">Parsing document...</span>}
            </div>
            <div className="cs-helper-text">
              Supports PDF, DOC, DOCX. <br />
              <b>
                Don&apos;t have a syllabus? Try demo sample for a preview.
              </b>
            </div>
          </section>

          {/* Extracted Keywords/Topics */}
          {extracted && (
            <section className="cs-keywords-section">
              <h3 className="cs-section-subtitle">Extracted Topics & Keywords</h3>
              <div className="cs-keywords-list">
                {keywords.map((kw, i) => (
                  <span className="cs-keyword" key={i}>
                    {kw}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Recommendations Tabs */}
          {extracted && (
            <section className="cs-tabs-section">
              <div className="cs-tabs" role="tablist">
                <button
                  className={`cs-tab-btn${activeTab === "internships" ? " active" : ""}`}
                  onClick={() => setActiveTab("internships")}
                  role="tab"
                  aria-selected={activeTab === "internships"}
                >
                  Internships
                </button>
                <button
                  className={`cs-tab-btn${activeTab === "certifications" ? " active" : ""}`}
                  onClick={() => setActiveTab("certifications")}
                  role="tab"
                  aria-selected={activeTab === "certifications"}
                >
                  Certifications
                </button>
                <button
                  className={`cs-tab-btn${activeTab === "projects" ? " active" : ""}`}
                  onClick={() => setActiveTab("projects")}
                  role="tab"
                  aria-selected={activeTab === "projects"}
                >
                  Project Ideas
                </button>
              </div>
              <div className="cs-tab-content" role="tabpanel">
                {recommendations[activeTab].map((item, idx) =>
                  renderRecommendationCard(item, idx, activeTab)
                )}
              </div>
            </section>
          )}

          {/* Welcome prompt below if not uploaded */}
          {!extracted && (
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

export default App;
