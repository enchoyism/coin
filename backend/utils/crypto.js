const crypto = require('crypto');

// 환경변수에서 암호화 키 가져오기 (필수)
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY is required in environment variables.');
}

// 키를 32자로 맞춤: 짧으면 0으로 패딩, 길면 자르기
let key = process.env.ENCRYPTION_KEY;
if (key.length < 32) {
  key = key.padEnd(32, '0');
} else if (key.length > 32) {
  key = key.substring(0, 32);
}

const ENCRYPTION_KEY = key;
const ALGORITHM = 'aes-256-cbc';

/**
 * 문자열을 암호화합니다
 * @param {string} text - 암호화할 텍스트
 * @returns {string} - 암호화된 텍스트 (iv:encrypted 형식)
 */
function encrypt(text) {
  if (!text) return null;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // IV와 암호화된 데이터를 함께 저장
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * 암호화된 문자열을 복호화합니다
 * @param {string} text - 암호화된 텍스트 (iv:encrypted 형식)
 * @returns {string} - 복호화된 텍스트
 */
function decrypt(text) {
  if (!text) return null;

  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

module.exports = { encrypt, decrypt };
