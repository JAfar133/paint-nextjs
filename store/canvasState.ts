import {makeAutoObservable} from "mobx";
import UserService from "@/lib/api/UserService";
import {Point} from "@/lib/tools/shapes/arcTool";
import toolState from "@/store/toolState";
import DragTool, {cursors} from "@/lib/tools/dragTool";

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
    scale: number = 1;
    scaleMultiplier: number = 1.1;
    offsetX: number = 0;
    offsetY: number = 0;
    mouse = {x: 0, y: 0};
    savedCanvasWithoutImage: string = '';
    imageContainer: HTMLDivElement | null = null;

    constructor() {
        this.canvas_id = `f${(+new Date).toString(16)}`
        makeAutoObservable(this);

    }

    trackMouse(event: MouseEvent) {
        this.mouse.x = event.clientX - this.canvas.offsetLeft;
        this.mouse.y = event.clientY - this.canvas.offsetTop;
    }
    drawBorder(){
        const ctx = this.canvas.getContext('2d')

        this.imageContainer = document.createElement('div');
        this.imageContainer.classList.add("image-container")
        if(ctx && toolState.imageForEdit && this.imageContainer){
            this.imageContainer.style.display = 'block';
            this.imageContainer.style.width = `${toolState.imageForEdit.img.width}px`; // Установите желаемую ширину
            this.imageContainer.style.height = `${toolState.imageForEdit.img.height}px`;
            this.imageContainer.style.transform = `translate(${toolState.imageForEdit.imageX+this.canvas.offsetLeft}px, ${toolState.imageForEdit.imageY+this.canvas.offsetTop}px)`;
            document.body.appendChild(this.imageContainer);
        }
    }
    deleteBorder(){
        if (this.imageContainer){
            this.imageContainer?.remove();
            this.imageContainer = null;
        }
        const containers = document.getElementsByClassName('image-container');
        const containerArray = Array.from(containers);

        containerArray.forEach(function(container) {
            container.remove();
        });
    }
    wheelHandler(e: WheelEvent) {
        e.preventDefault();
        // const scaleFactor = this.scaleMultiplier;
        // const delta = e.deltaY > 0 ? 1 / scaleFactor : scaleFactor;
        // const minScale = 1;
        // const maxScale = 10;
        //
        // const prevScale = this.scale;
        //
        // this.scale *= delta;
        // if (this.scale < minScale) this.scale = minScale;
        // if (this.scale > maxScale) this.scale = maxScale;
        // this.offsetX = e.offsetX - (e.offsetX - this.offsetX) * (this.scale / prevScale);
        // this.offsetY = e.offsetY - (e.offsetY - this.offsetY) * (this.scale / prevScale);
        //
        // this.draw(this.scale, { x: this.offsetX, y: this.offsetY });
    }


    draw(scale: number, translatePos: Point) {
        const img = new Image();
        const ctx = this.canvas.getContext('2d');
        img.src = this.canvas.toDataURL();
        img.onload = () => {
            ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx?.translate(translatePos.x, translatePos.y);
            ctx?.scale(scale, scale);
            ctx?.drawImage(img, 0, 0);
        };
    }

    get canvasId() {
        return this.canvas_id;
    }

    setCanvasId(id: string) {
        this.canvas_id = id;
    }

    setMessages(messages: Message[]) {
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
        this.clear();
        this.canvas.onwheel = this.wheelHandler.bind(this);
        this.canvas.onmousemove = this.trackMouse.bind(this);

    }

    addUndo(data: any) {
        this.undoList.push(data);
    }

    addRedo(data: any) {
        this.redoList.push(data);
    }

    addCurrentContextToUndo() {
        this.undoList.push(this.canvas.toDataURL())
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

    private sendDataUrl(dataUrl: string) {
        if (this.socket) {
            this.socket.send(JSON.stringify({
                method: "draw_url",
                id: this.canvasId,
                dataUrl: dataUrl
            }))
        }
    }

    drawByDataUrl(dataUrl: string, options: { clearRect: boolean, imageEdit: boolean } = {
        clearRect: true,
        imageEdit: false
    }) {
        let ctx = this.canvas.getContext('2d')
        let img = new Image();
        img.src = dataUrl;
        if (options.imageEdit) {
            toolState.imageForEdit = {imageX: 0, imageY: 0, offsetX: 0, offsetY: 0,
                img: img, isDragging: false, isResizing: false, isRotating: false, isUpload: true};
            if(this.socket){
                toolState.setTool(new DragTool(this.canvas, this.socket, this.canvasId, "drag"))
            }
        }
        img.onload = () => {
            options.clearRect && ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx?.drawImage(img, 0, 0, img.width, img.height);
        }
    }


    clearCanvas() {
        this.clear()
        this.saveCanvas();
        this.savedCanvasWithoutImage = '';
        toolState.imageForEdit = null;
        this.deleteBorder();
        if (this.socket) {
            this.socket.send(JSON.stringify({
                method: "clear",
                id: this.canvasId,
            }))
        }
    }

    saveCanvas() {
        UserService.saveImage(this.canvasId, this.canvas.toDataURL())
            .catch(e => console.log(e))
        localStorage.removeItem("image")
    }
    mouseLeaveHandler = () => {
        this.canvas.classList.remove('cursor-crosshair');
        this.canvas.classList.remove('cursor-text');
        this.canvas.classList.remove('cursor-cell');
        cursors.forEach(cursor=>this.canvas.classList.remove(cursor))
    }
    clear() {
        let ctx = this.canvas.getContext('2d')
        if (ctx) {
            ctx.fillStyle = 'rgba(255,255,255,1)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

export default new CanvasState();
