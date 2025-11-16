import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials, setAdminSessionCookie, clearAdminSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
	try {
		const { username, password } = await req.json();
		if (!verifyAdminCredentials(username, password)) {
			return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
		}
		setAdminSessionCookie();
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

export async function DELETE() {
	try {
		clearAdminSessionCookie();
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}


