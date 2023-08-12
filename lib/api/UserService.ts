import {$host, $authHost} from "@/lib/api/index";

export default class UserService {
    static async saveImage(id: string | string[], dataUrl: string){
        return $host.post(`/image?id=${id}`, {img: dataUrl})
    }

    static async getImage(id: string | string[]){
        return $host.get(`/image?id=${id}`)
    }
    static async saveDrawing(id: string | string[]){
        return $authHost.post(`/drawing?id=${id}`)
    }
    static async getImages(){
        return $authHost.get('/drawing')
    }
}