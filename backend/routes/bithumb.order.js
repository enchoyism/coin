const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();
const { getOrder } = require('../utils/bithumb');
const { decrypt } = require('../utils/crypto');
const config = require('../utils/config');

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

/**
 * GET /api/bithumb/order
 * 개별 주문 조회
 */
router.get('/order', isAuthenticated, async (req, res) => {
  let connection;

  try {
    const { uuid } = req.query;
    const email = req.user.email;

    if (!uuid) {
      return res.status(400).json({
        success: false,
        error: '주문 UUID가 필요합니다.'
      });
    }

    connection = await mysql.createConnection(config.dbConfig);

    // 사용자의 Bithumb API 키 조회
    const [connections] = await connection.query(
      'SELECT c_bithumb, c_bithumb_secret, bithumb_mode FROM connection WHERE email = ?',
      [email]
    );

    if (connections.length === 0 || !connections[0].c_bithumb || !connections[0].c_bithumb_secret) {
      return res.status(400).json({
        success: false,
        error: 'Bithumb API 키가 등록되지 않았습니다.'
      });
    }

    if (connections[0].bithumb_mode !== 'ON') {
      return res.status(400).json({
        success: false,
        error: 'Bithumb 연동이 비활성화되어 있습니다.'
      });
    }

    // 키 복호화
    const accessKey = decrypt(connections[0].c_bithumb);
    const secretKey = decrypt(connections[0].c_bithumb_secret);

    // Bithumb API 호출
    const order = await getOrder(accessKey, secretKey, uuid);

    // trade_log에서 해당 uuid의 desc 가져오기
    const [tradeLogs] = await connection.query(
      'SELECT * FROM trade_log WHERE uuid = ? LIMIT 1',
      [uuid]
    );

    const orderWithTradeLog = {
      ...order,
      order_type: tradeLogs.length > 0 ? 'AI' : 'USER',
      trade_log_desc: tradeLogs.length > 0 ? tradeLogs[0].desc : null
    };

    res.json({
      success: true,
      data: orderWithTradeLog
    });
  } catch (error) {
    console.error('주문 조회 오류:', error);

    let errorMessage = '주문 조회에 실패했습니다.';

    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'API 키가 올바르지 않습니다.';
      } else if (error.response.data?.error) {
        errorMessage = error.response.data.error.message || errorMessage;
      }
    }

    res.status(error.response?.status || 500).json({
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
