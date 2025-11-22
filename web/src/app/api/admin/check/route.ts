import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 관리자 계정 존재 여부 확인
export async function GET(req: NextRequest) {
	try {
		const count = await prisma.admin.count();
		return NextResponse.json({ exists: count > 0 });
	} catch (error) {
		console.error("Error checking admin:", error);
		return NextResponse.json({ exists: false }, { status: 500 });
	}
}

