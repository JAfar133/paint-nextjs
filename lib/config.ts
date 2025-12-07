import dotenv from 'dotenv'
dotenv.config();

export const BASE_URL = process.env.BACKEND_HTTP_URL || 'http://localhost:5045/'
export const BASE_SOCKET_URL = process.env.BACKEND_WS_URL || 'ws://localhost:5045/'