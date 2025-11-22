import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { designerId, start, end } = body ?? {};
		if (!designerId || !start || !end) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}
		
		const designer = await prisma.designer.findUnique({
			where: { id: designerId },
		});
		
		if (!designer) {
			return NextResponse.json({ message: "Designer not found" }, { status: 404 });
		}
		
		const breaks = designer.breaks ? JSON.parse(designer.breaks) : [];
		const newBreak = { start, end };
		
		// 중복 체크
		const exists = breaks.some((b: { start: string; end: string }) => b.start === start && b.end === end);
		if (exists) {
			return NextResponse.json({ message: "이미 존재하는 브레이크입니다." }, { status: 400 });
		}
		
		breaks.push(newBreak);
		
		await prisma.designer.update({
			where: { id: designerId },
			data: {
				breaks: JSON.stringify(breaks),
			},
		});
		
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Error adding break:", error);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const body = await req.json();
		const { designerId, start, end } = body ?? {};
		if (!designerId || !start || !end) {
			return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
		}
		
		const designer = await prisma.designer.findUnique({
			where: { id: designerId },
		});
		
		if (!designer) {
			return NextResponse.json({ message: "Designer not found" }, { status: 404 });
		}
		
		const breaks = designer.breaks ? JSON.parse(designer.breaks) : [];
		const index = breaks.findIndex((b: { start: string; end: string }) => b.start === start && b.end === end);
		
		if (index === -1) {
			return NextResponse.json({ message: "Break not found" }, { status: 404 });
		}
		
		breaks.splice(index, 1);
		
		await prisma.designer.update({
			where: { id: designerId },
			data: {
				breaks: breaks.length > 0 ? JSON.stringify(breaks) : null,
			},
		});
		
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Error deleting break:", error);
		return NextResponse.json({ message: "Server error" }, { status: 500 });
	}
}

