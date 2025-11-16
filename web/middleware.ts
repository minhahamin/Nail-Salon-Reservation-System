import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
	if (req.nextUrl.pathname.startsWith("/admin")) {
		const session = req.cookies.get("admin_session")?.value;
		if (session !== "ok" && !req.nextUrl.pathname.startsWith("/admin/login")) {
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


