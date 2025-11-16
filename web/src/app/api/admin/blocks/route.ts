import { NextRequest, NextResponse } from "next/server";
import { manualBlocks } from "@/lib/data";
import { Block } from "@/lib/types";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { designerId, startISO, endISO, reason } = body ?? {};
		if (!designerId || !startISO || !endISO) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}
		const block: Block = {
			id: `blk-${Date.now()}`,
			designerId,
			startISO,
			endISO,
			reason,
		};
		await prisma.block.create({
			data: {
				id: block.id,
				designerId: block.designerId,
				startISO: block.startISO,
				endISO: block.endISO,
				reason: block.reason,
			},
		});
		manualBlocks.push(block); // 메모리 동기화
		return NextResponse.json(block, { status: 201 });
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const body = await req.json();
		const { blockId } = body ?? {};
		const idx = manualBlocks.findIndex(b => b.id === blockId);
		if (idx === -1) return NextResponse.json({ message: "Not found" }, { status: 404 });
		await prisma.block.delete({ where: { id: blockId } });
		const removed = manualBlocks.splice(idx, 1)[0];
		return NextResponse.json(removed);
	} catch {
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}


