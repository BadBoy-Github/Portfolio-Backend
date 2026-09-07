import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  order: { type: Number, default: 0 },
  type: { type: String, default: '' },
  imgSrc: { type: String, default: '' },
  title: { type: String, required: true },
  subheading: { type: String, default: '' },
  tags: [{ type: String }],
  sTags: [{ type: String }],
  live: { type: String, default: '' },
  projectLink: { type: String, default: '' },
  code: { type: String, default: '' },
  gitUrl: { type: String, default: '' },
  techUsed: [{ type: String }],
  description: { type: String, default: '' },
  uses: { type: String, default: '' },
  improvements: { type: String, default: '' },
  displayTags: [{ type: String }],
  gallery: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
