import { NextRequest, NextResponse } from "next/server";
import { manualBlocks, designers } from "@/lib/data";
import { Block } from "@/lib/types";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { designerId, startISO, endISO, reason } = body ?? {};
		if (!designerId || !startISO || !endISO) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}
		
		// 날짜와 시간 추출 (YYYY-MM-DD 형식으로)
		const startDate = new Date(startISO);
		const dateStr = startDate.toISOString().slice(0, 10); // YYYY-MM-DD
		const startTime = startDate.toTimeString().slice(0, 5); // HH:MM
		const endTime = new Date(endISO).toTimeString().slice(0, 5); // HH:MM
		
		const block: Block = {
			id: `blk-${Date.now()}`,
			designerId,
			startISO,
			endISO,
			reason,
		};
		
		// 데이터베이스에 저장
		await prisma.block.create({
			data: {
				id: block.id,
				designerId: block.designerId,
				startISO: block.startISO,
				endISO: block.endISO,
				reason: block.reason,
			},
		});
		
		// 메모리 동기화
		manualBlocks.push(block);
		
		// 디자이너의 defaultBlocks에도 추가
		const designer = designers.find(d => d.id === designerId);
		if (designer) {
			designer.defaultBlocks = designer.defaultBlocks || [];
			// 중복 체크
			const exists = designer.defaultBlocks.some(
				db => db.date === dateStr && db.start === startTime && db.end === endTime
			);
			if (!exists) {
				designer.defaultBlocks.push({
					date: dateStr,
					start: startTime,
					end: endTime,
					reason: reason || undefined,
				});
			}
		}
		
		return NextResponse.json(block, { status: 201 });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const body = await req.json();
		const { blockId } = body ?? {};
		
		// 데이터베이스에서 먼저 조회
		const blockDb = await prisma.block.findUnique({ where: { id: blockId } });
		if (!blockDb) return NextResponse.json({ message: "Not found" }, { status: 404 });
		
		// 날짜와 시간 추출
		const startDate = new Date(blockDb.startISO);
		const dateStr = startDate.toISOString().slice(0, 10);
		const startTime = startDate.toTimeString().slice(0, 5);
		const endTime = new Date(blockDb.endISO).toTimeString().slice(0, 5);
		
		// 데이터베이스에서 삭제
		await prisma.block.delete({ where: { id: blockId } });
		
		// 메모리에서 삭제
		const idx = manualBlocks.findIndex(b => b.id === blockId);
		if (idx !== -1) {
			manualBlocks.splice(idx, 1);
		}
		
		// 디자이너의 defaultBlocks에서도 삭제
		const designer = designers.find(d => d.id === blockDb.designerId);
		if (designer && designer.defaultBlocks) {
			const blockIdx = designer.defaultBlocks.findIndex(
				db => db.date === dateStr && db.start === startTime && db.end === endTime
			);
			if (blockIdx !== -1) {
				designer.defaultBlocks.splice(blockIdx, 1);
			}
		}
		
		return NextResponse.json({ id: blockId, designerId: blockDb.designerId, startISO: blockDb.startISO, endISO: blockDb.endISO });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}


