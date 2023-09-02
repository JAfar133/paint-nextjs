import {$host, $authHost} from "@/lib/api/index";
interface ResponseMessage {
    _id: string;
    username: string;
    date: Date;
    text: string;
    canvas_id: string
}
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