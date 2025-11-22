import { NextRequest, NextResponse } from "next/server";
import { recommendSlots } from "@/lib/slots";
import { AvailabilitySchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { Designer, Booking, Block } from "@/lib/types";
import { isSameDay } from "@/lib/time";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = AvailabilitySchema.safeParse(body);
		if (!parsed.success) return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		const { designerId, dateISO, totalDurationMinutes, intervalMinutes, bufferMinutes, minLeadHours, maxLeadDays } = parsed.data;
		
		// 데이터베이스에서 디자이너 정보 가져오기
		const designerDb = await prisma.designer.findUnique({
			where: { id: designerId },
		});
		
		if (!designerDb) {
			return NextResponse.json({ message: "Designer not found" }, { status: 404 });
		}
		
		// Designer 타입으로 변환
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
		const date = new Date(dateISO);
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
		
		// 데이터베이스에서 가져온 데이터를 사용하여 슬롯 추천
		const data = recommendSlots(
			{ designerId, dateISO, totalDurationMinutes, intervalMinutes, bufferMinutes, minLeadHours, maxLeadDays },
			designer,
			bookings,
			blocks
		);
		
		return NextResponse.json(data);
	} catch (e) {
		console.error("Error in availability API:", e);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}


