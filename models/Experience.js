import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  year: { type: String, default: '' },
  name: { type: String, required: true },
  role: { type: String, default: '' },
  instName: { type: String, default: '' },
  instLogo: { type: String, default: '' },
  instLink: { type: String, default: '' },
  desc: { type: String, default: '' },
  imgSrc: { type: String, default: '' },
  certifi: { type: Boolean, default: false },
  skills: [{ type: String }],
  compound: { type: Boolean, default: false },
  content: [{
    year: { type: String, default: '' },
    name: { type: String, default: '' },
    role: { type: String, default: '' },
    desc: { type: String, default: '' },
    imgSrc: { type: String, default: '' },
    certifi: { type: Boolean, default: false },
    skills: [{ type: String }]
  }]
}, { timestamps: true });

export default mongoose.model('Experience', experienceSchema);
