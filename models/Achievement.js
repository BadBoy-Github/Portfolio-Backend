import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: String, required: true },
  image: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Achievement', achievementSchema);
