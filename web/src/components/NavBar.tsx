'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
	const pathname = usePathname();
	const isActive = (href: string) => pathname?.startsWith(href);
	return (
		<div className="sticky top-0 z-10 w-full border-b bg-white/80 backdrop-blur">
			<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
				<div className="text-sm font-semibold text-black">Nail Salon</div>
				<nav className="flex gap-2">
					<Link
						href="/booking"
						className={`rounded px-3 py-1.5 text-sm ${isActive("/booking") ? "bg-pink-200 border" : "hover:bg-pink-100"} text-black`}
					>
						예약
					</Link>
					<Link
						href="/my"
						className={`rounded px-3 py-1.5 text-sm ${isActive("/my") ? "bg-pink-200 border" : "hover:bg-pink-100"} text-black`}
					>
						마이페이지
					</Link>
					<Link
						href="/admin"
						className={`rounded px-3 py-1.5 text-sm ${isActive("/admin") ? "bg-pink-200 border" : "hover:bg-pink-100"} text-black`}
					>
						관리자
					</Link>
				</nav>
			</div>
		</div>
	);
}


