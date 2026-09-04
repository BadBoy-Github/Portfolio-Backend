import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  imgSrc: { type: String, default: '' },
  company: { type: String, default: '' },
  logo: { type: String, default: '' },
  year: { type: String, default: '' },
  technologiesLearned: [{ type: String }],
  description: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Certificate', certificateSchema);
