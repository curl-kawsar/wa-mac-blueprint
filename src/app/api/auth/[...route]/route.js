import { NextResponse } from 'next/server';
import {
    register,
    login,
    refreshAccessToken,
    logout,
    getUserById,
    changePassword,
    updateProfile,
} from '@/modules/auth/auth.service';
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    changePasswordSchema,
    updateProfileSchema,
    validate,
} from '@/modules/auth/auth.schema';
import { authenticate } from '@/lib/rbac/middleware';
import { connectDB } from '@/lib/db/mongoose';

/**
 * Rate limiting store (in-memory for simplicity)
 * In production, use Redis or similar
 */
const rateLimitStore = new Map();

/**
 * Simple rate limiter for auth endpoints
 */
function checkRateLimit(identifier, maxRequests = 5, windowMs = 900000) {
    const now = Date.now();
    const key = `auth:${identifier}`;

    const record = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };

    // Reset if window expired
    if (now > record.resetAt) {
        record.count = 0;
        record.resetAt = now + windowMs;
    }

    record.count++;
    rateLimitStore.set(key, record);

    if (record.count > maxRequests) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000);
        return { allowed: false, retryAfter };
    }

    return { allowed: true, remaining: maxRequests - record.count };
}

/**
 * Get client IP from request
 */
function getClientIP(request) {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'
    );
}

/**
 * Get request context for audit logging
 */
function getContext(request) {
    return {
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent'),
        route: request.url,
        method: request.method,
    };
}

/**
 * POST /api/auth/register
 * Register a new user
 */
async function handleRegister(request) {
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(ip, 3, 3600000); // 3 per hour

    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'Too many registration attempts. Please try again later.' },
            {
                status: 429,
                headers: { 'Retry-After': rateLimit.retryAfter.toString() },
            }
        );
    }

    try {
        const body = await request.json();
        const validation = validate(registerSchema, body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.errors },
                { status: 400 }
            );
        }

        const result = await register(validation.data, getContext(request));

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        if (error.message === 'Email already registered') {
            return NextResponse.json(
                { error: error.message },
                { status: 409 }
            );
        }

        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Registration failed' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/auth/login
 * Login user
 */
async function handleLogin(request) {
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(ip, 5, 900000); // 5 per 15 minutes

    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'Too many login attempts. Please try again later.' },
            {
                status: 429,
                headers: { 'Retry-After': rateLimit.retryAfter.toString() },
            }
        );
    }

    try {
        const body = await request.json();
        const validation = validate(loginSchema, body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.errors },
                { status: 400 }
            );
        }

        const result = await login(
            validation.data.email,
            validation.data.password,
            getContext(request)
        );

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { error: error.message || 'Login failed' },
            { status: 401 }
        );
    }
}

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
async function handleRefresh(request) {
    try {
        const body = await request.json();
        const validation = validate(refreshTokenSchema, body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.errors },
                { status: 400 }
            );
        }

        const result = await refreshAccessToken(
            validation.data.refreshToken,
            getContext(request)
        );

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { error: error.message || 'Token refresh failed' },
            { status: 401 }
        );
    }
}

/**
 * POST /api/auth/logout
 * Logout user
 */
async function handleLogout(request) {
    const authResult = await authenticate(request);

    if (authResult.error) {
        return authResult.error;
    }

    try {
        const body = await request.json().catch(() => ({}));

        await logout(
            authResult.user.id,
            body.refreshToken,
            getContext(request)
        );

        return NextResponse.json({ message: 'Logged out successfully' });
    } catch (error) {
        return NextResponse.json(
            { error: 'Logout failed' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/auth/me
 * Get current user profile
 */
async function handleMe(request) {
    const authResult = await authenticate(request);

    if (authResult.error) {
        return authResult.error;
    }

    try {
        const user = await getUserById(authResult.user.id);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to get user profile' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/auth/me
 * Update current user profile
 */
async function handleUpdateMe(request) {
    const authResult = await authenticate(request);

    if (authResult.error) {
        return authResult.error;
    }

    try {
        const body = await request.json();
        const validation = validate(updateProfileSchema, body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.errors },
                { status: 400 }
            );
        }

        const user = await updateProfile(authResult.user.id, validation.data);

        return NextResponse.json({ user });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/auth/change-password
 * Change password
 */
async function handleChangePassword(request) {
    const authResult = await authenticate(request);

    if (authResult.error) {
        return authResult.error;
    }

    try {
        const body = await request.json();
        const validation = validate(changePasswordSchema, body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.errors },
                { status: 400 }
            );
        }

        await changePassword(
            authResult.user.id,
            validation.data.currentPassword,
            validation.data.newPassword,
            getContext(request)
        );

        return NextResponse.json({ message: 'Password changed successfully' });
    } catch (error) {
        if (error.message === 'Current password is incorrect') {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to change password' },
            { status: 500 }
        );
    }
}

/**
 * Route handler for auth endpoints
 */
export async function POST(request, { params }) {
    await connectDB();

    const route = params.route?.join('/') || '';

    switch (route) {
        case 'register':
            return handleRegister(request);
        case 'login':
            return handleLogin(request);
        case 'refresh':
            return handleRefresh(request);
        case 'logout':
            return handleLogout(request);
        case 'change-password':
            return handleChangePassword(request);
        default:
            return NextResponse.json(
                { error: 'Not found' },
                { status: 404 }
            );
    }
}

export async function GET(request, { params }) {
    await connectDB();

    const route = params.route?.join('/') || '';

    switch (route) {
        case 'me':
            return handleMe(request);
        default:
            return NextResponse.json(
                { error: 'Not found' },
                { status: 404 }
            );
    }
}

export async function PATCH(request, { params }) {
    await connectDB();

    const route = params.route?.join('/') || '';

    switch (route) {
        case 'me':
            return handleUpdateMe(request);
        default:
            return NextResponse.json(
                { error: 'Not found' },
                { status: 404 }
            );
    }
}
