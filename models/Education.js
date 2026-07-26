import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  year: { type: String, required: true },
  percentage: { type: String, default: '' },
  description: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Education', educationSchema);
