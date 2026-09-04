import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function clearDatabase() {
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

        console.log('🗑️  Clearing all data from MongoDB...');
        
        await Admin.deleteMany({});
        await TechStack.deleteMany({});
        await Project.deleteMany({});
        await Certificate.deleteMany({});
        await Achievement.deleteMany({});
        await Review.deleteMany({});
        await Experience.deleteMany({});
        await Education.deleteMany({});
        await Blog.deleteMany({});

        console.log('✅ All data cleared from MongoDB successfully');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing database:', error.message);
        process.exit(1);
    }
}

clearDatabase();
