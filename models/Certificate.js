import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  date: { type: String, required: true },
  description: { type: String, required: true },
  link: { type: String, default: '' },
  image: { type: String, default: '' },
  logo: { type: String, default: '' },
  certNumber: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Certificate', certificateSchema);
