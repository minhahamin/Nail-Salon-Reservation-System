import { NextRequest, NextResponse } from "next/server";
import { existingBookings, services } from "@/lib/data";
import { prisma } from "@/lib/prisma";

function buildICS({ title, startISO, endISO, description }: { title: string; startISO: string; endISO: string; description?: string }) {
	const dtStart = new Date(startISO).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
	const dtEnd = new Date(endISO).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//NailSalon//Booking//KR",
		"BEGIN:VEVENT",
		`UID:${crypto.randomUUID()}`,
		`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
		`DTSTART:${dtStart}`,
		`DTEND:${dtEnd}`,
		`SUMMARY:${title}`,
		description ? `DESCRIPTION:${description}` : undefined,
		"END:VEVENT",
		"END:VCALENDAR",
	]
		.filter(Boolean)
		.join("\r\n");
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
	const id = params.id;
	// DB 우선 조회, 없으면 메모리에서 조회
	const db = await prisma.booking.findUnique({ where: { id } });
	let startISO = db?.startISO;
	let endISO = db?.endISO;
	let serviceIds: string[] = db ? JSON.parse(db.serviceIds) : [];
	if (!db) {
		const mem = existingBookings.find(b => b.id === id);
		if (!mem) return NextResponse.json({ message: "Not found" }, { status: 404 });
		startISO = mem.startISO;
		endISO = mem.endISO;
		serviceIds = mem.serviceIds;
	}
	const names = serviceIds
		.map(sid => services.find(s => s.id === sid)?.name)
		.filter(Boolean)
		.join(", ");
	const ics = buildICS({
		title: "네일샵 예약",
		startISO: startISO!,
		endISO: endISO!,
		description: names ? `시술: ${names}` : undefined,
	});
	return new NextResponse(ics, {
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Content-Disposition": `attachment; filename="booking-${id}.ics"`,
		},
	});
}


