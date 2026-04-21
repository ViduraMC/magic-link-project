import { cookies } from "next/headers";
import { serialize } from "cookie";

const REFRESH_TOKEN_COOKIE = "refreshToken";
const COOKIE_MAX_AGE = 14 * 24 * 60 * 60; // 14 days in seconds

export async function setRefreshTokenCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(REFRESH_TOKEN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
    });
}

export async function getRefreshTokenCookie(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
}

export async function clearRefreshTokenCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(REFRESH_TOKEN_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });
}
