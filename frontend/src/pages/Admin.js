import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import './Admin.css';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 15
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [newExpireDate, setNewExpireDate] = useState('');
  const [isUserSectionOpen, setIsUserSectionOpen] = useState(false);
  const [onlyExpired, setOnlyExpired] = useState(false);

  // 사용자 등록 폼
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    expire_at: ''
  });
  const [emailCheck, setEmailCheck] = useState({
    checking: false,
    available: null,
    message: ''
  });

  // 사용자 목록 조회
  const fetchUsers = async (page = 1, searchQuery = search, expiredOnly = onlyExpired) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15'
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (expiredOnly) {
        params.append('onlyExpired', 'true');
      }

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/api/users?${params}`,
        {
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      setError(err.message || '사용자 목록을 불러올 수 없습니다.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // 만료일 수정
  const updateExpireDate = async (userId) => {
    if (!newExpireDate) {
      alert('만료일을 입력해주세요.');
      return;
    }

    try {
      // YYYY-MM-DD 형식을 YYYY-MM-DD 23:59:59 형식으로 변환 (타임존 문제 방지)
      const expireDateTime = `${newExpireDate} 23:59:59`;

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/api/users/${userId}/expire`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ expire_at: expireDateTime })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update expire date');
      }

      const data = await response.json();

      if (data.success) {
        alert('만료일이 업데이트되었습니다.');
        setEditingUserId(null);
        setNewExpireDate('');
        fetchUsers(pagination.currentPage);
      }
    } catch (err) {
      alert(err.message || '만료일 업데이트에 실패했습니다.');
      console.error('Error updating expire date:', err);
    }
  };

  // 검색 실행
  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, search, onlyExpired);
  };

  // 만료 여부 체크
  const isExpired = (expireAt) => {
    if (!expireAt) return false;
    return new Date(expireAt) < new Date();
  };

  // 페이지 변경
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchUsers(page);
    }
  };

  // 만료일 편집 시작
  const startEdit = (user) => {
    setEditingUserId(user.id);
    // 기존 만료일을 date 포맷으로 변환 (YYYY-MM-DD)
    if (user.expire_at) {
      const date = new Date(user.expire_at);
      const formattedDate = date.toISOString().split('T')[0];
      setNewExpireDate(formattedDate);
    } else {
      setNewExpireDate('');
    }
  };

  // 이메일 중복 체크
  const checkEmailAvailability = async (email) => {
    if (!email) {
      setEmailCheck({ checking: false, available: null, message: '' });
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailCheck({
        checking: false,
        available: false,
        message: '유효하지 않은 이메일 형식입니다.'
      });
      return;
    }

    setEmailCheck({ checking: true, available: null, message: '확인 중...' });

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/api/users/check-email?email=${encodeURIComponent(email)}`,
        {
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (data.success) {
        setEmailCheck({
          checking: false,
          available: data.available,
          message: data.message
        });
      }
    } catch (err) {
      console.error('Error checking email:', err);
      setEmailCheck({
        checking: false,
        available: null,
        message: '이메일 확인 중 오류가 발생했습니다.'
      });
    }
  };

  // 사용자 등록
  const createUser = async (e) => {
    e.preventDefault();

    // 유효성 검사
    if (!newUser.username || !newUser.email) {
      alert('이름과 이메일을 입력해주세요.');
      return;
    }

    if (!emailCheck.available) {
      alert('사용 가능한 이메일을 입력해주세요.');
      return;
    }

    try {
      const userData = {
        username: newUser.username,
        email: newUser.email,
        expire_at: newUser.expire_at ? `${newUser.expire_at} 23:59:59` : null
      };

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/api/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(userData)
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('사용자가 등록되었습니다.');
        // 폼 초기화
        setNewUser({ username: '', email: '', expire_at: '' });
        setEmailCheck({ checking: false, available: null, message: '' });
        // 목록 새로고침
        fetchUsers(pagination.currentPage);
      } else {
        alert(data.error || '사용자 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      alert('사용자 등록 중 오류가 발생했습니다.');
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="admin-container">
      <Header />

      <div className="admin-content">
        <div className="section">
          <div
            className="section-header"
            onClick={() => setIsUserSectionOpen(!isUserSectionOpen)}
          >
            <h3>USER</h3>
            <button className="accordion-toggle-btn">
              {isUserSectionOpen ? '−' : '+'}
            </button>
          </div>

          {isUserSectionOpen && (
            <>
              <div className="section-divider"></div>
              <div className="section-content">
                {/* 검색 바 */}
                <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="username or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="icon-btn icon-btn-search" title="검색">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                fetchUsers(1, '');
              }}
              className="icon-btn icon-btn-cancel"
              title="초기화"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
            </button>
          )}
        </form>

        {/* 로딩 상태 */}
        {loading && <div className="loading">loading..</div>}

        {/* 에러 메시지 */}
        {error && <div className="error-message">{error}</div>}

        {/* 사용자 목록 테이블 */}
        {!loading && !error && (
          <>
            <div className="users-info-container">
              <div className="users-info">
                total {pagination.totalCount} ({pagination.currentPage}/{pagination.totalPages})
              </div>
              <div className="toggle-container">
                <span className="toggle-status">
                  only expired ({pagination.expiredCount || 0})
                </span>
                <button
                  className={`toggle-btn ${onlyExpired ? 'active' : ''}`}
                  onClick={() => {
                    const newValue = !onlyExpired;
                    setOnlyExpired(newValue);
                    fetchUsers(1, search, newValue);
                  }}
                >
                  <span className="toggle-slider"></span>
                </button>
              </div>
            </div>

            <table className="users-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>EXPIRE_AT</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr className={isExpired(user.expire_at) ? 'expired-row' : ''}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td
                        className="expire-cell"
                        onClick={() => startEdit(user)}
                      >
                        <span className="expire-display">
                          {user.expire_at ? new Date(user.expire_at).toISOString().split('T')[0] : '-'}
                        </span>
                      </td>
                    </tr>
                    {editingUserId === user.id && (
                      <tr key={`edit-${user.id}`}>
                        <td colSpan="3" style={{ padding: 0 }}>
                          <div className="expire-edit-section">
                            <input
                              type="date"
                              value={newExpireDate}
                              onChange={(e) => setNewExpireDate(e.target.value)}
                              className="expire-input-large"
                            />
                            <button
                              onClick={() => updateExpireDate(user.id)}
                              className="icon-btn icon-btn-save"
                              title="저장"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setEditingUserId(null);
                                setNewExpireDate('');
                              }}
                              className="icon-btn icon-btn-cancel"
                              title="취소"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* 사용자 등록 폼 */}
            <div className="user-register-section">
              <form onSubmit={createUser} className="register-form">
                <div className="form-row">
                  <div className="form-field">
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 10) {
                          setNewUser({ ...newUser, username: value });
                        }
                      }}
                      placeholder="username"
                      className="form-input"
                      maxLength={10}
                    />
                  </div>
                  <div className="form-field">
                    <div className="email-field-wrapper">
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 50) {
                            setNewUser({ ...newUser, email: value });
                          }
                        }}
                        onKeyUp={(e) => {
                          checkEmailAvailability(e.target.value);
                        }}
                        placeholder="user@domain.com"
                        className={`form-input ${emailCheck.available === true ? 'valid' : emailCheck.available === false ? 'invalid' : ''}`}
                        maxLength={50}
                      />
                      {emailCheck.message && (
                        <span className={`email-check-message ${emailCheck.available ? 'success' : 'error'}`}>
                          {emailCheck.message}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="form-field">
                    <input
                      type="date"
                      value={newUser.expire_at}
                      onChange={(e) => setNewUser({ ...newUser, expire_at: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <button type="submit" className="icon-btn icon-btn-save" title="등록">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                  </button>
                </div>
              </form>
            </div>

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => goToPage(1)}
                  disabled={pagination.currentPage === 1}
                  className="page-button"
                >
                  처음
                </button>
                <button
                  onClick={() => goToPage(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="page-button"
                >
                  이전
                </button>

                <span className="page-info">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>

                <button
                  onClick={() => goToPage(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="page-button"
                >
                  다음
                </button>
                <button
                  onClick={() => goToPage(pagination.totalPages)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="page-button"
                >
                  마지막
                </button>
              </div>
            )}
          </>
        )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
