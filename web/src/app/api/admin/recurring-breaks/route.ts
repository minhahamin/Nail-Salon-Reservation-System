import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { designerId, weekday, start, end } = body ?? {};
		if (!designerId || weekday === undefined || !start || !end) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}
		
		const designer = await prisma.designer.findUnique({
			where: { id: designerId },
		});
		
		if (!designer) {
			return NextResponse.json({ message: "Designer not found" }, { status: 404 });
		}
		
		const recurringBreaks = designer.recurringBreaks ? JSON.parse(designer.recurringBreaks) : [];
		const newRecurringBreak = { weekday: Number(weekday), start, end };
		
		// 중복 체크
		const exists = recurringBreaks.some(
			(rb: { weekday: number; start: string; end: string }) =>
				rb.weekday === Number(weekday) && rb.start === start && rb.end === end
		);
		if (exists) {
			return NextResponse.json({ message: "이미 존재하는 반복 브레이크입니다." }, { status: 400 });
		}
		
		recurringBreaks.push(newRecurringBreak);
		
		await prisma.designer.update({
			where: { id: designerId },
			data: {
				recurringBreaks: JSON.stringify(recurringBreaks),
			},
		});
		
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Error adding recurring break:", error);
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
		
		const designer = await prisma.designer.findUnique({
			where: { id: designerId },
		});
		
		if (!designer) {
			return NextResponse.json({ message: "Designer not found" }, { status: 404 });
		}
		
		const recurringBreaks = designer.recurringBreaks ? JSON.parse(designer.recurringBreaks) : [];
		const index = recurringBreaks.findIndex(
			(rb: { weekday: number; start: string; end: string }) =>
				rb.weekday === Number(weekday) && rb.start === start && rb.end === end
		);
		
		if (index === -1) {
			return NextResponse.json({ message: "Recurring break not found" }, { status: 404 });
		}
		
		recurringBreaks.splice(index, 1);
		
		await prisma.designer.update({
			where: { id: designerId },
			data: {
				recurringBreaks: recurringBreaks.length > 0 ? JSON.stringify(recurringBreaks) : null,
			},
		});
		
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Error deleting recurring break:", error);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

export async function GET(req: NextRequest) {
	try {
		console.log("[GET /api/admin/recurring-breaks] Request received");
		const designerId = req.nextUrl.searchParams.get("designerId");
		console.log("[GET /api/admin/recurring-breaks] designerId:", designerId);
		
		if (designerId) {
			const designer = await prisma.designer.findUnique({
				where: { id: designerId },
			});
			
			if (!designer) {
				console.error(`[GET /api/admin/recurring-breaks] Designer not found: ${designerId}`);
				return NextResponse.json({ message: "Designer not found" }, { status: 404 });
			}
			
			console.log("[GET /api/admin/recurring-breaks] Designer found:", designer.id);
			
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
			
			// 데이터베이스의 defaultBlocks와 Block 테이블의 데이터를 합침
			const dbDefaultBlocksFromDesigner = designer.defaultBlocks ? JSON.parse(designer.defaultBlocks) : [];
			const allBlocks = [...dbDefaultBlocksFromDesigner];
			for (const dbBlock of dbDefaultBlocks) {
				const exists = allBlocks.some(
					(mb: { date: string; start: string; end: string }) =>
						mb.date === dbBlock.date && mb.start === dbBlock.start && mb.end === dbBlock.end
				);
				if (!exists) {
					allBlocks.push(dbBlock);
				}
			}
			
			return NextResponse.json({
				breaks: designer.breaks ? JSON.parse(designer.breaks) : [],
				recurringBreaks: designer.recurringBreaks ? JSON.parse(designer.recurringBreaks) : [],
				defaultBlocks: allBlocks.sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date)),
			});
		}
		
		// 모든 디자이너 정보 반환
		const designers = await prisma.designer.findMany();
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
			
			const dbDefaultBlocks = d.defaultBlocks ? JSON.parse(d.defaultBlocks) : [];
			const allBlocks = [...dbDefaultBlocks];
			for (const dbBlock of designerBlocks) {
				const exists = allBlocks.some(
					(mb: { date: string; start: string; end: string }) =>
						mb.date === dbBlock.date && mb.start === dbBlock.start && mb.end === dbBlock.end
				);
				if (!exists) {
					allBlocks.push(dbBlock);
				}
			}
			
			return {
				id: d.id,
				name: d.name,
				breaks: d.breaks ? JSON.parse(d.breaks) : [],
				recurringBreaks: d.recurringBreaks ? JSON.parse(d.recurringBreaks) : [],
				defaultBlocks: allBlocks.sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date)),
			};
		});
		
		return NextResponse.json(result);
	} catch (error) {
		console.error("[GET /api/admin/recurring-breaks] Error:", error);
		return NextResponse.json({ 
			message: "Server error",
			error: error instanceof Error ? error.message : String(error)
		}, { status: 500 });
	}
}


