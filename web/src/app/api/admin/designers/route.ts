import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Designer } from "@/lib/types";

// GET: 디자이너 목록 조회
export async function GET(req: NextRequest) {
	try {
		const designers = await prisma.designer.findMany({
			orderBy: { createdAt: "asc" },
		});

		const result: Designer[] = designers.map(d => ({
			id: d.id,
			name: d.name,
			imageUrl: d.imageUrl ?? undefined,
			specialties: JSON.parse(d.specialties),
			workHours: JSON.parse(d.workHours),
			holidays: d.holidays ? JSON.parse(d.holidays) : [],
			breaks: d.breaks ? JSON.parse(d.breaks) : [],
			recurringBreaks: d.recurringBreaks ? JSON.parse(d.recurringBreaks) : [],
			defaultBlocks: d.defaultBlocks ? JSON.parse(d.defaultBlocks) : [],
			specialHours: d.specialHours ? JSON.parse(d.specialHours) : {},
			dailyMaxAppointments: d.dailyMaxAppointments ?? undefined,
			dailyMaxMinutes: d.dailyMaxMinutes ?? undefined,
		}));

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching designers:", error);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

// POST: 디자이너 생성
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			name,
			imageUrl,
			specialties,
			workHours,
			holidays,
			breaks,
			recurringBreaks,
			defaultBlocks,
			specialHours,
			dailyMaxAppointments,
			dailyMaxMinutes,
		} = body ?? {};

		if (!name || !specialties || !workHours) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}

		const designer = await prisma.designer.create({
			data: {
				name,
				imageUrl: imageUrl || null,
				specialties: JSON.stringify(specialties),
				workHours: JSON.stringify(workHours),
				holidays: holidays ? JSON.stringify(holidays) : null,
				breaks: breaks ? JSON.stringify(breaks) : null,
				recurringBreaks: recurringBreaks ? JSON.stringify(recurringBreaks) : null,
				defaultBlocks: defaultBlocks ? JSON.stringify(defaultBlocks) : null,
				specialHours: specialHours ? JSON.stringify(specialHours) : null,
				dailyMaxAppointments: dailyMaxAppointments ?? null,
				dailyMaxMinutes: dailyMaxMinutes ?? null,
			},
		});

		const result: Designer = {
			id: designer.id,
			name: designer.name,
			imageUrl: designer.imageUrl ?? undefined,
			specialties: JSON.parse(designer.specialties),
			workHours: JSON.parse(designer.workHours),
			holidays: designer.holidays ? JSON.parse(designer.holidays) : [],
			breaks: designer.breaks ? JSON.parse(designer.breaks) : [],
			recurringBreaks: designer.recurringBreaks ? JSON.parse(designer.recurringBreaks) : [],
			defaultBlocks: designer.defaultBlocks ? JSON.parse(designer.defaultBlocks) : [],
			specialHours: designer.specialHours ? JSON.parse(designer.specialHours) : {},
			dailyMaxAppointments: designer.dailyMaxAppointments ?? undefined,
			dailyMaxMinutes: designer.dailyMaxMinutes ?? undefined,
		};

		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		console.error("Error creating designer:", error);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

// PUT: 디자이너 수정
export async function PUT(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			id,
			name,
			imageUrl,
			specialties,
			workHours,
			holidays,
			breaks,
			recurringBreaks,
			defaultBlocks,
			specialHours,
			dailyMaxAppointments,
			dailyMaxMinutes,
		} = body ?? {};

		if (!id || !name || !specialties || !workHours) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}

		const designer = await prisma.designer.update({
			where: { id },
			data: {
				name,
				imageUrl: imageUrl || null,
				specialties: JSON.stringify(specialties),
				workHours: JSON.stringify(workHours),
				holidays: holidays ? JSON.stringify(holidays) : null,
				breaks: breaks ? JSON.stringify(breaks) : null,
				recurringBreaks: recurringBreaks ? JSON.stringify(recurringBreaks) : null,
				defaultBlocks: defaultBlocks ? JSON.stringify(defaultBlocks) : null,
				specialHours: specialHours ? JSON.stringify(specialHours) : null,
				dailyMaxAppointments: dailyMaxAppointments ?? null,
				dailyMaxMinutes: dailyMaxMinutes ?? null,
			},
		});

		const result: Designer = {
			id: designer.id,
			name: designer.name,
			imageUrl: designer.imageUrl ?? undefined,
			specialties: JSON.parse(designer.specialties),
			workHours: JSON.parse(designer.workHours),
			holidays: designer.holidays ? JSON.parse(designer.holidays) : [],
			breaks: designer.breaks ? JSON.parse(designer.breaks) : [],
			recurringBreaks: designer.recurringBreaks ? JSON.parse(designer.recurringBreaks) : [],
			defaultBlocks: designer.defaultBlocks ? JSON.parse(designer.defaultBlocks) : [],
			specialHours: designer.specialHours ? JSON.parse(designer.specialHours) : {},
			dailyMaxAppointments: designer.dailyMaxAppointments ?? undefined,
			dailyMaxMinutes: designer.dailyMaxMinutes ?? undefined,
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error updating designer:", error);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

// DELETE: 디자이너 삭제
export async function DELETE(req: NextRequest) {
	try {
		const body = await req.json();
		const { id } = body ?? {};

		if (!id) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}

		// 미래 예약이 있는지 확인 (과거 예약은 무시)
		const now = new Date();
		const futureBookings = await prisma.booking.findMany({
			where: {
				designerId: id,
				startISO: {
					gt: now.toISOString(), // 현재 시간보다 나중인 예약만
				},
			},
		});
		
		if (futureBookings.length > 0) {
			return NextResponse.json(
				{ message: `해당 디자이너에게 미래 예약 ${futureBookings.length}건이 있어 삭제할 수 없습니다.` },
				{ status: 400 }
			);
		}

		await prisma.designer.delete({ where: { id } });

		return NextResponse.json({ id, deleted: true });
	} catch (error) {
		console.error("Error deleting designer:", error);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

