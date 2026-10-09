// server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fetch from "node-fetch";
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_MODEL = process.env.GEMINI_MODEL;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
}));
app.use(bodyParser.json());

// MongoDB Connection
let mongoConnected = false;

async function connectMongo() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.log('⚠️  MONGO_URI not found in environment variables. Admin CRUD features will be unavailable.');
            return false;
        }
        await mongoose.connect(uri);
        mongoConnected = true;
        console.log('✅ MongoDB connected successfully');
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        return false;
    }
}

// In-memory portfolio data loaded directly from MongoDB
let portfolioData = null;

async function loadDataFromMongo() {
    if (!mongoConnected) return null;
    try {
        const TechStack = (await import('./models/TechStack.js')).default;
        const Project = (await import('./models/Project.js')).default;
        const Experience = (await import('./models/Experience.js')).default;
        const Education = (await import('./models/Education.js')).default;
        const Certificate = (await import('./models/Certificate.js')).default;
        const Achievement = (await import('./models/Achievement.js')).default;
        const Review = (await import('./models/Review.js')).default;
        const Blog = (await import('./models/Blog.js')).default;

        const [
            techStacks,
            projects,
            experiences,
            educations,
            certificates,
            achievements,
            reviews,
            blogs
        ] = await Promise.all([
            TechStack.find(),
            Project.find(),
            Experience.find(),
            Education.find(),
            Certificate.find(),
            Achievement.find(),
            Review.find(),
            Blog.find()
        ]);

        const featuredProjects = projects.filter(p => p.type === 'featured');

        return {
            name: "Elayabarathi M V",
            headline: "Full Stack Web Developer & Biotechnologist",
            about: "Welcome! I'm Elayabarathi M V, a professional biotechnologist with expertise in microbiology, genetics, and bioinformatics. Innovated cancer treatments via nanobiotechnology. Accomplished frontend web developer. Passionate about integrating biology and technology for innovation. Strong collaborator and problem-solver, dedicated to continuous learning and interdisciplinary success.",
            oneline: "Enthusiast in Scientific & Technological Innovations",
            contact: {
                email: "elayabarathiedison@gmail.com",
                linkedin: "https://www.linkedin.com/in/elayabarathi/",
                github: "https://github.com/BadBoy-Github",
                portfolio: "https://elayabarathimv.vercel.app/"
            },
            skills: techStacks.map(s => ({ label: s.label, desc: s.desc, imgSrc: s.imgSrc })),
            projects: projects.map(p => ({
                id: p.id,
                type: p.type,
                imgSrc: p.imgSrc,
                title: p.title,
                subheading: p.subheading,
                tags: p.tags,
                sTags: p.sTags,
                live: p.live,
                projectLink: p.projectLink,
                code: p.code,
                gitUrl: p.gitUrl,
                techUsed: p.techUsed,
                description: p.description,
                uses: p.uses,
                improvements: p.improvements,
                gallery: p.gallery
            })),
            experience: experiences.map(e => ({
                year: e.year,
                name: e.name,
                role: e.role,
                instName: e.instName,
                instLogo: e.instLogo,
                instLink: e.instLink,
                desc: e.desc,
                imgSrc: e.imgSrc,
                certifi: e.certifi,
                skills: e.skills,
                compound: e.compound,
                content: e.content
            })),
            education: educations.map(e => ({
                year: e.year,
                name: e.name,
                perc: e.perc,
                instName: e.instName,
                instLogo: e.instLogo,
                instLink: e.instLink,
                desc: e.desc,
                skills: e.skills
            })),
            certificates: certificates.map(c => ({
                id: c.id,
                title: c.title,
                imgSrc: c.imgSrc,
                company: c.company,
                logo: c.logo,
                year: c.year,
                technologiesLearned: c.technologiesLearned,
                description: c.description
            })),
            achievements: achievements.map(a => ({
                id: a.id,
                title: a.title,
                subtitle: a.subtitle,
                tags: a.tags,
                date: a.date,
                imgSrc: a.imgSrc,
                keyPoints: a.keyPoints
            })),
            reviews: reviews.map(r => ({
                content: r.content,
                name: r.name,
                imgSrc: r.imgSrc,
                company: r.company
            })),
            featuredProjects: featuredProjects.map(fp => ({
                name: fp.title,
                description: fp.description,
                link: fp.projectLink,
                github: fp.gitUrl,
                image: fp.imgSrc,
                tags: fp.sTags || fp.tags
            })),
            blogs: blogs.map(b => ({
                id: b.id,
                title: b.title,
                subtitle: b.subtitle,
                date: b.date,
                readTime: b.readTime,
                tags: b.tags,
                imageSrc: b.imageSrc,
                link: b.link,
                content: b.content
            })),
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Error loading data from MongoDB:', error.message);
        return null;
    }
}

// Initialize data from MongoDB (called after successful connection)
async function initializeMongoData() {
    if (!mongoConnected) {
        console.log('⚠️  MongoDB not connected. AI training data unavailable.');
        return;
    }
    const mongoData = await loadDataFromMongo();
    if (mongoData) {
        portfolioData = mongoData;
        console.log('✅ Portfolio data loaded from MongoDB for AI training');
    }
}

// Start server only after MongoDB connection is established
async function startServer() {
    const connected = await connectMongo();

    if (connected) {
        await initializeMongoData();
    }

    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);

        if (mongoConnected) {
            console.log('✅ MongoDB connected');
        } else {
            console.log('⚠️  MongoDB not connected. AI training data unavailable.');
        }

        if (!process.env.GOOGLE_API_KEY) {
            console.warn('⚠️  GOOGLE_API_KEY not found. AI features will use local response.');
        } else {
            console.log(`✅ Google Gemini API key loaded (model: ${GEMINI_MODEL})`);
           
        }
    });
}

startServer();

// Google Gemini API function (free tier via Google API key)
async function queryGemini(systemPrompt, question, maxTokens = 500, temperature = 0.2) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error('GOOGLE_API_KEY not set');
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [
                    { role: 'user', parts: [{ text: question }] }
                ],
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature: temperature,
                    topP: 0.95
                }
            })
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('❌ Gemini API error body:', errorBody);
        throw new Error(`Gemini API error! status: ${response.status} - ${errorBody}`);
    }

    const result = await response.json();
    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
        return result.candidates[0].content.parts[0].text;
    } else {
        throw new Error('Invalid response from Gemini API');
    }
}

// RAG: Create chunks from ALL MongoDB documents (no trimming — every document becomes a chunk)
function createChunks(data) {
    const chunks = [];

    // Featured projects
    (data.featuredProjects || []).forEach(fp => {
        chunks.push({
            id: fp.id || `fp-${chunks.length}`,
            type: 'featuredProject',
            text: `Project: ${fp.name}. ${fp.description || ''}. Link: ${fp.link || ''}.`
        });
    });

    // All projects (FULL — no slicing)
    (data.projects || []).forEach(p => {
        const techUsed = (p.techUsed || []).join(', ');
        chunks.push({
            id: p.id || `proj-${chunks.length}`,
            type: 'project',
            text: `Project: ${p.title}${p.subheading ? ` — ${p.subheading}` : ''}. ${p.description || ''}. Tech: ${techUsed}. Live: ${p.projectLink || ''}.`
        });
    });

    // Experience (each entry = one chunk)
    (data.experience || []).forEach(e => {
        chunks.push({
            id: e._id || `exp-${chunks.length}`,
            type: 'experience',
            text: `Experience: ${e.name}${e.role ? ` (${e.role})` : ''} @ ${e.instName || ''}, ${e.year || ''}. ${e.desc || ''}`
        });
    });

    // Education (each entry = one chunk)
    (data.education || []).forEach(e => {
        chunks.push({
            id: e._id || `edu-${chunks.length}`,
            type: 'education',
            text: `Education: ${e.name}${e.instName ? ` @ ${e.instName}` : ''}, ${e.year || ''}. ${e.desc || ''}`
        });
    });

    // Certificates (FULL — no slicing)
    (data.certificates || []).forEach(c => {
        chunks.push({
            id: c.id || `cert-${chunks.length}`,
            type: 'certificate',
            text: `Certificate: ${c.title}${c.company ? ` by ${c.company}` : ''}, ${c.year || ''}. ${c.description || ''}`
        });
    });

    // Achievements (FULL — no slicing)
    (data.achievements || []).forEach(a => {
        const keyPoints = (a.keyPoints || []).join(' ');
        chunks.push({
            id: a.id || `ach-${chunks.length}`,
            type: 'achievement',
            text: `Achievement: ${a.title}${a.subtitle ? ` — ${a.subtitle}` : ''}, ${a.date || ''}. ${keyPoints || a.desc || ''}`
        });
    });

    // Reviews (FULL — no slicing)
    (data.reviews || []).forEach(r => {
        chunks.push({
            id: r.id || `rev-${chunks.length}`,
            type: 'review',
            text: `Review from ${r.name || 'Anonymous'}${r.company ? ` (${r.company})` : ''}: "${r.content || ''}"`
        });
    });

    // Blogs (FULL — no slicing)
    (data.blogs || []).forEach(b => {
        chunks.push({
            id: b.id || `blog-${chunks.length}`,
            type: 'blog',
            text: `Blog: ${b.title} (${b.readTime || ''}). ${b.subtitle || ''}`
        });
    });

    // Skills (one chunk)
    if (data.skills && data.skills.length > 0) {
        const skillText = (data.skills || []).map(s => `${s.label}${s.desc ? `: ${s.desc}` : ''}`).join('; ');
        chunks.push({
            id: 'skills',
            type: 'skills',
            text: `Skills: ${skillText}`
        });
    }

    // Tech stacks
    if (data.techStacks && data.techStacks.length > 0) {
        const techText = (data.techStacks || []).map(t => `${t.name || t.label || ''}`).join(', ');
        chunks.push({
            id: 'techstacks',
            type: 'techstack',
            text: `Tech Stacks: ${techText}`
        });
    }

    // Contact info (always included)
    const contact = data.contact || {};
    chunks.push({
        id: 'contact',
        type: 'contact',
        text: `Contact: Email ${contact.email || ''}, LinkedIn ${contact.linkedin || ''}, GitHub ${contact.github || ''}, Portfolio ${contact.portfolio || ''}`
    });

    // About (always included)
    if (data.about) {
        chunks.push({
            id: 'about',
            type: 'about',
            text: `About: ${data.about}`
        });
    }

    // Stats chunk — ALWAYS included, contains exact counts from MongoDB
    // This is the single source of truth for all "how many / total / count" questions
    chunks.push({
        id: 'stats',
        type: 'stats',
        text: [
            `EXACT PORTFOLIO COUNTS (authoritative — do NOT guess or estimate these numbers):`,
            `- Total projects: ${(data.projects || []).length}`,
            `- Featured projects: ${(data.featuredProjects || []).length}`,
            `- Work experience entries: ${(data.experience || []).length}`,
            `- Education entries: ${(data.education || []).length}`,
            `- Certificates: ${(data.certificates || []).length}`,
            `- Achievements: ${(data.achievements || []).length}`,
            `- Reviews/Testimonials: ${(data.reviews || []).length}`,
            `- Blog posts: ${(data.blogs || []).length}`,
            `- Skills/Tech stacks: ${(data.skills || []).length}`,
        ].join('\n')
    });

    return chunks;
}

// RAG: Retrieve relevant chunks using keyword-based relevance scoring
function retrieveChunks(question, chunks) {
    const q = question.toLowerCase();
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'what', 'tell', 'me', 'to', 'and', 'or', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'can', 'you', 'i', 'want', 'know', 'his', 'her', 'them', 'show', 'give', 'list']);
    const keywords = q.split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w));

    const typeKeywords = {
        featuredProject: ['project', 'portfolio'],
        project: ['project', 'portfolio', 'build', 'develop'],
        experience: ['experience', 'work', 'internship', 'job', 'career', 'employ', 'train'],
        education: ['education', 'degree', 'college', 'university', 'study', 'academ'],
        certificate: ['certificate', 'certification', 'certified', 'course'],
        achievement: ['achievement', 'award', 'accomplishment', 'recognition'],
        review: ['review', 'testimonial', 'people', 'feedback'],
        blog: ['blog', 'article', 'post', 'write'],
        skills: ['skill', 'technology', 'tech', 'stack', 'expertise'],
        techstack: ['tech', 'stack', 'technology', 'framework'],
        contact: ['contact', 'email', 'linkedin', 'github', 'reach'],
        stats: ['total', 'count', 'how many', 'number', 'many', 'much', 'all'],
    };

    const scored = chunks.map(chunk => {
        let score = 0;
        const ct = chunk.text.toLowerCase();

        keywords.forEach(kw => {
            if (ct.includes(kw)) score += 1;
        });

        const typeKw = typeKeywords[chunk.type] || [];
        typeKw.forEach(word => {
            if (q.includes(word)) score += 3;
        });

        // Always pin these chunks into context
        if (chunk.type === 'contact' || chunk.type === 'about' || chunk.type === 'skills' || chunk.type === 'stats') {
            score += 2;
        }

        return { ...chunk, score };
    });

    scored.sort((a, b) => b.score - a.score);

    let relevant = scored.filter(c => c.score > 0);
    if (relevant.length === 0) {
        relevant = scored.filter(c => ['contact', 'about', 'skills'].includes(c.type));
    }

    const seen = new Set();
    return relevant.filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
    });
}

// RAG: Build context string from retrieved chunks
function buildRAGContext(retrievedChunks, data, question) {
    const name = data.name || 'Elayabarathi M V';
    const about = data.about || '';

    const typeLabels = {
        stats: 'PORTFOLIO STATISTICS (EXACT COUNTS — USE THESE, DO NOT ESTIMATE)',
        featuredProject: 'FEATURED PROJECTS',
        project: 'PROJECTS',
        experience: 'PROFESSIONAL EXPERIENCE',
        education: 'EDUCATION',
        certificate: 'CERTIFICATES',
        achievement: 'ACHIEVEMENTS',
        review: 'REVIEWS & TESTIMONIALS',
        blog: 'BLOG POSTS',
        skills: 'TECHNICAL SKILLS',
        techstack: 'TECH STACKS',
        contact: 'CONTACT INFORMATION',
        about: 'ABOUT'
    };

    const sectionOrder = ['stats', 'featuredProject', 'project', 'experience', 'skills', 'techstack', 'education', 'certificate', 'achievement', 'review', 'blog', 'contact', 'about'];

    const sections = {};
    retrievedChunks.forEach(chunk => {
        if (!sections[chunk.type]) sections[chunk.type] = [];
        sections[chunk.type].push(chunk.text);
    });

    const sectionsText = sectionOrder
        .filter(type => sections[type] && sections[type].length > 0)
        .map(type => `=== ${typeLabels[type]} ===\n${sections[type].join('\n')}`)
        .join('\n\n');

    return `You are Portfolio-GPT, a chatbot for ${name}'s portfolio. ` +
        `${name} is a Full Stack Web Developer who builds modern web apps with React, Tailwind, Node.js, MongoDB. ` +
        `Answer based ONLY on the retrieved data below. If the data doesn't cover the question, say you don't know. ` +
        `Use bullet points, keep answers concise.\n\n` +
        `Name: ${name}\nAbout: ${about}\n\n` +
        `RAG-RETRIEVED DATA (from MongoDB):\n\n${sectionsText}\n\n` +
        `RULES:\n` +
        `- COUNTS: For ANY question about totals, counts, or "how many" — use ONLY the exact numbers from the PORTFOLIO STATISTICS section above. NEVER guess or estimate counts.\n` +
        `- "featured projects" or "best projects" → ONLY Featured Projects\n` +
        `- "experience" / "work" / "jobs" → Professional Experience\n` +
        `- "projects" → ALL PROJECTS\n` +
        `- "certificates" → Certificates\n` +
        `- "education" → Education\n` +
        `- "achievements" → Achievements\n` +
        `- "reviews" / "testimonials" → Reviews\n` +
        `- "blogs" → Blog Posts\n` +
        `- Prioritize tech/web development info over biotech.`;
}

// Enhanced response generator (local fallback)
function generateLocalResponse(question) {
    const q = question.toLowerCase().trim();
    const data = portfolioData || {};

    const projects = data.projects || [];
    const experiences = data.experience || [];
    const education = data.education || [];
    const certificates = data.certificates || [];
    const achievements = data.achievements || [];
    const reviews = data.reviews || [];
    const blogs = data.blogs || [];
    const skills = data.skills || [];

    if (q.includes('github') || q.includes('git') || q.includes('code') || q.includes('repository')) {
        const projList = projects.map(p => `• ${p.title}${p.projectLink ? ` - ${p.projectLink}` : ''}`).join('\n') || '• No projects listed';
        return `🔗 Elayabarathi's GitHub: ${data.contact?.github || 'https://github.com/BadBoy-Github'}\n\nHere you'll find all his projects:\n${projList}\n\nFeel free to explore and star his repositories!`;
    }

    if (/\b(hello|hi|hey|greetings|good morning|good afternoon)\b/i.test(q)) {
        return "Hello! 👋 I'm Elayabarathi's portfolio assistant. He's a passionate full-stack developer and biotechnologist. I can tell you about his projects, skills, experience, education, certificates, achievements, or how to contact him. What would you like to know?";
    }

    if (q.includes('project') || q.includes('portfolio') || q.includes('projects')) {
        const projList = projects.map(p =>
            `• ${p.title}${p.subheading ? ` — ${p.subheading}` : ''}: ${(p.description || '').substring(0, 100)}${p.projectLink ? ` [${p.projectLink}]` : ''}`
        ).join('\n') || '• No projects listed';
        return `🚀 Elayabarathi's Projects:\n\n${projList}\n\nCheck out his portfolio for live demos: ${data.contact?.portfolio || 'https://elayabarathimv.vercel.app/'}`;
    }

    if (q.includes('skill') || q.includes('technology') || q.includes('tech') || q.includes('stack')) {
        const skillList = skills.map(s => `• ${s.label}${s.desc ? `: ${s.desc}` : ''}`).join('\n') || '• No skills listed';
        return `💻 Technical Skills:\n\n${skillList}\n\nHe's always learning new technologies!`;
    }

    if (q.includes('experience') || q.includes('work') || q.includes('intern') || q.includes('job') || q.includes('career') || q.includes('work history')) {
        const exp = experiences.map(e =>
            `• ${e.name}${e.role ? ` — ${e.role}` : ''}${e.instName ? ` @ ${e.instName}` : ''}${e.year ? ` (${e.year})` : ''}`
        ).join('\n') || '• No experience listed';
        return `💼 Professional Experience:\n\n${exp}\n\nHe has practical experience in both software development and biotech research.`;
    }

    if (q.includes('contact') || q.includes('email') || q.includes('linkedin') || q.includes('reach') || q.includes('connect')) {
        return `📞 Contact Elayabarathi:\n\n📧 Email: ${data.contact?.email || 'elayabarathiedison@gmail.com'}\n💼 LinkedIn: ${data.contact?.linkedin || 'https://www.linkedin.com/in/elayabarathi/'}\n🔗 GitHub: ${data.contact?.github || 'https://github.com/BadBoy-Github'}\n🌐 Portfolio: ${data.contact?.portfolio || 'https://elayabarathimv.vercel.app/'}\n\nHe's open to collaborations and new opportunities!`;
    }

    if (q.includes('review') || q.includes('testimonial') || q.includes('people') || q.includes('say about') || q.includes('what others say')) {
        const rev = reviews.map(r => `• "${r.content || ''}" — ${r.name || 'Anonymous'}${r.company ? `, ${r.company}` : ''}`).join('\n') || '• No reviews listed';
        return `⭐ Reviews & Testimonials:\n\n${rev}`;
    }

    if (q.includes('education') || q.includes('degree') || q.includes('study') || q.includes('college') || q.includes('university')) {
        const edu = education.map(e =>
            `• ${e.name}${e.instName ? ` @ ${e.instName}` : ''}${e.year ? ` (${e.year})` : ''}${e.perc ? ` — ${e.perc}` : ''}`
        ).join('\n') || '• No education listed';
        return `🎓 Education:\n\n${edu}`;
    }

    if (q.includes('certificate') || q.includes('certification') || q.includes('certified')) {
        const certs = certificates.map(c =>
            `• ${c.title}${c.company ? ` by ${c.company}` : ''}${c.year ? ` (${c.year})` : ''}`
        ).join('\n') || '• No certificates listed';
        return `📜 Certificates:\n\n${certs}`;
    }

    if (q.includes('achievement') || q.includes('award') || q.includes('accomplishment')) {
        const ach = achievements.map(a =>
            `• ${a.title}${a.subtitle ? ` — ${a.subtitle}` : ''}${a.date ? ` (${a.date})` : ''}`
        ).join('\n') || '• No achievements listed';
        return `🏆 Achievements:\n\n${ach}`;
    }

    if (q.includes('blog') || q.includes('article') || q.includes('writing') || q.includes('post')) {
        const blg = blogs.map(b => `• ${b.title}${b.subtitle ? ` — ${b.subtitle}` : ''} (${b.readTime || 'N/A'})`).join('\n') || '• No blogs listed';
        return `📝 Blog Posts:\n\n${blg}`;
    }

    if (q.includes('about') || q.includes('who are you') || q.includes('who is') || q.includes('yourself') || q.includes('introduce')) {
        return `👨‍💻 About Elayabarathi:\n\n${data.about || ''}\n\nHe's passionate about integrating technology and biology to create innovative solutions that make a difference.`;
    }

    return `🤖 I can help you learn about Elayabarathi M V! Here's what I can tell you about:\n\n• His projects and portfolio 🚀\n• Technical skills and technologies 💻\n• Professional experience 💼\n• Education background 🎓\n• Certificates 📜\n• Achievements 🏆\n• Reviews & testimonials ⭐\n• Blog posts 📝\n• Contact information 📞\n• GitHub repositories 🔗\n\nWhat would you like to know specifically?`;
}

// Enhanced chat endpoint with AI integration
function formatAIResponse(text) {
    if (!text) return text;

    let formatted = text
        .replace(/###\s+(.+)/g, '<strong>$1</strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^[\s]*[•\-]\s+(.+)$/gm, '• $1')
        .replace(/\n\s*\n/g, '\n')
        .replace(/\n/g, '<br/>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    return formatted;
}

app.post('/api/chat', async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || typeof question !== 'string') {
            return res.status(400).json({
                error: 'Please provide a question in the request body',
                example: { "question": "What is your GitHub?" }
            });
        }

        console.log(`💬 Question: "${question}"`);

        let answer;
        let source = 'local';

        // Always load fresh data from MongoDB for AI training
        let data = portfolioData;
        if (!data && mongoConnected) {
            data = await loadDataFromMongo();
            if (data) portfolioData = data;
        }
        data = data || {};
        // RAG: Create chunks from ALL MongoDB documents, retrieve relevant ones
        const chunks = createChunks(data);
        const retrievedChunks = retrieveChunks(question, chunks);
        const context = buildRAGContext(retrievedChunks, data, question);

        console.log(`📏 RAG: ${chunks.length} chunks created, ${retrievedChunks.length} retrieved, context: ${context.length} chars`);

        let aiUsed = false;

        // Try Google Gemini API first (free tier)
        try {
            const aiResponse = await queryGemini(context, question, 500, 0.7);
            answer = formatAIResponse(aiResponse);
            source = 'ai';
            aiUsed = true;
            console.log('🤖 Gemini API response used');
        } catch (geminiError) {
            console.error('❌ Gemini API failed, using local response:', geminiError.message);
        }

        if (!aiUsed) {
            answer = generateLocalResponse(question);
            source = 'local';
        }

        res.json({
            answer,
            source,
            timestamp: new Date().toISOString(),
            success: true
        });

    } catch (error) {
        console.error('❌ Chat error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'Portfolio Chatbot API is running smoothly',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Test endpoint with AI
app.get('/api/test-ai', async (req, res) => {
    try {
        const testQuestion = "What can you tell me about Elayabarathi's skills?";
        const data = portfolioData || {};
        const chunks = createChunks(data);
        const retrievedChunks = retrieveChunks(testQuestion, chunks);
        const context = buildRAGContext(retrievedChunks, data, testQuestion);

        let aiResponse, source = 'local';
        try {
            aiResponse = await queryGemini(context, testQuestion, 500, 0.7);
            source = 'gemini';
        } catch (geminiError) {
            aiResponse = generateLocalResponse(testQuestion);
        }

        res.json({
            test: 'AI model test',
            question: testQuestion,
            aiResponse: aiResponse,
            source: source,
            contextLength: context.length,
            chunksRetrieved: retrievedChunks.length,
            success: true
        });
    } catch (error) {
        res.status(500).json({
            error: 'AI test failed',
            message: error.message
        });
    }
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Server is working!',
        endpoints: {
            chat: 'POST /api/chat',
            health: 'GET /api/health',
            test: 'GET /api/test',
            testAI: 'GET /api/test-ai',
            sync: 'POST /api/sync',
            syncStatus: 'GET /api/sync-status',
            login: 'POST /api/admin/login',
            seed: 'POST /api/admin/seed',
            techStacks: '/api/tech-stacks',
            projects: '/api/projects',
            certificates: '/api/certificates',
            achievements: '/api/achievements',
            reviews: '/api/reviews',
            experience: '/api/experience',
            education: '/api/education',
            blogs: '/api/blogs',
            adminTechStacks: '/api/admin/tech-stacks',
            adminProjects: '/api/admin/projects',
            adminCertificates: '/api/admin/certificates',
            adminAchievements: '/api/admin/achievements',
            adminReviews: '/api/admin/reviews',
            adminExperience: '/api/admin/experience',
            adminEducation: '/api/admin/education',
            adminBlogs: '/api/admin/blogs'
        },
        mongoConnected
    });
});

// Manual sync endpoint
app.post('/api/sync', async (req, res) => {
    try {
        console.log('🔄 Manual sync triggered...');
        
        if (mongoConnected) {
            const mongoData = await loadDataFromMongo();
            if (mongoData) {
                portfolioData = mongoData;
                console.log('✅ Data synchronized from MongoDB');
                
                res.json({
                    success: true,
                    message: 'Data synchronized successfully from MongoDB',
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to load data from MongoDB',
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            res.status(500).json({
                success: false,
                message: 'MongoDB not connected',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('❌ Sync error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get sync status
app.get('/api/sync-status', (req, res) => {
    res.json({
        status: 'active',
        autoSyncEnabled: false,
        syncIntervalMinutes: 0,
        lastDataUpdate: portfolioData?.lastUpdated || null,
        lastTrainingUpdate: null,
        dataFileModified: null,
        trainingFileModified: null,
        mongoConnected,
        timestamp: new Date().toISOString()
    });
});

// Stop auto-sync (for maintenance)
app.post('/api/sync/stop', (req, res) => {
    res.json({
        success: true,
        message: 'Auto-sync not applicable - data loaded directly from MongoDB'
    });
});

// Start auto-sync
app.post('/api/sync/start', (req, res) => {
    res.json({
        success: true,
        message: 'Auto-sync not applicable - data loaded directly from MongoDB'
    });
});

// Contact form endpoint with nodemailer
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, category, message } = req.body;

        if (!name || !email || !subject || !category || !message) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        const validCategories = ['query', 'feedback', 'question', 'issue', 'collab', 'chitchat', 'others'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category'
            });
        }

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error('❌ Contact form error: SMTP credentials not configured');
            return res.status(500).json({
                success: false,
                error: 'Email service not configured. Please try again later.'
            });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        try {
            await transporter.verify();
        } catch (verifyError) {
            console.error('❌ Contact form error: SMTP connection failed:', verifyError.message);
            return res.status(500).json({
                success: false,
                error: 'Email service connection failed. Please try again later.'
            });
        }

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: process.env.TO_EMAIL || process.env.SMTP_USER,
            subject: `${category} | [Portfolio Contact Form] : ${subject}`,
            html: `
                <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Contact Form Submission</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f7fb; font-family: Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 0;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 25px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0284c7; padding:20px 30px; color:#ffffff;">
              <h2 style="margin:0; font-size:22px;">📩 New Contact Message</h2>
              <p style="margin:5px 0 0; font-size:14px; opacity:0.9;">
                You’ve received a new message from your portfolio
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px; color:#333333;">

              <!-- Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #e5e7eb; border-radius:10px; padding:20px; background:#f9fbfd;">

                <tr>
                  <td style="padding-bottom:10px;">
                    <strong style="color:#0284c7;">👤 Name:</strong><br>
                    ${escapeHtml(name)}
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:10px;">
                    <strong style="color:#0284c7;">📧 Email:</strong><br>
                    ${escapeHtml(email)}
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:10px;">
                    <strong style="color:#0284c7;">📂 Category:</strong><br>
                    ${escapeHtml(category)}
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:10px;">
                    <strong style="color:#0284c7;">📝 Subject:</strong><br>
                    ${escapeHtml(subject)}
                  </td>
                </tr>

              </table>

              <!-- Message Section -->
              <div style="margin-top:25px;">
                <strong style="color:#0284c7; font-size:16px;">💬 Message</strong>
                <div style="margin-top:10px; padding:15px; background:#f1f5f9; border-radius:8px; line-height:1.6;">
                  ${escapeHtml(message).replace(/\n/g, '<br>')}
                </div>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px; background:#f9fafb; text-align:center;">
              <p style="margin:0; font-size:12px; color:#6b7280;">
                This email was sent from your portfolio contact form.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
            `
        };

        await transporter.sendMail(mailOptions);

        console.log(`📧 Contact form submitted: ${name} (${email}) - ${category}: ${subject}`);

        res.json({
            success: true,
            message: 'Message sent successfully!'
        });

    } catch (error) {
        console.error('❌ Contact form error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send message. Please try again later.'
        });
    }
});

// Public review submission endpoint (sends emails, does not store in DB)
app.post('/api/reviews/public', async (req, res) => {
    try {
        const { name, email, company, content, rating, imgSrc } = req.body;

        if (!name || !email || !content || !rating) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, content and rating are required'
            });
        }

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error('❌ Public review error: SMTP credentials not configured');
            return res.status(500).json({
                success: false,
                error: 'Email service not configured. Please try again later.'
            });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        try {
            await transporter.verify();
        } catch (verifyError) {
            console.error('❌ Public review error: SMTP connection failed:', verifyError.message);
            return res.status(500).json({
                success: false,
                error: 'Email service connection failed. Please try again later.'
            });
        }

        const stars = '★'.repeat(Math.min(5, Math.max(1, parseInt(rating) || 5))) + '☆'.repeat(5 - Math.min(5, Math.max(1, parseInt(rating) || 5)));

        // Email to admin with full review content and image preview
        const adminMailOptions = {
            from: process.env.SMTP_USER,
            to: process.env.TO_EMAIL || process.env.SMTP_USER,
            subject: `⭐ New Review from ${name}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <title>New Review Submission</title>
                </head>
                <body style="margin:0; padding:0; background-color:#f4f7fb; font-family: Arial, sans-serif;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 0;">
                    <tr>
                      <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0"
                          style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 25px rgba(0,0,0,0.08);">
                          <tr>
                            <td style="background:#0284c7; padding:20px 30px; color:#ffffff;">
                              <h2 style="margin:0; font-size:22px;">⭐ New Review Submission</h2>
                              <p style="margin:5px 0 0; font-size:14px; opacity:0.9;">You've received a new review from your portfolio</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:30px; color:#333333;">
                              <table width="100%" cellpadding="0" cellspacing="0"
                                style="border:1px solid #e5e7eb; border-radius:10px; padding:20px; background:#f9fbfd;">
                                <tr>
                                  <td style="padding-bottom:10px;">
                                    <strong style="color:#0284c7;">👤 Name:</strong><br>
                    ${escapeHtml(name)}
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding-bottom:10px;">
                                    <strong style="color:#0284c7;">🏢 Company:</strong><br>
                                    ${escapeHtml(company || 'N/A')}
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding-bottom:10px;">
                                    <strong style="color:#0284c7;">📧 Email:</strong><br>
                    ${escapeHtml(email)}
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding-bottom:10px;">
                                    <strong style="color:#0284c7;">⭐ Rating:</strong><br>
                                    <span style="color:#f59e0b; font-size:18px;">${stars}</span> (${escapeHtml(rating)}/5)
                                  </td>
                                </tr>
                                ${imgSrc ? `
                                <tr>
                                  <td style="padding-bottom:10px;">
                                    <strong style="color:#0284c7;">🖼️ Profile Image:</strong><br>
                                    <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(name)}" style="max-width:120px; max-height:120px; border-radius:8px; margin-top:8px; border:1px solid #e5e7eb;" onerror="this.style.display='none'" />
                                  </td>
                                </tr>
                                ` : ''}
                              </table>
                              <div style="margin-top:25px;">
                                <strong style="color:#0284c7; font-size:16px;">💬 Review Content</strong>
                                <div style="margin-top:10px; padding:15px; background:#f1f5f9; border-radius:8px; line-height:1.6;">
                                  ${escapeHtml(content).replace(/\n/g, '<br>')}
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 30px; background:#f9fafb; text-align:center;">
                              <p style="margin:0; font-size:12px; color:#6b7280;">
                                This review was submitted through your portfolio contact page.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
            `
        };

        // Thank you email to the user
        const userMailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Thank you for your review!',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <title>Thank You for Your Review</title>
                </head>
                <body style="margin:0; padding:0; background-color:#f4f7fb; font-family: Arial, sans-serif;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 0;">
                    <tr>
                      <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0"
                          style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 25px rgba(0,0,0,0.08);">
                          <tr>
                            <td style="background:#0284c7; padding:20px 30px; color:#ffffff;">
                              <h2 style="margin:0; font-size:22px;">Thank You! 🙏</h2>
                              <p style="margin:5px 0 0; font-size:14px; opacity:0.9;">We appreciate your time and effort</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:30px; color:#333333;">
                               <p style="font-size:16px; line-height:1.6;">Hello ${escapeHtml(name)},</p>
                              <p style="font-size:16px; line-height:1.6;">
                                You have sent a review for me. <strong>Thank you for your time and effort.</strong>
                              </p>
                              <p style="font-size:16px; line-height:1.6;">
                                Your feedback means a lot and helps me improve. I'll be in touch if needed!
                              </p>
                              <div style="margin-top:25px; padding:15px; background:#f1f5f9; border-radius:8px;">
                                <p style="margin:0; font-size:14px; color:#6b7280;">
                                  Best regards,<br>
                                  <strong>Elayabarathi M V</strong><br>
                                  <a href="mailto:elayabarathiedison@gmail.com" style="color:#0284c7;">elayabarathiedison@gmail.com</a>
                                </p>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 30px; background:#f9fafb; text-align:center;">
                              <p style="margin:0; font-size:12px; color:#6b7280;">
                                Visit my portfolio: <a href="https://elayabarathimv.vercel.app" style="color:#0284c7; text-decoration:none;">https://elayabarathimv.vercel.app</a>
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
            `
        };

        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(userMailOptions);

        console.log(`📧 Public review submitted: ${name} (${email}) - Rating: ${rating}`);

        res.json({
            success: true,
            message: 'Review sent successfully!'
        });

    } catch (error) {
        console.error('❌ Public review error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send review. Please try again later.'
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Elayabarathi Portfolio Chatbot API',
        endpoints: {
            chat: 'POST /api/chat',
            health: 'GET /api/health',
            test: 'GET /api/test',
            testAI: 'GET /api/test-ai',
            sync: 'POST /api/sync',
            syncStatus: 'GET /api/sync-status',
            login: 'POST /api/admin/login',
            seed: 'POST /api/admin/seed',
            techStacks: '/api/tech-stacks',
            projects: '/api/projects',
            certificates: '/api/certificates',
            achievements: '/api/achievements',
            reviews: '/api/reviews',
            experience: '/api/experience',
            education: '/api/education',
            blogs: '/api/blogs',
            adminTechStacks: '/api/admin/tech-stacks',
            adminProjects: '/api/admin/projects',
            adminCertificates: '/api/admin/certificates',
            adminAchievements: '/api/admin/achievements',
            adminReviews: '/api/admin/reviews',
            adminExperience: '/api/admin/experience',
            adminEducation: '/api/admin/education',
            adminBlogs: '/api/admin/blogs'
        },
        features: {
            ai: 'Integrated Google Gemini with RAG from MongoDB data',
            fallback: 'Local response system as backup',
            context: 'Portfolio-aware responses from MongoDB'
        },
        example: {
            chat: 'curl -X POST http://localhost:5000/api/chat -H "Content-Type: application/json" -d \'{"question":"What is your GitHub?"}\''
        }
    });
});

// Public routes
import techStackRoutes from './routes/techStacks.js';
import projectRoutes from './routes/projects.js';
import certificateRoutes from './routes/certificates.js';
import achievementRoutes from './routes/achievements.js';
import reviewRoutes from './routes/reviews.js';
import experienceRoutes from './routes/experience.js';
import educationRoutes from './routes/education.js';
import blogRoutes from './routes/blogs.js';

app.use('/api/tech-stacks', techStackRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/blogs', blogRoutes);

// Admin routes
import authRoutes from './routes/auth.js';
import adminProjectRoutes from './routes/admin/projects.js';
import adminCertificateRoutes from './routes/admin/certificates.js';
import adminAchievementRoutes from './routes/admin/achievements.js';
import adminReviewRoutes from './routes/admin/reviews.js';
import adminExperienceRoutes from './routes/admin/experience.js';
import adminEducationRoutes from './routes/admin/education.js';
import adminBlogRoutes from './routes/admin/blogs.js';
import adminTechStackRoutes from './routes/admin/techStacks.js';

app.use('/api/admin', authRoutes);
app.use('/api/admin/tech-stacks', adminTechStackRoutes);
app.use('/api/admin/projects', adminProjectRoutes);
app.use('/api/admin/certificates', adminCertificateRoutes);
app.use('/api/admin/achievements', adminAchievementRoutes);
app.use('/api/admin/reviews', adminReviewRoutes);
app.use('/api/admin/experience', adminExperienceRoutes);
app.use('/api/admin/education', adminEducationRoutes);
app.use('/api/admin/blogs', adminBlogRoutes);

import { authMiddleware } from './middleware/auth.js';

// Seed endpoint
app.post('/api/admin/seed', async (req, res) => {
    if (!mongoConnected) {
        return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    try {
        const Admin = (await import('./models/Admin.js')).default;
        const TechStack = (await import('./models/TechStack.js')).default;
        const Project = (await import('./models/Project.js')).default;
        const Certificate = (await import('./models/Certificate.js')).default;
        const Achievement = (await import('./models/Achievement.js')).default;
        const Review = (await import('./models/Review.js')).default;
        const Experience = (await import('./models/Experience.js')).default;
        const Education = (await import('./models/Education.js')).default;
        const Blog = (await import('./models/Blog.js')).default;
        const bcrypt = (await import('bcryptjs')).default;
        const fs = await import('fs');
        const path = await import('path');

        const dataPath = path.join(__dirname, "data", "data.json");
        const raw = fs.readFileSync(dataPath, "utf8");
        const data = JSON.parse(raw);

        await Admin.deleteMany({});
        await TechStack.deleteMany({});
        await Project.deleteMany({});
        await Certificate.deleteMany({});
        await Achievement.deleteMany({});
        await Review.deleteMany({});
        await Experience.deleteMany({});
        await Education.deleteMany({});
        await Blog.deleteMany({});

        try {
            await TechStack.collection.dropIndex('category_1');
        } catch (e) { }

        const adminEmail = process.env.ADMIN_EMAIL || 'elayabarathiedison@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const salt = await bcrypt.hash(adminPassword, 10);
        await Admin.create({ email: adminEmail, password: salt });

        if (Array.isArray(data.skills)) {
            const formatted = data.skills.map(s => ({
                id: s.label || `skill-${Math.random().toString(36).slice(2, 9)}`,
                label: s.label || '',
                desc: s.desc || '',
                imgSrc: s.imgSrc || ''
            }));
            await TechStack.insertMany(formatted);
        }

        if (Array.isArray(data.projects)) {
            const formatted = data.projects.map(p => {
                const isFeatured = p.name === 'Dev Portfolio Hub' || p.name === 'Card Vault';
                return {
                    id: p.id || `project-${Math.random().toString(36).slice(2, 9)}`,
                    type: isFeatured ? 'featured' : (p.type || ''),
                    imgSrc: p.imgSrc || p.image || '',
                    title: p.title || p.name || 'Untitled Project',
                    subheading: p.subheading || '',
                    tags: Array.isArray(p.tags) ? p.tags : (Array.isArray(p.skills) ? p.skills : []),
                    sTags: Array.isArray(p.sTags) ? p.sTags : [],
                    live: String(p.live ?? ''),
                    projectLink: p.projectLink || p.link || '',
                    code: String(p.code ?? ''),
                    gitUrl: p.gitUrl || p.github || '',
                    techUsed: Array.isArray(p.techUsed) ? p.techUsed : (Array.isArray(p.skills) ? p.skills : []),
                    description: p.description || '',
                    uses: p.uses || '',
                    improvements: p.improvements || '',
                    gallery: Array.isArray(p.gallery) ? p.gallery : []
                };
            });
            await Project.insertMany(formatted);
        }

        if (Array.isArray(data.certificates)) {
            const formatted = data.certificates.map((c, i) => ({
                id: c.id || `cert-${i}`,
                title: c.title || c.name || '',
                imgSrc: c.imgSrc || c.image || '',
                company: c.company || c.issuer || '',
                logo: c.logo || '',
                year: c.year || c.date || '',
                technologiesLearned: Array.isArray(c.technologiesLearned) ? c.technologiesLearned : [],
                description: c.description || ''
            }));
            await Certificate.insertMany(formatted);
        }

        if (Array.isArray(data.achievements)) {
            const formatted = data.achievements.map(a => ({
                id: a.id || `ach-${Math.random().toString(36).slice(2, 9)}`,
                title: a.title || '',
                subtitle: a.subtitle || '',
                tags: a.tags || [],
                date: a.date || '',
                imgSrc: a.imgSrc || a.image || '',
                keyPoints: a.keyPoints || []
            }));
            await Achievement.insertMany(formatted);
        }

        if (Array.isArray(data.reviews)) {
            const formatted = data.reviews.map((r, i) => ({
                id: r.name ? `rev-${i}-${r.name.replace(/\s+/g, '-').toLowerCase()}` : `rev-${i}`,
                content: r.content || r.comment || '',
                name: r.name || '',
                imgSrc: r.imgSrc || '',
                company: r.company || ''
            }));
            await Review.insertMany(formatted);
        }

        if (Array.isArray(data.experience)) {
            const formatted = [];
            for (const exp of data.experience) {
                formatted.push({
                    id: exp.id || `exp-${Math.random().toString(36).slice(2, 9)}`,
                    year: exp.year || exp.period || '',
                    name: exp.name || exp.title || '',
                    role: exp.role || '',
                    instName: exp.instName || exp.company || '',
                    instLogo: exp.instLogo || '',
                    instLink: exp.instLink || exp.link || '',
                    desc: exp.desc || exp.description || '',
                    imgSrc: exp.imgSrc || '',
                    certifi: !!exp.certifi,
                    skills: Array.isArray(exp.skills) ? exp.skills : [],
                    compound: !!exp.compound,
                    content: Array.isArray(exp.content) ? exp.content : []
                });
            }
            if (formatted.length) {
                await Experience.insertMany(formatted);
            }
        }

        if (Array.isArray(data.education)) {
            const formatted = data.education.map((e, i) => ({
                id: e.id || `edu-${i}`,
                year: e.year || '',
                name: e.name || e.degree || '',
                perc: e.perc || e.percentage || '',
                instName: e.instName || e.institution || '',
                instLogo: e.instLogo || '',
                instLink: e.instLink || '',
                desc: e.desc || e.description || '',
                skills: Array.isArray(e.skills) ? e.skills : []
            }));
            await Education.insertMany(formatted);
        }

        if (Array.isArray(data.blogs)) {
            const formatted = data.blogs.map(b => ({
                id: b.id || `blog-${Math.random().toString(36).slice(2, 9)}`,
                title: b.title || '',
                subtitle: b.subtitle || '',
                date: b.date || '',
                readTime: b.readTime || '',
                tags: b.tags || [],
                imageSrc: b.imageSrc || b.image || '',
                link: b.link || '',
                content: b.content || ''
            }));
            await Blog.insertMany(formatted);
        }

        res.json({ success: true, message: 'Database seeded successfully from backend data.json' });
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

