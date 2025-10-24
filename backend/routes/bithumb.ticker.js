const express = require('express');
const router = express.Router();
const { getTicker } = require('../utils/bithumb');

/**
 * GET /api/bithumb/ticker
 * 마켓의 현재가 정보 조회 (인증 불필요)
 * Query params:
 * - markets: 마켓 코드 (예: KRW-BTC)
 */
router.get('/ticker', async (req, res) => {
  try {
    const { markets } = req.query;

    if (!markets) {
      return res.status(400).json({
        success: false,
        error: 'markets parameter is required'
      });
    }

    // Bithumb API 호출
    const ticker = await getTicker(markets);

    res.json({
      success: true,
      data: ticker
    });

  } catch (error) {
    console.error('Error fetching ticker:', error);

    let errorMessage = '현재가 정보 조회에 실패했습니다.';

    if (error.response) {
      if (error.response.data?.error) {
        errorMessage = error.response.data.error.message || errorMessage;
      }
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
});

module.exports = router;
