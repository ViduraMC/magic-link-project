import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getRefreshTokenCookie, clearRefreshTokenCookie } from "@/lib/cookies";
import { hashToken } from "@/lib/tokens";
import { ApiResponse } from "@/types";

export async function POST() {
    try {
        // Find and delete ONLY the current session using the cookie
        const refreshToken = await getRefreshTokenCookie();

        if (refreshToken) {
            const hashedToken = hashToken(refreshToken);
            await prisma.session.deleteMany({
                where: { refreshToken: hashedToken },
            });
        }

        await clearRefreshTokenCookie();

        return NextResponse.json<ApiResponse>(
            { success: true, message: "Logged out successfully", statusCode: 200 },
            { status: 200 }
        );
    } catch (error) {
        console.error("Logout error:", error);
        await clearRefreshTokenCookie();
        return NextResponse.json<ApiResponse>(
            { success: true, message: "Logged out", statusCode: 200 },
            { status: 200 }
        );
    }
}
