//
// utils/recommendations.js
//
// Async stubs to simulate backend/API recommendations for CourseSync.
// Each recommendation includes a real or reference external resource link.
//

// PUBLIC_INTERFACE
/**
 * Fetch mock internship recommendations based on extracted topics.
 * Each recommendation includes a real or reference external resource link to the actual API endpoint
 * or the platform's search/resource page. Topics are used to populate search.
 * @param {string[]} topics - Extracted syllabus topics/keywords.
 * @returns {Promise<Array>} Array of internship recommendations.
 */
export async function fetchInternships(topics = []) {
  // Platforms with resource/search URLs
  const platforms = [
    {
      name: "Internshala",
      url: "https://internshala.com/internships/",
      search: topic => `https://internshala.com/internships/${encodeURIComponent(topic.toLowerCase().replace(/ /g, "-"))}-internship`
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/jobs/internships",
      search: topic => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(topic)}&f_E=1`
    },
    {
      name: "Remotive",
      url: "https://remotive.com/remote-jobs/search?category=software-dev",
      search: topic => `https://remotive.com/remote-jobs/search?search=${encodeURIComponent(topic)}`
    },
    {
      name: "Jooble",
      url: "https://jooble.org/jobs-internship",
      search: topic => `https://jooble.org/SearchResult?ukw=${encodeURIComponent(topic)}&typ=3`
    },
    {
      name: "AngelList",
      url: "https://wellfound.com/jobs",
      search: topic => `https://wellfound.com/jobs?keywords=${encodeURIComponent(topic)}`
    },
    {
      name: "Adzuna",
      url: "https://www.adzuna.com/search?q=intern",
      search: topic => `https://www.adzuna.com/search?q=intern+${encodeURIComponent(topic)}`
    }
  ];

  const exemplar = [
    {
      title: "Backend Intern — FinTech Co.",
      summary: "Develop microservices in Node.js for payment systems.",
      meta: "Remote | 2 months | Paid",
      action: "Apply on Internshala",
      resourceLink: platforms[0].url
    },
    {
      title: "AI Research Intern — NLP Lab",
      summary: "Help train large language models for text summarization.",
      meta: "Onsite | 3 months | Stipend",
      action: "See on Remotive",
      resourceLink: platforms[2].url
    },
    {
      title: "Software Engineering Intern — HealthTech",
      summary: "Build end-to-end cloud solutions for hospitals.",
      meta: "Hybrid | 6 months",
      action: "Apply via LinkedIn",
      resourceLink: platforms[1].url
    },
    {
      title: "Cybersecurity Analyst — SecureIT",
      summary: "Assess and mitigate security risks for web apps.",
      meta: "Remote | 3 months",
      action: "Find on Jooble",
      resourceLink: platforms[3].url
    },
    {
      title: "Database Intern — EduData Inc.",
      summary: "Help design distributed, scalable student record systems.",
      meta: "Onsite | 4 months",
      action: "Browse on AngelList",
      resourceLink: platforms[4].url
    }
  ];

  await new Promise(r => setTimeout(r, 650)); // simulate latency

  // Topic-enhanced: recommend resourceLinks with platform search URLs for the first topic, if present
  let topicBased = [];
  if (topics && topics.length > 0) {
    // For better coverage, use top 3 platforms for topic-based resourceLinks
    const [first] = topics;
    topicBased = platforms.slice(0, 5).map(pf => ({
      title: `${pf.name} Internships — ${first}`,
      summary: `Discover internship opportunities for ${first} at ${pf.name}.`,
      meta: `${pf.name} | Real-time Search`,
      action: `Search on ${pf.name}`,
      resourceLink: pf.search(first)
    }));
  }
  // Prefer topic-based, otherwise use exemplars
  const dataPool = topicBased.length > 0 ? [...topicBased, ...exemplar] : exemplar;
  // Deduplicate by resourceLink and title, limit to 3
  const unique = [];
  for (let item of dataPool) {
    if (!unique.some(x => x.resourceLink === item.resourceLink && x.title === item.title)) unique.push(item);
    if (unique.length >= 3) break;
  }
  return unique;
}

// PUBLIC_INTERFACE
/**
 * Fetch mock certification recommendations based on extracted topics.
 * Each recommendation includes a reference/search/resource URL.
 * @param {string[]} topics
 * @returns {Promise<Array>} Array of certification recommendations.
 */
export async function fetchCertifications(topics = []) {
  // Base URLs for platform search endpoints
  const courseraBase = "https://www.coursera.org/search?query=";
  const udemyBase = "https://www.udemy.com/courses/search/?q=";
  const edxBase = "https://www.edx.org/search?tab=course&q=";
  const skillshareBase = "https://www.skillshare.com/en/search?query=";
  const futurelearnUrl = "https://www.futurelearn.com/courses";
  const datacampBase = "https://www.datacamp.com/search?q=";
  const googleCertsUrl = "https://grow.google/certificates/";

  const exemplar = [
    {
      title: "Coursera: Deep Learning Specialization",
      summary: "Master neural networks and AI concepts from Andrew Ng.",
      meta: "Coursera | Beginner to Advanced",
      action: "See on Coursera",
      resourceLink: courseraBase + "ai",
    },
    {
      title: "Udemy: The Complete Node.js Developer Course",
      summary: "Hands-on course for making Node.js web apps.",
      meta: "Udemy | Self-paced",
      action: "Explore Udemy",
      resourceLink: udemyBase + "web+development",
    },
    {
      title: "edX: Software Engineering Essentials",
      summary: "Key skills for software project management.",
      meta: "edX | Free Option",
      action: "Start on edX",
      resourceLink: edxBase + "software+engineering",
    },
    {
      title: "Skillshare: Agile for Software Teams",
      summary: "Learn agile project management and dev skills.",
      meta: "Skillshare | Self-guided",
      action: "Watch on Skillshare",
      resourceLink: skillshareBase + "software%20engineering",
    },
    {
      title: "FutureLearn: Cybersecurity Foundations",
      summary: "Intro to defending digital systems and networks.",
      meta: "FutureLearn | Short Course",
      action: "Start with FutureLearn",
      resourceLink: futurelearnUrl,
    },
    {
      title: "Google Cybersecurity Professional Cert",
      summary: "Build practical skills in defending computer systems.",
      meta: "Google Career | 6 months",
      action: "Enroll with Google",
      resourceLink: googleCertsUrl,
    },
    {
      title: "NLP Crash Course (DataCamp)",
      summary: "Apply NLP algorithms to real-world text problems.",
      meta: "DataCamp | Intermediate",
      action: "Try for Free",
      resourceLink: datacampBase + "nlp",
    },
  ];

  await new Promise(r => setTimeout(r, 600));

  // Priority: show topic-based platform searches if available
  let topicBased = [];
  if (topics && topics.length > 0) {
    const topic = encodeURIComponent(topics[0]);
    topicBased = [
      {
        title: `Coursera Certification — ${topics[0]}`,
        summary: `Certification & courses for ${topics[0]} from Coursera.`,
        meta: "Coursera | Search",
        action: "Browse Coursera",
        resourceLink: courseraBase + topic
      },
      {
        title: `Udemy Certification — ${topics[0]}`,
        summary: `Online courses for ${topics[0]} on Udemy.`,
        meta: "Udemy | Search",
        action: "Find on Udemy",
        resourceLink: udemyBase + topic
      },
      {
        title: `edX Certificate — ${topics[0]}`,
        summary: `Online certifications for ${topics[0]} from edX.`,
        meta: "edX | Search",
        action: "See edX Courses",
        resourceLink: edxBase + topic
      }
    ];
  }

  const pool = topicBased.length > 0 ? [...topicBased, ...exemplar] : exemplar;
  // Dedupe and limit to 3
  const unique = [];
  for (let item of pool) {
    if (!unique.some(x => x.resourceLink === item.resourceLink && x.title === item.title)) unique.push(item);
    if (unique.length >= 3) break;
  }
  return unique;
}

// PUBLIC_INTERFACE
/**
 * Fetch mock project ideas based on extracted topics.
 * Each project includes a demo, docs, or search link to a relevant platform.
 * @param {string[]} topics
 * @returns {Promise<Array>} Array of project recommendations.
 */
export async function fetchProjectIdeas(topics = []) {
  // Platform docs/examples/searches
  const openaiBaseUrl = "https://platform.openai.com/examples";
  const huggingfaceBaseUrl = "https://huggingface.co/models?pipeline_tag=";
  const witaiBaseUrl = "https://wit.ai/experiences";
  const dialogflowDocs = "https://dialogflow.cloud.google.com/#/docs";
  const kaggleBase = "https://www.kaggle.com/search?q=";

  const exemplar = [
    {
      title: "Smart Campus Messenger",
      summary: "Build a cross-platform chat app for students using NLP moderation.",
      meta: "Tech: React, Node, NLP API",
      action: "Try OpenAI example",
      resourceLink: openaiBaseUrl,
    },
    {
      title: "Personal Expense Tracker with AI Insights",
      summary: "Track spending, get smart suggestions with ML analysis.",
      meta: "Tech: Django, Pandas, ML",
      action: "Explore on Kaggle",
      resourceLink: "https://www.kaggle.com/datasets",
    },
    {
      title: "Resume Analyzer Bot",
      summary: "Analyze and summarize CVs, match to job profiles using LLM.",
      meta: "Python, OpenAI API",
      action: "Open HuggingFace Models",
      resourceLink: huggingfaceBaseUrl + "text-classification",
    },
    {
      title: "Conversational Assistant with Wit.ai",
      summary: "Build a voice/text chatbot using Wit.ai NLP.",
      meta: "Wit.ai, Node.js",
      action: "Try on Wit.ai",
      resourceLink: witaiBaseUrl,
    },
    {
      title: "Dialogflow Helpdesk Bot",
      summary: "AI handles IT/helpdesk tickets using Dialogflow intent recognition.",
      meta: "Dialogflow, GCP, React",
      action: "View Dialogflow Docs",
      resourceLink: dialogflowDocs,
    },
    {
      title: "AI-Driven Project Manager",
      summary: "Automate Gantt charts and task estimates using AI.",
      meta: "GPT, JS, PM Libraries",
      action: "See more OpenAI apps",
      resourceLink: openaiBaseUrl,
    },
  ];
  await new Promise(r => setTimeout(r, 500));

  let topicBased = [];
  if (topics && topics.length > 0) {
    const topic = topics[0];
    topicBased = [
      {
        title: `AI Project: ${topic}`,
        summary: `Design an innovative project using ${topic} with OpenAI APIs.`,
        meta: "OpenAI Demo | Real Example",
        action: "View OpenAI Example",
        resourceLink: openaiBaseUrl
      },
      {
        title: `HuggingFace Models for ${topic}`,
        summary: `Find ML/NLP models on HuggingFace related to "${topic}".`,
        meta: "HuggingFace | Model Search",
        action: "Search HuggingFace",
        resourceLink: huggingfaceBaseUrl + encodeURIComponent(topic.toLowerCase().replace(/\s/g, "-"))
      },
      {
        title: `Kaggle Projects: ${topic}`,
        summary: `Explore projects, datasets and competitions about ${topic}.`,
        meta: "Kaggle | Dataset Search",
        action: "Search on Kaggle",
        resourceLink: kaggleBase + encodeURIComponent(topic)
      }
    ];
  }

  // Compose final list with topical priority, deduped to 3
  const pool = topicBased.length > 0 ? [...topicBased, ...exemplar] : exemplar;
  const unique = [];
  for (let item of pool) {
    if (!unique.some(x => x.resourceLink === item.resourceLink && x.title === item.title)) unique.push(item);
    if (unique.length >= 3) break;
  }
  return unique;
}
