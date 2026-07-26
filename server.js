// server.js
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
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
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

connectMongo();

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

    if (q.includes('github') || q.includes('git') || q.includes('code') || q.includes('repository')) {
        return `🔗 Elayabarathi's GitHub: ${data.contact.github}\n\nHere you'll find all his projects including:\n• Portfolio Website (React + Tailwind)\n• Bamboo Blogs (Flask blog platform)\n• Spotify Clone (with React)\n• eCommerce applications\n• AI Chatbots\n• And many more with complete source code!\n\nFeel free to explore and star his repositories!`;
    }

    if (/(hello|hi|hey|greetings|good morning|good afternoon)/i.test(q)) {
        return "Hello! 👋 I'm Elayabarathi's portfolio assistant. He's a passionate full-stack developer and biotechnologist. I can tell you about his projects, skills, experience, or how to contact him. What would you like to know?";
    }

    if (q.includes('project') || q.includes('portfolio') || q.includes('work')) {
        const projects = data.projects.slice(0, 4).map(proj =>
            `• ${proj.name}: ${proj.description.substring(0, 80)}...`
        ).join('\n');

        return `🚀 Elayabarathi's Projects:\n\n${projects}\n\nCheck out his portfolio for live demos: ${data.contact.portfolio}`;
    }

    if (q.includes('skill') || q.includes('technology') || q.includes('tech') || q.includes('stack')) {
        return `💻 Technical Skills:\n\nFRONTEND: React, JavaScript, HTML, CSS, Tailwind\nBACKEND: Python, Flask, Node.js, Express\nDATABASES: MongoDB, PostgreSQL, SQLite\nTOOLS: Git, VS Code, Postman, Docker\n\n🧬 Biotechnology:\nMicrobiology, Genetic Engineering, Nanobiotechnology, Bioinformatic\n\nHe's always learning new technologies!`;
    }

    if (q.includes('experience') || q.includes('work') || q.includes('intern') || q.includes('job')) {
        return `💼 Professional Experience:\n\n• Fullstack Web Developer Intern @ Corizo Edutech\n• Java Fullstack Trainee @ QSpider\n• Biotechnology Intern @ Elies Biotech\n• Research in Nanobiotechnology & Antimicrobial Solutions\n\nHe has practical experience in both software development and biotech research.`;
    }

    if (q.includes('contact') || q.includes('email') || q.includes('linkedin') || q.includes('reach') || q.includes('connect')) {
        return `📞 Contact Elayabarathi:\n\n📧 Email: ${data.contact.email}\n💼 LinkedIn: ${data.contact.linkedin}\n🔗 GitHub: ${data.contact.github}\n🌐 Portfolio: ${data.contact.portfolio}\n\nHe's open to collaborations and new opportunities!`;
    }

    if (q.includes('about') || q.includes('who are you') || q.includes('yourself') || q.includes('introduce')) {
        return `👨‍💻 About Elayabarathi:\n\n${data.about}\n\nHe's passionate about integrating technology and biology to create innovative solutions that make a difference.`;
    }

    if (q.includes('education') || q.includes('degree') || q.includes('study') || q.includes('college')) {
        const edu = data.education[0];
        return `🎓 Education:\n\n${edu.education}\n${edu.institution} (${edu.year})\nGrade: ${edu.percentage}\n\n${edu.description}`;
    }

    return `🤖 I can help you learn about Elayabarathi M V! Here's what I can tell you about:\n\n• His projects and portfolio 🚀\n• Technical skills and technologies 💻\n• Professional experience 💼\n• Education background 🎓\n• Contact information 📞\n• GitHub repositories 🔗\n\nWhat would you like to know specifically?`;
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

        if (trainingData && trainingData.context) {
            const featuredProjectsInfo = portfolioData.featuredProjects ?
                portfolioData.featuredProjects.map(fp =>
                    `- ${fp.name}: ${fp.description || 'Featured project'} - Link: ${fp.link || 'N/A'}`
                ).join('\n') : 'No featured projects';

            const blogsInfo = portfolioData.blogs ?
                portfolioData.blogs.map(blog =>
                    `- ${blog.title}: ${blog.subtitle || 'Blog post'} (${blog.readTime || 'N/A'})`
                ).join('\n') : 'No blogs';

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
            
            Blog Posts (He writes technical articles - mention when asked about blogs):
            ${blogsInfo}
            
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
            sync: 'POST /api/sync',
            syncStatus: 'GET /api/sync-status',
            login: 'POST /api/admin/login',
            seed: 'POST /api/admin/seed',
            techStacks: '/api/admin/tech-stacks',
            projects: '/api/admin/projects',
            certificates: '/api/admin/certificates',
            achievements: '/api/admin/achievements',
            reviews: '/api/admin/reviews',
            experience: '/api/admin/experience',
            education: '/api/admin/education',
            blogs: '/api/admin/blogs'
        },
        mongoConnected
    });
});

// Manual sync endpoint
app.post('/api/sync', async (req, res) => {
    try {
        console.log('🔄 Manual sync triggered...');
        const success = await syncData();

        if (success) {
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

// Contact form endpoint with nodemailer
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

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

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
                    ${name}
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:10px;">
                    <strong style="color:#0284c7;">📧 Email:</strong><br>
                    ${email}
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:10px;">
                    <strong style="color:#0284c7;">📂 Category:</strong><br>
                    ${category}
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:10px;">
                    <strong style="color:#0284c7;">📝 Subject:</strong><br>
                    ${subject}
                  </td>
                </tr>

              </table>

              <!-- Message Section -->
              <div style="margin-top:25px;">
                <strong style="color:#0284c7; font-size:16px;">💬 Message</strong>
                <div style="margin-top:10px; padding:15px; background:#f1f5f9; border-radius:8px; line-height:1.6;">
                  ${message}
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
            error: 'Failed to send message. Please try again later.'
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
            techStacks: '/api/admin/tech-stacks',
            projects: '/api/admin/projects',
            certificates: '/api/admin/certificates',
            achievements: '/api/admin/achievements',
            reviews: '/api/admin/reviews',
            experience: '/api/admin/experience',
            education: '/api/admin/education',
            blogs: '/api/admin/blogs'
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

// Admin routes
import authRoutes from './routes/auth.js';
import techStackRoutes from './routes/techStacks.js';
import projectRoutes from './routes/projects.js';
import certificateRoutes from './routes/certificates.js';
import achievementRoutes from './routes/achievements.js';
import reviewRoutes from './routes/reviews.js';
import experienceRoutes from './routes/experience.js';
import educationRoutes from './routes/education.js';
import blogRoutes from './routes/blogs.js';

app.use('/api/admin', authRoutes);
app.use('/api/admin/tech-stacks', techStackRoutes);
app.use('/api/admin/projects', projectRoutes);
app.use('/api/admin/certificates', certificateRoutes);
app.use('/api/admin/achievements', achievementRoutes);
app.use('/api/admin/reviews', reviewRoutes);
app.use('/api/admin/experience', experienceRoutes);
app.use('/api/admin/education', educationRoutes);
app.use('/api/admin/blogs', blogRoutes);

import { authMiddleware } from './middleware/auth.js';

// Seed endpoint
app.post('/api/admin/seed', authMiddleware, async (req, res) => {
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

        const adminEmail = process.env.ADMIN_EMAIL || 'elayabarathiedison@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const salt = await bcrypt.hash(adminPassword, 10);
        await Admin.create({ email: adminEmail, password: salt });

        if (data.skills && data.skills['technical skills']) {
            const skills = data.skills['technical skills'];
            for (const [category, items] of Object.entries(skills)) {
                if (Array.isArray(items) && items.length > 0) {
                    await TechStack.create({ category, items });
                }
            }
        }

        if (Array.isArray(data.projects)) {
            await Project.insertMany(data.projects);
        }
        if (Array.isArray(data.certificates)) {
            await Certificate.insertMany(data.certificates);
        }
        if (Array.isArray(data.achievements)) {
            await Achievement.insertMany(data.achievements);
        }
        if (Array.isArray(data.reviews)) {
            await Review.insertMany(data.reviews);
        }
        if (Array.isArray(data.experience)) {
            await Experience.insertMany(data.experience);
        }
        if (Array.isArray(data.education)) {
            await Education.insertMany(data.education);
        }
        if (Array.isArray(data.blogs)) {
            await Blog.insertMany(data.blogs);
        }

        res.json({ success: true, message: 'Database seeded successfully' });
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`💡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
    console.log(`🤖 AI test: http://localhost:${PORT}/api/test-ai`);
    console.log(`🎯 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`🔑 Admin login: POST http://localhost:${PORT}/api/admin/login`);

    if (mongoConnected) {
        console.log('✅ MongoDB connected');
    } else {
        console.log('⚠️  MongoDB not connected. Run seed endpoint after setting MONGO_URI in .env');
    }

    // Start auto-sync (every 30 minutes)
    startAutoSync();

    if (!process.env.HF_TOKEN) {
        console.warn('⚠️  HF_TOKEN not found in environment variables. AI features may not work.');
    } else {
        console.log('✅ Hugging Face token loaded');
    }
});
