import express from 'express';
import Project from '../models/Project.js';

const router = express.Router();

// Public GET routes
router.get('/', async (req, res) => {
  try {
    const items = await Project.find();
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Project.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
