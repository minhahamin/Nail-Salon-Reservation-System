import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json({ message: "파일이 없습니다." }, { status: 400 });
		}

		// 이미지 파일만 허용
		if (!file.type.startsWith("image/")) {
			return NextResponse.json({ message: "이미지 파일만 업로드 가능합니다." }, { status: 400 });
		}

		// 파일 크기 제한 (5MB)
		if (file.size > 5 * 1024 * 1024) {
			return NextResponse.json({ message: "파일 크기는 5MB 이하여야 합니다." }, { status: 400 });
		}

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// 파일명 생성 (타임스탬프 + 원본 파일명)
		const timestamp = Date.now();
		const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
		const fileName = `${timestamp}-${originalName}`;

		// 업로드 디렉토리 생성
		const uploadDir = join(process.cwd(), "public", "uploads", "designers");
		if (!existsSync(uploadDir)) {
			await mkdir(uploadDir, { recursive: true });
		}

		// 파일 저장
		const filePath = join(uploadDir, fileName);
		await writeFile(filePath, buffer);

		// URL 반환
		const imageUrl = `/uploads/designers/${fileName}`;

		return NextResponse.json({ imageUrl }, { status: 200 });
	} catch (error) {
		console.error("Error uploading file:", error);
		return NextResponse.json({ message: "파일 업로드 실패" }, { status: 500 });
	}
}

