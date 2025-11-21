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

export async function DELETE(req: NextRequest) {
	try {
		const body = await req.json();
		const { designerId, weekday, start, end } = body ?? {};
		if (!designerId || weekday === undefined || !start || !end) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}
		const d = designers.find(x => x.id === designerId);
		if (!d) return NextResponse.json({ message: "Designer not found" }, { status: 404 });
		d.recurringBreaks = d.recurringBreaks ?? [];
		const index = d.recurringBreaks.findIndex(
			rb => rb.weekday === Number(weekday) && rb.start === start && rb.end === end
		);
		if (index === -1) {
			return NextResponse.json({ message: "Recurring break not found" }, { status: 404 });
		}
		d.recurringBreaks.splice(index, 1);
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

export async function GET(req: NextRequest) {
	try {
		const designerId = req.nextUrl.searchParams.get("designerId");
		if (designerId) {
			const d = designers.find(x => x.id === designerId);
			if (!d) return NextResponse.json({ message: "Designer not found" }, { status: 404 });
			return NextResponse.json({
				breaks: d.breaks || [],
				recurringBreaks: d.recurringBreaks || [],
				defaultBlocks: d.defaultBlocks || [],
			});
		}
		// 모든 디자이너 정보 반환
		const result = designers.map(d => ({
			id: d.id,
			name: d.name,
			breaks: d.breaks || [],
			recurringBreaks: d.recurringBreaks || [],
			defaultBlocks: d.defaultBlocks || [],
		}));
		return NextResponse.json(result);
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}


