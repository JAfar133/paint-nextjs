import {makeAutoObservable} from "mobx";
import UserService from "@/lib/api/UserService";

export interface Message {
    id: string,
    username: string,
    text: string,
    date: Date,
    color: string
}
class CanvasState {
    // @ts-ignore
    canvas: HTMLCanvasElement;
    canvas_id: string;
    socket: WebSocket | null = null;
    undoList: any = [];
    redoList: any = [];
    userCount: number = 0;
    users: string[] | null = null;
    messages: Message[] = []
    isFill: boolean = false;
    isStroke: boolean = true;
    constructor() {
        this.canvas_id = `f${(+new Date).toString(16)}`
        makeAutoObservable(this);
    }

    get canvasId() {
        return this.canvas_id;
    }

    setCanvasId(id: string) {
        this.canvas_id = id;
    }
    setMessages(messages: Message[]){
        this.messages = messages;
    }

    setUsers(users: string[] | null) {
        this.users = users;
    }

    setUserCount(count: number) {
        this.userCount = count;
    }

    setSocket(socket: WebSocket) {
        this.socket = socket;
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    addUndo(data: any) {
        this.undoList.push(data);
    }

    addRedo(data: any) {
        this.redoList.push(data);
    }

    undo() {
        if (this.undoList.length) {
            let dataUrl = this.undoList.pop();
            this.addRedo(this.canvas.toDataURL());
            this.drawByDataUrl(dataUrl);
            this.sendDataUrl(dataUrl);
        } else {
            this.addRedo(this.canvas.toDataURL());
            this.clear();
            this.saveCanvas();
        }
    }

    redo() {
        if (this.redoList.length) {
            let dataUrl = this.redoList.pop();
            this.addUndo(this.canvas.toDataURL())
            this.drawByDataUrl(dataUrl);
            this.sendDataUrl(dataUrl);
        }
    }

    private sendDataUrl(dataUrl: string){
        if(this.socket){
            this.socket.send(JSON.stringify({
                method: "draw_url",
                id: this.canvasId,
                dataUrl: dataUrl
            }))
        }
    }


    drawByDataUrl(dataUrl: string){
        let ctx = this.canvas.getContext('2d')
        let img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height)
            ctx?.drawImage(img, 0, 0, this.canvas.width, this.canvas.height)
        }
        this.saveCanvas();
    }

    clearCanvas() {
        this.clear()
        this.saveCanvas();
        if(this.socket) {
            this.socket.send(JSON.stringify({
                method: "clear",
                id: this.canvasId,
            }))
        }
    }

    saveCanvas(){
        UserService.saveImage(this.canvasId, this.canvas.toDataURL())
            .catch(e=>console.log(e))
    }

    clear() {
        let ctx = this.canvas.getContext('2d')
        ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
}

export default new CanvasState();
