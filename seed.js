import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import Admin from './models/Admin.js';
import TechStack from './models/TechStack.js';
import Project from './models/Project.js';
import Certificate from './models/Certificate.js';
import Achievement from './models/Achievement.js';
import Review from './models/Review.js';
import Experience from './models/Experience.js';
import Education from './models/Education.js';
import Blog from './models/Blog.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGO_URI || '';

async function connect() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function seed() {
  await connect();
  console.log('Starting seed...');

  const dataPath = path.join(__dirname, 'data', 'data.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
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
  console.log('Admin seeded');

  if (Array.isArray(data.skills)) {
    await TechStack.insertMany(data.skills);
    console.log('Tech stacks seeded');
  }

  if (Array.isArray(data.projects)) {
    await Project.insertMany(data.projects);
    console.log('Projects seeded');
  }

  if (Array.isArray(data.certificates)) {
    await Certificate.insertMany(data.certificates);
    console.log('Certificates seeded');
  }

  if (Array.isArray(data.achievements)) {
    await Achievement.insertMany(data.achievements);
    console.log('Achievements seeded');
  }

  if (Array.isArray(data.reviews)) {
    await Review.insertMany(data.reviews);
    console.log('Reviews seeded');
  }

  if (Array.isArray(data.experience)) {
    await Experience.insertMany(data.experience);
    console.log('Experience seeded');
  }

  if (Array.isArray(data.education)) {
    await Education.insertMany(data.education);
    console.log('Education seeded');
  }

  if (Array.isArray(data.blogs)) {
    await Blog.insertMany(data.blogs);
    console.log('Blogs seeded');
  }

  console.log('Seed completed!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
