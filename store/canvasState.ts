import {makeAutoObservable} from "mobx";
import UserService from "@/lib/api/UserService";
import {log} from "util";

class CanvasState {
    // @ts-ignore
    canvas: HTMLCanvasElement;
    canvas_id: string | string[];
    // @ts-ignore
    socket: WebSocket;
    undoList: any = [];
    redoList: any = [];

    constructor() {
        this.canvas_id = `f${(+new Date).toString(16)}`
        makeAutoObservable(this);
    }

    get canvasId() {
        return this.canvas_id;
    }

    setCanvasId(id: string | string[]) {
        this.canvas_id = id;
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
        this.socket.send(JSON.stringify({
            method: "draw_url",
            id: this.canvasId,
            dataUrl: dataUrl
        }))
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
        this.socket.send(JSON.stringify({
            method: "clear",
            id: this.canvasId,
        }))
    }

    saveCanvas(){
        UserService.saveImage(this.canvasId, this.canvas.toDataURL())
            .then(res => console.log(res.data))
            .catch(e=>console.log(e))
    }

    clear() {
        let ctx = this.canvas.getContext('2d')
        ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
}

export default new CanvasState();
