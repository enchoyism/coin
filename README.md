# Google OAuth Sample Project

Node.js Express 백엔드와 React 프론트엔드를 사용한 Google OAuth 로그인 샘플 프로젝트입니다.

## 프로젝트 구조

```
nodejs/
├── backend/          # Express 서버
│   ├── server.js     # 메인 서버 파일
│   ├── package.json
│   └── .env.example  # 환경 변수 예시
└── frontend/         # React 앱
    ├── src/
    │   ├── pages/    # Login, Dashboard 페이지
    │   ├── components/ # PrivateRoute 컴포넌트
    │   ├── context/  # AuthContext
    │   └── App.js
    └── package.json
```

## 기능

- Google OAuth 2.0 로그인
- 로그인 후 대시보드 페이지로 리다이렉트
- 사용자 정보 표시
- Protected Route (인증 필요)
- 로그아웃 기능
- 샘플 API 호출

## 설치 및 실행 방법

### 1. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보"로 이동
4. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
5. 애플리케이션 유형: "웹 애플리케이션" 선택
6. 승인된 리디렉션 URI 추가:
   - `http://localhost:3001/auth/google/callback`
7. Client ID와 Client Secret을 복사

### 2. 백엔드 설정

```bash
# 백엔드 디렉토리로 이동
cd backend

# 패키지 설치
npm install

# .env 파일 생성
cp .env.example .env

# .env 파일 편집 (Google OAuth 정보 입력)
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
# SESSION_SECRET=random_string_here
# FRONTEND_URL=http://localhost:3000
# BACKEND_URL=http://localhost:3001

# 서버 실행
npm start
```

서버가 http://localhost:3001 에서 실행됩니다.

### 3. 프론트엔드 설정

```bash
# 새 터미널에서 프론트엔드 디렉토리로 이동
cd frontend

# 패키지 설치
npm install

# 개발 서버 실행
npm start
```

React 앱이 http://localhost:3000 에서 실행됩니다.

## 사용 방법

1. 브라우저에서 http://localhost:3000 접속
2. "Sign in with Google" 버튼 클릭
3. Google 계정으로 로그인
4. 로그인 성공 후 Dashboard 페이지로 이동
5. "Fetch Sample Data" 버튼을 클릭하여 Protected API 테스트
6. "Logout" 버튼으로 로그아웃

## API 엔드포인트

### 백엔드 (http://localhost:3001)

- `GET /` - 서버 상태 확인
- `GET /auth/google` - Google OAuth 시작
- `GET /auth/google/callback` - Google OAuth 콜백
- `GET /auth/user` - 현재 로그인된 사용자 정보
- `GET /auth/logout` - 로그아웃
- `GET /api/sample` - 샘플 Protected API

## 주요 패키지

### 백엔드
- express - 웹 프레임워크
- passport - 인증 미들웨어
- passport-google-oauth20 - Google OAuth 전략
- express-session - 세션 관리
- cors - CORS 설정
- dotenv - 환경 변수 관리

### 프론트엔드
- react - UI 라이브러리
- react-router-dom - 라우팅
- axios - HTTP 클라이언트

## 보안 고려사항

1. `.env` 파일은 절대 커밋하지 마세요
2. `SESSION_SECRET`은 랜덤한 문자열로 설정하세요
3. 프로덕션 환경에서는 HTTPS를 사용하세요
4. `cookie.secure`를 true로 설정하세요 (HTTPS 사용 시)

## 트러블슈팅

### CORS 에러가 발생하는 경우
- 백엔드의 `.env` 파일에서 `FRONTEND_URL`이 올바른지 확인
- `withCredentials: true` 옵션이 axios 요청에 포함되어 있는지 확인

### 로그인 후 리다이렉트가 안 되는 경우
- Google Cloud Console에서 리디렉션 URI가 올바르게 설정되었는지 확인
- `.env` 파일의 `BACKEND_URL`이 올바른지 확인

### 세션이 유지되지 않는 경우
- 쿠키 설정 확인
- 브라우저에서 쿠키가 차단되지 않았는지 확인

## 라이선스

MIT

## 참고 자료

- [Passport.js 문서](http://www.passportjs.org/)
- [Google OAuth 2.0 가이드](https://developers.google.com/identity/protocols/oauth2)
- [React Router 문서](https://reactrouter.com/)
