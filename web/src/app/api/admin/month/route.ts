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
		// 단순화를 위해 전체를 가져와 JS로 필터
		const [bookingsDb, blocksDb] = await Promise.all([
			prisma.booking.findMany({ where: { designerId } }),
			prisma.block.findMany({ where: { designerId } }),
		]);
		const countByDay: Record<number, { bookings: number; blocks: number }> = {};
		for (const b of bookingsDb) {
			const d = new Date(b.startISO);
			if (d >= start && d < end) {
				const day = d.getDate();
				countByDay[day] = countByDay[day] || { bookings: 0, blocks: 0 };
				countByDay[day].bookings += 1;
			}
		}
		for (const bl of blocksDb) {
			const d = new Date(bl.startISO);
			if (d >= start && d < end) {
				const day = d.getDate();
				countByDay[day] = countByDay[day] || { bookings: 0, blocks: 0 };
				countByDay[day].blocks += 1;
			}
		}
		return NextResponse.json({ year, month, days: countByDay });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}



