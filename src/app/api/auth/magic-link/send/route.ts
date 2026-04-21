import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/tokens";
import { sendMagicLinkEmail } from "@/lib/email";
import { isValidEmail } from "@/lib/validations";
import { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Email is required", statusCode: 400 },
                { status: 400 }
            );
        }

        if (!isValidEmail(email)) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Invalid email format", statusCode: 422 },
                { status: 422 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Rate limit: check if a magic link was sent in the last 60 seconds
        const recentToken = await prisma.magicLinkToken.findFirst({
            where: {
                email: normalizedEmail,
                createdAt: { gt: new Date(Date.now() - 60 * 1000) }, // within last 60 seconds
            },
        });

        if (recentToken) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Please wait 60 seconds before requesting another link.", statusCode: 429 },
                { status: 429 }
            );
        }

        // Delete any old magic link tokens for this email
        await prisma.magicLinkToken.deleteMany({
            where: { email: normalizedEmail },
        });

        // Generate new token (15 min expiry)
        const plainToken = generateToken();
        const hashedToken = hashToken(plainToken);

        await prisma.magicLinkToken.create({
            data: {
                email: normalizedEmail,
                token: hashedToken,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            },
        });

        // Send magic link email
        await sendMagicLinkEmail(normalizedEmail, plainToken);

        return NextResponse.json<ApiResponse>(
            {
                success: true,
                message: "Magic link sent! Check your email inbox.",
                statusCode: 200,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Magic link send error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, message: "Internal server error", statusCode: 500 },
            { status: 500 }
        );
    }
}
