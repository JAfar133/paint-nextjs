import dotenv from 'dotenv'
dotenv.config();

export const BASE_URL = process.env.BASE_URL || 'http://212.109.218.146:8000'
export const BASE_SOCKET_URL = process.env.BASE_SOCKET_URL || 'ws://212.109.218.146:8000'