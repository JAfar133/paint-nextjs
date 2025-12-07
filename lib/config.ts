import dotenv from 'dotenv'
dotenv.config();

export const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/'
export const BASE_SOCKET_URL = process.env.BASE_URL || 'ws://localhost:5000/'