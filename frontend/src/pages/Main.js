import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import './Main.css';

const Main = () => {
  const tradeRefresh = 5;
  const { user } = useAuth();
  const navigate = useNavigate();

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // API KEY  관리 상태
  const [apiKey, setApiKey] = useState('');
  const [apiSecretKey, setApiSecretKey] = useState('');
  const [isApiRegistered, setIsApiRegistered] = useState(false);
  const [isSecretRegistered, setIsSecretRegistered] = useState(false);
  const [isApiEnabled, setIsApiEnabled] = useState(false);
  const [isApiEditing, setIsApiEditing] = useState(false);
  const [isSecretEditing, setIsSecretEditing] = useState(false);
  const [bithumbExpireAt, setBithumbExpireAt] = useState(null);

  // 마켓 선택 상태
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [marketSearch, setMarketSearch] = useState('');
  const [marketList, setMarketList] = useState([]);
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);

  // SNS 연동 KEY  관리 상태
  const [snsKey, setSnsKey] = useState('');
  const [isSnsRegistered, setIsSnsRegistered] = useState(false);
  const [isSnsEnabled, setIsSnsEnabled] = useState(false);
  const [isSnsEditing, setIsSnsEditing] = useState(false);

  // TRADE 섹션 상태
  const [accounts, setAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [accountsError, setAccountsError] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(true);

  // 주문 내역 섹션 상태
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [isOrdersOpen, setIsOrdersOpen] = useState(true);
  const [orderFilter, setOrderFilter] = useState('all'); // 'all', 'wait', 'done', 'cancel'
  const [isFilterOpen, setIsFilterOpen] = useState(false); // 검색조건 접힌 상태 (default closed)
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(25); // 페이지당 개수
  const [selectedOrderUuid, setSelectedOrderUuid] = useState(null); // 선택된 주문 UUID
  const [orderDetail, setOrderDetail] = useState(null); // 주문 상세 정보
  const [isLoadingOrderDetail, setIsLoadingOrderDetail] = useState(false);

  // 아코디언 상태
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);

  // 컴포넌트 마운트 시 연동 정보 조회
  useEffect(() => {
    if (user?.email) {
      fetchConnectionData();
      fetchMarketList();
    }
  }, [user]);

  // 마켓 목록 조회
  const fetchMarketList = async () => {
    try {
      const response = await axios.get(
        'http://localhost:3001/api/markets',
        { withCredentials: true }
      );

      if (response.data.success) {
        setMarketList(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching market list:', error);
    }
  };

  // 마켓 검색 필터링
  const filteredMarkets = marketList.filter(market => {
    if (!marketSearch) return true;
    const searchLower = marketSearch.toLowerCase();
    return (
      market.market.toLowerCase().includes(searchLower) ||
      market.korean_name.toLowerCase().includes(searchLower) ||
      market.english_name.toLowerCase().includes(searchLower)
    );
  });

  // 마켓 선택 핸들러
  const handleMarketSelect = async (market) => {
    setSelectedMarket(market.market);
    setMarketSearch('');
    setIsMarketDropdownOpen(false);

    // 서버에 저장
    try {
      await axios.post(
        'http://localhost:3001/api/connections',
        {
          email: user.email,
          bithumb_market: market.market
        },
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Error saving market selection:', error);
      alert('마켓 선택 저장에 실패했습니다.');
    }
  };

  // 마켓 선택 해제
  const handleMarketClear = async () => {
    setSelectedMarket(null);

    try {
      await axios.post(
        'http://localhost:3001/api/connections',
        {
          email: user.email,
          bithumb_market: null
        },
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Error clearing market selection:', error);
      alert('마켓 선택 해제에 실패했습니다.');
    }
  };

  // 모든 키 등록 및 ON 상태 확인하여 아코디언 자동 접기
  useEffect(() => {
    const allRegistered = isApiRegistered && isSecretRegistered && isSnsRegistered;
    const allEnabled = isApiEnabled && isSnsEnabled;
    const marketSelected = selectedMarket !== null && selectedMarket !== '';

    if (allRegistered && allEnabled && marketSelected) {
      setIsAccordionOpen(false);
    } else {
      setIsAccordionOpen(true);
    }
  }, [isApiRegistered, isSecretRegistered, isSnsRegistered, isApiEnabled, isSnsEnabled, selectedMarket]);

  const fetchConnectionData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/connections/${user.email}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        const { c_bithumb, c_bithumb_secret, bithumb_mode, bithumb_market, bithumb_expire_at, c_telegram, telegram_mode } = response.data.data;

        // Bithumb API Key 설정
        if (c_bithumb) {
          setApiKey(c_bithumb);
          setIsApiRegistered(true);
          setIsApiEnabled(bithumb_mode === 'ON');
        }

        // Bithumb SECRET KEY 설정
        if (c_bithumb_secret) {
          setApiSecretKey(c_bithumb_secret);
          setIsSecretRegistered(true);
        }

        // Bithumb Market 설정
        if (bithumb_market) {
          setSelectedMarket(bithumb_market);
        }

        // Bithumb Expire At 설정
        if (bithumb_expire_at) {
          setBithumbExpireAt(bithumb_expire_at);
        }

        // Telegram 데이터 설정
        if (c_telegram) {
          setSnsKey(c_telegram);
          setIsSnsRegistered(true);
          setIsSnsEnabled(telegram_mode === 'ON');
        }

      }
    } catch (error) {
      console.error('Error fetching connection data:', error);
    }
  };

  // 마스킹 처리 함수 (첫 5글자만 보여주고 나머지는 *)
  const maskKey = (key) => {
    if (!key || key.length <= 5) return key;
    return key.substring(0, 5) + '*'.repeat(key.length - 5);
  };

  // 복사 함수
  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Copy failed:', error);
      alert('복사에 실패했습니다.');
    }
  };

  const toggleAccordion = () => {
    setIsAccordionOpen(!isAccordionOpen);
  };

  // API KEY 관리 함수
  const handleApiRegister = async () => {
    if (apiKey.trim()) {
      try {
        const response = await axios.post(
          'http://localhost:3001/api/connections',
          {
            email: user.email,
            c_bithumb: apiKey,
            bithumb_mode: 'OFF'
          },
          { withCredentials: true }
        );

        if (response.data.success) {
          setIsApiRegistered(true);
          setIsApiEditing(false);
        }
      } catch (error) {
        console.error('Error registering API key:', error);
        alert('API KEY 등록에 실패했습니다.');
      }
    }
  };

  const handleApiEdit = () => {
    setIsApiEditing(true);
    setApiKey('');
  };

  const handleApiCancel = () => {
    setIsApiEditing(false);
    setApiKey('');
    fetchConnectionData();
  };

  const handleApiUpdate = async () => {
    if (!apiKey.trim()) {
      alert('API KEY를 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:3001/api/connections',
        {
          email: user.email,
          c_bithumb: apiKey,
          bithumb_mode: isApiEnabled ? 'ON' : 'OFF'
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setIsApiEditing(false);
      }
    } catch (error) {
      console.error('Error updating API key:', error);
      alert('API KEY 수정에 실패했습니다.');
    }
  };

  const handleApiDelete = async () => {
    if (window.confirm('API KEY를 삭제하시겠습니까?')) {
      try {
        const response = await axios.post(
          'http://localhost:3001/api/connections',
          {
            email: user.email,
            c_bithumb: null,
            bithumb_mode: 'OFF'
          },
          { withCredentials: true }
        );

        if (response.data.success) {
          setApiKey('');
          setIsApiRegistered(false);
          setIsApiEnabled(false);
          setIsApiEditing(false);
        }
      } catch (error) {
        console.error('Error deleting API key:', error);
        alert('API KEY 삭제에 실패했습니다.');
      }
    }
  };

  // SECRET KEY 관리 함수
  const handleSecretRegister = async () => {
    if (apiSecretKey.trim()) {
      try {
        const response = await axios.post(
          'http://localhost:3001/api/connections',
          {
            email: user.email,
            c_bithumb_secret: apiSecretKey
          },
          { withCredentials: true }
        );

        if (response.data.success) {
          setIsSecretRegistered(true);
          setIsSecretEditing(false);
        }
      } catch (error) {
        console.error('Error registering SECRET KEY:', error);
        alert('SECRET KEY 등록에 실패했습니다.');
      }
    }
  };

  const handleSecretEdit = () => {
    setIsSecretEditing(true);
    setApiSecretKey('');
  };

  const handleSecretCancel = () => {
    setIsSecretEditing(false);
    setApiSecretKey('');
    fetchConnectionData();
  };

  const handleSecretUpdate = async () => {
    if (!apiSecretKey.trim()) {
      alert('SECRET KEY를 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:3001/api/connections',
        {
          email: user.email,
          c_bithumb_secret: apiSecretKey
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setIsSecretEditing(false);
      }
    } catch (error) {
      console.error('Error updating SECRET KEY:', error);
      alert('SECRET KEY 수정에 실패했습니다.');
    }
  };

  const handleSecretDelete = async () => {
    if (window.confirm('SECRET KEY를 삭제하시겠습니까?')) {
      try {
        const response = await axios.post(
          'http://localhost:3001/api/connections',
          {
            email: user.email,
            c_bithumb_secret: null
          },
          { withCredentials: true }
        );

        if (response.data.success) {
          setApiSecretKey('');
          setIsSecretRegistered(false);
          setIsSecretEditing(false);
        }
      } catch (error) {
        console.error('Error deleting SECRET KEY:', error);
        alert('SECRET KEY 삭제에 실패했습니다.');
      }
    }
  };

  const handleApiToggle = async () => {
    if (isApiRegistered) {
      const newMode = !isApiEnabled;
      try {
        const response = await axios.patch(
          `http://localhost:3001/api/connections/${user.email}/mode`,
          {
            type: 'bithumb',
            mode: newMode ? 'ON' : 'OFF'
          },
          { withCredentials: true }
        );

        if (response.data.success) {
          setIsApiEnabled(newMode);
        }
      } catch (error) {
        console.error('Error toggling API mode:', error);
        alert('연동 모드 변경에 실패했습니다.');
      }
    }
  };

  // SNS KEY  관리 함수
  const handleSnsRegister = async () => {
    if (snsKey.trim()) {
      try {
        const response = await axios.post(
          'http://localhost:3001/api/connections',
          {
            email: user.email,
            c_telegram: snsKey,
            telegram_mode: 'OFF'
          },
          { withCredentials: true }
        );

        if (response.data.success) {
          setIsSnsRegistered(true);
          setIsSnsEditing(false);
        }
      } catch (error) {
        console.error('Error registering SNS key:', error);
        alert('SNS KEY 등록에 실패했습니다.');
      }
    }
  };

  const handleSnsEdit = () => {
    setIsSnsEditing(true);
    setSnsKey(''); // 수정 모드 시작 시 입력창 비우기
  };

  const handleSnsCancel = () => {
    setIsSnsEditing(false);
    setSnsKey(''); // 취소 시 입력값 초기화
    fetchConnectionData(); // 원래 데이터 다시 불러오기
  };

  const handleSnsUpdate = async () => {
    if (!snsKey.trim()) {
      alert('SNS KEY를 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:3001/api/connections',
        {
          email: user.email,
          c_telegram: snsKey,
          telegram_mode: isSnsEnabled ? 'ON' : 'OFF'
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setIsSnsEditing(false);
      }
    } catch (error) {
      console.error('Error updating SNS key:', error);
      alert('SNS KEY 수정에 실패했습니다.');
    }
  };

  const handleSnsDelete = async () => {
    if (window.confirm('SNS KEY 을/를 삭제하시겠습니까?')) {
      try {
        const response = await axios.post(
          'http://localhost:3001/api/connections',
          {
            email: user.email,
            c_telegram: null,
            telegram_mode: 'OFF'
          },
          { withCredentials: true }
        );

        if (response.data.success) {
          setSnsKey('');
          setIsSnsRegistered(false);
          setIsSnsEnabled(false);
          setIsSnsEditing(false);
        }
      } catch (error) {
        console.error('Error deleting SNS key:', error);
        alert('SNS KEY 삭제에 실패했습니다.');
      }
    }
  };

  // Bithumb 테스트 함수
  const handleBithumbTest = async () => {
    try {
      const response = await axios.get(
        'http://localhost:3001/api/bithumb/api-keys',
        { withCredentials: true }
      );

      if (response.data.success) {
        setBithumbExpireAt(response.data.expire_at);
        alert('✅ 테스트 성공');
      }
    } catch (error) {
      console.error('Error testing bithumb:', error);
      const errorMsg = error.response?.data?.error || '테스트에 실패했습니다.';
      alert(`❌ 테스트 실패\n\n${errorMsg}`);
    }
  };

  // 텔레그램 테스트 함수
  const [isTesting, setIsTesting] = useState(false);
  const handleTelegramTest = async () => {
    setIsTesting(true);
    try {
      const response = await axios.post(
        'http://localhost:3001/api/telegram/test',
        {
          email: user.email
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        alert('✅ 테스트 성공');
      }
    } catch (error) {
      console.error('Error testing telegram:', error);
      const errorMsg = error.response?.data?.error || '테스트에 실패했습니다.';
      alert(`❌ 테스트 실패\n\n${errorMsg}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSnsToggle = async () => {
    if (isSnsRegistered) {
      const newMode = !isSnsEnabled;
      try {
        const response = await axios.patch(
          `http://localhost:3001/api/connections/${user.email}/mode`,
          {
            type: 'telegram',
            mode: newMode ? 'ON' : 'OFF'
          },
          { withCredentials: true }
        );

        if (response.data.success) {
          setIsSnsEnabled(newMode);
        }
      } catch (error) {
        console.error('Error toggling SNS mode:', error);
        alert('연동 모드 변경에 실패했습니다.');
      }
    }
  };

  // 계좌 정보 조회
  const fetchAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      setAccountsError(null);

      const response = await axios.get(
        'http://localhost:3001/api/bithumb/accounts',
        { withCredentials: true }
      );

      if (response.data.success) {
        setAccounts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccountsError(error.response?.data?.error || '계좌 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // 현재가 조회
  const fetchCurrentPrice = async () => {
    if (!selectedMarket) return;

    try {
      const response = await axios.get(
        `http://localhost:3001/api/bithumb/ticker?markets=${selectedMarket}`,
        { withCredentials: true }
      );

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        setCurrentPrice(response.data.data[0].trade_price);
      }
    } catch (error) {
      console.error('Error fetching ticker:', error);
    }
  };

  // 주문 내역 조회
  const fetchOrders = async () => {
    if (!selectedMarket) return;

    try {
      setIsLoadingOrders(true);
      setOrdersError(null);

      // Build query params with pagination
      let queryParams = `market=${selectedMarket}&limit=${ordersPerPage}&page=${currentPage}&order_by=desc`;

      // Add state filter if not 'all'
      if (orderFilter !== 'all') {
        queryParams += `&state=${orderFilter}`;
      } else {
        // For 'all', fetch wait, done, and cancel states
        const states = ['wait', 'done', 'cancel'];
        const statesQuery = states.map(state => `states=${state}`).join('&');
        queryParams += `&${statesQuery}`;
      }

      const response = await axios.get(
        `http://localhost:3001/api/bithumb/orders?${queryParams}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrdersError(error.response?.data?.error || '주문 내역을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Bithumb 연동 상태 확인
  const isBithumbReady = isApiRegistered && isSecretRegistered && isApiEnabled && selectedMarket;

  // 주문 상세 정보 가져오기
  const fetchOrderDetail = async (uuid) => {
    setIsLoadingOrderDetail(true);
    try {
      const response = await fetch(`http://localhost:3001/api/bithumb/order?uuid=${uuid}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('주문 상세 조회 실패');
      }

      const data = await response.json();
      if (data.success) {
        setOrderDetail(data.data);
      } else {
        throw new Error(data.error || '주문 상세 조회 실패');
      }
    } catch (error) {
      console.error('주문 상세 조회 오류:', error);
      setOrderDetail(null);
    } finally {
      setIsLoadingOrderDetail(false);
    }
  };

  // 주문 행 클릭 핸들러
  const handleOrderRowClick = (uuid) => {
    if (selectedOrderUuid === uuid) {
      // 같은 주문을 다시 클릭하면 닫기
      setSelectedOrderUuid(null);
      setOrderDetail(null);
    } else {
      // 새로운 주문 선택
      setSelectedOrderUuid(uuid);
      fetchOrderDetail(uuid);
    }
  };

  // orderFilter 변경 시 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [orderFilter]);

  // 페이징 다음 버튼 활성화 상태 (useMemo로 안정화)
  const hasNextPage = useMemo(() => {
    return orders.length >= ordersPerPage;
  }, [orders.length, ordersPerPage]);

  // 5초마다 계좌 정보, 현재가, 주문 내역 갱신
  useEffect(() => {
    let intervalSecId;
    let intervalMinId;

    if (isBithumbReady) {
      // 초기 로드
      fetchAccounts();
      fetchCurrentPrice();
      fetchOrders();

      // 5초마다 갱신
      intervalSecId = setInterval(() => {
        fetchAccounts();
        fetchCurrentPrice();
      }, tradeRefresh * 1000);
      intervalMinId = setInterval(() => {
        fetchOrders();
      }, tradeRefresh * 1000 * 60);
    } else {
      // 조건이 맞지 않으면 상태 초기화
      setAccounts([]);
      setAccountsError(null);
      setCurrentPrice(null);
      setOrders([]);
      setOrdersError(null);
    }

    return () => {
      if (intervalSecId) {
        clearInterval(intervalSecId);
      }
    };
  }, [isBithumbReady, selectedMarket, orderFilter, currentPage, ordersPerPage]);

  return (
    <div className="main-container">
      <Header />

      <div className="main-content">
        {/* 통합 KEY  관리 섹션 */}
        <div className="config-section">
          <div className="section-header" onClick={toggleAccordion}>
            <h3>
              연동 관리
              {bithumbExpireAt && (
                <span className="expire-at-text">
                  &nbsp;&nbsp;(Bithumb EXPIRE_AT: {formatDateTime(bithumbExpireAt)})
                </span>
              )}
            </h3>
            
            <button className="accordion-toggle-btn">
              {isAccordionOpen ? '−' : '+'}
            </button>
          </div>

          {isAccordionOpen && (
            <>
              <div className="section-divider"></div>
              <div className="config-body">
            {/* API */}
            <div className="key-item">
              <div className="key-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span className="key-label">Bithumb</span>
                  <button
                    className="guide-link-btn"
                    onClick={() => window.open('/guide#bithumb', '_blank')}
                    title="연동 가이드 보기"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </button>
                  {bithumbExpireAt && (
                    <span className="expire-at-text">
                      (EXPIRE_AT: {formatDateTime(bithumbExpireAt)})
                    </span>
                  )}
                </div>
                <div className="toggle-container">
                  <button
                    className={`toggle-btn ${isApiEnabled ? 'active' : ''} ${!isApiRegistered ? 'disabled' : ''}`}
                    onClick={handleApiToggle}
                    disabled={!isApiRegistered}
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>
              </div>

              {/* API KEY */}
              {!isApiRegistered ? (
                <div className="input-group">
                  <input
                    type="text"
                    className="key-input"
                    placeholder="API KEY 을/를 입력하세요"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <button className="icon-btn icon-btn-save" onClick={handleApiRegister} title="등록">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                  </button>
                </div>
              ) : isApiEditing ? (
                <div className="input-group">
                  <input
                    type="text"
                    className="key-input"
                    placeholder="새로운 API KEY 를 입력하세요"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <button className="icon-btn icon-btn-save" onClick={handleApiUpdate} title="저장">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </button>
                  <button className="icon-btn icon-btn-cancel" onClick={handleApiCancel} title="취소">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="input-group">
                  <div className="input-with-copy">
                    <input
                      type="text"
                      className="key-input"
                      placeholder="API KEY"
                      value={maskKey(apiKey)}
                      disabled
                    />
                    <button className="copy-icon-btn" onClick={() => handleCopy(apiKey, 'API KEY가')} title="복사">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                  <button className="icon-btn icon-btn-edit" onClick={handleApiEdit} title="수정">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button className="icon-btn icon-btn-delete" onClick={handleApiDelete} title="삭제">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              )}

              {/* SECRET KEY */}
              {!isSecretRegistered ? (
                <div className="input-group">
                  <input
                    type="text"
                    className="key-input"
                    placeholder="SECRET KEY 을/를 입력하세요"
                    value={apiSecretKey}
                    onChange={(e) => setApiSecretKey(e.target.value)}
                  />
                  <button className="icon-btn icon-btn-save" onClick={handleSecretRegister} title="등록">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                  </button>
                </div>
              ) : isSecretEditing ? (
                <div className="input-group">
                  <input
                    type="text"
                    className="key-input"
                    placeholder="새로운 SECRET KEY 를 입력하세요"
                    value={apiSecretKey}
                    onChange={(e) => setApiSecretKey(e.target.value)}
                  />
                  <button className="icon-btn icon-btn-save" onClick={handleSecretUpdate} title="저장">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </button>
                  <button className="icon-btn icon-btn-cancel" onClick={handleSecretCancel} title="취소">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="input-group">
                  <div className="input-with-copy">
                    <input
                      type="text"
                      className="key-input"
                      placeholder="SECRET KEY"
                      value={maskKey(apiSecretKey)}
                      disabled
                    />
                    <button className="copy-icon-btn" onClick={() => handleCopy(apiSecretKey, 'SECRET KEY가')} title="복사">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                  <button className="icon-btn icon-btn-edit" onClick={handleSecretEdit} title="수정">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button className="icon-btn icon-btn-delete" onClick={handleSecretDelete} title="삭제">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              )}

              {/* 마켓 선택 */}
              {isApiRegistered && isSecretRegistered && (
                <div className="market-select-container">
                  {selectedMarket ? (
                    <div className="selected-market-display">
                      <span className="selected-market-text">
                        {selectedMarket}
                        <span className="market-code"> {marketList.find(m => m.market === selectedMarket)?.korean_name} ({marketList.find(m => m.market === selectedMarket)?.english_name})</span>
                      </span>
                      <button
                        className="market-clear-btn"
                        onClick={handleMarketClear}
                        title="선택 해제"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="market-select-wrapper">
                      <input
                        type="text"
                        className="market-search-input"
                        placeholder="마켓 선택 (검색 예: BTC, 비트코인)"
                        value={marketSearch}
                        onChange={(e) => setMarketSearch(e.target.value)}
                        onFocus={() => setIsMarketDropdownOpen(true)}
                      />
                      {isMarketDropdownOpen && (
                        <>
                          <div
                            className="market-dropdown-overlay"
                            onClick={() => setIsMarketDropdownOpen(false)}
                          />
                          <div className="market-dropdown">
                            {filteredMarkets.length > 0 ? (
                              filteredMarkets.map(market => (
                                <div
                                  key={market.id}
                                  className="market-item"
                                  onClick={() => handleMarketSelect(market)}
                                >
                                  <span className="market-code-small">{market.market}</span>
                                  <span className="market-name">{market.korean_name} ({market.english_name})</span>
                                </div>
                              ))
                            ) : (
                              <div className="market-no-results">검색 결과가 없습니다.</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bithumb 테스트 버튼 */}
              {isApiRegistered && isSecretRegistered && (
                <div className="test-button-row">
                  <button className="btn-test" onClick={handleBithumbTest}>
                    TEST
                  </button>
                </div>
              )}
            </div>

            {/* SNS */}
            <div className="key-item">
              <div className="key-header">
                <span className="key-label">
                  Telegram
                  <button
                    className="guide-link-btn"
                    onClick={() => window.open('/guide#telegram', '_blank')}
                    title="연동 가이드 보기"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </button>
                </span>
                <div className="toggle-container">
                  <button
                    className={`toggle-btn ${isSnsEnabled ? 'active' : ''} ${!isSnsRegistered ? 'disabled' : ''}`}
                    onClick={handleSnsToggle}
                    disabled={!isSnsRegistered}
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>
              </div>

              {!isSnsRegistered ? (
                <div className="input-group">
                  <input
                    type="text"
                    className="key-input"
                    placeholder="SNS KEY 을/를 입력하세요"
                    value={snsKey}
                    onChange={(e) => setSnsKey(e.target.value)}
                  />
                  <button className="icon-btn icon-btn-save" onClick={handleSnsRegister} title="등록">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                  </button>
                </div>
              ) : isSnsEditing ? (
                <div className="input-group">
                  <input
                    type="text"
                    className="key-input"
                    placeholder="새로운 SNS KEY 를 입력하세요"
                    value={snsKey}
                    onChange={(e) => setSnsKey(e.target.value)}
                  />
                  <button className="icon-btn icon-btn-save" onClick={handleSnsUpdate} title="저장">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </button>
                  <button className="icon-btn icon-btn-cancel" onClick={handleSnsCancel} title="취소">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="input-group">
                  <div className="input-with-copy">
                    <input
                      type="text"
                      className="key-input"
                      placeholder="SNS KEY"
                      value={maskKey(snsKey)}
                      disabled
                    />
                    <button className="copy-icon-btn" onClick={() => handleCopy(snsKey, 'SNS KEY가')} title="복사">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                  <button className="icon-btn icon-btn-edit" onClick={handleSnsEdit} title="수정">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button className="icon-btn icon-btn-delete" onClick={handleSnsDelete} title="삭제">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              )}

              {/* Telegram 테스트 버튼 */}
              {isSnsRegistered && (
                <div className="test-button-row">
                  <button className="btn-test" onClick={handleTelegramTest} disabled={isTesting}>
                    TEST
                  </button>
                </div>
              )}
            </div>
            </div>
            </>
          )}
        </div>

        {/* TRADE 섹션 */}
        {isBithumbReady && (
          <div className="trade-section">
            <div className="section-header" onClick={() => setIsTradeOpen(!isTradeOpen)}>
              <h3>트레이드 {selectedMarket}</h3>
              <button className="accordion-toggle-btn">
                {isTradeOpen ? '−' : '+'}
              </button>
            </div>

            {isTradeOpen && (
              <>
                <div className="section-divider"></div>
                <div className="trade-body">
              {isLoadingAccounts && accounts.length === 0 ? (
                <div className="trade-loading">계좌 정보를 불러오는 중...</div>
              ) : accountsError ? (
                <div className="trade-error">
                  <span className="error-icon">⚠️</span>
                  <span>{accountsError}</span>
                </div>
              ) : accounts.length > 0 ? (
                <div className="assets-container">
                  <div className="assets-header" onClick={() => setIsAssetsOpen(!isAssetsOpen)}>
                    <div className="assets-header-left">
                      {(() => {
                        // 총 원화 환산 금액 계산 및 각 통화별 금액
                        const [baseCurrency, tradeCurrency] = selectedMarket ? selectedMarket.split('-') : ['KRW', null];
                        let totalKrwValue = 0;
                        let krwAmount = 0;
                        let cryptoKrwValue = 0;

                        accounts.forEach(account => {
                          if (account.currency === baseCurrency || account.currency === tradeCurrency) {
                            const balance = parseFloat(account.balance);
                            const locked = parseFloat(account.locked);
                            const total = balance + locked;

                            if (account.currency === baseCurrency) {
                              krwAmount = total;
                              totalKrwValue += total;
                            } else if (account.currency === tradeCurrency && currentPrice) {
                              cryptoKrwValue = total * currentPrice;
                              totalKrwValue += cryptoKrwValue;
                            }
                          }
                        });

                        return (
                          <>
                            <span className="assets-label">현재자산(원):</span>
                            <span className="total-amount">{Math.floor(totalKrwValue).toLocaleString()}</span>
                            <span className="amount-detail">
                              ({Math.floor(krwAmount).toLocaleString()} KRW + {Math.floor(cryptoKrwValue).toLocaleString()} KRW-{tradeCurrency})
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    <div className="assets-header-right">
                      <span className="refresh-indicator">refresh {tradeRefresh} sec ●</span>
                      <button className="toggle-assets-btn">
                        {isAssetsOpen ? '−' : '+'}
                      </button>
                    </div>
                  </div>
                  {isAssetsOpen && (
                    <div className="assets-list">
                      {(() => {
                      // 선택된 마켓에서 기준 통화와 거래 통화 추출 (예: KRW-ETH -> KRW, ETH)
                      const [baseCurrency, tradeCurrency] = selectedMarket ? selectedMarket.split('-') : ['KRW', null];

                      // 필터링: 기준 통화와 거래 통화만 표시
                      const filteredAccounts = accounts.filter(account =>
                        account.currency === baseCurrency || account.currency === tradeCurrency
                      );

                      // 정렬: 기준 통화(KRW) 먼저, 거래 통화(ETH 등) 나중
                      const sortedAccounts = filteredAccounts.sort((a, b) => {
                        if (a.currency === baseCurrency) return -1;
                        if (b.currency === baseCurrency) return 1;
                        return 0;
                      });

                      return sortedAccounts.map((account) => {
                        const balance = parseFloat(account.balance);
                        const locked = parseFloat(account.locked);
                        const total = balance + locked;

                        // 원화 환산
                        let krwValue = null;
                        if (account.currency !== baseCurrency && currentPrice) {
                          krwValue = total * currentPrice;
                        } else if (account.currency === baseCurrency) {
                          krwValue = total;
                        }

                        return (
                          <div key={account.currency} className="asset-item">
                            <div className="asset-info">
                              <span className="asset-currency">{account.currency}</span>
                            </div>
                            <div className="asset-amounts">
                              <div className="amount-row">
                                <span className="amount-label">보유잔고:</span>
                                <span className="amount-value">{total}</span>
                              </div>
                              {account.avg_buy_price && parseFloat(account.avg_buy_price) > 0 && (
                                <div className="amount-row avg-price">
                                  <span className="amount-label">평균매수가:</span>
                                  <span className="amount-value">{parseFloat(account.avg_buy_price).toLocaleString()}</span>
                                </div>
                              )}
                              {krwValue !== null && (
                                <div className="amount-row krw-value">
                                  <span className="amount-label">평가금액(원):</span>
                                  <span className="amount-value">{Math.floor(krwValue).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="trade-empty">보유 중인 자산이 없습니다.</div>
              )}

                  {/* 주문 내역 */}
                  <div className="orders-container">
                    <div className="orders-header">
                      <div className="orders-header-left" onClick={() => setIsOrdersOpen(!isOrdersOpen)}>
                        <span className="orders-label">주문내역</span>
                      </div>
                      <div className="orders-header-right">
                        <span className="refresh-indicator">refresh {tradeRefresh} min ●</span>
                        <button
                          className="filter-icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFilterOpen(!isFilterOpen);
                          }}
                          title="필터"
                        >
                          ⚙
                        </button>
                        <button className="toggle-orders-btn" onClick={() => setIsOrdersOpen(!isOrdersOpen)}>
                          {isOrdersOpen ? '−' : '+'}
                        </button>
                      </div>
                    </div>
                    {isOrdersOpen && (
                      <>
                        {isFilterOpen && (
                          <div className="order-filter-section">
                            <div className="filter-group">
                              <span className="filter-group-label">상태:</span>
                              <label className="filter-radio">
                                <input
                                  type="radio"
                                  name="orderFilter"
                                  value="all"
                                  checked={orderFilter === 'all'}
                                  onChange={(e) => setOrderFilter(e.target.value)}
                                />
                                <span>전체</span>
                              </label>
                              <label className="filter-radio">
                                <input
                                  type="radio"
                                  name="orderFilter"
                                  value="wait"
                                  checked={orderFilter === 'wait'}
                                  onChange={(e) => setOrderFilter(e.target.value)}
                                />
                                <span>대기</span>
                              </label>
                              <label className="filter-radio">
                                <input
                                  type="radio"
                                  name="orderFilter"
                                  value="done"
                                  checked={orderFilter === 'done'}
                                  onChange={(e) => setOrderFilter(e.target.value)}
                                />
                                <span>완료</span>
                              </label>
                              <label className="filter-radio">
                                <input
                                  type="radio"
                                  name="orderFilter"
                                  value="cancel"
                                  checked={orderFilter === 'cancel'}
                                  onChange={(e) => setOrderFilter(e.target.value)}
                                />
                                <span>취소</span>
                              </label>
                            </div>
                            <div className="filter-divider"></div>
                            <div className="filter-group">
                              <span className="filter-group-label">개수:</span>
                              <select
                                className="limit-select"
                                value={ordersPerPage}
                                onChange={(e) => {
                                  setOrdersPerPage(Number(e.target.value));
                                  setCurrentPage(1);
                                }}
                              >
                                <option value="1">1</option>
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                              </select>
                            </div>
                          </div>
                        )}
                        <div className="orders-with-pagination">
                          <div className="orders-list-container">
                            {isLoadingOrders && orders.length === 0 ? (
                              <div className="orders-loading">주문 내역을 불러오는 중...</div>
                            ) : ordersError ? (
                              <div className="orders-error">
                                <span className="error-icon">⚠️</span>
                                <span>{ordersError}</span>
                              </div>
                            ) : orders.length > 0 ? (
                              <table className="orders-table">
                                <thead>
                                  <tr>
                                    <th>매매</th>
                                    <th>구분</th>
                                    <th>상태</th>
                                    <th>주문가격</th>
                                    <th>주문수량</th>
                                    <th>체결수량</th>
                                    <th>미체결수량</th>
                                    <th>주문시간</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {orders.map((order) => (
                                    <tr
                                      key={order.uuid}
                                      className="order-row"
                                      onClick={() => handleOrderRowClick(order.uuid)}
                                    >
                                      <td>
                                        <span className={`order-type ${order.order_type === 'AI' ? 'ai' : 'user'}`}>
                                          {order.order_type || 'USER'}
                                        </span>
                                      </td>
                                      <td>
                                        <span className={`order-side ${order.side}`}>
                                          {order.side === 'bid' ? '매수' : '매도'}
                                        </span>
                                      </td>
                                      <td>
                                        <span className={`order-state ${order.state}`}>
                                          {order.state === 'wait' ? '대기' : order.state === 'done' ? '완료' : '취소'}
                                        </span>
                                      </td>
                                      <td className="order-price">{parseFloat(order.price).toLocaleString()}</td>
                                      <td className="order-volume">{order.volume}</td>
                                      <td className="order-executed">{order.executed_volume}</td>
                                      <td className="order-remaining">{order.remaining_volume}</td>
                                      <td className="order-time">{formatDateTime(order.created_at)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="orders-empty">주문 내역이 없습니다.</div>
                            )}
                          </div>
                          {!isLoadingOrders && !ordersError && (
                            <div className="pagination">
                              <button
                                className="pagination-btn"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                              >
                                이전
                              </button>
                              <span className="pagination-info">
                                {currentPage} 페이지
                              </span>
                              <button
                                className="pagination-btn"
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={!hasNextPage}
                              >
                                다음
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 주문 상세 모달 */}
      {selectedOrderUuid && (
        <div className="order-modal-overlay" onClick={() => {
          setSelectedOrderUuid(null);
          setOrderDetail(null);
        }}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <h3>주문 상세 정보</h3>
              <button
                className="order-modal-close"
                onClick={() => {
                  setSelectedOrderUuid(null);
                  setOrderDetail(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="order-modal-body">
              {isLoadingOrderDetail ? (
                <div className="order-detail-loading">상세 정보를 불러오는 중...</div>
              ) : orderDetail ? (
                <div className="order-detail-content">
                  {orderDetail.trade_log_desc && (
                    <div className="order-detail-section" style={{marginBottom: '20px'}}>
                      <h4>AI 트레이드 로그</h4>
                      <div className="trade-log-desc">
                        {orderDetail.trade_log_desc}
                      </div>
                    </div>
                  )}
                  <div className="order-detail-section">
                    <h4>주문 정보</h4>
                    <div className="order-detail-grid">
                      <div className="detail-item detail-item-full">
                        <span className="detail-label">주문 ID:</span>
                        <span className="detail-value">{orderDetail.uuid}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">마켓:</span>
                        <span className="detail-value">{orderDetail.market}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">매매유형:</span>
                        <span className="detail-value">
                          <span className={`order-type ${orderDetail.order_type === 'AI' ? 'ai' : 'user'}`}>
                            {orderDetail.order_type || 'USER'}
                          </span>
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">주문 구분:</span>
                        <span className="detail-value">
                          <span className={`order-side ${orderDetail.side}`}>
                            {orderDetail.side === 'bid' ? '매수' : '매도'}
                          </span>
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">주문 유형:</span>
                        <span className="detail-value">{orderDetail.ord_type === 'limit' ? '지정가' : '시장가'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">상태:</span>
                        <span className="detail-value">
                          <span className={`order-state ${orderDetail.state}`}>
                            {orderDetail.state === 'wait' ? '대기' : orderDetail.state === 'done' ? '완료' : '취소'}
                          </span>
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">주문시간:</span>
                        <span className="detail-value">{formatDateTime(orderDetail.created_at)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">주문가격:</span>
                        <span className="detail-value">{parseFloat(orderDetail.price).toLocaleString()} KRW</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">주문수량:</span>
                        <span className="detail-value">{orderDetail.volume}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">체결수량:</span>
                        <span className="detail-value">{orderDetail.executed_volume}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">미체결수량:</span>
                        <span className="detail-value">{orderDetail.remaining_volume}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">사용 수수료:</span>
                        <span className="detail-value">{parseFloat(orderDetail.paid_fee || 0).toLocaleString()} KRW</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">예약 수수료:</span>
                        <span className="detail-value">{parseFloat(orderDetail.reserved_fee || 0).toLocaleString()} KRW</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">남은 수수료:</span>
                        <span className="detail-value">{parseFloat(orderDetail.remaining_fee || 0).toLocaleString()} KRW</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">거래 사용중:</span>
                        <span className="detail-value">{parseFloat(orderDetail.locked || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {orderDetail.trades && orderDetail.trades.length > 0 && (
                    <div className="order-detail-section" style={{marginTop: '20px'}}>
                      <h4>체결 내역 ({orderDetail.trades_count}건)</h4>
                      <div className="trades-list">
                        {orderDetail.trades.map((trade, index) => (
                          <div key={trade.uuid} className="trade-item">
                            <div className="trade-header">
                              <span className="trade-number">#{index + 1}</span>
                              <span className="trade-time">{formatDateTime(trade.created_at)}</span>
                            </div>
                            <div className="trade-details">
                              <div className="trade-detail-row">
                                <span className="trade-label">체결 ID:</span>
                                <span className="trade-value">{trade.uuid}</span>
                              </div>
                              <div className="trade-detail-row">
                                <span className="trade-label">체결 가격:</span>
                                <span className="trade-value">{parseFloat(trade.price).toLocaleString()} KRW</span>
                              </div>
                              <div className="trade-detail-row">
                                <span className="trade-label">체결 수량:</span>
                                <span className="trade-value">{trade.volume}</span>
                              </div>
                              <div className="trade-detail-row">
                                <span className="trade-label">체결 금액:</span>
                                <span className="trade-value">{parseFloat(trade.funds).toLocaleString()} KRW</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="order-detail-error">상세 정보를 불러올 수 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Main;
