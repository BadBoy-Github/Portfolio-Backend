import express from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import Project from '../../models/Project.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const items = await Project.find();
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/order', async (req, res) => {
  const { items } = req.body;
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.some((item) =>
      !item ||
      typeof item.id !== 'string' ||
      !Number.isInteger(item.order) ||
      item.order < 0
    )
  ) {
    return res.status(400).json({
      success: false,
      message: 'A list of project IDs and non-negative order values is required.'
    });
  }

  const ids = items.map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    return res.status(400).json({
      success: false,
      message: 'Project IDs must be unique.'
    });
  }

  try {
    const existingProjects = await Project.find({ _id: { $in: ids } }).select('_id');
    if (existingProjects.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: 'The submitted project list is out of date.'
      });
    }

    await Project.bulkWrite(
      items.map(({ id, order }) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { order } }
        }
      }))
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Project.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const item = await Project.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const item = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const item = await Project.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/order', async (req, res) => {
  try {
    const item = await Project.findByIdAndUpdate(req.params.id, { order: req.body.order }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
