import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRefreshTokenCookie, clearRefreshTokenCookie } from "@/lib/cookies";
import { hashToken } from "@/lib/tokens";
import { ApiResponse } from "@/types";

export async function POST() {
    try {
        const currentUser = await getCurrentUser();

        if (currentUser) {
            // If we have a valid JWT, delete ALL sessions for this user
            await prisma.session.deleteMany({
                where: { userId: currentUser.userId },
            });
        } else {
            // Fallback: use the refresh token cookie to find and delete the session
            const refreshToken = await getRefreshTokenCookie();
            if (refreshToken) {
                const hashedToken = hashToken(refreshToken);
                const session = await prisma.session.findFirst({
                    where: { refreshToken: hashedToken },
                });
                if (session) {
                    await prisma.session.deleteMany({
                        where: { userId: session.userId },
                    });
                }
            }
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
