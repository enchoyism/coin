const { bithumbAPI } = require("./bithumb");

module.exports = {
    dbConfig: {
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASS || '',
        port: process.env.MYSQL_PORT || 3306,
        database: process.env.MYSQL_DATABASE || 'coin'
    },
    bithumbMarkets: [
        {
            "market": "KRW-BTC",
            "korean_name": "비트코인",
            "english_name": "Bitcoin"
        },
        {
            "market": "KRW-BCH",
            "korean_name": "비트코인 캐시",
            "english_name": "Bitcoin Cash"
        },
        {
            "market": "KRW-ETH",
            "korean_name": "이더리움",
            "english_name": "Ethereum"
        },
        {
            "market": "KRW-ETC",
            "korean_name": "이더리움 클래식",
            "english_name": "Ethereum Classic"
        },
        {
            "market": "KRW-XRP",
            "korean_name": "엑스알피 [리플]",
            "english_name": "XRP"
        },
        {
            "market": "KRW-TRX",
            "korean_name": "트론",
            "english_name": "TRON"
        },
        {
            "market": "KRW-SOL",
            "korean_name": "솔라나",
            "english_name": "Solana"
        },
        {
            "market": "KRW-USDT",
            "korean_name": "테더",
            "english_name": "Tether USDt"
        },
        {
            "market": "KRW-USDC",
            "korean_name": "유에스디코인",
            "english_name": "USD Coin"
        },
        {
            "market": "KRW-DOGE",
            "korean_name": "도지코인",
            "english_name": "Dogecoin"
        },
        {
            "market": "KRW-SUI",
            "korean_name": "수이",
            "english_name": "SUI"
        },
        {
            "market": "KRW-LINK",
            "korean_name": "체인링크",
            "english_name": "ChainLink"
        },
        {
            "market": "KRW-FIL",
            "korean_name": "파일코인",
            "english_name": "Filecoin"
        },
        {
            "market": "KRW-TON",
            "korean_name": "톤코인",
            "english_name": "Toncoin"
        },
        {
            "market": "KRW-DOT",
            "korean_name": "폴카닷",
            "english_name": "Polkadot"
        },
        {
            "market": "KRW-UNI",
            "korean_name": "유니스왑",
            "english_name": "Uniswap"
        },
        {
            "market": "KRW-AVAX",
            "korean_name": "아발란체",
            "english_name": "Avalanche"
        },
        {
            "market": "KRW-ONDO",
            "korean_name": "온도 파이낸스",
            "english_name": "Ondo Finance"
        },
        {
            "market": "KRW-ALGO",
            "korean_name": "알고랜드",
            "english_name": "Algorand"
        },
        {
            "market": "KRW-PENDLE",
            "korean_name": "펜들",
            "english_name": "Pendle"
        },
        {
            "market": "KRW-POLYX",
            "korean_name": "폴리매쉬",
            "english_name": "Polymesh"
        },
        {
            "market": "KRW-CTC",
            "korean_name": "크레딧코인",
            "english_name": "Creditcoin"
        },
        {
            "market": "KRW-ADA",
            "korean_name": "에이다",
            "english_name": "Cardano"
        },
        {
            "market": "KRW-BNB",
            "korean_name": "비앤비",
            "english_name": "BNB"
        },
    ]
};
