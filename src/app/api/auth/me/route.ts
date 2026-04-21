import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRefreshTokenCookie, clearRefreshTokenCookie } from "@/lib/cookies";
import { hashToken } from "@/lib/tokens";
import { ApiResponse, UserResponse } from "@/types";

export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Not authenticated", statusCode: 401 },
                { status: 401 }
            );
        }

        const refreshToken = await getRefreshTokenCookie();

        if (!refreshToken) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Session expired. Please login again.", statusCode: 401 },
                { status: 401 }
            );
        }

        const hashedToken = hashToken(refreshToken);
        const session = await prisma.session.findFirst({
            where: {
                refreshToken: hashedToken,
                expiresAt: { gt: new Date() },
            },
        });

        if (!session) {
            await clearRefreshTokenCookie();
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Session expired. Please login again.", statusCode: 401 },
                { status: 401 }
            );
        }

        if (session.userId !== currentUser.userId) {
            await clearRefreshTokenCookie();
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Session mismatch. Please login again.", statusCode: 401 },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: currentUser.userId },
        });

        if (!user) {
            await prisma.session.deleteMany({ where: { id: session.id } });
            await clearRefreshTokenCookie();
            return NextResponse.json<ApiResponse>(
                { success: false, message: "User not found", statusCode: 404 },
                { status: 404 }
            );
        }

        const userResponse: UserResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt.toISOString(),
        };

        return NextResponse.json<ApiResponse<UserResponse>>(
            { success: true, message: "User retrieved successfully", data: userResponse, statusCode: 200 },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get me error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, message: "Internal server error", statusCode: 500 },
            { status: 500 }
        );
    }
}
