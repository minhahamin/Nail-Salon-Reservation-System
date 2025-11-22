import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setTime } from "@/lib/time";

function isSameLocalDay(a: Date, b: Date) {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export async function GET(req: NextRequest) {
	try {
		const designerId = req.nextUrl.searchParams.get("designerId") ?? "";
		const dateStr = req.nextUrl.searchParams.get("date") ?? ""; // YYYY-MM-DD
		if (!designerId || !dateStr) {
			return NextResponse.json({ message: "Invalid query" }, { status: 400 });
		}
		const day = new Date(dateStr + "T00:00:00");
		const weekday = day.getDay();

		const [bookingsDb, blocksDb, designerDb] = await Promise.all([
			prisma.booking.findMany({ where: { designerId } }),
			prisma.block.findMany({ where: { designerId } }),
			prisma.designer.findUnique({ where: { id: designerId } }),
		]);

		const bookings = bookingsDb
			.filter(b => isSameLocalDay(new Date(b.startISO), day))
			.map(b => ({
				id: b.id,
				designerId: b.designerId,
				startISO: b.startISO,
				endISO: b.endISO,
				customerName: b.customerName,
				customerPhone: b.customerPhone,
			}))
			.sort((a, b) => a.startISO.localeCompare(b.startISO));

		const blocks = blocksDb
			.filter(b => isSameLocalDay(new Date(b.startISO), day))
			.map(b => ({
				id: b.id,
				designerId: b.designerId,
				startISO: b.startISO,
				endISO: b.endISO,
				reason: b.reason ?? "",
			}))
			.sort((a, b) => a.startISO.localeCompare(b.startISO));

		// 브레이크타임 정보 가져오기
		const breaks: Array<{ startISO: string; endISO: string; label: string; type: "break" | "recurringBreak" }> = [];
		
		if (designerDb) {
			const workHours = JSON.parse(designerDb.workHours);
			const breaksList = designerDb.breaks ? JSON.parse(designerDb.breaks) : [];
			const recurringBreaks = designerDb.recurringBreaks ? JSON.parse(designerDb.recurringBreaks) : [];
			
			// 근무일인지 확인
			const isWorkDay = workHours.weekday.includes(weekday);
			
			// 매일 적용되는 브레이크
			if (isWorkDay && breaksList.length > 0) {
				for (const br of breaksList) {
					const startISO = setTime(day, br.start).toISOString();
					const endISO = setTime(day, br.end).toISOString();
					breaks.push({
						startISO,
						endISO,
						label: `브레이크 ${br.start}~${br.end}`,
						type: "break",
					});
				}
			}
			
			// 반복 브레이크 (특정 요일에만 적용)
			const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];
			for (const rb of recurringBreaks) {
				if (rb.weekday === weekday) {
					const startISO = setTime(day, rb.start).toISOString();
					const endISO = setTime(day, rb.end).toISOString();
					breaks.push({
						startISO,
						endISO,
						label: `반복 브레이크 (${weekdayNames[rb.weekday]}) ${rb.start}~${rb.end}`,
						type: "recurringBreak",
					});
				}
			}
		}

		// 시간 순으로 정렬
		breaks.sort((a, b) => a.startISO.localeCompare(b.startISO));

		return NextResponse.json({ bookings, blocks, breaks });
	} catch (error) {
		console.error("Error in day API:", error);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}


