import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  date: { type: String, required: true },
  readTime: { type: String, default: '' },
  tags: [{ type: String }],
  image: { type: String, default: '' },
  content: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Blog', blogSchema);
