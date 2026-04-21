import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { setRefreshTokenCookie } from "@/lib/cookies";
import { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, email } = body;

        if (!token || !email) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Token and email are required", statusCode: 400 },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Find and validate the magic link token
        const hashedToken = hashToken(token);

        const magicLinkToken = await prisma.magicLinkToken.findFirst({
            where: {
                token: hashedToken,
                email: normalizedEmail,
                expiresAt: { gt: new Date() },
            },
        });

        if (!magicLinkToken) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Invalid or expired magic link. Please request a new one.", statusCode: 400 },
                { status: 400 }
            );
        }

        // Delete the token immediately (single-use)
        await prisma.magicLinkToken.delete({ where: { id: magicLinkToken.id } });

        // Find or create the user (auto-registration)
        let user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    emailVerified: true,
                },
            });
        }

        // Clean up expired sessions before creating a new one
        await prisma.session.deleteMany({
            where: {
                userId: user.id,
                expiresAt: { lt: new Date() },
            },
        });

        // Enforce 2-session limit (delete oldest if at limit)
        const activeSessions = await prisma.session.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "asc" },
        });

        if (activeSessions.length >= 2) {
            await prisma.session.delete({
                where: { id: activeSessions[0].id },
            });
        }

        // Generate tokens
        const tokenPayload = { userId: user.id, email: user.email };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Get request metadata
        const userAgent = request.headers.get("user-agent") || "Unknown";
        const forwarded = request.headers.get("x-forwarded-for");
        const ipAddress = forwarded?.split(",")[0].trim() || "Unknown";

        // Create session
        const hashedRefreshToken = hashToken(refreshToken);

        await prisma.session.create({
            data: {
                userId: user.id,
                refreshToken: hashedRefreshToken,
                userAgent,
                ipAddress,
                expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
            },
        });

        // Set refresh token cookie
        await setRefreshTokenCookie(refreshToken);

        return NextResponse.json<ApiResponse<{ accessToken: string }>>(
            {
                success: true,
                message: "Logged in successfully",
                data: { accessToken },
                statusCode: 200,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Magic link verify error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, message: "Internal server error", statusCode: 500 },
            { status: 500 }
        );
    }
}
