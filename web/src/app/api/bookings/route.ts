import { NextRequest, NextResponse } from "next/server";
import { existingBookings, services, designers } from "@/lib/data";
import { Booking, Designer, Block } from "@/lib/types";
import { recommendSlots } from "@/lib/slots";
import { BUFFER_MINUTES, MIN_LEAD_HOURS, MAX_LEAD_DAYS } from "@/lib/config";
import { addMinutes, isSameDay } from "@/lib/time";
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
		const date = new Date(startISO);
		
		// 데이터베이스에서 디자이너 정보 가져오기
		const designerDb = await prisma.designer.findUnique({
			where: { id: designerId },
		});
		
		if (!designerDb) {
			return NextResponse.json({ message: "Designer not found" }, { status: 404 });
		}
		
		const designer: Designer = {
			id: designerDb.id,
			name: designerDb.name,
			imageUrl: designerDb.imageUrl ?? undefined,
			specialties: JSON.parse(designerDb.specialties),
			workHours: JSON.parse(designerDb.workHours),
			holidays: designerDb.holidays ? JSON.parse(designerDb.holidays) : [],
			breaks: designerDb.breaks ? JSON.parse(designerDb.breaks) : [],
			recurringBreaks: designerDb.recurringBreaks ? JSON.parse(designerDb.recurringBreaks) : [],
			defaultBlocks: designerDb.defaultBlocks ? JSON.parse(designerDb.defaultBlocks) : [],
			specialHours: designerDb.specialHours ? JSON.parse(designerDb.specialHours) : {},
			dailyMaxAppointments: designerDb.dailyMaxAppointments ?? undefined,
			dailyMaxMinutes: designerDb.dailyMaxMinutes ?? undefined,
		};
		
		// 데이터베이스에서 예약 정보 가져오기
		const bookingsDb = await prisma.booking.findMany({
			where: { designerId },
		});
		
		const bookings: Booking[] = bookingsDb
			.filter(b => isSameDay(new Date(b.startISO), date))
			.map(b => ({
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
		
		// 데이터베이스에서 차단 시간 가져오기
		const blocksDb = await prisma.block.findMany({
			where: { designerId },
		});
		
		const blocks: Block[] = blocksDb
			.filter(b => isSameDay(new Date(b.startISO), date))
			.map(b => ({
				id: b.id,
				designerId: b.designerId,
				startISO: b.startISO,
				endISO: b.endISO,
				reason: b.reason ?? undefined,
			}));
		
		const available = recommendSlots(
			{
				designerId,
				dateISO,
				totalDurationMinutes: totalDuration,
				bufferMinutes: BUFFER_MINUTES,
				minLeadHours: MIN_LEAD_HOURS,
				maxLeadDays: MAX_LEAD_DAYS,
			},
			designer,
			bookings,
			blocks
		);
		
		const selectedSlot = available.slots.find(s => s.startISO === startISO && s.endISO === endISO);
		if (!selectedSlot) {
			return NextResponse.json({ 
				message: "선택한 시간 슬롯을 찾을 수 없습니다.",
				reason: "not_found"
			}, { status: 409 });
		}
		if (!selectedSlot.isAvailable) {
			const reason = selectedSlot.reason === "past" ? "과거 시간입니다." 
				: selectedSlot.reason === "conflict" ? "다른 예약 또는 차단 시간과 겹칩니다."
				: "예약할 수 없는 시간입니다.";
			return NextResponse.json({ 
				message: reason,
				reason: selectedSlot.reason || "unavailable"
			}, { status: 409 });
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
		const designerIdFilter = req.nextUrl.searchParams.get("designerId") ?? "";
		if (!phone || phone.length < 7) {
			return NextResponse.json({ message: "Invalid phone" }, { status: 400 });
		}
		const ip = getClientIp(req.headers);
		const r = rateLimit(`booking:list:${ip}`, 10, 60_000);
		if (!r.ok) return NextResponse.json({ message: "Too many requests" }, { status: 429 });
		const where: any = { customerPhone: phone };
		if (designerIdFilter) where.designerId = designerIdFilter;
		const list = await prisma.booking.findMany({ where, orderBy: { startISO: "asc" } });
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
		const where: any = { id: bookingId };
		if (customerPhone) where.customerPhone = customerPhone;
		const b = await prisma.booking.findFirst({ where });
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
		const dateISO = new Date(startISO).toISOString();
		const date = new Date(startISO);
		
		// 데이터베이스에서 디자이너 정보 가져오기
		const designerDb = await prisma.designer.findUnique({
			where: { id: b.designerId },
		});
		
		if (!designerDb) {
			return NextResponse.json({ message: "Designer not found" }, { status: 404 });
		}
		
		const designer: Designer = {
			id: designerDb.id,
			name: designerDb.name,
			imageUrl: designerDb.imageUrl ?? undefined,
			specialties: JSON.parse(designerDb.specialties),
			workHours: JSON.parse(designerDb.workHours),
			holidays: designerDb.holidays ? JSON.parse(designerDb.holidays) : [],
			breaks: designerDb.breaks ? JSON.parse(designerDb.breaks) : [],
			recurringBreaks: designerDb.recurringBreaks ? JSON.parse(designerDb.recurringBreaks) : [],
			defaultBlocks: designerDb.defaultBlocks ? JSON.parse(designerDb.defaultBlocks) : [],
			specialHours: designerDb.specialHours ? JSON.parse(designerDb.specialHours) : {},
			dailyMaxAppointments: designerDb.dailyMaxAppointments ?? undefined,
			dailyMaxMinutes: designerDb.dailyMaxMinutes ?? undefined,
		};
		
		// 데이터베이스에서 예약 정보 가져오기 (현재 예약 제외)
		const bookingsDb = await prisma.booking.findMany({
			where: { designerId: b.designerId },
		});
		
		const bookings: Booking[] = bookingsDb
			.filter(booking => booking.id !== b.id) // 현재 예약 제외
			.filter(booking => isSameDay(new Date(booking.startISO), date))
			.map(booking => ({
				id: booking.id,
				designerId: booking.designerId,
				startISO: booking.startISO,
				endISO: booking.endISO,
				serviceIds: JSON.parse(booking.serviceIds),
				customerName: booking.customerName,
				customerPhone: booking.customerPhone,
				agreedTerms: booking.agreedTerms,
				agreedPrivacy: booking.agreedPrivacy,
				reminderOptIn: booking.reminderOptIn,
			}));
		
		// 데이터베이스에서 차단 시간 가져오기
		const blocksDb = await prisma.block.findMany({
			where: { designerId: b.designerId },
		});
		
		const blocks: Block[] = blocksDb
			.filter(block => isSameDay(new Date(block.startISO), date))
			.map(block => ({
				id: block.id,
				designerId: block.designerId,
				startISO: block.startISO,
				endISO: block.endISO,
				reason: block.reason ?? undefined,
			}));
		
		const available = recommendSlots(
			{
				designerId: b.designerId,
				dateISO,
				totalDurationMinutes: totalDuration,
				bufferMinutes: BUFFER_MINUTES,
				minLeadHours: MIN_LEAD_HOURS,
				maxLeadDays: MAX_LEAD_DAYS,
			},
			designer,
			bookings,
			blocks
		);
		
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


