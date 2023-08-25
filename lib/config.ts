import dotenv from 'dotenv'
dotenv.config();

export const BASE_URL = process.env.BASE_URL || 'http://localhost:8000/' || 'https://paint-nodejs-3sgr.vercel.app/'
export const BASE_SOCKET_URL = process.env.BASE_URL || 'ws://localhost:8000/' ||  'wss://paint-nodejs-3sgr.vercel.app/'