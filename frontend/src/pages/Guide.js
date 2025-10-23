import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import './Guide.css';

const Guide = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('bithumb');

  useEffect(() => {
    if (location.hash === '#telegram') {
      setActiveSection('telegram');
    } else {
      setActiveSection('bithumb');
    }
  }, [location.hash]);

  return (
    <div className="guide-container">
      <Header />

      <div className="guide-content">
        {/* 네비게이션 탭 */}
        <div className="guide-nav">
          <button
            className={`guide-nav-btn ${activeSection === 'bithumb' ? 'active' : ''}`}
            onClick={() => setActiveSection('bithumb')}
          >
            Bithumb
          </button>

          <button
            className={`guide-nav-btn ${activeSection === 'telegram' ? 'active' : ''}`}
            onClick={() => setActiveSection('telegram')}
          >
            Telegram
          </button>
        </div>

        {/* Bithumb 연동 가이드 */}
        {activeSection === 'bithumb' && (
          <div className="guide-section">
            <div className="guide-card">
              <div className="guide-steps">
                <div className="guide-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3>Bithumb 로그인</h3>
                    <p><a href="https://www.bithumb.com" target="_blank" rel="noopener noreferrer">Bithumb 웹사이트</a>에 로그인합니다.</p>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>API 관리 페이지 접속</h3>
                    <p>마이페이지 → API 관리 메뉴로 이동합니다.</p>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3>API Key 발급</h3>
                    <p>새 API Key를 생성하고 필요한 권한을 설정합니다.</p>
                    <div className="info-box warning">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      <p><strong>보안:</strong> API Key와 Secret은 안전하게 보관하세요!</p>
                    </div>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h3>Dashboard에 등록</h3>
                    <p>발급받은 API Key를 Dashboard에 입력하고 저장합니다.</p>
                    <div className="info-box success">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      <p><strong>완료!</strong> Bithumb API 연동이 완료되었습니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Telegram 연동 가이드 */}
        {activeSection === 'telegram' && (
          <div className="guide-section">
            <div className="guide-card">
              <div className="guide-steps">
                {/* Step 1 */}
                <div className="guide-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3>BotFather와 대화 시작</h3>
                    <p>Telegram 앱에서 <strong>@BotFather</strong>를 검색하여 대화를 시작합니다.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="guide-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>새로운 Bot 생성</h3>
                    <p>BotFather에게 다음 명령어를 전송합니다:</p>
                    <div className="code-block">
                      <code>/newbot</code>
                    </div>
                    <p>Bot의 이름과 사용자명을 입력합니다.</p>
                    <p>사용자명은 반드시 <strong>bot</strong>으로 끝나야 합니다.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="guide-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3>Bot Token 받기</h3>
                    <p>Bot 생성이 완료되면 BotFather가 API Token을 제공합니다.</p>
                    <div className="code-block highlight">
                      <div className="code-label">예시 Token:</div>
                      <code>123456789:ABCdefGHIjklMNOpqrsTUVwxyz</code>
                    </div>
                    <div className="info-box warning">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      <p><strong>주의:</strong> 이 Token은 절대 공유하지 마세요!</p>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="guide-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h3>Bot과 대화 시작</h3>
                    <p>Telegram에서 생성한 Bot을 검색하여 대화를 시작합니다.</p>
                    <p>Bot에게 <strong>아무 메시지나</strong> 보내서 대화를 활성화합니다.</p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="guide-step">
                  <div className="step-number">5</div>
                  <div className="step-content">
                    <h3>Chat ID 확인</h3>
                    <p>다음 URL을 브라우저에서 열어 Chat ID를 확인합니다:</p>
                    <div className="code-block">
                      <code>https://api.telegram.org/bot[YOUR_BOT_TOKEN]/getUpdates</code>
                    </div>
                    <p><code>[YOUR_BOT_TOKEN]</code> 부분을 실제 Bot Token으로 교체하세요.</p>
                    <div className="info-box warning">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      <p>만약 <code>{'{"ok":true,"result":[]}'}</code> 처럼 빈 결과가 나온다면, Bot에게 메시지를 보낸 후 다시 시도하세요.</p>
                    </div>
                    <p>응답에서 <strong>chat.id</strong> 값을 찾습니다:</p>
                    <div className="code-block">
                      <div className="code-label">응답 예시:</div>
                      <code>{'{"ok":true,"result":[{"message":{"from":{"id":1234567890},"chat":{"id":1234567890,"first_name":"username","type":"private"}}}]}'}</code>
                    </div>
                    <p>위 예시에서 <strong>"chat":{'{"id":1234567890}'}</strong> 부분의 숫자가 Chat ID입니다.</p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="guide-step">
                  <div className="step-number">6</div>
                  <div className="step-content">
                    <h3>Dashboard에 등록</h3>
                    <p>Dashboard의 Telegram 섹션에 다음 형식으로 입력합니다:</p>
                    <div className="code-block highlight">
                      <div className="code-label">입력 형식:</div>
                      <code>[BOT_TOKEN]:[CHAT_ID]</code>
                    </div>
                    <div className="info-box success">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      <p><strong>완료!</strong> 이제 Telegram으로 알림을 받을 수 있습니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        
      </div>
    </div>
  );
};

export default Guide;
