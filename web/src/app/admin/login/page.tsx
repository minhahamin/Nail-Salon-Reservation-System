'use client';
import { useState } from "react";
import { redirect } from "next/navigation";

export default function AdminLoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const submit = async () => {
		setError("");
		const res = await fetch("/api/admin/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});
		if (res.ok) {
			location.href = "/admin";
		} else {
			setError("아이디 또는 비밀번호가 올바르지 않습니다.");
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200 p-6 text-black">
			<div className="mx-auto mt-24 max-w-sm rounded border bg-white/70 p-6">
				<h1 className="mb-4 text-xl font-semibold">관리자 로그인</h1>
				<div className="space-y-3">
					<input className="w-full rounded border px-3 py-2 text-black" placeholder="아이디" value={username} onChange={e => setUsername(e.target.value)} />
					<input className="w-full rounded border px-3 py-2 text-black" placeholder="비밀번호" type="password" value={password} onChange={e => setPassword(e.target.value)} />
					{error && <div className="rounded border border-red-600 bg-red-100 p-2 text-sm">{error}</div>}
					<button className="w-full rounded bg-gray-900 px-3 py-2 text-white hover:bg-black" onClick={submit}>
						로그인
					</button>
				</div>
			</div>
		</div>
	);
}


