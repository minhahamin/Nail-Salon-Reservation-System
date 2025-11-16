import { NextRequest, NextResponse } from "next/server";
import { existingBookings, services, designers } from "@/lib/data";
import { Booking } from "@/lib/types";
import { recommendSlots } from "@/lib/slots";
import { BUFFER_MINUTES, MIN_LEAD_HOURS, MAX_LEAD_DAYS } from "@/lib/config";
import { addMinutes } from "@/lib/time";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { designerId, startISO, endISO, serviceIds, customerName, customerPhone } = body ?? {};
		if (!designerId || !startISO || !endISO || !Array.isArray(serviceIds) || serviceIds.length === 0) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}
		// 서버 더블부킹/리드타임/버퍼 검증
		const totalDuration = serviceIds.reduce((sum: number, id: string) => sum + (services.find(s => s.id === id)?.durationMinutes || 0), 0);
		const dateISO = new Date(startISO).toISOString();
		const available = recommendSlots({
			designerId,
			dateISO,
			totalDurationMinutes: totalDuration,
			bufferMinutes: BUFFER_MINUTES,
			minLeadHours: MIN_LEAD_HOURS,
			maxLeadDays: MAX_LEAD_DAYS,
		});
		const ok = available.slots.some(s => s.isAvailable && s.startISO === startISO && s.endISO === endISO);
		if (!ok) {
			return NextResponse.json({ message: "Selected slot is not available" }, { status: 409 });
		}
		const newBooking: Booking = {
			id: `bk-${Date.now()}`,
			designerId,
			startISO,
			endISO,
			serviceIds,
			customerName: customerName ?? "",
			customerPhone: customerPhone ?? "",
		};
		existingBookings.push(newBooking);
		return NextResponse.json(newBooking, { status: 201 });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

// 조회
export async function PUT(req: NextRequest) {
	try {
		const body = await req.json();
		const { bookingId, customerPhone } = body ?? {};
		const b = existingBookings.find(x => x.id === bookingId && x.customerPhone === customerPhone);
		if (!b) return NextResponse.json({ message: "Not found" }, { status: 404 });
		return NextResponse.json(b);
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

// 취소
export async function DELETE(req: NextRequest) {
	try {
		const body = await req.json();
		const { bookingId, customerPhone } = body ?? {};
		const idx = existingBookings.findIndex(x => x.id === bookingId && x.customerPhone === customerPhone);
		if (idx === -1) return NextResponse.json({ message: "Not found" }, { status: 404 });
		const removed = existingBookings.splice(idx, 1)[0];
		return NextResponse.json(removed);
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

// 변경(리스케줄)
export async function PATCH(req: NextRequest) {
	try {
		const body = await req.json();
		const { bookingId, customerPhone, startISO, endISO } = body ?? {};
		const b = existingBookings.find(x => x.id === bookingId && x.customerPhone === customerPhone);
		if (!b) return NextResponse.json({ message: "Not found" }, { status: 404 });
		// 검증
		const totalDuration = b.serviceIds.reduce(
			(sum, id) => sum + (services.find(s => s.id === id)?.durationMinutes || 0),
			0
		);
		const available = recommendSlots({
			designerId: b.designerId,
			dateISO: new Date(startISO).toISOString(),
			totalDurationMinutes: totalDuration,
		});
		const ok = available.slots.some(s => s.isAvailable && s.startISO === startISO && s.endISO === endISO);
		if (!ok) return NextResponse.json({ message: "Slot not available" }, { status: 409 });
		b.startISO = startISO;
		b.endISO = endISO;
		return NextResponse.json(b);
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}


