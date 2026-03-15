// server.js
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import { startAutoSync, stopAutoSync, syncData } from './dataSync.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(bodyParser.json());

// Load portfolio data
let portfolioData;
let trainingData;

function loadData() {
    try {
        const dataPath = path.join(__dirname, "data", "data.json");
        const rawData = fs.readFileSync(dataPath, "utf8");

        portfolioData = JSON.parse(rawData);
        console.log('✅ Portfolio data loaded successfully');

        // Also load training data
        const trainingPath = path.join(__dirname, "data", "training.json");
        try {
            const trainingRaw = fs.readFileSync(trainingPath, "utf8");
            trainingData = JSON.parse(trainingRaw);
            console.log('✅ Training data loaded successfully');
        } catch (e) {
            console.log('⚠️  Training data not found, will be generated on first sync');
        }
    } catch (error) {
        console.error('❌ Error loading data.json:', error.message);
        process.exit(1);
    }
}

// Initial data load
loadData();

// Hugging Face API function
async function queryHuggingFace(data) {
    try {
        const response = await fetch(
            "https://router.huggingface.co/v1/chat/completions",
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify(data),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('❌ Hugging Face API error:', error.message);
        throw error;
    }
}

// Enhanced response generator (local fallback)
function generateLocalResponse(question) {
    const q = question.toLowerCase().trim();
    const data = portfolioData;

    // GitHub related questions
    if (q.includes('github') || q.includes('git') || q.includes('code') || q.includes('repository')) {
        return `🔗 Elayabarathi's GitHub: ${data.contact.github}\n\nHere you'll find all his projects including:\n• Portfolio Website (React + Tailwind)\n• Bamboo Blogs (Flask blog platform)\n• Spotify Clone (with React)\n• eCommerce applications\n• AI Chatbots\n• And many more with complete source code!\n\nFeel free to explore and star his repositories!`;
    }

    // Greetings
    if (/(hello|hi|hey|greetings|good morning|good afternoon)/i.test(q)) {
        return "Hello! 👋 I'm Elayabarathi's portfolio assistant. He's a passionate full-stack developer and biotechnologist. I can tell you about his projects, skills, experience, or how to contact him. What would you like to know?";
    }

    // Projects
    if (q.includes('project') || q.includes('portfolio') || q.includes('work')) {
        const projects = data.projects.slice(0, 4).map(proj =>
            `• ${proj.name}: ${proj.description.substring(0, 80)}...`
        ).join('\n');

        return `🚀 Elayabarathi's Projects:\n\n${projects}\n\nCheck out his portfolio for live demos: ${data.contact.portfolio}`;
    }

    // Skills
    if (q.includes('skill') || q.includes('technology') || q.includes('tech') || q.includes('stack')) {
        return `💻 Technical Skills:\n\nFRONTEND: React, JavaScript, HTML, CSS, Tailwind\nBACKEND: Python, Flask, Node.js, Express\nDATABASES: MongoDB, PostgreSQL, SQLite\nTOOLS: Git, VS Code, Postman, Docker\n\n🧬 Biotechnology:\nMicrobiology, Genetic Engineering, Nanobiotechnology, Bioinformatic\n\nHe's always learning new technologies!`;
    }

    // Experience
    if (q.includes('experience') || q.includes('work') || q.includes('intern') || q.includes('job')) {
        return `💼 Professional Experience:\n\n• Fullstack Web Developer Intern @ Corizo Edutech\n• Java Fullstack Trainee @ QSpider\n• Biotechnology Intern @ Elies Biotech\n• Research in Nanobiotechnology & Antimicrobial Solutions\n\nHe has practical experience in both software development and biotech research.`;
    }

    // Contact
    if (q.includes('contact') || q.includes('email') || q.includes('linkedin') || q.includes('reach') || q.includes('connect')) {
        return `📞 Contact Elayabarathi:\n\n📧 Email: ${data.contact.email}\n💼 LinkedIn: ${data.contact.linkedin}\n🔗 GitHub: ${data.contact.github}\n🌐 Portfolio: ${data.contact.portfolio}\n\nHe's open to collaborations and new opportunities!`;
    }

    // About
    if (q.includes('about') || q.includes('who are you') || q.includes('yourself') || q.includes('introduce')) {
        return `👨‍💻 About Elayabarathi:\n\n${data.about}\n\nHe's passionate about integrating technology and biology to create innovative solutions that make a difference.`;
    }

    // Education
    if (q.includes('education') || q.includes('degree') || q.includes('study') || q.includes('college')) {
        const edu = data.education[0];
        return `🎓 Education:\n\n${edu.education}\n${edu.institution} (${edu.year})\nGrade: ${edu.percentage}\n\n${edu.description}`;
    }

    // Default response
    return `🤖 I can help you learn about Elayabarathi M V! Here's what I can tell you about:\n\n• His projects and portfolio 🚀\n• Technical skills and technologies 💻\n• Professional experience 💼\n• Education background 🎓\n• Contact information 📞\n• GitHub repositories 🔗\n\nWhat would you like to know specifically?`;
}

// Enhanced chat endpoint with AI integration
function formatAIResponse(text) {
    if (!text) return text;

    // Replace markdown-style formatting with HTML
    let formatted = text
        // Headers (### Header -> <strong>Header</strong>)
        .replace(/###\s+(.+)/g, '<strong>$1</strong>')
        // Bold (**text** -> <strong>text</strong>)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic (*text* -> <em>text</em>)
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Bullet points with • or -
        .replace(/^[\s]*[•\-]\s+(.+)$/gm, '• $1')
        // Multiple newlines to single newline
        .replace(/\n\s*\n/g, '\n')
        // Ensure proper line breaks
        .replace(/\n/g, '<br/>')
        // Ensure proper link formating
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    return formatted;
}

// Update the chat endpoint to use formatting
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

        // Try AI model first, fallback to local responses
        let answer;
        let source = 'local';

        // Build enhanced context from training data
        let context = `
        Your name is Portfolio-GPT, let the user to interact with Elayabarathi M V's portfolio and CV. 
        You are a helpful assistant for Elayabarathi M V's portfolio. 
        Here's some information about him:
        
        Name: ${portfolioData.name}
        Headline: ${portfolioData.headline}
        About: ${portfolioData.about}
        
        Contact Information:
        - Email: ${portfolioData.contact.email}
        - LinkedIn: ${portfolioData.contact.linkedin}
        - GitHub: ${portfolioData.contact.github}
        - Portfolio: ${portfolioData.contact.portfolio}
        
        Skills: Full-stack web development, Biotechnology, Python, React, JavaScript, Flask, etc.
        
        Please answer questions about Elayabarathi professionally and helpfully. 
        Use clear formatting with bullet points, headings, and proper spacing.
        If you don't know something specific, suggest asking about his projects, skills, or experience.
        `;

        // Override with training data context if available
        if (trainingData && trainingData.context) {
            // Build featured projects info
            const featuredProjectsInfo = portfolioData.featuredProjects ?
                portfolioData.featuredProjects.map(fp =>
                    `- ${fp.name}: ${fp.description || 'Featured project'} - Link: ${fp.link || 'N/A'}`
                ).join('\n') : 'No featured projects';

            context = `
            Your name is Portfolio-GPT. You are a friendly chatbot that lets users interact with Elayabarathi M V's portfolio and CV. 
            You are a helpful assistant for Elayabarathi M V's portfolio. 
            
            STRICT INSTRUCTIONS: When answering questions, you MUST prioritize web technology, software development, and tech-related information by default. 
            Only mention biotech, bioinformatics, or other non-tech backgrounds if the user explicitly asks for that. 
            Focus on web development skills, projects, and technologies. Do not give long explanations about biotech unless asked.
            
            Here's some information about him:
            
            Name: ${trainingData.context.name || portfolioData.name}
            Headline: Full Stack Web Developer (This is his PRIMARY focus - always lead with this)
            About: ${trainingData.context.about || portfolioData.about}
            
            Featured Projects (THESE ARE HIS BEST WORKS - mention these when asked about featured projects):
            ${featuredProjectsInfo}
            
            Contact Information:
            - Email: ${portfolioData.contact.email}
            - LinkedIn: ${portfolioData.contact.linkedin}
            - GitHub: ${portfolioData.contact.github}
            - Portfolio: ${portfolioData.contact.portfolio}
            
            Skills: ${trainingData.context.skills || 'Full-stack web development, Python, React, JavaScript, Flask, etc.'}
            
            Please answer questions about Elayabarathi professionally and helpfully. 
            Use clear formatting with bullet points, headings, and proper spacing.
            When asked about "featured projects" or "best projects", ONLY mention the 2 featured projects: Portfolio Website and Card Vault.
            If you don't know something specific, suggest asking about his projects, skills, or experience.
            `;
        }

        try {
            const aiResponse = await queryHuggingFace({
                messages: [
                    {
                        role: "system",
                        content: context
                    },
                    {
                        role: "user",
                        content: question,
                    },
                ],
                model: "CohereLabs/command-a-translate-08-2025:cohere",
                max_tokens: 500,
                temperature: 0.7,
            });

            if (aiResponse.choices && aiResponse.choices[0] && aiResponse.choices[0].message) {
                answer = formatAIResponse(aiResponse.choices[0].message.content);
                source = 'ai';
                console.log('🤖 AI model response used');
            } else {
                throw new Error('Invalid response from AI model');
            }
        } catch (aiError) {
            console.log('❌ AI model failed, using local response:', aiError.message);
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
        const aiResponse = await queryHuggingFace({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant for Elayabarathi M V's portfolio. He is a full-stack developer and biotechnologist."
                },
                {
                    role: "user",
                    content: testQuestion,
                },
            ],
            model: "CohereLabs/command-a-translate-08-2025:cohere",
        });

        res.json({
            test: 'AI model test',
            question: testQuestion,
            aiResponse: aiResponse,
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
            sync: 'POST /api/sync - Trigger manual data sync',
            syncStatus: 'GET /api/sync-status - Check sync status'
        }
    });
});

// Manual sync endpoint
app.post('/api/sync', async (req, res) => {
    try {
        console.log('🔄 Manual sync triggered...');
        const success = await syncData();

        if (success) {
            // Reload data after sync
            loadData();
            res.json({
                success: true,
                message: 'Data synchronized successfully from frontend to backend',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Data sync failed',
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
    const dataPath = path.join(__dirname, "data", "data.json");
    const trainingPath = path.join(__dirname, "data", "training.json");

    let dataLastModified = null;
    let trainingLastModified = null;

    try {
        const dataStats = fs.statSync(dataPath);
        dataLastModified = dataStats.mtime.toISOString();
    } catch (e) { }

    try {
        const trainingStats = fs.statSync(trainingPath);
        trainingLastModified = trainingStats.mtime.toISOString();
    } catch (e) { }

    res.json({
        status: 'active',
        autoSyncEnabled: true,
        syncIntervalMinutes: 30,
        lastDataUpdate: portfolioData?.lastUpdated || dataLastModified,
        lastTrainingUpdate: trainingData?.lastTrained || trainingLastModified,
        dataFileModified: dataLastModified,
        trainingFileModified: trainingLastModified,
        timestamp: new Date().toISOString()
    });
});

// Stop auto-sync (for maintenance)
app.post('/api/sync/stop', (req, res) => {
    stopAutoSync();
    res.json({
        success: true,
        message: 'Auto-sync stopped'
    });
});

// Start auto-sync
app.post('/api/sync/start', (req, res) => {
    startAutoSync();
    res.json({
        success: true,
        message: 'Auto-sync started (every 30 minutes)'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Elayabarathi Portfolio Chatbot API',
        endpoints: {
            chat: 'POST /api/chat - Send questions about the portfolio',
            health: 'GET /api/health - Check server status',
            test: 'GET /api/test - Test endpoint',
            testAI: 'GET /api/test-ai - Test AI model'
        },
        features: {
            ai: 'Integrated Hugging Face AI model',
            fallback: 'Local response system as backup',
            context: 'Portfolio-aware responses'
        },
        example: {
            chat: 'curl -X POST http://localhost:5000/api/chat -H "Content-Type: application/json" -d \'{"question":"What is your GitHub?"}\''
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`💡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
    console.log(`🤖 AI test: http://localhost:${PORT}/api/test-ai`);
    console.log(`🎯 Test endpoint: http://localhost:${PORT}/api/test`);

    // Start auto-sync (every 30 minutes)
    startAutoSync();

    if (!process.env.HF_TOKEN) {
        console.warn('⚠️  HF_TOKEN not found in environment variables. AI features may not work.');
    } else {
        console.log('✅ Hugging Face token loaded');
    }
});

