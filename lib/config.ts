import dotenv from 'dotenv'
dotenv.config();

export const BASE_URL = process.env.BASE_URL || 'https://paint-nodejs-git-main-jafar133.vercel.app/'
    // || 'http://localhost:8000/'
export const BASE_SOCKET_URL = process.env.BASE_SOCKET_URL || 'ws://paint-nodejs-git-main-jafar133.vercel.app/'
    // || 'ws://localhost:8000/'