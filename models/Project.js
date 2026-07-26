import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  link: { type: String, default: '' },
  github: { type: String, default: '' },
  skills: [{ type: String }],
  image: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
