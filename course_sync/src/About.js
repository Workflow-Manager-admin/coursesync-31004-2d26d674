import React, { useState } from "react";
import "./App.css";

// PUBLIC_INTERFACE
/**
 * About page for CourseSync. Offers a site description,
 * star rating and open feedback (mock submit), and contact info.
 */
function About() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Handle form (mock: local only)
  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    // Optionally store feedback somewhere, but this is a mock
  }

  // Reset feedback for new submission
  function handleFeedbackEdit() {
    setSubmitted(false);
    setFeedback("");
    setRating(0);
  }

  return (
    <div style={{
      background: "var(--subtle-section-bg)",
      borderRadius: 16,
      boxShadow: "var(--card-shadow)",
      padding: "44px 29px 35px 29px",
      maxWidth: 680,
      margin: "0 auto",
      color: "var(--text-primary)"
    }}>
      <h2 className="cs-section-title" style={{marginTop:0, marginBottom:10}}>
        About CourseSync
      </h2>
      <div style={{ fontSize: "1.16em", color: "var(--accent-button)", marginBottom: 22, lineHeight: 1.6 }}>
        <b>Welcome to CourseSync!</b>
        <div style={{ color: "var(--text-main)", fontWeight: 500, marginTop: 7 }}>
          CourseSync empowers students to make the most of their academic journey. Instantly discover tailored internships, recognized certifications, and project ideas using your university syllabus or area of interest.
          <br /><br />
          Our mission: <span style={{color:"var(--header-bg)", fontWeight:700}}>Bridge the gap between coursework and real-world opportunities!</span>
        </div>
      </div>

      {/* Rating & Feedback */}
      <div style={{
        background: "var(--highlight)",
        padding: "24px 21px",
        borderRadius: 12,
        marginBottom: 20,
        boxShadow: "0 1px 9px #4b2e2513"
      }}>
        <div className="cs-section-subtitle" style={{margin:0, marginBottom:10}}>Rate your experience</div>
        {submitted ? (
          <div>
            <div style={{fontSize:"1.14em", color:"var(--cta-green)", fontWeight:700, marginBottom:10}}>
              Thank you for your feedback!
            </div>
            <button className="btn cs-btn-accent" style={{minWidth:98, fontSize:"0.96em"}} onClick={handleFeedbackEdit}>
              Submit Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 17, maxWidth:480 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "1.87em" }}>
              {[1,2,3,4,5].map(num => (
                <span
                  key={num}
                  onMouseEnter={() => setHovered(num)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(num)}
                  style={{
                    cursor: "pointer",
                    color: (hovered || rating) >= num ? "#E87A41" : "#ccbca9",
                    transition: "color 0.16s"
                  }}
                  role="radio"
                  aria-checked={rating === num}
                  tabIndex={0}
                  onKeyPress={e => {
                    if (e.key === "Enter" || e.key === " ") setRating(num);
                  }}
                  aria-label={`${num} star${num===1?'':'s'}`}
                >★</span>
              ))}
              <span style={{marginLeft:8, fontSize:"0.53em",color:"#7C4F37", fontWeight:900}}>
                {rating ? `${rating} / 5` : ""}
              </span>
            </div>
            <label style={{fontWeight:600, color:"var(--accent-button)", marginBottom:3}}>
              Share any feedback (optional):
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={3}
                placeholder="Tell us what you love, or what we can improve..."
                style={{
                  fontSize:"1.07em", width: "100%",
                  borderRadius: 8, border: "1.2px solid #D8BFAA",
                  padding: "10px 13px", marginTop:7,
                  resize: "vertical",minHeight:55,
                }}
                maxLength={300}
                aria-label="Your feedback"
              />
            </label>
            <button
              className="btn cs-btn-accent"
              type="submit"
              disabled={!rating}
              style={{
                minWidth:110,
                background: "#4B2E25",
                color: "#FFD9BF",
                fontWeight:700,
                fontSize:"1.03em"
              }}
              aria-label="Submit feedback"
            >
              Submit
            </button>
          </form>
        )}
      </div>

      {/* Contact Section */}
      <div style={{
        marginTop: "12px",
        background: "#fff",
        border: "1.2px solid #D8BFAA",
        borderRadius: "10px",
        padding: "17px 19px",
        display: "flex",
        flexDirection: "column",
        gap: 3
      }}>
        <div className="cs-section-subtitle" style={{fontSize:"1.13em", margin:0, color:"#5E422F"}}>Contact Us</div>
        <div style={{fontSize:"1.05em", color:"#4B2E25"}}>
          Have suggestions, questions, or need help?
        </div>
        <div style={{marginTop:4,}}>
          <b>Email:</b> <a href="mailto:support@coursesync.app" style={{color:"#E87A41"}}>support@coursesync.app</a>
        </div>
      </div>
    </div>
  );
}

export default About;
