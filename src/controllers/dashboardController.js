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

    // Generate chart data based on range
    const range = req.query.range || 'weekly';
    let startDate = new Date();
    let dateFormat = "%Y-%m-%d";
    let chartData = [];

    if (range === 'yearly') {
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setMonth(startDate.getMonth() + 1, 1);
      startDate.setHours(0, 0, 0, 0);
      dateFormat = "%Y-%m";
    } else if (range === 'monthly') {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      dateFormat = "%Y-%m-%d";
    } else {
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      dateFormat = "%Y-%m-%d";
    }

    const visitsAggregation = await Visitor.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: dateFormat, date: "$createdAt" } }, visits: { $sum: 1 } } }
    ]);

    const appsAggregation = await JobApplication.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: dateFormat, date: "$createdAt" } }, applications: { $sum: 1 } } }
    ]);

    if (range === 'yearly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        const monthString = d.toISOString().substring(0, 7);
        const v = visitsAggregation.find(x => x._id === monthString);
        const a = appsAggregation.find(x => x._id === monthString);
        chartData.push({ name: months[d.getMonth()], visits: v ? v.visits : 0, applications: a ? a.applications : 0 });
      }
    } else if (range === 'monthly') {
      for (let i = 0; i < 4; i++) {
        chartData.push({ name: `Week ${i+1}`, visits: 0, applications: 0 });
      }
      visitsAggregation.forEach(v => {
        const diff = Math.floor((new Date() - new Date(v._id)) / (1000 * 60 * 60 * 24));
        const weekIdx = 3 - Math.floor(diff / 7.5);
        if (weekIdx >= 0 && weekIdx <= 3) chartData[weekIdx].visits += v.visits;
      });
      appsAggregation.forEach(a => {
        const diff = Math.floor((new Date() - new Date(a._id)) / (1000 * 60 * 60 * 24));
        const weekIdx = 3 - Math.floor(diff / 7.5);
        if (weekIdx >= 0 && weekIdx <= 3) chartData[weekIdx].applications += a.applications;
      });
    } else {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateString = d.toISOString().split('T')[0];
        const v = visitsAggregation.find(x => x._id === dateString);
        const a = appsAggregation.find(x => x._id === dateString);
        chartData.push({ name: days[d.getDay()], visits: v ? v.visits : 0, applications: a ? a.applications : 0 });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        counts: {
          visits: visitorCount,
          jobs: jobCount,
          applications: appCount,
          contacts: contactCount
        },
        recentActivity,
        chartData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
