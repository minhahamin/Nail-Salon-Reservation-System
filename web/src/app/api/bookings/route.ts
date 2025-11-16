import { NextRequest, NextResponse } from "next/server";
import { existingBookings, services } from "@/lib/data";
import { Booking } from "@/lib/types";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { designerId, startISO, endISO, serviceIds, customerName, customerPhone } = body ?? {};
		if (!designerId || !startISO || !endISO || !Array.isArray(serviceIds) || serviceIds.length === 0) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
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


