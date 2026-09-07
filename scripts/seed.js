import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const Admin = (await import('../models/Admin.js')).default;
        const TechStack = (await import('../models/TechStack.js')).default;
        const Project = (await import('../models/Project.js')).default;
        const Certificate = (await import('../models/Certificate.js')).default;
        const Achievement = (await import('../models/Achievement.js')).default;
        const Review = (await import('../models/Review.js')).default;
        const Experience = (await import('../models/Experience.js')).default;
        const Education = (await import('../models/Education.js')).default;
        const Blog = (await import('../models/Blog.js')).default;

        console.log('🗑️  Clearing existing data...');
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
        console.log('✅ Admin user created');

        const dataPath = path.join(__dirname, '..', 'data', 'data.json');
        const raw = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(raw);

        console.log('📊 Seeding data from data.json...');
        console.log('   Skills:', data.skills?.length || 0);
        console.log('   Projects:', data.projects?.length || 0);
        console.log('   Certificates:', data.certificates?.length || 0);
        console.log('   Achievements:', data.achievements?.length || 0);
        console.log('   Reviews:', data.reviews?.length || 0);
        console.log('   Experience:', data.experience?.length || 0);
        console.log('   Education:', data.education?.length || 0);
        console.log('   Blogs:', data.blogs?.length || 0);

        if (Array.isArray(data.skills)) {
            const formatted = data.skills.map(s => ({
                id: s.label || `skill-${Math.random().toString(36).slice(2, 9)}`,
                label: s.label || '',
                desc: s.desc || '',
                imgSrc: s.imgSrc || ''
            }));
            await TechStack.insertMany(formatted);
            console.log('✅ Skills seeded');
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
            console.log('✅ Projects seeded');
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
            console.log('✅ Certificates seeded');
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
            console.log('✅ Achievements seeded');
        }

        if (Array.isArray(data.reviews)) {
            const formatted = data.reviews.map((r, i) => ({
                id: r.name ? `rev-${i}-${r.name.replace(/\s+/g, '-').toLowerCase()}` : `rev-${i}`,
                content: r.content || r.comment || '',
                name: r.name || '',
                imgSrc: r.imgSrc || r.image || '',
                company: r.company || ''
            }));
            await Review.insertMany(formatted);
            console.log('✅ Reviews seeded');
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
                console.log('✅ Experience seeded');
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
            console.log('✅ Education seeded');
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
            console.log('✅ Blogs seeded');
        }

        console.log('🎉 Database seeded successfully!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error.message);
        process.exit(1);
    }
}

seedDatabase();
