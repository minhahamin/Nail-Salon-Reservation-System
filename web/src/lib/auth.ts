import { cookies } from "next/headers";

export const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
export const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin1234";
const COOKIE_NAME = "admin_session";

export function verifyAdminCredentials(username: string, password: string): boolean {
	return username === ADMIN_USER && password === ADMIN_PASS;
}

export function setAdminSessionCookie() {
	cookies().set({
		name: COOKIE_NAME,
		value: "ok",
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
	});
}

export function clearAdminSessionCookie() {
	cookies().set({
		name: COOKIE_NAME,
		value: "",
		httpOnly: true,
		path: "/",
		maxAge: 0,
	});
}

export function isAdminAuthenticated(): boolean {
	const c = cookies().get(COOKIE_NAME);
	return c?.value === "ok";
}


