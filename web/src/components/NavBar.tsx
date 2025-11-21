'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
	const pathname = usePathname();
	const isActive = (href: string) => pathname?.startsWith(href);
	return (
		<div className="sticky top-0 z-10 w-full bg-gradient-to-r from-pink-100 via-purple-50 to-pink-100 backdrop-blur-md shadow-sm border-b border-pink-200/50">
			<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
				<div className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
					💅 Nail Salon
				</div>
				<nav className="flex gap-2">
					<Link
						href="/booking"
						className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
							isActive("/booking")
								? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md"
								: "text-gray-700 hover:bg-white/60 hover:shadow-sm"
						}`}
					>
						예약
					</Link>
					<Link
						href="/my"
						className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
							isActive("/my")
								? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md"
								: "text-gray-700 hover:bg-white/60 hover:shadow-sm"
						}`}
					>
						마이페이지
					</Link>
					<Link
						href="/admin"
						className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
							isActive("/admin")
								? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md"
								: "text-gray-700 hover:bg-white/60 hover:shadow-sm"
						}`}
					>
						관리자
					</Link>
				</nav>
			</div>
		</div>
	);
}


