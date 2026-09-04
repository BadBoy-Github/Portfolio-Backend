import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  tags: [{ type: String }],
  date: { type: String, required: true },
  imgSrc: { type: String, default: '' },
  keyPoints: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Achievement', achievementSchema);
