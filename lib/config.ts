import dotenv from 'dotenv'
dotenv.config();

export const BASE_URL = process.env.BASE_URL || 'http://localhost:8080/'
export const BASE_SOCKET_URL = process.env.BASE_URL ||  'ws://localhost:8080/'