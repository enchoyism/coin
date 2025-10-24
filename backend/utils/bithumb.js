const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');

const BITHUMB_API_URL = 'https://api.bithumb.com';

/**
 * Bithumb API 공통 인증 토큰 생성
 * @param {string} accessKey - API Access Key
 * @param {string} secretKey - API Secret Key
 * @param {string} query - Query string for hash (optional)
 * @returns {string} JWT Token
 */
function generateAuthToken(accessKey, secretKey, query = '') {
    const payload = {
        access_key: accessKey,
        nonce: uuidv4(),
        timestamp: Date.now()
    };

    if (query) {
        const alg = 'SHA512';
        const hash = crypto.createHash(alg);
        const queryHash = hash.update(query, 'utf-8').digest('hex');
        payload.query_hash = queryHash;
        payload.query_hash_alg = alg;
    }

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

/**
 * 주문 목록 조회
 * @param {string} accessKey - API Access Key
 * @param {string} secretKey - API Secret Key
 * @param {object} params - Query parameters (market, state, states, page, limit, order_by)
 * @returns {Promise} 주문 목록
 */
async function getOrders(accessKey, secretKey, params = {}) {
    try {
        let query = '';
        const queryParts = [];

        // Handle regular parameters
        for (const key in params) {
            if (key === 'states' && Array.isArray(params[key])) {
                // Handle states array specially
                params[key].forEach(state => {
                    queryParts.push(`states[]=${state}`);
                });
            } else if (params[key] !== undefined && params[key] !== null) {
                queryParts.push(`${key}=${encodeURIComponent(params[key])}`);
            }
        }

        query = queryParts.join('&');

        const jwtToken = generateAuthToken(accessKey, secretKey, query);
        const config = {
            headers: {
                Authorization: `Bearer ${jwtToken}`
            }
        };

        const response = await axios.get(`${BITHUMB_API_URL}/v1/orders?${query}`, config);
        return response.data;
    } catch (error) {
        throw error;
    }
}

/**
 * 개별 주문 조회
 * @param {string} accessKey - API Access Key
 * @param {string} secretKey - API Secret Key
 * @param {string} uuid - 주문 UUID
 * @returns {Promise} 주문 상세 정보
 */
async function getOrder(accessKey, secretKey, uuid) {
    try {
        const query = querystring.stringify({ uuid });
        const jwtToken = generateAuthToken(accessKey, secretKey, query);
        const config = {
            headers: {
                Authorization: `Bearer ${jwtToken}`
            }
        };

        const response = await axios.get(`${BITHUMB_API_URL}/v1/order?${query}`, config);
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
    getOrders,
    getOrder,
    generateAuthToken
}
