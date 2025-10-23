const express = require('express');
const router = express.Router();

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Sample protected route
router.get('/sample', isAuthenticated, (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: req.user
  });
});

module.exports = router;
