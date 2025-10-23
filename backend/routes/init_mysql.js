const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

const router = express.Router();

async function initializeDatabase() {
  let connection;

  // 응답 객체 초기화
  const response = {
    success: false,
    message: '',
    data: {
      database: null,
      tables: []
    },
    errors: []
  };

  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
      user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_PASS || process.env.DB_PASSWORD || '',
      port: process.env.MYSQL_PORT || process.env.DB_PORT || 3306
    });

    console.log('Connected to MySQL server');

    await connection.query(`
      CREATE DATABASE IF NOT EXISTS coin
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci
    `);
    console.log('Database "coin" created or already exists');
    response.data.database = 'coin';

    await connection.query('USE coin');

    // 1. users 테이블 생성 - 사용자 정보 관리
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL COMMENT '사용자명',
        email VARCHAR(100) NOT NULL UNIQUE COMMENT '이메일 (고유값)',
        expire_at DATETIME NULL DEFAULT NULL COMMENT '만료일시',
        is_admin CHAR(1) NOT NULL DEFAULT 'F' COMMENT '관리자 여부 (T/F)',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
        UNIQUE KEY unique_email (email)
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
        COMMENT='사용자 정보 테이블'
    `);

    console.log('Table "users" created or already exists');
    response.data.tables.push({ name: 'users', description: '사용자 정보 테이블' });

    // 기본 관리자 계정 삽입 (이미 존재하면 무시)
    await connection.query(`
      INSERT INTO users (username, email, expire_at, is_admin)
      SELECT * FROM (SELECT 'yicho' as username, 'joyikr@gmail.com' as email, '2199-12-12' as expire_at, 'T' as is_admin) as tmp
      WHERE NOT EXISTS (
        SELECT email FROM users WHERE email = 'joyikr@gmail.com'
      ) LIMIT 1
    `);
    console.log('Default admin user checked/inserted');
    
    await connection.query(`
        CREATE TABLE IF NOT EXISTS connection (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100) NOT NULL UNIQUE COMMENT '이메일 (고유값)',
            c_bithumb VARCHAR(500) NULL,
            bithumb_mode VARCHAR(10) NOT NULL DEFAULT 'OFF' COMMENT 'ON/OFF',
            c_telegram VARCHAR(500) NULL,
            telegram_mode VARCHAR(10) NOT NULL DEFAULT 'OFF' COMMENT 'ON/OFF',
            UNIQUE KEY unique_email (email)
        ) ENGINE=InnoDB
          DEFAULT CHARSET=utf8mb4
          COLLATE=utf8mb4_unicode_ci
    `);

    // 성공 응답 설정
    response.success = true;
    response.message = '데이터베이스 초기화가 성공적으로 완료되었습니다.';

  } catch (error) {
    // 에러 발생 시 처리
    console.error('Error initializing database:', error);
    response.success = false;
    response.message = '데이터베이스 초기화 중 오류가 발생했습니다.';
    response.errors.push({
      type: 'DatabaseError',
      message: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    // 연결 종료
    if (connection) {
      await connection.end();
      console.log('Connection closed');
    }
  }

  return response;
}

if (require.main === module) {
  initializeDatabase()
    .then((response) => {
      console.log('\n=== 초기화 결과 ===');
      console.log(JSON.stringify(response, null, 2));
    })
    .catch((error) => {
      console.error('\n=== 초기화 실패 ===');
      console.error(error);
    });
}

/**
 * 데이터베이스 초기화 핸들러 함수
 */
const initMysqlHandler = async (req, res) => {
  try {
    const result = await initializeDatabase();
    res.status(200).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('Database initialization failed:', error);
    res.status(500).json({
      success: false,
      message: '데이터베이스 초기화 중 오류가 발생했습니다.',
      errors: [{
        type: 'DatabaseError',
        message: error.message
      }]
    });
  }
};

/**
 * GET /api/init-mysql
 * 브라우저에서 직접 접속 가능한 데이터베이스 초기화 엔드포인트
 */
router.get('/init-mysql', initMysqlHandler);

module.exports = router;
module.exports.initializeDatabase = initializeDatabase;
