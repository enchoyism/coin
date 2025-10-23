import { useState } from 'react';
import Header from '../components/Header';
import './Dashboard.css';

const Dashboard = () => {

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

  const toggleAccordion = () => {
    setIsAccordionOpen(!isAccordionOpen);
  };

  // API KEY  관리 함수
  const handleApiRegister = () => {
    if (apiKey.trim()) {
      setIsApiRegistered(true);
      setIsApiEditing(false);
      // 둘 다 등록되면 접기
      if (isSnsRegistered) {
        setIsAccordionOpen(false);
      }
      alert('API KEY 가 등록되었습니다.');
    }
  };

  const handleApiEdit = () => {
    setIsApiEditing(true);
  };

  const handleApiUpdate = () => {
    if (apiKey.trim()) {
      setIsApiEditing(false);
      alert('API KEY 가 수정되었습니다.');
    }
  };

  const handleApiDelete = () => {
    if (window.confirm('API KEY 을/를 삭제하시겠습니까?')) {
      setApiKey('');
      setIsApiRegistered(false);
      setIsApiEnabled(false);
      setIsApiEditing(false);
      setIsAccordionOpen(true); // 삭제하면 펼치기
      alert('API KEY 가 삭제되었습니다.');
    }
  };

  const handleApiToggle = () => {
    if (isApiRegistered) {
      setIsApiEnabled(!isApiEnabled);
    }
  };

  // SNS KEY  관리 함수
  const handleSnsRegister = () => {
    if (snsKey.trim()) {
      setIsSnsRegistered(true);
      setIsSnsEditing(false);
      // 둘 다 등록되면 접기
      if (isApiRegistered) {
        setIsAccordionOpen(false);
      }
      alert('SNS KEY 가 등록되었습니다.');
    }
  };

  const handleSnsEdit = () => {
    setIsSnsEditing(true);
  };

  const handleSnsUpdate = () => {
    if (snsKey.trim()) {
      setIsSnsEditing(false);
      alert('SNS KEY 가 수정되었습니다.');
    }
  };

  const handleSnsDelete = () => {
    if (window.confirm('SNS KEY 을/를 삭제하시겠습니까?')) {
      setSnsKey('');
      setIsSnsRegistered(false);
      setIsSnsEnabled(false);
      setIsSnsEditing(false);
      setIsAccordionOpen(true); // 삭제하면 펼치기
      alert('SNS KEY 가 삭제되었습니다.');
    }
  };

  const handleSnsToggle = () => {
    if (isSnsRegistered) {
      setIsSnsEnabled(!isSnsEnabled);
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
                  <button className="btn btn-primary" onClick={handleApiRegister}>
                    등록
                  </button>
                </div>
              ) : (
                <div className="input-group">
                  <input
                    type="text"
                    className="key-input"
                    placeholder="API KEY "
                    value={isApiEditing ? apiKey : '••••••••••••••••'}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={!isApiEditing}
                  />
                  {isApiEditing ? (
                    <button className="btn btn-primary" onClick={handleApiUpdate}>
                      저장
                    </button>
                  ) : (
                    <button className="btn btn-secondary" onClick={handleApiEdit}>
                      수정
                    </button>
                  )}
                  <button className="btn btn-danger" onClick={handleApiDelete}>
                    삭제
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
                  <button className="btn btn-primary" onClick={handleSnsRegister}>
                    등록
                  </button>
                </div>
              ) : (
                <div className="input-group">
                  <input
                    type="text"
                    className="key-input"
                    placeholder="SNS KEY "
                    value={isSnsEditing ? snsKey : '••••••••••••••••'}
                    onChange={(e) => setSnsKey(e.target.value)}
                    disabled={!isSnsEditing}
                  />
                  {isSnsEditing ? (
                    <button className="btn btn-primary" onClick={handleSnsUpdate}>
                      저장
                    </button>
                  ) : (
                    <button className="btn btn-secondary" onClick={handleSnsEdit}>
                      수정
                    </button>
                  )}
                  <button className="btn btn-danger" onClick={handleSnsDelete}>
                    삭제
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
