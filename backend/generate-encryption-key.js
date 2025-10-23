#!/usr/bin/env node

/**
 * ENCRYPTION_KEY 생성 스크립트
 *
 * 사용법:
 *   node generate-encryption-key.js
 *
 * 생성된 키를 .env 파일의 ENCRYPTION_KEY에 설정하세요.
 */

const crypto = require('crypto');

// 32바이트 랜덤 키 생성
const key = crypto.randomBytes(32).toString('hex').slice(0, 32);

console.log('='.repeat(60));
console.log('Generated ENCRYPTION_KEY (32 characters):');
console.log('='.repeat(60));
console.log(key);
console.log('='.repeat(60));
console.log('\nAdd this to your .env file:');
console.log(`ENCRYPTION_KEY=${key}`);
console.log('='.repeat(60));
