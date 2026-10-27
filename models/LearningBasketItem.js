import mongoose from 'mongoose';

const learningBasketItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  value: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('LearningBasketItem', learningBasketItemSchema);
