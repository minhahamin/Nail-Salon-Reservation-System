import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

		const [bookingsDb, blocksDb] = await Promise.all([
			prisma.booking.findMany({ where: { designerId } }),
			prisma.block.findMany({ where: { designerId } }),
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

		return NextResponse.json({ bookings, blocks });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}


