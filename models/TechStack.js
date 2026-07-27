import mongoose from 'mongoose';

const techStackSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  items: [{
    label: { type: String, required: true },
    desc: { type: String, default: '' },
    imgSrc: { type: String, default: '' }
  }]
}, { timestamps: true });

export default mongoose.model('TechStack', techStackSchema);
