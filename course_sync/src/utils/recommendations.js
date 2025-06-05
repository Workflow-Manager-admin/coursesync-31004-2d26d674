//
// utils/recommendations.js
//
// Async stubs to simulate backend/API recommendations for CourseSync.
//

// PUBLIC_INTERFACE
/**
 * Fetch mock internship recommendations based on extracted topics.
 * @param {string[]} topics - Extracted syllabus topics/keywords.
 * @returns {Promise<Array>} Array of internship recommendations.
 */
export async function fetchInternships(topics = []) {
  // Mock: Simulate filtering based on topics
  // Add official platform URLs as reference for each rec.
  const internshalaUrl = "https://internshala.com/internships";
  const linkedinUrl = "https://www.linkedin.com/jobs/internships";
  const remotiveUrl = "https://remotive.com/remote-jobs/search?category=software-dev";
  const adzunaUrl = "https://www.adzuna.com/search?q=intern";
  const joobleUrl = "https://jooble.org/jobs-internship";
  const angellistUrl = "https://wellfound.com/jobs";
  const exemplar = [
    {
      title: "Backend Intern — FinTech Co.",
      summary: "Develop microservices in Node.js for payment systems.",
      meta: "Remote | 2 months | Paid",
      action: "Apply on Internshala",
      resourceLink: internshalaUrl
    },
    {
      title: "AI Research Intern — NLP Lab",
      summary: "Help train large language models for text summarization.",
      meta: "Onsite | 3 months | Stipend",
      action: "See on Remotive",
      resourceLink: remotiveUrl
    },
    {
      title: "Software Engineering Intern — HealthTech",
      summary: "Build end-to-end cloud solutions for hospitals.",
      meta: "Hybrid | 6 months",
      action: "Apply via LinkedIn",
      resourceLink: linkedinUrl
    },
    {
      title: "Cybersecurity Analyst — SecureIT",
      summary: "Assess and mitigate security risks for web apps.",
      meta: "Remote | 3 months",
      action: "Find on Jooble",
      resourceLink: joobleUrl
    },
    {
      title: "Database Intern — EduData Inc.",
      summary: "Help design distributed, scalable student record systems.",
      meta: "Onsite | 4 months",
      action: "Browse on AngelList",
      resourceLink: angellistUrl
    }
  ];
  await new Promise(r => setTimeout(r, 650)); // simulate network latency

  // Topic-driven filtering (simulate: pick matches if keywords align, else random)
  const filtered = topics.length
    ? exemplar.filter(item =>
        topics.some(topic =>
          item.summary.toLowerCase().includes(topic.toLowerCase())
          || item.title.toLowerCase().includes(topic.toLowerCase())
        )
      )
    : exemplar;

  return (filtered.length > 0 ? filtered : exemplar).slice(0, 3);
}

// PUBLIC_INTERFACE
/**
 * Fetch mock certification recommendations based on extracted topics.
 * @param {string[]} topics
 * @returns {Promise<Array>} Array of certification recommendations.
 */
export async function fetchCertifications(topics = []) {
  // Use reference search URLs to main platforms
  const courseraUrl = "https://www.coursera.org/search?query=ai";
  const udemyUrl = "https://www.udemy.com/courses/search/?q=web+development";
  const edxUrl = "https://www.edx.org/search?tab=course";
  const skillshareUrl = "https://www.skillshare.com/en/search?query=software%20engineering";
  const futurelearnUrl = "https://www.futurelearn.com/courses";
  const datacampUrl = "https://www.datacamp.com/search?q=nlp";
  const googleCertsUrl = "https://grow.google/certificates/";
  const exemplar = [
    {
      title: "Coursera: Deep Learning Specialization",
      summary: "Master neural networks and AI concepts from Andrew Ng.",
      meta: "Coursera | Beginner to Advanced",
      action: "See on Coursera",
      resourceLink: courseraUrl
    },
    {
      title: "Udemy: The Complete Node.js Developer Course",
      summary: "Hands-on course for making Node.js web apps.",
      meta: "Udemy | Self-paced",
      action: "Explore Udemy",
      resourceLink: udemyUrl
    },
    {
      title: "edX: Software Engineering Essentials",
      summary: "Key skills for software project management.",
      meta: "edX | Free Option",
      action: "Start on edX",
      resourceLink: edxUrl
    },
    {
      title: "Skillshare: Agile for Software Teams",
      summary: "Learn agile project management and dev skills.",
      meta: "Skillshare | Self-guided",
      action: "Watch on Skillshare",
      resourceLink: skillshareUrl
    },
    {
      title: "FutureLearn: Cybersecurity Foundations",
      summary: "Intro to defending digital systems and networks.",
      meta: "FutureLearn | Short Course",
      action: "Start with FutureLearn",
      resourceLink: futurelearnUrl
    },
    {
      title: "Google Cybersecurity Professional Cert",
      summary: "Build practical skills in defending computer systems.",
      meta: "Google Career | 6 months",
      action: "Enroll with Google",
      resourceLink: googleCertsUrl
    },
    {
      title: "NLP Crash Course (DataCamp)",
      summary: "Apply NLP algorithms to real-world text problems.",
      meta: "DataCamp | Intermediate",
      action: "Try for Free",
      resourceLink: datacampUrl
    }
  ];
  await new Promise(r => setTimeout(r, 600));
  const filtered = topics.length
    ? exemplar.filter(item =>
        topics.some(topic =>
          item.title.toLowerCase().includes(topic.toLowerCase()) ||
          item.summary.toLowerCase().includes(topic.toLowerCase())
        )
      )
    : exemplar;
  return (filtered.length > 0 ? filtered : exemplar).slice(0, 3);
}

// PUBLIC_INTERFACE
/**
 * Fetch mock project ideas based on extracted topics.
 * @param {string[]} topics
 * @returns {Promise<Array>} Array of project recommendations.
 */
export async function fetchProjectIdeas(topics = []) {
  const exemplar = [
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
    {
      title: "Distributed Database Visualizer",
      summary: "Tool to visualize distributed data flows and replication.",
      meta: "React, D3.js, MongoDB",
      action: "See project doc",
    },
    {
      title: "AI-Driven Project Manager",
      summary: "Automate Gantt charts and task estimates using AI.",
      meta: "GPT, JS, PM Libraries",
      action: "View more",
    }
  ];
  await new Promise(r => setTimeout(r, 500));
  const filtered = topics.length
    ? exemplar.filter(item =>
        topics.some(topic =>
          item.title.toLowerCase().includes(topic.toLowerCase()) ||
          item.summary.toLowerCase().includes(topic.toLowerCase())
        )
      )
    : exemplar;
  return (filtered.length > 0 ? filtered : exemplar).slice(0, 3);
}
