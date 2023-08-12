import dotenv from 'dotenv'
dotenv.config();

export const BASE_URL = process.env.BASE_URL || 'https://paint-nodejs.vercel.app/'
    // || 'http://localhost:8000/'
export const BASE_SOCKET_URL = process.env.BASE_SOCKET_URL || 'wss://paint-nodejs.vercel.app/'
    // || 'ws://localhost:8000/'