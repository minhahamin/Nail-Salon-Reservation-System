import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "admin_session";

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
	try {
		const admin = await prisma.admin.findUnique({
			where: { username },
		});
		
		if (!admin) {
			return false;
		}
		
		return await bcrypt.compare(password, admin.password);
	} catch (error) {
		console.error("Error verifying admin credentials:", error);
		return false;
	}
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


