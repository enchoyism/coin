import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Header from '../components/Header';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  // API KEY  관리 상태
  const [apiKey, setApiKey] = useState('');
  const [isApiRegistered, setIsApiRegistered] = useState(false);
  const [isApiEnabled, setIsApiEnabled] = useState(false);
  const [isApiEditing, setIsApiEditing] = useState(false);

  // SNS 연동 KEY  관리 상태
  const [snsKey, setSnsKey] = useState('');
  const [isSnsRegistered, setIsSnsRegistered] = useState(false);
  const [isSnsEnabled, setIsSnsEnabled] = useState(false);
  const [isSnsEditing, setIsSnsEditing] = useState(false);

  // 아코디언 상태 - 둘 다 등록되어 있으면 접힌 상태, 아니면 펼쳐진 상태
  const [isAccordionOpen, setIsAccordionOpen] = useState(
    !(isApiRegistered && isSnsRegistered)
  );

  // 컴포넌트 마운트 시 연동 정보 조회
  useEffect(() => {
    if (user?.email) {
      fetchConnectionData();
    }
  }, [user]);

  const fetchConnectionData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/connections/${user.email}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        const { c_bithumb, bithumb_mode, c_telegram, telegram_mode } = response.data.data;

        // Bithumb 데이터 설정
        if (c_bithumb) {
          setApiKey(c_bithumb);
          setIsApiRegistered(true);
          setIsApiEnabled(bithumb_mode === 'ON');
        }

        // Telegram 데이터 설정
        if (c_telegram) {
          setSnsKey(c_telegram);
          setIsSnsRegistered(true);
          setIsSnsEnabled(telegram_mode === 'ON');
        }

        // 둘 다 등록되어 있으면 아코디언 접기
        if (c_bithumb && c_telegram) {
          setIsAccordionOpen(false);
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
      alert(`${type} 복사되었습니다.`);
    } catch (error) {
      console.error('Copy failed:', error);
      alert('복사에 실패했습니다.');
    }
  };

  const toggleAccordion = () => {
    setIsAccordionOpen(!isAccordionOpen);
  };

  // API KEY  관리 함수
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
          // 둘 다 등록되면 접기
          if (isSnsRegistered) {
            setIsAccordionOpen(false);
          }
          alert('API KEY 가 등록되었습니다.');
        }
      } catch (error) {
        console.error('Error registering API key:', error);
        alert('API KEY 등록에 실패했습니다.');
      }
    }
  };

  const handleApiEdit = () => {
    setIsApiEditing(true);
    setApiKey(''); // 수정 모드 시작 시 입력창 비우기
  };

  const handleApiCancel = () => {
    setIsApiEditing(false);
    setApiKey(''); // 취소 시 입력값 초기화
    fetchConnectionData(); // 원래 데이터 다시 불러오기
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
        alert('API KEY 가 수정되었습니다.');
      }
    } catch (error) {
      console.error('Error updating API key:', error);
      alert('API KEY 수정에 실패했습니다.');
    }
  };

  const handleApiDelete = async () => {
    if (window.confirm('API KEY 을/를 삭제하시겠습니까?')) {
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
          setIsAccordionOpen(true); // 삭제하면 펼치기
          alert('API KEY 가 삭제되었습니다.');
        }
      } catch (error) {
        console.error('Error deleting API key:', error);
        alert('API KEY 삭제에 실패했습니다.');
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
          // 둘 다 등록되면 접기
          if (isApiRegistered) {
            setIsAccordionOpen(false);
          }
          alert('SNS KEY 가 등록되었습니다.');
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
        alert('SNS KEY 가 수정되었습니다.');
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
          setIsAccordionOpen(true); // 삭제하면 펼치기
          alert('SNS KEY 가 삭제되었습니다.');
        }
      } catch (error) {
        console.error('Error deleting SNS key:', error);
        alert('SNS KEY 삭제에 실패했습니다.');
      }
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

  return (
    <div className="dashboard-container">
      <Header />

      <div className="dashboard-content">
        {/* 통합 KEY  관리 섹션 */}
        <div className="config-section">
          <div className="section-header" onClick={toggleAccordion}>
            <h3>연동 관리</h3>
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
                <span className="key-label">Bithumb</span>
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </button>
                  <button className="icon-btn icon-btn-cancel" onClick={handleApiCancel} title="취소">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button className="icon-btn icon-btn-delete" onClick={handleApiDelete} title="삭제">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* SNS */}
            <div className="key-item">
              <div className="key-header">
                <span className="key-label">Telegram</span>
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </button>
                  <button className="icon-btn icon-btn-cancel" onClick={handleSnsCancel} title="취소">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button className="icon-btn icon-btn-delete" onClick={handleSnsDelete} title="삭제">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              )}
            </div>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
