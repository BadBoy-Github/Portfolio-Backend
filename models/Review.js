import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  order: { type: Number, default: 0 },
  content: { type: String, default: '' },
  name: { type: String, required: true },
  imgSrc: { type: String, default: '' },
  company: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);
