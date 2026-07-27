import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  period: { type: String, required: true },
  description: { type: String, required: true },
  skills: [{ type: String }],
  link: { type: String, default: '' },
  role: { type: String, default: '' },
  instLogo: { type: String, default: '' },
  imgSrc: { type: String, default: '' },
  certifi: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Experience', experienceSchema);
