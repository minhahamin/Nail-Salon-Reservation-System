# 네일샵 예약 시스템 (Nail Salon Reservation System)

Next.js 기반의 네일샵 예약 관리 시스템입니다.

## 기술 스택

- **프레임워크**: Next.js 16.0.3
- **언어**: TypeScript
- **데이터베이스**: SQLite (Prisma ORM)
- **스타일링**: Tailwind CSS
- **런타임**: Node.js

## 시작하기

### 1. 의존성 설치

```bash
cd web
npm install
```

### 2. 데이터베이스 설정

Prisma 마이그레이션을 실행하여 데이터베이스를 초기화합니다:

```bash
npx prisma migrate dev
```

또는 Prisma Client를 생성합니다:

```bash
npx prisma generate
```

### 3. 개발 서버 실행

```bash
npm run dev
```

개발 서버가 실행되면 [http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

### 4. 프로덕션 빌드

```bash
npm run build
npm start
```

## 주요 기능

### 예약 페이지 (`/booking`)
- 디자이너 선택
- 서비스 선택 (베이직 젤, 아트, 케어, 제거 등)
- 날짜 및 시간 선택
- 예약 가능한 시간대 확인
- 고객 정보 입력 및 예약 완료

### 마이페이지 (`/my`)
- 예약 내역 조회
- 예약 정보 확인

### 관리자 페이지 (`/admin`)
- 관리자 로그인
- 예약 관리
- 시간대 차단 설정
- 디자이너별 일정 관리
- 월별 예약 현황 확인

## 설정

주요 설정은 `src/lib/config.ts`에서 변경할 수 있습니다:

- `BUFFER_MINUTES`: 시술 후 준비 시간 (기본값: 10분)
- `MIN_LEAD_HOURS`: 최소 리드타임 (기본값: 2시간)
- `MAX_LEAD_DAYS`: 최대 예약 가능 일수 (기본값: 30일)

디자이너 및 서비스 정보는 `src/lib/data.ts`에서 관리합니다.

## 프로젝트 구조

```
web/
├── src/
│   ├── app/              # Next.js App Router 페이지
│   │   ├── admin/        # 관리자 페이지
│   │   ├── booking/      # 예약 페이지
│   │   ├── my/           # 마이페이지
│   │   └── api/          # API 라우트
│   ├── components/       # React 컴포넌트
│   └── lib/              # 유틸리티 및 설정
├── prisma/               # Prisma 스키마 및 마이그레이션
└── public/               # 정적 파일
```

## 데이터베이스 스키마

### Booking (예약)
- 고객 정보 (이름, 전화번호)
- 디자이너 ID
- 예약 시간 (시작/종료)
- 서비스 목록
- 약관 동의 정보

### Block (차단 시간)
- 디자이너 ID
- 차단 시간 (시작/종료)
- 차단 사유

## 개발 팁

- 페이지는 `src/app/` 디렉토리에서 관리됩니다
- 컴포넌트는 `src/components/` 디렉토리에 있습니다
- API 라우트는 `src/app/api/` 디렉토리에 있습니다
- 파일을 수정하면 개발 서버가 자동으로 새로고침됩니다

## 문제 해결

### 데이터베이스 오류가 발생하는 경우
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### Prisma Client가 인식되지 않는 경우
```bash
npx prisma generate
```

## 배포

Vercel에 배포하는 것이 가장 간단합니다:

1. [Vercel](https://vercel.com)에 프로젝트를 연결
2. 빌드 설정에서 `web` 디렉토리를 루트로 설정
3. 환경 변수 설정 (필요한 경우)
4. 배포 완료

## 라이선스

이 프로젝트는 개인 포트폴리오 프로젝트입니다.
