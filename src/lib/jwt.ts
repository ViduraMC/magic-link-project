import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set");
}

export interface AccessTokenPayload {
    userId: string;
    email: string;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, ACCESS_SECRET!, { expiresIn: "15m" });
}

export function generateRefreshToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, REFRESH_SECRET!, { expiresIn: "14d" });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, ACCESS_SECRET!) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): AccessTokenPayload {
    return jwt.verify(token, REFRESH_SECRET!) as AccessTokenPayload;
}
