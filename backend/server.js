require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true if using https
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`
  },
  (accessToken, refreshToken, profile, done) => {
    // Here you would typically save user to database
    // For this example, we'll just pass the profile
    const userEmail = profile.emails[0].value;
    const adminEmails = process.env.ADMIN ? process.env.ADMIN.split(',').map(email => email.trim()) : [];

    const user = {
      id: profile.id,
      displayName: profile.displayName,
      email: userEmail,
      photo: profile.photos[0].value,
      isAdmin: adminEmails.includes(userEmail)
    };
    return done(null, user);
  }
));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Import routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Google OAuth Backend Server' });
});

// Use routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
