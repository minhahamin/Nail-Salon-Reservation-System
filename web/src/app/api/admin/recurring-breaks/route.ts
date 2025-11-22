import { NextRequest, NextResponse } from "next/server";
import { designers } from "@/lib/data";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { designerId, weekday, start, end } = body ?? {};
		if (!designerId || weekday === undefined || !start || !end) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}
		const d = designers.find(x => x.id === designerId);
		if (!d) return NextResponse.json({ message: "Designer not found" }, { status: 404 });
		d.recurringBreaks = d.recurringBreaks ?? [];
		d.recurringBreaks.push({ weekday: Number(weekday), start, end });
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const body = await req.json();
		const { designerId, weekday, start, end } = body ?? {};
		if (!designerId || weekday === undefined || !start || !end) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}
		const d = designers.find(x => x.id === designerId);
		if (!d) return NextResponse.json({ message: "Designer not found" }, { status: 404 });
		d.recurringBreaks = d.recurringBreaks ?? [];
		const index = d.recurringBreaks.findIndex(
			rb => rb.weekday === Number(weekday) && rb.start === start && rb.end === end
		);
		if (index === -1) {
			return NextResponse.json({ message: "Recurring break not found" }, { status: 404 });
		}
		d.recurringBreaks.splice(index, 1);
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

export async function GET(req: NextRequest) {
	try {
		const { prisma } = await import("@/lib/prisma");
		const designerId = req.nextUrl.searchParams.get("designerId");
		
		if (designerId) {
			const d = designers.find(x => x.id === designerId);
			if (!d) return NextResponse.json({ message: "Designer not found" }, { status: 404 });
			
			// 데이터베이스에서 Block 데이터를 가져와서 defaultBlocks 형식으로 변환
			const blocksDb = await prisma.block.findMany({ where: { designerId } });
			const dbDefaultBlocks = blocksDb.map(b => {
				const startDate = new Date(b.startISO);
				const dateStr = startDate.toISOString().slice(0, 10);
				const startTime = startDate.toTimeString().slice(0, 5);
				const endTime = new Date(b.endISO).toTimeString().slice(0, 5);
				return {
					date: dateStr,
					start: startTime,
					end: endTime,
					reason: b.reason || undefined,
				};
			});
			
			// 메모리의 defaultBlocks와 데이터베이스의 blocks를 합침 (중복 제거)
			const memoryBlocks = d.defaultBlocks || [];
			const allBlocks = [...memoryBlocks];
			for (const dbBlock of dbDefaultBlocks) {
				const exists = allBlocks.some(
					mb => mb.date === dbBlock.date && mb.start === dbBlock.start && mb.end === dbBlock.end
				);
				if (!exists) {
					allBlocks.push(dbBlock);
				}
			}
			
			return NextResponse.json({
				breaks: d.breaks || [],
				recurringBreaks: d.recurringBreaks || [],
				defaultBlocks: allBlocks.sort((a, b) => a.date.localeCompare(b.date)),
			});
		}
		// 모든 디자이너 정보 반환
		const blocksDb = await prisma.block.findMany();
		const result = designers.map(d => {
			const designerBlocks = blocksDb
				.filter(b => b.designerId === d.id)
				.map(b => {
					const startDate = new Date(b.startISO);
					const dateStr = startDate.toISOString().slice(0, 10);
					const startTime = startDate.toTimeString().slice(0, 5);
					const endTime = new Date(b.endISO).toTimeString().slice(0, 5);
					return {
						date: dateStr,
						start: startTime,
						end: endTime,
						reason: b.reason || undefined,
					};
				});
			
			const memoryBlocks = d.defaultBlocks || [];
			const allBlocks = [...memoryBlocks];
			for (const dbBlock of designerBlocks) {
				const exists = allBlocks.some(
					mb => mb.date === dbBlock.date && mb.start === dbBlock.start && mb.end === dbBlock.end
				);
				if (!exists) {
					allBlocks.push(dbBlock);
				}
			}
			
			return {
				id: d.id,
				name: d.name,
				breaks: d.breaks || [],
				recurringBreaks: d.recurringBreaks || [],
				defaultBlocks: allBlocks.sort((a, b) => a.date.localeCompare(b.date)),
			};
		});
		return NextResponse.json(result);
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}


