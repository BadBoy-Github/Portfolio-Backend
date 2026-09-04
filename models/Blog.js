import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
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
