import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
	if (req.nextUrl.pathname.startsWith("/admin")) {
		const session = req.cookies.get("admin_session")?.value;
		// 로그인 페이지와 등록 페이지는 세션 체크 제외
		if (session !== "ok" && !req.nextUrl.pathname.startsWith("/admin/login") && !req.nextUrl.pathname.startsWith("/admin/register")) {
			const url = req.nextUrl.clone();
			url.pathname = "/admin/login";
			return NextResponse.redirect(url);
		}
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/admin/:path*"],
};


