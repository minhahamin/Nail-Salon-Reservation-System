type Counter = { count: number; resetAt: number };

const store = new Map<string, Counter>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; resetAt: number } {
	const now = Date.now();
	const current = store.get(key);
	if (!current || now > current.resetAt) {
		const resetAt = now + windowMs;
		store.set(key, { count: 1, resetAt });
		return { ok: true, remaining: limit - 1, resetAt };
	}
	if (current.count >= limit) {
		return { ok: false, remaining: 0, resetAt: current.resetAt };
	}
	current.count += 1;
	return { ok: true, remaining: limit - current.count, resetAt: current.resetAt };
}

export function getClientIp(headers: Headers): string {
	const fwd = headers.get("x-forwarded-for");
	if (fwd) return fwd.split(",")[0].trim();
	const realIp = headers.get("x-real-ip");
	if (realIp) return realIp;
	return "unknown";
}


