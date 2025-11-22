'use client';
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminRegisterPage() {
	const router = useRouter();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const submit = async (e?: FormEvent) => {
		e?.preventDefault();
		
		if (!username || !password || !confirmPassword) {
			setError("모든 필드를 입력해주세요.");
			return;
		}
		
		if (username.length < 3) {
			setError("사용자명은 최소 3자 이상이어야 합니다.");
			return;
		}
		
		if (password.length < 4) {
			setError("비밀번호는 최소 4자 이상이어야 합니다.");
			return;
		}
		
		if (password !== confirmPassword) {
			setError("비밀번호가 일치하지 않습니다.");
			return;
		}
		
		setError("");
		setSuccess("");
		setIsLoading(true);
		
		try {
			const res = await fetch("/api/admin/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});
			
			const data = await res.json();
			
			if (res.ok) {
				setSuccess("관리자 계정이 생성되었습니다. 로그인 페이지로 이동합니다...");
				setTimeout(() => {
					router.push("/admin/login");
				}, 2000);
			} else {
				setError(data.message || "계정 생성 중 오류가 발생했습니다.");
			}
		} catch (err) {
			setError("계정 생성 중 오류가 발생했습니다.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-pink-200 flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				{/* 로고/타이틀 영역 */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 mb-4 shadow-lg">
						<svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
						</svg>
					</div>
					<h1 className="text-3xl font-bold text-gray-800 mb-2">관리자 등록</h1>
					<p className="text-gray-600 text-sm">새 관리자 계정을 생성합니다</p>
				</div>

				{/* 등록 카드 */}
				<div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
					<form onSubmit={submit} className="space-y-5">
						{/* 사용자명 입력 */}
						<div>
							<label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
								사용자명
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
								</div>
								<input
									id="username"
									type="text"
									className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
									placeholder="사용자명을 입력하세요 (최소 3자)"
									value={username}
									onChange={e => setUsername(e.target.value)}
									disabled={isLoading}
									autoComplete="username"
								/>
							</div>
						</div>

						{/* 비밀번호 입력 */}
						<div>
							<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
								비밀번호
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
								</div>
								<input
									id="password"
									type="password"
									className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
									placeholder="비밀번호를 입력하세요 (최소 4자)"
									value={password}
									onChange={e => setPassword(e.target.value)}
									disabled={isLoading}
									autoComplete="new-password"
								/>
							</div>
						</div>

						{/* 비밀번호 확인 */}
						<div>
							<label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
								비밀번호 확인
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
									</svg>
								</div>
								<input
									id="confirmPassword"
									type="password"
									className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
									placeholder="비밀번호를 다시 입력하세요"
									value={confirmPassword}
									onChange={e => setConfirmPassword(e.target.value)}
									disabled={isLoading}
									autoComplete="new-password"
								/>
							</div>
						</div>

						{/* 에러 메시지 */}
						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
								<svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
								</svg>
								<span className="text-sm">{error}</span>
							</div>
						)}

						{/* 성공 메시지 */}
						{success && (
							<div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
								<svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
								</svg>
								<span className="text-sm">{success}</span>
							</div>
						)}

						{/* 등록 버튼 */}
						<button
							type="submit"
							disabled={isLoading}
							className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
						>
							{isLoading ? (
								<>
									<svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									<span>등록 중...</span>
								</>
							) : (
								<>
									<span>계정 등록</span>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
									</svg>
								</>
							)}
						</button>
					</form>

					{/* 로그인 링크 */}
					<div className="mt-6 text-center">
						<a
							href="/admin/login"
							className="text-sm text-pink-600 hover:text-pink-700 font-medium"
						>
							이미 계정이 있으신가요? 로그인하기
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}

