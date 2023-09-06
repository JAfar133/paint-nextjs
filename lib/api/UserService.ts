import {$host, $authHost} from "@/lib/api/index";
import {log} from "util";
interface ResponseMessage {
    _id: string;
    username: string;
    date: Date;
    text: string;
    canvas_id: string
}
export default class UserService {
    static saveImage(id: string | string[], dataUrl: string){
        return $host.post(`/image?id=${id}`, {img: dataUrl})
    }

    static getImage(id: string | string[]){
        return $host.get(`/image?id=${id}`);
    }
    static saveDrawing(id: string | string[]){
        return $authHost.post(`/drawing?id=${id}`)
    }
    static getImages(){
        return $authHost.get('/drawing')
    }
    static getGalleryImages(){
        return $host.get('/gallery')
    }
    static getGalleryImage(id: string | string[]){
        return $host.get(`/gallery/get-image?id=${id}`);
    }
    static async getMessages(canvas_id: string) {
        const response = await $host.get(`/message/get/${canvas_id}`);
        const messages: ResponseMessage[] = response.data;

        return messages.map(message => ({
            id: message._id,
            username: message.username,
            date: message.date,
            text: message.text,
            color: "rgb(255, 255, 255)"
        }));
    }

}