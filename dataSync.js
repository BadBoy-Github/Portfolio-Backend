// dataSync.js - Automatic data synchronization from frontend to backend
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const FRONTEND_DATA_PATH = path.join(__dirname, '..', 'frontend', 'src', 'components', 'data');
const BACKEND_DATA_PATH = path.join(__dirname, 'data');
const DATA_JSON_PATH = path.join(BACKEND_DATA_PATH, 'data.json');
const TRAINING_JSON_PATH = path.join(BACKEND_DATA_PATH, 'training.json');

// Sync interval in milliseconds (30 minutes)
const SYNC_INTERVAL = 30 * 60 * 1000;

// Read and parse a JavaScript data file
function readJsDataFile(filename) {
    try {
        const filePath = path.join(FRONTEND_DATA_PATH, filename);

        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️  File not found: ${filename}`);
            return null;
        }

        const content = fs.readFileSync(filePath, 'utf8');

        // Try different patterns to extract the exported data
        // Pattern 1: export const variableName = [...]; (inline export)
        let match = content.match(/export\s+const\s+(\w+)\s*=\s*(\[[\s\S]*\]);?\s*$/m);

        // Pattern 2: const variableName = [...]; export { variableName }; (named export at end)
        if (!match) {
            match = content.match(/const\s+(\w+)\s*=\s*(\[[\s\S]*\]);?\s*$/m);
        }

        // Pattern 3: const variableName = [...]; (no export - just read the array)
        if (!match) {
            match = content.match(/const\s+(\w+)\s*=\s*(\[[\s\S]*\]);?/);
        }

        if (match && match[2]) {
            let jsonStr = match[2];

            try {
                // Preprocess to handle common JS syntax issues
                // Handle trailing commas in arrays and objects
                jsonStr = jsonStr
                    .replace(/,\s*\]/g, ']')   // trailing comma in array
                    .replace(/,\s*\}/g, '}');  // trailing comma in object

                // Create a function that returns the data - handles JS syntax natively
                const dataExtractor = new Function(`return ${jsonStr}`);
                const data = dataExtractor();
                return data;
            } catch (e) {
                console.error(`❌ Error parsing ${filename}:`, e.message);
                return null;
            }
        }

        console.warn(`⚠️  Could not find export in ${filename}`);
        return null;
    } catch (error) {
        console.error(`❌ Error reading ${filename}:`, error.message);
        return null;
    }
}

// Format skills for backend
function formatSkills(skillData) {
    if (!skillData || !Array.isArray(skillData)) return {};

    const formattedSkills = {
        "technical skills": {
            "languages": [],
            "frameworks": [],
            "libraries": [],
            "tools": []
        }
    };

    skillData.forEach(skill => {
        const label = skill.label?.toLowerCase() || '';
        const desc = skill.desc?.toLowerCase() || '';

        // Categorize based on label
        if (['react js', 'javascript', 'python', 'java', 'html', 'css', 'sql'].some(k => label.includes(k))) {
            if (!formattedSkills["technical skills"]["languages"].includes(skill.label)) {
                formattedSkills["technical skills"]["languages"].push(skill.label);
            }
        } else if (['tailwind', 'bootstrap', 'flask'].some(k => label.includes(k))) {
            if (!formattedSkills["technical skills"]["frameworks"].includes(skill.label)) {
                formattedSkills["technical skills"]["frameworks"].push(skill.label);
            }
        } else if (['github', 'vercel', 'canva', 'autocad'].some(k => label.includes(k))) {
            if (!formattedSkills["technical skills"]["tools"].includes(skill.label)) {
                formattedSkills["technical skills"]["tools"].push(skill.label);
            }
        } else {
            if (!formattedSkills["technical skills"]["libraries"].includes(skill.label)) {
                formattedSkills["technical skills"]["libraries"].push(skill.label);
            }
        }
    });

    return formattedSkills;
}

// Format projects for backend
function formatProjects(projectData) {
    if (!projectData || !Array.isArray(projectData)) return [];

    return projectData.map(proj => ({
        name: proj.title || proj.name || '',
        description: proj.desc || proj.description || '',
        link: proj.projectLink || proj.link || '',
        github: proj.gitUrl || proj.github || '',
        skills: proj.sTags || proj.tags || [],
        image: proj.imgSrc || proj.image || ''
    }));
}

// Format experience for backend
function formatExperience(expData) {
    if (!expData || !Array.isArray(expData)) return [];

    return expData.map(exp => ({
        title: exp.name || exp.title || '',
        company: exp.instName || exp.company || '',
        period: exp.year || exp.period || '',
        description: exp.desc || exp.description || '',
        skills: exp.skills || [],
        link: exp.instLink || exp.link || ''
    }));
}

// Format education for backend
function formatEducation(eduData) {
    if (!eduData || !Array.isArray(eduData)) return [];

    return eduData.map(e => ({
        institution: e.school || e.college || e.institution || '',
        degree: e.degree || e.course || '',
        year: e.year || e.graduationYear || '',
        percentage: e.grade || e.percentage || '',
        description: e.desc || e.description || ''
    }));
}

// Format certificates for backend
function formatCertificates(certData) {
    if (!certData || !Array.isArray(certData)) return [];

    return certData.map(cert => ({
        name: cert.name || cert.title || '',
        issuer: cert.issuer || cert.company || '',
        date: cert.date || cert.year || '',
        description: cert.desc || cert.description || '',
        link: cert.link || cert.url || ''
    }));
}

// Format achievements for backend
function formatAchievements(achievementData) {
    if (!achievementData || !Array.isArray(achievementData)) return [];

    return achievementData.map(ach => ({
        title: ach.title || ach.name || '',
        description: ach.desc || ach.description || '',
        date: ach.date || ach.year || '',
        image: ach.imgSrc || ach.image || ''
    }));
}

// Format reviews for backend
function formatReviews(reviewData) {
    if (!reviewData || !Array.isArray(reviewData)) return [];

    return reviewData.map(rev => ({
        name: rev.name || rev.reviewerName || '',
        role: rev.role || rev.reviewerRole || '',
        comment: rev.comment || rev.review || '',
        rating: rev.rating || 5,
        image: rev.imgSrc || rev.image || ''
    }));
}

// Format featured projects
function formatFeaturedProjects(featuredData) {
    if (!featuredData || !Array.isArray(featuredData)) return [];

    return featuredData.map(fp => ({
        name: fp.title || fp.name || '',
        description: fp.desc || fp.description || '',
        link: fp.link || fp.projectLink || '',
        github: fp.gitUrl || fp.github || '',
        image: fp.imgSrc || fp.image || '',
        tags: fp.sTags || fp.tags || []
    }));
}

// Main sync function
async function syncData() {
    console.log('\n🔄 Starting data synchronization...');
    console.log(`📂 Reading from: ${FRONTEND_DATA_PATH}`);

    try {
        // Read all frontend data files
        const skillData = readJsDataFile('SkillData.js');
        const projectData = readJsDataFile('ProjectData.js');
        const experienceData = readJsDataFile('ExperienceData.js');
        const educationData = readJsDataFile('EducationData.js');
        const certificateData = readJsDataFile('CertificateData.js');
        const achievementData = readJsDataFile('AchievementData.js');
        const reviewData = readJsDataFile('ReviewData.js');
        const featuredProjectData = readJsDataFile('FeaturedProjectData.js');

        console.log('📊 Data loaded:', {
            skills: skillData?.length || 0,
            projects: projectData?.length || 0,
            experience: experienceData?.length || 0,
            education: educationData?.length || 0,
            certificates: certificateData?.length || 0,
            achievements: achievementData?.length || 0,
            reviews: reviewData?.length || 0,
            featuredProjects: featuredProjectData?.length || 0
        });

        // Build the portfolio data object
        const portfolioData = {
            name: "Elayabarathi M V",
            headline: "Full Stack Web Developer & Biotechnologist",
            about: "Welcome! I'm Elayabarathi M V, a professional biotechnologist with expertise in microbiology, genetics, and bioinformatics. Innovated cancer treatments via nanobiotechnology. Accomplished frontend web developer. Passionate about integrating biology and technology for innovation. Strong collaborator and problem-solver, dedicated to continuous learning and interdisciplinary success.",
            oneline: "Enthusiast in Scientific & Technological Innovations",
            contact: {
                email: "elayabarathiedison@gmail.com",
                linkedin: "https://www.linkedin.com/in/elayabarathi/",
                github: "https://github.com/BadBoy-Github",
                portfolio: "https://elayabarathimv-portfolio.vercel.app/"
            },
            skills: formatSkills(skillData),
            projects: formatProjects(projectData),
            experience: formatExperience(experienceData),
            education: formatEducation(educationData),
            certificates: formatCertificates(certificateData),
            achievements: formatAchievements(achievementData),
            reviews: formatReviews(reviewData),
            featuredProjects: formatFeaturedProjects(featuredProjectData),
            lastUpdated: new Date().toISOString()
        };

        // Write to data.json
        fs.writeFileSync(DATA_JSON_PATH, JSON.stringify(portfolioData, null, 2), 'utf8');
        console.log('✅ data.json updated successfully');

        // Generate training data for AI
        const trainingData = generateTrainingData(portfolioData);

        // Write to training.json
        fs.writeFileSync(TRAINING_JSON_PATH, JSON.stringify(trainingData, null, 2), 'utf8');
        console.log('✅ training.json updated successfully');

        console.log(`⏰ Data synced at: ${new Date().toISOString()}`);

        return true;
    } catch (error) {
        console.error('❌ Sync error:', error.message);
        return false;
    }
}

// Generate training data for the AI
function generateTrainingData(data) {
    const trainingExamples = [];

    // System context - instructs AI to prioritize web tech
    const webTechContext = "IMPORTANT: When answering questions, prioritize web technology, software development, and tech-related information by default. Only mention biotech, bioinformatics, or other non-tech backgrounds if explicitly asked. Focus on web development skills, projects, and technologies.";

    // About section
    trainingExamples.push({
        input: "Tell me about yourself",
        output: data.about
    });

    // Skills - prioritize web tech
    if (data.skills) {
        const skillsStr = Object.entries(data.skills).map(([category, items]) => {
            if (typeof items === 'object') {
                return `${category}: ${Object.entries(items).map(([key, vals]) =>
                    `${key}: ${Array.isArray(vals) ? vals.join(', ') : vals}`
                ).join(', ')}`;
            }
            return `${category}: ${items}`;
        }).join('. ');

        trainingExamples.push({
            input: "What are your technical skills?",
            output: "As a Full Stack Web Developer, my core technical skills include: " + skillsStr
        });
    }

    // Projects
    if (data.projects && data.projects.length > 0) {
        const projectsStr = data.projects.map(p =>
            `${p.name}: ${p.description?.substring(0, 100)}...`
        ).join('. ');

        trainingExamples.push({
            input: "What projects have you worked on?",
            output: projectsStr
        });
    }

    // Experience
    if (data.experience && data.experience.length > 0) {
        const expStr = data.experience.map(e =>
            `${e.title} at ${e.company} (${e.period}): ${e.description?.substring(0, 80)}...`
        ).join('. ');

        trainingExamples.push({
            input: "What is your work experience?",
            output: expStr
        });
    }

    // Education
    if (data.education && data.education.length > 0) {
        const eduStr = data.education.map(e =>
            `${e.degree} at ${e.institution} (${e.year})`
        ).join('. ');

        trainingExamples.push({
            input: "What is your educational background?",
            output: eduStr
        });
    }

    // Featured Projects
    if (data.featuredProjects && data.featuredProjects.length > 0) {
        const fpStr = data.featuredProjects.map(fp =>
            `${fp.name}: ${fp.description || 'Featured project'} - Live: ${fp.link || 'N/A'}`
        ).join('. ');

        trainingExamples.push({
            input: "What are your featured projects?",
            output: fpStr
        });
    }

    // Contact
    trainingExamples.push({
        input: "How can I contact you?",
        output: `You can reach me at: Email: ${data.contact?.email || 'N/A'}, LinkedIn: ${data.contact?.linkedin || 'N/A'}, GitHub: ${data.contact?.github || 'N/A'}`
    });

    return {
        version: "1.0",
        lastTrained: new Date().toISOString(),
        examples: trainingExamples,
        context: {
            name: data.name,
            headline: data.headline,
            about: data.about,
            systemPrompt: webTechContext,
            defaultFocus: "web development and technology"
        }
    };
}

// Start auto-sync interval
let syncInterval = null;

export function startAutoSync(intervalMs = SYNC_INTERVAL) {
    // Initial sync
    syncData();

    // Set up interval
    syncInterval = setInterval(() => {
        syncData();
    }, intervalMs);

    console.log(`🔄 Auto-sync started. Syncing every ${intervalMs / 60000} minutes.`);

    return syncInterval;
}

export function stopAutoSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        console.log('🛑 Auto-sync stopped.');
    }
}

export { syncData, SYNC_INTERVAL };
