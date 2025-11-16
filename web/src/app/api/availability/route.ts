import { NextRequest, NextResponse } from "next/server";
import { recommendSlots } from "@/lib/slots";
import { AvailabilitySchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = AvailabilitySchema.safeParse(body);
		if (!parsed.success) return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		const { designerId, dateISO, totalDurationMinutes, intervalMinutes, bufferMinutes, minLeadHours, maxLeadDays } = parsed.data;
		const data = recommendSlots({ designerId, dateISO, totalDurationMinutes, intervalMinutes, bufferMinutes, minLeadHours, maxLeadDays });
		return NextResponse.json(data);
	} catch (e) {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}


