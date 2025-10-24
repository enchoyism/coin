const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const BITHUMB_API_URL = 'https://api.bithumb.com';

/**
 * Bithumb API 공통 인증 토큰 생성
 * @param {string} accessKey - API Access Key
 * @param {string} secretKey - API Secret Key
 * @returns {string} JWT Token
 */
function generateAuthToken(accessKey, secretKey) {
    const payload = {
        access_key: accessKey,
        nonce: uuidv4(),
        timestamp: Date.now()
    };
    return jwt.sign(payload, secretKey);
}

/**
 * 전체 계좌 조회
 * @param {string} accessKey - API Access Key
 * @param {string} secretKey - API Secret Key
 * @returns {Promise} 계좌 정보
 */
async function getAccounts(accessKey, secretKey) {
    try {
        const jwtToken = generateAuthToken(accessKey, secretKey);
        const config = {
            headers: {
                Authorization: `Bearer ${jwtToken}`
            }
        };

        const response = await axios.get(`${BITHUMB_API_URL}/v1/accounts`, config);
        return response.data;
    } catch (error) {
        throw error;
    }
}

/**
 * 현재가 정보 조회
 * @param {string} markets - 마켓 코드 (예: KRW-BTC)
 * @returns {Promise} 현재가 정보
 */
async function getTicker(markets) {
    try {
        const config = {
            headers: {
                accept: 'application/json'
            },
            params: {
                markets
            }
        };

        const response = await axios.get(`${BITHUMB_API_URL}/v1/ticker`, config);
        return response.data;
    } catch (error) {
        throw error;
    }
}

function bithumbAPI() {

}

module.exports = {
    bithumbAPI,
    getAccounts,
    getTicker,
    generateAuthToken
}
