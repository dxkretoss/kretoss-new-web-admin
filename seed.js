require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/userModel');
const connectDB = require('./src/config/db');

const seedAdmin = async () => {
  try {
    await connectDB();
    const adminExists = await User.findOne({ email: 'kretossadmin@kretoss.in' });
    const strongPassword = 'yT7$pK2#mN9@xL4!';

    if (!adminExists) {
      await User.create({
        email: 'kretossadmin@kretoss.in',
        password: strongPassword,
      });
      console.log('Admin user seeded successfully with the strong password');
    } else {
      adminExists.password = strongPassword;
      await adminExists.save();
      console.log('Admin user password updated to the strong password');
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
