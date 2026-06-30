const PortfolioCategory = require('../models/PortfolioCategory');

exports.getCategories = async (req, res) => {
  try {
    const categories = await PortfolioCategory.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const newCategory = new PortfolioCategory({ name });
    await newCategory.save();
    res.json({ success: true, data: newCategory });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PortfolioCategory.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.reorderCategories = async (req, res) => {
  try {
    const { order } = req.body;
    if (!order || !Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'Invalid order data' });
    }

    const bulkOps = order.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index }
      }
    }));

    if (bulkOps.length > 0) {
      await PortfolioCategory.bulkWrite(bulkOps);
    }
    
    res.json({ success: true, message: 'Categories reordered' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
