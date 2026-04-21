import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@/lib/jwt";
import { getRefreshTokenCookie, setRefreshTokenCookie, clearRefreshTokenCookie } from "@/lib/cookies";
import { hashToken } from "@/lib/tokens";
import { ApiResponse } from "@/types";

export async function POST() {
    try {
        const refreshToken = await getRefreshTokenCookie();

        if (!refreshToken) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "No refresh token", statusCode: 401 },
                { status: 401 }
            );
        }

        // Verify JWT signature
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            await clearRefreshTokenCookie();
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Invalid refresh token", statusCode: 401 },
                { status: 401 }
            );
        }

        // Find session in DB
        const hashedToken = hashToken(refreshToken);
        const session = await prisma.session.findFirst({
            where: {
                refreshToken: hashedToken,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });

        if (!session) {
            await clearRefreshTokenCookie();
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Session expired. Please login again.", statusCode: 401 },
                { status: 401 }
            );
        }

        // Generate new tokens (rotation)
        const newAccessToken = generateAccessToken({ userId: session.user.id, email: session.user.email });
        const newRefreshToken = generateRefreshToken({ userId: session.user.id, email: session.user.email });
        const newHashedRefreshToken = hashToken(newRefreshToken);

        // Update session with new refresh token
        await prisma.session.update({
            where: { id: session.id },
            data: {
                refreshToken: newHashedRefreshToken,
                expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
            },
        });

        await setRefreshTokenCookie(newRefreshToken);

        return NextResponse.json<ApiResponse<{ accessToken: string }>>(
            {
                success: true,
                message: "Token refreshed",
                data: { accessToken: newAccessToken },
                statusCode: 200,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Refresh error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, message: "Internal server error", statusCode: 500 },
            { status: 500 }
        );
    }
}
