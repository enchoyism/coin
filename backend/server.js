require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001;

// MySQL 연결 설정
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASS || '',
  port: process.env.MYSQL_PORT || 3306,
  database: process.env.MYSQL_DATABASE || 'coin'
};

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
  async (accessToken, refreshToken, profile, done) => {
    let connection;
    try {
      const userEmail = profile.emails[0].value;

      // DB에서 사용자 확인
      connection = await mysql.createConnection(dbConfig);
      const [users] = await connection.query(
        'SELECT id, username, email, expire_at, is_admin FROM users WHERE email = ?',
        [userEmail]
      );

      // 사용자가 DB에 없으면 로그인 거부
      if (users.length === 0) {
        return done(null, false, { message: '등록되지 않은 사용자입니다.' });
      }

      const dbUser = users[0];

      // 만료일 체크
      if (dbUser.expire_at) {
        const expireDate = new Date(dbUser.expire_at);
        const now = new Date();
        if (expireDate < now) {
          return done(null, false, { message: '만료된 계정입니다.' });
        }
      }

      // 로그인 성공
      const user = {
        id: dbUser.id,
        displayName: dbUser.username,
        email: dbUser.email,
        photo: profile.photos[0].value,
        isAdmin: dbUser.is_admin === 'T',
        expireAt: dbUser.expire_at
      };

      return done(null, user);
    } catch (error) {
      console.error('Error in Google OAuth Strategy:', error);
      return done(error);
    } finally {
      if (connection) {
        await connection.end();
      }
    }
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
const initMysqlRoutes = require('./routes/init_mysql');

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Google OAuth Backend Server' });
});

// Use routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api', initMysqlRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
