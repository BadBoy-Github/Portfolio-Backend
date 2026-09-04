import mongoose from 'mongoose';

const techStackSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  imgSrc: { type: String, default: '' },
  label: { type: String, required: true },
  desc: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('TechStack', techStackSchema);
