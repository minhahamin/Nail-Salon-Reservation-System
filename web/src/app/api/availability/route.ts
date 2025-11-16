import { NextRequest, NextResponse } from "next/server";
import { recommendSlots } from "@/lib/slots";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { designerId, dateISO, totalDurationMinutes, intervalMinutes, bufferMinutes, minLeadHours, maxLeadDays } = body ?? {};
		if (!designerId || !dateISO || !totalDurationMinutes) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}
		const data = recommendSlots({ designerId, dateISO, totalDurationMinutes, intervalMinutes, bufferMinutes, minLeadHours, maxLeadDays });
		return NextResponse.json(data);
	} catch (e) {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}


