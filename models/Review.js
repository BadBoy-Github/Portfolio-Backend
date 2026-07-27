import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, default: '' },
  company: { type: String, default: '' },
  comment: { type: String, default: '' },
  rating: { type: Number, default: 5 },
  image: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);
