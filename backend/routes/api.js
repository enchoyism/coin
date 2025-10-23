const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();
const { encrypt, decrypt } = require('../utils/crypto');

// MySQL 연결 설정
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASS || '',
  port: process.env.MYSQL_PORT || 3306,
  database: process.env.MYSQL_DATABASE || 'coin'
};

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Middleware to check admin
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ error: 'Forbidden - Admin access required' });
};

/**
 * GET /api/users
 * 사용자 목록 조회 (페이징, 검색 지원)
 * Query params:
 * - page: 페이지 번호 (기본: 1)
 * - limit: 페이지당 항목 수 (기본: 15)
 * - search: 검색어 (username 또는 email)
 * - onlyExpired: 만료된 사용자만 조회 (true/false)
 */
router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
  let connection;

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search || '';
    const onlyExpired = req.query.onlyExpired === 'true';
    const offset = (page - 1) * limit;

    connection = await mysql.createConnection(dbConfig);

    // 검색 조건
    let whereConditions = [];
    let queryParams = [];

    if (search) {
      whereConditions.push('(username LIKE ? OR email LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    if (onlyExpired) {
      whereConditions.push('(expire_at IS NOT NULL AND expire_at < NOW())');
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // 전체 개수 조회
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );
    const totalCount = countResult[0].total;

    // 만료된 사용자 수 조회
    const [expiredCountResult] = await connection.query(
      'SELECT COUNT(*) as total FROM users WHERE expire_at IS NOT NULL AND expire_at < NOW()'
    );
    const expiredCount = expiredCountResult[0].total;

    // 페이지 데이터 조회
    const [users] = await connection.query(`
      SELECT *
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          expiredCount,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * PATCH /api/users/:id/expire
 * 사용자 만료일 수정
 * Body: { expire_at: 'YYYY-MM-DD HH:MM:SS' }
 */
router.patch('/users/:id/expire', isAuthenticated, isAdmin, async (req, res) => {
  let connection;

  try {
    const userId = parseInt(req.params.id);
    const { expire_at } = req.body;

    if (!expire_at) {
      return res.status(400).json({
        success: false,
        error: 'expire_at is required'
      });
    }

    connection = await mysql.createConnection(dbConfig);

    // 사용자 존재 확인
    const [users] = await connection.query(
      'SELECT id, username, email FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // 만료일 업데이트
    await connection.query(
      'UPDATE users SET expire_at = ?, updated_at = NOW() WHERE id = ?',
      [expire_at, userId]
    );

    // 업데이트된 정보 조회
    const [updatedUsers] = await connection.query(
      'SELECT id, username, email, expire_at, is_admin, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: '사용자 만료일이 업데이트되었습니다.',
      data: updatedUsers[0]
    });

  } catch (error) {
    console.error('Error updating user expire date:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user expire date',
      message: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * GET /api/users/check-email?email=xxx
 * 이메일 중복 체크
 */
router.get('/users/check-email', isAuthenticated, isAdmin, async (req, res) => {
  let connection;

  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'email is required'
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({
        success: true,
        available: false,
        message: '유효하지 않은 이메일 형식입니다.'
      });
    }

    connection = await mysql.createConnection(dbConfig);

    const [users] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    res.json({
      success: true,
      available: users.length === 0,
      message: users.length === 0 ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.'
    });

  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check email',
      message: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * POST /api/users
 * 사용자 등록
 * Body: { username, email, expire_at }
 */
router.post('/users', isAuthenticated, isAdmin, async (req, res) => {
  let connection;

  try {
    const { username, email, expire_at } = req.body;

    // 필수 필드 검증
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        error: 'username and email are required'
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    connection = await mysql.createConnection(dbConfig);

    // 이메일 중복 체크
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // 사용자 등록
    const [result] = await connection.query(
      'INSERT INTO users (username, email, expire_at, is_admin) VALUES (?, ?, ?, ?)',
      [username, email, expire_at || null, 'F']
    );

    // 등록된 사용자 정보 조회
    const [newUsers] = await connection.query(
      'SELECT id, username, email, expire_at, is_admin, created_at, updated_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.json({
      success: true,
      message: '사용자가 등록되었습니다.',
      data: newUsers[0]
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * GET /api/connections/:email
 * 특정 사용자의 연동 정보 조회
 */
router.get('/connections/:email', isAuthenticated, async (req, res) => {
  let connection;

  try {
    const { email } = req.params;

    // 자신의 정보이거나 관리자만 조회 가능
    if (req.user.email !== email && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden'
      });
    }

    connection = await mysql.createConnection(dbConfig);

    const [connections] = await connection.query(
      'SELECT id, email, c_bithumb, bithumb_mode, c_telegram, telegram_mode FROM connection WHERE email = ?',
      [email]
    );

    if (connections.length === 0) {
      // 연동 정보가 없으면 기본값 반환
      return res.json({
        success: true,
        data: {
          email,
          c_bithumb: null,
          bithumb_mode: 'OFF',
          c_telegram: null,
          telegram_mode: 'OFF'
        }
      });
    }

    // 암호화된 데이터 복호화
    const conn = connections[0];
    res.json({
      success: true,
      data: {
        id: conn.id,
        email: conn.email,
        c_bithumb: conn.c_bithumb ? decrypt(conn.c_bithumb) : null,
        bithumb_mode: conn.bithumb_mode,
        c_telegram: conn.c_telegram ? decrypt(conn.c_telegram) : null,
        telegram_mode: conn.telegram_mode
      }
    });

  } catch (error) {
    console.error('Error fetching connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch connection',
      message: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * POST /api/connections
 * 연동 정보 생성 또는 업데이트
 * Body: { email, c_bithumb?, bithumb_mode?, c_telegram?, telegram_mode? }
 */
router.post('/connections', isAuthenticated, async (req, res) => {
  let connection;

  try {
    const { email, c_bithumb, bithumb_mode, c_telegram, telegram_mode } = req.body;

    // 자신의 정보이거나 관리자만 수정 가능
    if (req.user.email !== email && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'email is required'
      });
    }

    connection = await mysql.createConnection(dbConfig);

    // 데이터 암호화
    const encryptedBithumb = c_bithumb ? encrypt(c_bithumb) : null;
    const encryptedTelegram = c_telegram ? encrypt(c_telegram) : null;

    // INSERT ... ON DUPLICATE KEY UPDATE
    await connection.query(`
      INSERT INTO connection (email, c_bithumb, bithumb_mode, c_telegram, telegram_mode)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        c_bithumb = VALUES(c_bithumb),
        bithumb_mode = VALUES(bithumb_mode),
        c_telegram = VALUES(c_telegram),
        telegram_mode = VALUES(telegram_mode)
    `, [
      email,
      encryptedBithumb,
      bithumb_mode || 'OFF',
      encryptedTelegram,
      telegram_mode || 'OFF'
    ]);

    // 업데이트된 정보 조회 및 복호화
    const [connections] = await connection.query(
      'SELECT id, email, c_bithumb, bithumb_mode, c_telegram, telegram_mode FROM connection WHERE email = ?',
      [email]
    );

    const conn = connections[0];
    res.json({
      success: true,
      message: '연동 정보가 저장되었습니다.',
      data: {
        id: conn.id,
        email: conn.email,
        c_bithumb: conn.c_bithumb ? decrypt(conn.c_bithumb) : null,
        bithumb_mode: conn.bithumb_mode,
        c_telegram: conn.c_telegram ? decrypt(conn.c_telegram) : null,
        telegram_mode: conn.telegram_mode
      }
    });

  } catch (error) {
    console.error('Error saving connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save connection',
      message: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

/**
 * PATCH /api/connections/:email/mode
 * 연동 모드 변경 (ON/OFF 토글)
 * Body: { type: 'bithumb' | 'telegram', mode: 'ON' | 'OFF' }
 */
router.patch('/connections/:email/mode', isAuthenticated, async (req, res) => {
  let connection;

  try {
    const { email } = req.params;
    const { type, mode } = req.body;

    // 자신의 정보이거나 관리자만 수정 가능
    if (req.user.email !== email && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden'
      });
    }

    if (!type || !mode) {
      return res.status(400).json({
        success: false,
        error: 'type and mode are required'
      });
    }

    if (!['bithumb', 'telegram'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type'
      });
    }

    if (!['ON', 'OFF'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode'
      });
    }

    connection = await mysql.createConnection(dbConfig);

    const field = type === 'bithumb' ? 'bithumb_mode' : 'telegram_mode';

    // 먼저 레코드가 있는지 확인
    const [existing] = await connection.query(
      'SELECT id FROM connection WHERE email = ?',
      [email]
    );

    if (existing.length === 0) {
      // 레코드가 없으면 생성
      await connection.query(`
        INSERT INTO connection (email, ${field})
        VALUES (?, ?)
      `, [email, mode]);
    } else {
      // 레코드가 있으면 업데이트
      await connection.query(`
        UPDATE connection SET ${field} = ? WHERE email = ?
      `, [mode, email]);
    }

    // 업데이트된 정보 조회 및 복호화
    const [connections] = await connection.query(
      'SELECT id, email, c_bithumb, bithumb_mode, c_telegram, telegram_mode FROM connection WHERE email = ?',
      [email]
    );

    const conn = connections[0];
    res.json({
      success: true,
      message: '연동 모드가 변경되었습니다.',
      data: {
        id: conn.id,
        email: conn.email,
        c_bithumb: conn.c_bithumb ? decrypt(conn.c_bithumb) : null,
        bithumb_mode: conn.bithumb_mode,
        c_telegram: conn.c_telegram ? decrypt(conn.c_telegram) : null,
        telegram_mode: conn.telegram_mode
      }
    });

  } catch (error) {
    console.error('Error updating connection mode:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update connection mode',
      message: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

module.exports = router;
