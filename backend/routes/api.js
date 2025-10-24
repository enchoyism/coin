const express = require('express');
const mysql = require('mysql2/promise');
const axios = require('axios');
const router = express.Router();
const { encrypt, decrypt } = require('../utils/crypto');
const config = require('../utils/config');

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

    connection = await mysql.createConnection(config.dbConfig);

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

    connection = await mysql.createConnection(config.dbConfig);

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

    connection = await mysql.createConnection(config.dbConfig);

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

    connection = await mysql.createConnection(config.dbConfig);

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

    connection = await mysql.createConnection(config.dbConfig);

    const [connections] = await connection.query(
      'SELECT * FROM connection WHERE email = ?',
      [email]
    );

    if (connections.length === 0) {
      // 연동 정보가 없으면 기본값 반환
      return res.json({
        success: true,
        data: {
          email,
          c_bithumb: null,
          c_bithumb_secret: null,
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
        c_bithumb_secret: conn.c_bithumb_secret ? decrypt(conn.c_bithumb_secret) : null,
        bithumb_mode: conn.bithumb_mode,
        bithumb_market: conn.bithumb_market,
        bithumb_expire_at: conn.bithumb_expire_at,
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
 * GET /api/markets
 * 마켓 목록 조회
 * Query params:
 * - search: 검색어 (마켓 코드, 한글명, 영어명)
 */
router.get('/markets', isAuthenticated, async (req, res) => {
  let connection;

  try {
    const search = req.query.search || '';

    connection = await mysql.createConnection(config.dbConfig);

    let query = 'SELECT * FROM market';
    const params = [];

    if (search) {
      query += ' WHERE market LIKE ? OR korean_name LIKE ? OR english_name LIKE ?';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY market ASC';

    const [markets] = await connection.query(query, params);

    res.json({
      success: true,
      data: markets
    });

  } catch (error) {
    console.error('Error fetching markets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch markets',
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
 * Body: { email, c_bithumb?, c_bithumb_secret?, bithumb_mode?, bithumb_market?, c_telegram?, telegram_mode? }
 */
router.post('/connections', isAuthenticated, async (req, res) => {
  let connection;

  try {
    const { email, c_bithumb, c_bithumb_secret, bithumb_mode, bithumb_market, c_telegram, telegram_mode } = req.body;

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

    connection = await mysql.createConnection(config.dbConfig);

    // 기존 데이터 조회
    const [existing] = await connection.query(
      'SELECT * FROM connection WHERE email = ?',
      [email]
    );

    // 데이터 암호화 - 요청에 포함된 경우만 처리
    let finalBithumb, finalBithumbSecret, finalBithumbMode, finalBithumbMarket, finalTelegram, finalTelegramMode;

    if (existing.length > 0) {
      // UPDATE: 요청에 포함된 필드만 업데이트
      finalBithumb = c_bithumb !== undefined ? (c_bithumb ? encrypt(c_bithumb) : null) : existing[0].c_bithumb;
      finalBithumbSecret = c_bithumb_secret !== undefined ? (c_bithumb_secret ? encrypt(c_bithumb_secret) : null) : existing[0].c_bithumb_secret;
      finalBithumbMode = bithumb_mode !== undefined ? bithumb_mode : existing[0].bithumb_mode;
      finalBithumbMarket = bithumb_market !== undefined ? bithumb_market : existing[0].bithumb_market;
      finalTelegram = c_telegram !== undefined ? (c_telegram ? encrypt(c_telegram) : null) : existing[0].c_telegram;
      finalTelegramMode = telegram_mode !== undefined ? telegram_mode : existing[0].telegram_mode;
    } else {
      // INSERT: 새로 생성
      finalBithumb = c_bithumb ? encrypt(c_bithumb) : null;
      finalBithumbSecret = c_bithumb_secret ? encrypt(c_bithumb_secret) : null;
      finalBithumbMode = bithumb_mode || 'OFF';
      finalBithumbMarket = bithumb_market || null;
      finalTelegram = c_telegram ? encrypt(c_telegram) : null;
      finalTelegramMode = telegram_mode || 'OFF';
    }

    // INSERT ... ON DUPLICATE KEY UPDATE
    await connection.query(`
      INSERT INTO connection (email, c_bithumb, c_bithumb_secret, bithumb_mode, bithumb_market, c_telegram, telegram_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        c_bithumb = VALUES(c_bithumb),
        c_bithumb_secret = VALUES(c_bithumb_secret),
        bithumb_mode = VALUES(bithumb_mode),
        bithumb_market = VALUES(bithumb_market),
        c_telegram = VALUES(c_telegram),
        telegram_mode = VALUES(telegram_mode)
    `, [
      email,
      finalBithumb,
      finalBithumbSecret,
      finalBithumbMode,
      finalBithumbMarket,
      finalTelegram,
      finalTelegramMode
    ]);

    // 업데이트된 정보 조회 및 복호화
    const [connections] = await connection.query(
      'SELECT * FROM connection WHERE email = ?',
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
        c_bithumb_secret: conn.c_bithumb_secret ? decrypt(conn.c_bithumb_secret) : null,
        bithumb_mode: conn.bithumb_mode,
        bithumb_market: conn.bithumb_market,
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

    connection = await mysql.createConnection(config.dbConfig);

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
      'SELECT * FROM connection WHERE email = ?',
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

/**
 * POST /api/telegram/test
 * 텔레그램 연동 테스트
 * Body: { telegram_key: 'bot_token:chat_id' }
 */
router.post('/telegram/test', isAuthenticated, async (req, res) => {
  try {
    const { telegram_key } = req.body;

    if (!telegram_key) {
      return res.status(400).json({
        success: false,
        error: 'telegram_key is required'
      });
    }

    // telegram_key 파싱 (bot_token:chat_id 형식)
    const parts = telegram_key.split(':');
    if (parts.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid telegram key format. Expected: bot_token:chat_id'
      });
    }

    // bot_token은 첫 두 부분, chat_id는 마지막 부분
    const chatId = parts[parts.length - 1];
    const botToken = parts.slice(0, -1).join(':');

    // Telegram API로 테스트 메시지 전송
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await axios.post(telegramApiUrl, {
      chat_id: chatId,
      text: '✅ 텔레그램 연동 테스트 성공!\n정상적으로 연결되었습니다.'
    });

    if (response.data.ok) {
      res.json({
        success: true,
        message: '테스트 메시지가 성공적으로 전송되었습니다.'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to send test message',
        details: response.data
      });
    }

  } catch (error) {
    console.error('Error testing telegram:', error);

    let errorMessage = '텔레그램 연동 테스트 실패';

    if (error.response) {
      // Telegram API 에러
      if (error.response.status === 401) {
        errorMessage = 'Bot Token이 올바르지 않습니다.';
      } else if (error.response.status === 400) {
        errorMessage = 'Chat ID가 올바르지 않거나 Bot과 대화를 시작하지 않았습니다.';
      } else {
        errorMessage = error.response.data?.description || errorMessage;
      }
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = '네트워크 연결을 확인해주세요.';
    }

    res.status(400).json({
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
});

/**
 * POST /api/telegram/test
 * Telegram 메시지 전송 테스트 (email로 조회)
 */
router.post('/telegram/test', isAuthenticated, async (req, res) => {
  let connection;

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    connection = await mysql.createConnection(config.dbConfig);

    // 연동 정보 조회
    const [connections] = await connection.query(
      'SELECT * FROM connection WHERE email = ?',
      [email]
    );

    if (connections.length === 0 || !connections[0].c_telegram) {
      return res.status(400).json({
        success: false,
        error: 'Telegram KEY를 등록해주세요.'
      });
    }

    const telegram_key = decrypt(connections[0].c_telegram);
    const [botToken, chatId] = telegram_key.split(':');

    if (!botToken || !chatId) {
      return res.status(400).json({
        success: false,
        error: 'Telegram KEY 형식이 올바르지 않습니다. (형식: botToken:chatId)'
      });
    }

    // Telegram API로 테스트 메시지 전송
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await axios.post(telegramUrl, {
      chat_id: chatId,
      text: '✅ 텔레그램 연동 테스트 메시지입니다.'
    });

    if (response.data.ok) {
      res.json({
        success: true,
        message: '테스트 메시지가 전송되었습니다.'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Telegram API 응답 오류'
      });
    }

  } catch (error) {
    console.error('Telegram test error:', error);

    let errorMessage = '테스트 메시지 전송에 실패했습니다.';

    if (error.response) {
      if (error.response.status === 404) {
        errorMessage = 'Bot Token이 올바르지 않습니다.';
      } else if (error.response.status === 400) {
        errorMessage = 'Chat ID가 올바르지 않습니다.';
      }
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = '네트워크 연결을 확인해주세요.';
    }

    res.status(400).json({
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

module.exports = router;
