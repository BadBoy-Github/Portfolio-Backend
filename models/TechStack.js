import mongoose from 'mongoose';

const techStackSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  items: [{ type: String, required: true }]
}, { timestamps: true });

export default mongoose.model('TechStack', techStackSchema);
