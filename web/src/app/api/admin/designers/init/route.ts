import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { designers } from "@/lib/data";

// 초기 디자이너 데이터를 데이터베이스에 로드
export async function POST(req: NextRequest) {
	try {
		// 기존 디자이너가 있는지 확인
		const existing = await prisma.designer.findMany();
		if (existing.length > 0) {
			return NextResponse.json({ message: "이미 디자이너 데이터가 존재합니다." }, { status: 400 });
		}

		// 하드코딩된 디자이너 데이터를 데이터베이스에 추가
		for (const designer of designers) {
			await prisma.designer.create({
				data: {
					id: designer.id,
					name: designer.name,
					imageUrl: designer.imageUrl || null,
					specialties: JSON.stringify(designer.specialties),
					workHours: JSON.stringify(designer.workHours),
					holidays: designer.holidays ? JSON.stringify(designer.holidays) : null,
					breaks: designer.breaks ? JSON.stringify(designer.breaks) : null,
					recurringBreaks: designer.recurringBreaks ? JSON.stringify(designer.recurringBreaks) : null,
					defaultBlocks: designer.defaultBlocks ? JSON.stringify(designer.defaultBlocks) : null,
					specialHours: designer.specialHours ? JSON.stringify(designer.specialHours) : null,
					dailyMaxAppointments: designer.dailyMaxAppointments ?? null,
					dailyMaxMinutes: designer.dailyMaxMinutes ?? null,
				},
			});
		}

		return NextResponse.json({ message: "초기 디자이너 데이터가 로드되었습니다.", count: designers.length });
	} catch (error) {
		console.error("Error initializing designers:", error);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

