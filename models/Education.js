import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  year: { type: String, required: true },
  percentage: { type: String, default: '' },
  description: { type: String, default: '' },
  instLogo: { type: String, default: '' },
  instLink: { type: String, default: '' },
  skills: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Education', educationSchema);
