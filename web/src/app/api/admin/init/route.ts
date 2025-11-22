import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 초기 관리자 계정 생성 (기본 admin 계정이 없을 때만)
export async function POST(req: NextRequest) {
	try {
		// 기존 관리자 확인
		const existing = await prisma.admin.findUnique({
			where: { username: "admin" },
		});
		
		if (existing) {
			return NextResponse.json({ message: "이미 관리자 계정이 존재합니다." }, { status: 400 });
		}
		
		const defaultPassword = process.env.ADMIN_PASSWORD || "admin1234";
		const hashedPassword = await bcrypt.hash(defaultPassword, 10);
		
		const admin = await prisma.admin.create({
			data: {
				username: "admin",
				password: hashedPassword,
			},
		});
		
		return NextResponse.json({ 
			message: "초기 관리자 계정이 생성되었습니다.",
			username: admin.username,
			password: "기본 비밀번호: admin1234 (환경 변수 ADMIN_PASSWORD가 설정되어 있으면 해당 값 사용)",
		}, { status: 201 });
	} catch (error) {
		console.error("Error initializing admin:", error);
		return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
	}
}

