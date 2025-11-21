import { NextRequest, NextResponse } from "next/server";
import { designers } from "@/lib/data";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { designerId, start, end } = body ?? {};
		if (!designerId || !start || !end) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}
		const d = designers.find(x => x.id === designerId);
		if (!d) return NextResponse.json({ message: "Designer not found" }, { status: 404 });
		d.breaks = d.breaks ?? [];
		d.breaks.push({ start, end });
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const body = await req.json();
		const { designerId, start, end } = body ?? {};
		if (!designerId || !start || !end) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}
		const d = designers.find(x => x.id === designerId);
		if (!d) return NextResponse.json({ message: "Designer not found" }, { status: 404 });
		d.breaks = d.breaks ?? [];
		const index = d.breaks.findIndex(b => b.start === start && b.end === end);
		if (index === -1) {
			return NextResponse.json({ message: "Break not found" }, { status: 404 });
		}
		d.breaks.splice(index, 1);
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

