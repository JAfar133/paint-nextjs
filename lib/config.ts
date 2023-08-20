import dotenv from 'dotenv'
dotenv.config();

export const BASE_URL = process.env.BASE_URL || 'https://paint-nodejs-3sgr.vercel.app/'
export const BASE_SOCKET_URL = process.env.BASE_URL ||  'wss://paint-nodejs-3sgr.vercel.app/'