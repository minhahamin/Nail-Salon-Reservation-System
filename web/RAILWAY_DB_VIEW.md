# Railway 배포 환경에서 Prisma 데이터베이스 보기

## 방법 1: Railway CLI로 원격 Prisma Studio 실행 (권장)

### 1. Railway CLI 설치
```bash
npm install -g @railway/cli
```

### 2. Railway 로그인
```bash
railway login
```

### 3. 프로젝트 연결
```bash
railway link
```

### 4. 원격에서 Prisma Studio 실행 (포트 포워딩)
```bash
railway run npx prisma studio --port 5555
```

이 명령어는 Railway 서버에서 Prisma Studio를 실행하고, 로컬의 `http://localhost:5555`로 접속할 수 있게 포워딩합니다.

---

## 방법 2: 데이터베이스 파일 다운로드 후 로컬에서 확인

### 1. Railway CLI로 데이터베이스 파일 다운로드
```bash
# Railway 서버의 데이터베이스 파일 경로 확인 (보통 /tmp/prisma/dev.db 또는 ./prisma/dev.db)
railway run cat prisma/dev.db > local-dev.db
```

또는 Railway 대시보드에서:
1. Railway 대시보드 → 프로젝트 선택
2. **Volumes** 탭 클릭
3. 데이터베이스 파일 다운로드

### 2. 로컬에서 Prisma Studio 실행
```bash
# 다운로드한 파일을 사용하여 Prisma Studio 실행
DATABASE_URL="file:./local-dev.db" npx prisma studio
```

---

## 방법 3: Railway 대시보드에서 직접 확인

### Railway Shell 사용
1. Railway 대시보드 → 프로젝트 선택
2. **Deployments** 탭 → 최신 배포 클릭
3. **View Logs** 또는 **Shell** 탭 클릭
4. Shell에서 다음 명령어 실행:
```bash
cd web
npx prisma studio --port 5555 --hostname 0.0.0.0
```

그런 다음 Railway가 제공하는 Public URL로 접속합니다.

---

## 방법 4: API 엔드포인트로 데이터 확인

배포된 API를 통해 데이터 확인:

```bash
# 예약 목록 조회
curl https://your-railway-app.railway.app/api/bookings?phone=01012345678

# 관리자 API로 예약 조회 (인증 필요)
curl -X GET https://your-railway-app.railway.app/api/admin/bookings \
  -H "Cookie: admin_session=ok"
```

---

## 주의사항

⚠️ **프로덕션 환경에서는 Prisma Studio를 직접 노출하지 마세요!**
- 보안상 위험할 수 있습니다
- 개발/디버깅 목적으로만 사용하세요
- 사용 후 반드시 종료하세요

✅ **권장 방법:**
- 개발 중: 방법 1 (Railway CLI 포워딩)
- 데이터 백업: 방법 2 (파일 다운로드)
- 빠른 확인: 방법 4 (API 엔드포인트)

