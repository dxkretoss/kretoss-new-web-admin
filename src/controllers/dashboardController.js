const Visitor = require('../models/Visitor');
const Career = require('../models/Career');
const JobApplication = require('../models/JobApplication');
const ContactLead = require('../models/ContactLead');

// Record a new visitor
exports.recordVisit = async (req, res) => {
  try {
    // Get IP from request (handling proxies)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Check if IP already exists
    const existingVisitor = await Visitor.findOne({ ip });
    
    if (!existingVisitor && ip) {
      const visitor = new Visitor({ ip });
      await visitor.save();
    }
    
    res.status(200).json({ success: true, message: 'Visit recorded' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const visitorCount = await Visitor.countDocuments();
    const jobCount = await Career.countDocuments();
    const appCount = await JobApplication.countDocuments();
    const contactCount = await ContactLead.countDocuments();

    // Get Recent Activity (Top 5 Applications and Top 5 Contact Leads)
    const recentApps = await JobApplication.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName appliedFor createdAt');
      
    const recentContacts = await ContactLead.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName service createdAt');

    // Combine and sort recent activity
    let recentActivity = [];
    
    recentApps.forEach(app => {
      recentActivity.push({
        type: 'Application',
        message: `New job application from ${app.fullName} for ${app.appliedFor || 'a position'}`,
        createdAt: app.createdAt
      });
    });

    recentContacts.forEach(contact => {
      recentActivity.push({
        type: 'Contact',
        message: `New contact lead from ${contact.fullName}`,
        createdAt: contact.createdAt
      });
    });

    // Sort combined array by newest first
    recentActivity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Keep only top 10 recent activities
    recentActivity = recentActivity.slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          visits: visitorCount,
          jobs: jobCount,
          applications: appCount,
          contacts: contactCount
        },
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
