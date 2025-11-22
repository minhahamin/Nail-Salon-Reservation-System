import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
	try {
		const designerId = req.nextUrl.searchParams.get("designerId") ?? "";
		const year = Number(req.nextUrl.searchParams.get("year"));
		const month = Number(req.nextUrl.searchParams.get("month")); // 1-12
		if (!designerId || !year || !month) {
			return NextResponse.json({ message: "Invalid query" }, { status: 400 });
		}
		const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
		const end = new Date(year, month, 1, 0, 0, 0, 0);
		
		// 디자이너 정보 가져오기 (브레이크 정보 포함)
		const designer = await prisma.designer.findUnique({
			where: { id: designerId },
		});
		
		if (!designer) {
			return NextResponse.json({ message: "Designer not found" }, { status: 404 });
		}
		
		const breaks = designer.breaks ? JSON.parse(designer.breaks) : [];
		const recurringBreaks = designer.recurringBreaks ? JSON.parse(designer.recurringBreaks) : [];
		const workHours = JSON.parse(designer.workHours);
		
		// 단순화를 위해 전체를 가져와 JS로 필터
		const [bookingsDb, blocksDb] = await Promise.all([
			prisma.booking.findMany({ where: { designerId } }),
			prisma.block.findMany({ where: { designerId } }),
		]);
		
		const countByDay: Record<number, { bookings: number; blocks: number; breaks: number }> = {};
		
		// 예약 카운트
		for (const b of bookingsDb) {
			const d = new Date(b.startISO);
			if (d >= start && d < end) {
				const day = d.getDate();
				countByDay[day] = countByDay[day] || { bookings: 0, blocks: 0, breaks: 0 };
				countByDay[day].bookings += 1;
			}
		}
		
		// 차단 카운트
		for (const bl of blocksDb) {
			const d = new Date(bl.startISO);
			if (d >= start && d < end) {
				const day = d.getDate();
				countByDay[day] = countByDay[day] || { bookings: 0, blocks: 0, breaks: 0 };
				countByDay[day].blocks += 1;
			}
		}
		
		// 브레이크타임 카운트 (매일 적용되는 브레이크)
		if (breaks.length > 0) {
			for (let day = 1; day <= new Date(year, month, 0).getDate(); day++) {
				const cellDate = new Date(year, month - 1, day);
				const weekday = cellDate.getDay();
				
				// 근무일인지 확인
				if (workHours.weekday.includes(weekday)) {
					countByDay[day] = countByDay[day] || { bookings: 0, blocks: 0, breaks: 0 };
					countByDay[day].breaks += breaks.length;
				}
			}
		}
		
		// 반복 브레이크 카운트 (특정 요일에만 적용)
		for (const rb of recurringBreaks) {
			for (let day = 1; day <= new Date(year, month, 0).getDate(); day++) {
				const cellDate = new Date(year, month - 1, day);
				const weekday = cellDate.getDay();
				
				if (weekday === rb.weekday) {
					countByDay[day] = countByDay[day] || { bookings: 0, blocks: 0, breaks: 0 };
					countByDay[day].breaks += 1;
				}
			}
		}
		
		return NextResponse.json({ year, month, days: countByDay });
	} catch (error) {
		console.error("Error in month API:", error);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}



