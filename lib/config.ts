import dotenv from 'dotenv'
dotenv.config();

export const BASE_URL = 'https://212.109.218.146:8000' || process.env.BASE_URL
export const BASE_SOCKET_URL = 'wss://212.109.218.146:8000' || process.env.BASE_SOCKET_URL