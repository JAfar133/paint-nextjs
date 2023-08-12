import {$authHost, $host} from "@/lib/api/index";

export interface RegistrationUser {
    username: string;
    email: string;
    password: string;
}

export default class AuthService {
    static async registration(user: RegistrationUser) {
        const response =  await $host.post("auth/registration", user)
        return response;
    }
    static async login(user: {email: string; password: string}) {
        const response =  await $host.post("auth/login", user)
        if(response.data.token) {
            localStorage.setItem('token', response.data.token)
        }
        return response;
    }
    static async check(){
        const response = await $authHost.get('auth/check')
        if(response.data.token) {
            localStorage.setItem('token', response.data.token)
        }
        return response;
    }

}