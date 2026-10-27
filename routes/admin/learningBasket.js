import express from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import LearningBasketItem from '../../models/LearningBasketItem.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const items = await LearningBasketItem.find().sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  const value = typeof req.body.value === 'string' ? req.body.value.trim() : '';
  const id = typeof req.body.id === 'string' ? req.body.id.trim() : '';
  if (!value || !id) {
    return res.status(400).json({
      success: false,
      message: 'A learning item value and id are required.'
    });
  }

  try {
    const item = await LearningBasketItem.create({
      id,
      value,
      order: Number.isInteger(req.body.order) ? req.body.order : 0
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    const status = error.code === 11000 || error.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

router.patch('/order', async (req, res) => {
  const { ids } = req.body;
  if (
    !Array.isArray(ids) ||
    ids.some((id) => typeof id !== 'string') ||
    new Set(ids).size !== ids.length
  ) {
    return res.status(400).json({
      success: false,
      message: 'A unique list of learning item IDs is required.'
    });
  }

  try {
    const existingItems = await LearningBasketItem.find({
      _id: { $in: ids }
    }).select('_id');
    if (existingItems.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: 'The submitted learning item list is out of date.'
      });
    }

    await LearningBasketItem.bulkWrite(
      ids.map((_id, order) => ({
        updateOne: {
          filter: { _id },
          update: { $set: { order } }
        }
      }))
    );
    const items = await LearningBasketItem.find().sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/order', async (req, res) => {
  const { order } = req.body;
  if (!Number.isInteger(order) || order < 0) {
    return res.status(400).json({
      success: false,
      message: 'Order must be a non-negative integer.'
    });
  }

  try {
    const item = await LearningBasketItem.findByIdAndUpdate(
      req.params.id,
      { order },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const item = await LearningBasketItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
