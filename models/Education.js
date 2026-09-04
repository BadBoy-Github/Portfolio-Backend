import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  year: { type: String, default: '' },
  name: { type: String, required: true },
  perc: { type: String, default: '' },
  instName: { type: String, default: '' },
  instLogo: { type: String, default: '' },
  instLink: { type: String, default: '' },
  desc: { type: String, default: '' },
  skills: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Education', educationSchema);
