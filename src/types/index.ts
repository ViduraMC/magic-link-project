export interface ApiResponse<T = undefined> {
    success: boolean;
    message: string;
    data?: T;
    statusCode: number;
}

export interface UserResponse {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    createdAt: string;
}

export interface SessionResponse {
    id: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    expiresAt: string;
}
