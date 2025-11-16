import { NextRequest, NextResponse } from "next/server";
import { existingBookings, services, designers } from "@/lib/data";
import { Booking } from "@/lib/types";
import { recommendSlots } from "@/lib/slots";
import { BUFFER_MINUTES, MIN_LEAD_HOURS, MAX_LEAD_DAYS } from "@/lib/config";
import { addMinutes } from "@/lib/time";
import { prisma } from "@/lib/prisma";
import { BookingCreateSchema, BookingDeleteSchema, BookingLookupSchema, BookingRescheduleSchema } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = BookingCreateSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ message: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
		}
		// rate limit
		const ip = getClientIp(req.headers);
		const r1 = rateLimit(`booking:create:ip:${ip}`, 5, 60_000);
		const r2 = rateLimit(`booking:create:phone:${parsed.data.customerPhone}`, 5, 60_000);
		if (!r1.ok || !r2.ok) return NextResponse.json({ message: "Too many requests" }, { status: 429 });
		const {
			designerId,
			startISO,
			endISO,
			serviceIds,
			customerName,
			customerPhone,
			agreedTerms,
			agreedPrivacy,
			reminderOptIn,
		} = parsed.data;
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
			agreedTerms: Boolean(agreedTerms),
			agreedPrivacy: Boolean(agreedPrivacy),
			reminderOptIn: Boolean(reminderOptIn),
		};
		// DB 저장
		const created = await prisma.booking.create({
			data: {
				id: newBooking.id,
				designerId: newBooking.designerId,
				startISO: newBooking.startISO,
				endISO: newBooking.endISO,
				serviceIds: JSON.stringify(newBooking.serviceIds),
				customerName: newBooking.customerName,
				customerPhone: newBooking.customerPhone,
				agreedTerms: Boolean(newBooking.agreedTerms),
				agreedPrivacy: Boolean(newBooking.agreedPrivacy),
				reminderOptIn: Boolean(newBooking.reminderOptIn),
			},
		});
		// 슬롯 계산은 메모리 배열도 참고하므로 동기화
		existingBookings.push(newBooking);
		return NextResponse.json(newBooking, { status: 201 });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

// 전화번호로 목록 조회
export async function GET(req: NextRequest) {
	try {
		const phone = req.nextUrl.searchParams.get("phone") ?? "";
		if (!phone || phone.length < 7) {
			return NextResponse.json({ message: "Invalid phone" }, { status: 400 });
		}
		const ip = getClientIp(req.headers);
		const r = rateLimit(`booking:list:${ip}`, 10, 60_000);
		if (!r.ok) return NextResponse.json({ message: "Too many requests" }, { status: 429 });
		const list = await prisma.booking.findMany({ where: { customerPhone: phone }, orderBy: { startISO: "asc" } });
		const data: Booking[] = list.map((b: any) => ({
			id: b.id,
			designerId: b.designerId,
			startISO: b.startISO,
			endISO: b.endISO,
			serviceIds: JSON.parse(b.serviceIds),
			customerName: b.customerName,
			customerPhone: b.customerPhone,
			agreedTerms: b.agreedTerms,
			agreedPrivacy: b.agreedPrivacy,
			reminderOptIn: b.reminderOptIn,
		}));
		return NextResponse.json(data);
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

// 조회
export async function PUT(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = BookingLookupSchema.safeParse(body);
		if (!parsed.success) return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		const { bookingId, customerPhone } = parsed.data;
		const ip = getClientIp(req.headers);
		const r = rateLimit(`booking:lookup:${ip}`, 10, 60_000);
		if (!r.ok) return NextResponse.json({ message: "Too many requests" }, { status: 429 });
		const b = await prisma.booking.findFirst({ where: { id: bookingId, customerPhone } });
		if (!b) return NextResponse.json({ message: "Not found" }, { status: 404 });
		const data: Booking = {
			id: b.id,
			designerId: b.designerId,
			startISO: b.startISO,
			endISO: b.endISO,
			serviceIds: JSON.parse(b.serviceIds),
			customerName: b.customerName,
			customerPhone: b.customerPhone,
			agreedTerms: b.agreedTerms,
			agreedPrivacy: b.agreedPrivacy,
			reminderOptIn: b.reminderOptIn,
		};
		return NextResponse.json(data);
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

// 취소
export async function DELETE(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = BookingDeleteSchema.safeParse(body);
		if (!parsed.success) return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		const { bookingId, customerPhone } = parsed.data;
		const ip = getClientIp(req.headers);
		const r = rateLimit(`booking:cancel:${ip}`, 5, 60_000);
		if (!r.ok) return NextResponse.json({ message: "Too many requests" }, { status: 429 });
		const b = await prisma.booking.findFirst({ where: { id: bookingId, customerPhone } });
		if (!b) return NextResponse.json({ message: "Not found" }, { status: 404 });
		await prisma.booking.delete({ where: { id: b.id } });
		// 메모리 동기화
		const idx = existingBookings.findIndex(x => x.id === bookingId && x.customerPhone === customerPhone);
		if (idx !== -1) existingBookings.splice(idx, 1);
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

// 변경(리스케줄)
export async function PATCH(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = BookingRescheduleSchema.safeParse(body);
		if (!parsed.success) return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		const { bookingId, customerPhone, startISO, endISO } = parsed.data;
		const ip = getClientIp(req.headers);
		const r = rateLimit(`booking:reschedule:${ip}`, 5, 60_000);
		if (!r.ok) return NextResponse.json({ message: "Too many requests" }, { status: 429 });
		const b = await prisma.booking.findFirst({ where: { id: bookingId, customerPhone } });
		if (!b) return NextResponse.json({ message: "Not found" }, { status: 404 });
		// 검증
		const svcIds: string[] = JSON.parse(b.serviceIds);
		const totalDuration = svcIds.reduce(
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
		const updated = await prisma.booking.update({ where: { id: b.id }, data: { startISO, endISO } });
		// 메모리 동기화
		const mem = existingBookings.find(x => x.id === b.id);
		if (mem) {
			mem.startISO = startISO;
			mem.endISO = endISO;
		}
		return NextResponse.json({
			id: updated.id,
			designerId: updated.designerId,
			startISO: updated.startISO,
			endISO: updated.endISO,
			serviceIds: JSON.parse(updated.serviceIds),
			customerName: updated.customerName,
			customerPhone: updated.customerPhone,
			agreedTerms: updated.agreedTerms,
			agreedPrivacy: updated.agreedPrivacy,
			reminderOptIn: updated.reminderOptIn,
		});
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}


