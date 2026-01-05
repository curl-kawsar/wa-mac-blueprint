import { NextResponse } from 'next/server';
import { isConnected, getConnectionState, connectDB } from '@/lib/db/mongoose';

/**
 * Health check endpoint for Docker health checks and monitoring
 * GET /api/health
 */
export async function GET() {
    try {
        // Attempt to connect if not connected
        if (!isConnected()) {
            await connectDB();
        }

        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: {
                status: isConnected() ? 'connected' : 'disconnected',
                state: getConnectionState(),
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                unit: 'MB',
            },
        };

        return NextResponse.json(health, { status: 200 });
    } catch (error) {
        const errorResponse = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            database: {
                status: 'error',
                state: getConnectionState(),
            },
        };

        return NextResponse.json(errorResponse, { status: 503 });
    }
}
