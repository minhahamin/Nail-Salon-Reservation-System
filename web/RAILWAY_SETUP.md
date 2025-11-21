# Railway SQLite 설정 가이드

## 1. Railway 프로젝트 생성

1. [Railway](https://railway.app)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 연결 또는 직접 업로드

## 2. 환경 변수 설정

Railway 대시보드에서 **Variables** 탭으로 이동하여 다음 환경 변수를 추가:

```
DATABASE_URL=file:./prisma/dev.db
```

또는 절대 경로 사용:
```
DATABASE_URL=file:/tmp/prisma/dev.db
```

## 3. 프로젝트 설정

Railway 대시보드에서:

1. **Settings** 탭으로 이동
2. **Root Directory**를 `web`으로 설정
3. **Build Command**는 `railway.json`에 이미 설정되어 있음 (자동 적용됨)

## 4. 볼륨 설정 (선택사항, 권장)

데이터베이스 파일을 영구 저장하려면:

1. Railway 대시보드에서 프로젝트 선택
2. **Volumes** 탭 클릭
3. **Create Volume** 클릭
4. Mount Path: `/tmp/prisma` 또는 `/app/prisma`
5. 환경 변수 업데이트:
   ```
   DATABASE_URL=file:/tmp/prisma/dev.db
   ```

## 5. 배포

Railway가 자동으로:
- `npm install` 실행
- `npx prisma generate` 실행
- `npx prisma migrate deploy` 실행 (마이그레이션 적용)
- `npm run build` 실행
- `npm start` 실행

## 6. 확인

배포 완료 후:
- 예약 페이지 동작 확인
- 관리자 페이지 로그인 확인
- 데이터베이스에 데이터가 저장되는지 확인

## 주의사항

⚠️ **볼륨을 사용하지 않으면**:
- 컨테이너가 재시작되면 데이터가 사라질 수 있음
- 프로덕션 환경에서는 반드시 볼륨 사용 권장

✅ **볼륨 사용 시**:
- 데이터베이스 파일이 영구 저장됨
- 컨테이너 재시작해도 데이터 유지

