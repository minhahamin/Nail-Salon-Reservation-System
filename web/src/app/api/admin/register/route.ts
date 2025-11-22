import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
	try {
		const { username, password } = await req.json();
		
		if (!username || !password) {
			return NextResponse.json({ message: "사용자명과 비밀번호를 입력해주세요." }, { status: 400 });
		}
		
		if (username.length < 3) {
			return NextResponse.json({ message: "사용자명은 최소 3자 이상이어야 합니다." }, { status: 400 });
		}
		
		if (password.length < 4) {
			return NextResponse.json({ message: "비밀번호는 최소 4자 이상이어야 합니다." }, { status: 400 });
		}
		
		// 기존 관리자 확인
		const existing = await prisma.admin.findUnique({
			where: { username },
		});
		
		if (existing) {
			return NextResponse.json({ message: "이미 존재하는 사용자명입니다." }, { status: 400 });
		}
		
		// 비밀번호 해싱
		const hashedPassword = await bcrypt.hash(password, 10);
		
		// 관리자 생성
		const admin = await prisma.admin.create({
			data: {
				username,
				password: hashedPassword,
			},
		});
		
		return NextResponse.json({ 
			message: "관리자 계정이 생성되었습니다.",
			id: admin.id,
			username: admin.username,
		}, { status: 201 });
	} catch (error) {
		console.error("Error creating admin:", error);
		return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
	}
}

