const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();
const { getOrders } = require('../utils/bithumb');
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
 * GET /api/bithumb/orders
 * 주문 목록 조회
 */
router.get('/orders', isAuthenticated, async (req, res) => {
  let connection;

  try {
    const { market, state, states, page, limit, order_by } = req.query;
    const email = req.user.email;

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

    // Query parameters 구성
    const params = {};
    if (market) params.market = market;
    if (state) params.state = state;
    if (states) params.states = states;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (order_by) params.order_by = order_by;

    // Bithumb API 호출
    const orders = await getOrders(accessKey, secretKey, params);

    // 각 주문에 대해 trade_log 확인하여 AI/USER 구분 추가
    const ordersWithType = await Promise.all(orders.map(async (order) => {
      const [tradeLogs] = await connection.query(
        'SELECT COUNT(*) as count FROM trade_log WHERE uuid = ?',
        [order.uuid]
      );

      return {
        ...order,
        order_type: tradeLogs[0].count > 0 ? 'AI' : 'USER'
      };
    }));

    res.json({
      success: true,
      data: ordersWithType
    });
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);

    let errorMessage = '주문 목록 조회에 실패했습니다.';

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
