const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Seed initial admin user
// @route   POST /api/auth/seed
// @access  Public (for initialization purposes only)
const seedAdmin = async (req, res) => {
  try {
    const adminExists = await User.findOne({ email: 'kretossadmin@kretoss.in' });

    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = await User.create({
      email: 'kretossadmin@kretoss.in',
      password: 'yT7$pK2#mN9@xL4!', // Highly secure Google-suggested style password
    });

    if (admin) {
      res.status(201).json({
        message: 'Admin created successfully',
        email: admin.email
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { authUser, seedAdmin };
