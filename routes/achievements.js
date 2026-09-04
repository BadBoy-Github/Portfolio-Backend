import express from 'express';
import Achievement from '../models/Achievement.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const items = await Achievement.find();
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Achievement.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
