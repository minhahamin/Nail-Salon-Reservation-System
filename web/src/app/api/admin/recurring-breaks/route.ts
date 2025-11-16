import { NextRequest, NextResponse } from "next/server";
import { designers } from "@/lib/data";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { designerId, weekday, start, end } = body ?? {};
		if (!designerId || weekday === undefined || !start || !end) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}
		const d = designers.find(x => x.id === designerId);
		if (!d) return NextResponse.json({ message: "Designer not found" }, { status: 404 });
		d.recurringBreaks = d.recurringBreaks ?? [];
		d.recurringBreaks.push({ weekday: Number(weekday), start, end });
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}


