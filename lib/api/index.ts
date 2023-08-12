import axios, { AxiosRequestConfig, AxiosInstance } from "axios";
import { BASE_URL } from "@/lib/config";

const $host: AxiosInstance = axios.create({
    baseURL: BASE_URL
})

const $authHost: AxiosInstance = axios.create({
    baseURL: BASE_URL
})

const authInterceptor = (config: AxiosRequestConfig | any) => {
    config.headers.authorization = `Bearer ${localStorage.getItem('token')}`;
    return config;
}

$authHost.interceptors.request.use(authInterceptor);

export {
    $host, $authHost
}
