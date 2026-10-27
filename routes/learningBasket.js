import express from 'express';
import LearningBasketItem from '../models/LearningBasketItem.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const items = await LearningBasketItem.find().sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
