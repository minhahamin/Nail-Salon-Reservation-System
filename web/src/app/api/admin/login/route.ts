import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials, setAdminSessionCookie, clearAdminSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
	try {
		const { username, password } = await req.json();
		if (!username || !password) {
			return NextResponse.json({ message: "사용자명과 비밀번호를 입력해주세요." }, { status: 400 });
		}
		
		const isValid = await verifyAdminCredentials(username, password);
		if (!isValid) {
			return NextResponse.json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
		}
		await setAdminSessionCookie();
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Error in login:", error);
		return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
	}
}

export async function DELETE() {
	try {
		await clearAdminSessionCookie();
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}


