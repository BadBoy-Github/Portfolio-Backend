import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  order: { type: Number, default: 0 },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  date: { type: String, default: '' },
  readTime: { type: String, default: '' },
  tags: [{ type: String }],
  imageSrc: { type: String, default: '' },
  link: { type: String, default: '' },
  content: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Blog', blogSchema);
