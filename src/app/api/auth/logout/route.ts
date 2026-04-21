import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { clearRefreshTokenCookie } from "@/lib/cookies";
import { ApiResponse } from "@/types";

export async function POST() {
    try {
        const currentUser = await getCurrentUser();

        if (currentUser) {
            await prisma.session.deleteMany({
                where: { userId: currentUser.userId },
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
