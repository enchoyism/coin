const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { decrypt } = require('../utils/crypto');

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASS || '',
  port: process.env.MYSQL_PORT || 3306,
  database: process.env.MYSQL_DATABASE || 'coin'
};

router.get('/api-keys', async (req, res) => {
  let connection;
  try {
    const userEmail = req.user.email;

    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT c_bithumb, c_bithumb_secret FROM connection WHERE email = ?', [userEmail]);

    if (rows.length === 0 || !rows[0].c_bithumb || !rows[0].c_bithumb_secret) {
      return res.status(400).json({ error: 'API Key or Secret Key not registered' });
    }

    const accessKey = decrypt(rows[0].c_bithumb);
    const secretKey = decrypt(rows[0].c_bithumb_secret);

    const payload = {
      access_key: accessKey,
      nonce: uuidv4(),
      timestamp: Date.now()
    };
    const jwtToken = jwt.sign(payload, secretKey);

    const response = await axios.get('https://api.bithumb.com/v1/api_keys', {
      headers: {
        Authorization: `Bearer ${jwtToken}`
      }
    });

    if (response.data.error) {
      return res.status(400).json({ error: response.data.error });
    }

    const apiKeys = response.data;
    let matchedKey = null;

    for (const key of apiKeys) {
      if (key.access_key === accessKey) {
        matchedKey = key;
        await connection.query(
          'UPDATE connection SET bithumb_expire_at = ? WHERE email = ?',
          [key.expire_at, userEmail]
        );
        break;
      }
    }

    res.json({
      success: true,
      expire_at: matchedKey ? matchedKey.expire_at : null
    });

  } catch (error) {
    console.error('Bithumb API Error:', error.message);

    if (error.response) {
      return res.status(statusCode).json({ error: errorMessage });
    }

    res.status(500).json({ error: 'Server error occurred' });
  } finally {
    if (connection) await connection.end();
  }
});

module.exports = router;
