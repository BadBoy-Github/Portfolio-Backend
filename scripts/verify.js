import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/portfolio');
        console.log('✅ Connected to MongoDB');

        const Project = (await import('../models/Project.js')).default;
        const Review = (await import('../models/Review.js')).default;

        const featured = await Project.find({ type: 'featured' }).select('title type');
        console.log('\n⭐ Featured projects:', featured.map(p => p.title));

        const reviews = await Review.find().limit(3).select('name content');
        console.log('\n💬 Sample reviews:');
        reviews.forEach((r, i) => {
            console.log(`  ${i + 1}. ${r.name}: ${r.content?.slice(0, 100) || '(empty)'}`);
        });

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verify();
