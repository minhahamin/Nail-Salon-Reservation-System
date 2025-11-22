import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

declare global {
	// eslint-disable-next-line no-var
	var prisma: PrismaClient | undefined;
}

// DATABASE_URL 설정 및 Windows 호환성 처리
let databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";

// 상대 경로인 경우 절대 경로로 변환 (Windows에서 필요)
if (databaseUrl.startsWith("file:./")) {
	const relativePath = databaseUrl.replace("file:./", "");
	const absolutePath = path.resolve(process.cwd(), relativePath);
	
	console.log("[Prisma] Original DATABASE_URL:", process.env.DATABASE_URL);
	console.log("[Prisma] process.cwd():", process.cwd());
	console.log("[Prisma] Resolved absolute path:", absolutePath);
	console.log("[Prisma] File exists:", fs.existsSync(absolutePath));
	
	if (!fs.existsSync(absolutePath)) {
		console.warn("[Prisma] Database file does not exist. Run 'npx prisma migrate dev' to create it.");
	}
	
	// Windows에서 절대 경로를 Prisma가 인식할 수 있는 형식으로 변환
	if (process.platform === "win32") {
		// Windows: file:C:/path 형식 (슬래시 2개, 드라이브 문자 포함)
		const normalizedPath = absolutePath.replace(/\\/g, "/");
		databaseUrl = `file:${normalizedPath}`;
	} else {
		// Unix: file:/absolute/path 형식
		databaseUrl = `file:${absolutePath}`;
	}
	
	console.log("[Prisma] Final DATABASE_URL:", databaseUrl);
}

// 환경 변수를 확실히 설정 (PrismaClient가 읽을 수 있도록)
process.env.DATABASE_URL = databaseUrl;

// global.prisma가 이미 생성되어 있다면 연결을 끊고 재생성
if (global.prisma) {
	console.log("[Prisma] Disconnecting existing PrismaClient...");
	global.prisma.$disconnect().catch(() => {});
	global.prisma = undefined;
}

// PrismaClient 생성 (환경 변수가 이미 설정되어 있음)
console.log("[Prisma] Creating PrismaClient with DATABASE_URL:", process.env.DATABASE_URL);
const prismaInstance = new PrismaClient({
	log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

// 연결 테스트 (개발 환경에서만)
if (process.env.NODE_ENV !== "production") {
	prismaInstance.$connect()
		.then(() => {
			console.log("[Prisma] Successfully connected to database");
		})
		.catch((error) => {
			console.error("[Prisma] Failed to connect to database:", error);
			console.error("[Prisma] DATABASE_URL:", process.env.DATABASE_URL);
		});
}

export const prisma = prismaInstance;
if (process.env.NODE_ENV !== "production") global.prisma = prisma;


