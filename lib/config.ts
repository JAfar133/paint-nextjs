import dotenv from 'dotenv'
dotenv.config();

export const BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_HTTP_URL || 'http://localhost:8000/'

export const BASE_SOCKET_URL =
    process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'ws://localhost:8000/'