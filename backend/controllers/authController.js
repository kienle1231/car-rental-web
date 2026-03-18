const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      _id: user.id, name: user.name, email: user.email, role: user.role,
      token: generateToken(user.id, user.role)
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && user.status === 'Locked') {
      return res.status(403).json({ message: 'Account is locked by admin' });
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id, name: user.name, email: user.email, role: user.role,
        token: generateToken(user.id, user.role)
      });
    } else { res.status(401).json({ message: 'Invalid credentials' }); }
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Missing Google credential' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(400).json({ message: 'Invalid Google token' });

    let user = await User.findOne({ email: payload.email });
    if (user && user.status === 'Locked') {
      return res.status(403).json({ message: 'Account is locked by admin' });
    }

    if (!user) {
      user = await User.create({
        name: payload.name || payload.given_name || 'Google User',
        email: payload.email,
        password: await bcrypt.hash(Math.random().toString(36).slice(2), 10)
      });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id, user.role)
    });
  } catch (error) {
    res.status(500).json({ message: 'Google login failed', error: error.message });
  }
};

// Admin user management
exports.getUsers = async (req, res) => {
  try { const users = await User.find().select('-password'); res.json(users); }
  catch (error) { res.status(500).json({ error: error.message }); }
};
exports.deleteUser = async (req, res) => {
  try { await User.findByIdAndDelete(req.params.id); res.json({ message: 'User deleted' }); }
  catch (error) { res.status(500).json({ error: error.message }); }
};
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.status = user.status === 'Active' ? 'Locked' : 'Active';
    await user.save();
    res.json(user);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In production, send via email. For demo, we return it.
    res.json({ message: 'Reset code generated', resetCode });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ 
      email, 
      resetPasswordToken: code, 
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset code' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
