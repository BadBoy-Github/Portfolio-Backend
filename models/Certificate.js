import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  date: { type: String, required: true },
  description: { type: String, required: true },
  link: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Certificate', certificateSchema);
