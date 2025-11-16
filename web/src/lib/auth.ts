import { cookies } from "next/headers";

export const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
export const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin1234";
const COOKIE_NAME = "admin_session";

export function verifyAdminCredentials(username: string, password: string): boolean {
	return username === ADMIN_USER && password === ADMIN_PASS;
}

export async function setAdminSessionCookie() {
	const jar = await cookies();
	jar.set({
		name: COOKIE_NAME,
		value: "ok",
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
	});
}

export async function clearAdminSessionCookie() {
	const jar = await cookies();
	jar.set({
		name: COOKIE_NAME,
		value: "",
		httpOnly: true,
		path: "/",
		maxAge: 0,
	});
}

export async function isAdminAuthenticated(): Promise<boolean> {
	const jar = await cookies();
	const c = jar.get(COOKIE_NAME);
	return c?.value === "ok";
}


