import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'admin-secret-key';

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required', errorType: 'missing' });
    }
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Incorrect email', errorType: 'email' });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password', errorType: 'password' });
    }
    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token, email: admin.email });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
