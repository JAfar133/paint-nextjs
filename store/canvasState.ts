import {makeAutoObservable} from "mobx";
import UserService from "@/lib/api/UserService";
import {Point} from "@/lib/tools/shapes/arcTool";
import toolState from "@/store/toolState";
import DragTool, {getImageCenter, getNewPointPosition} from "@/lib/tools/dragTool";

export type cursorClass =
    "cursor-move" | "cursor-grab" | "cursor-text" | "cursor-cell" |
    "cursor-grabbing" | "cursor-nwse-resize" | "cursor-alias" | "cursor-crosshair" |
    "cursor-nesw-resize" | "cursor-ew-resize" | "cursor-ns-resize"
export const cursors: cursorClass[] =
    ["cursor-move", "cursor-grab", "cursor-text" , "cursor-cell",
        "cursor-grabbing", "cursor-nwse-resize", "cursor-alias", "cursor-crosshair",
        "cursor-nesw-resize", "cursor-ew-resize", "cursor-ns-resize"]
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

        this.deleteBorder();
        this.imageContainer = document.createElement('div');
        const leftTop = document.createElement('div');
        const leftBottom = document.createElement('div');
        const rightTop = document.createElement('div');
        const rightBottom = document.createElement('div');

        this.imageContainer.classList.add("image-container");
        leftTop.classList.add('square');
        leftBottom.classList.add('square');
        rightTop.classList.add('square');
        rightBottom.classList.add('square');
        const image = toolState.imageForEdit;

        if(ctx && image && this.imageContainer){
            this.imageContainer.style.display = 'block';
            this.imageContainer.style.width = `${image.img.width}px`;
            this.imageContainer.style.height = `${image.img.height}px`;

            leftTop.style.transform = `translate(-5px, -5px)`;
            leftBottom.style.transform = `translate(-5px, ${image.img.height}px)`;
            rightTop.style.transform = `translate(${image.img.width}px, -5px)`;
            rightBottom.style.transform = `translate(${image.img.width}px, ${image.img.height}px)`;

            let transformStyle = `translate(${image.imageX+this.canvas.offsetLeft}px, ${image.imageY+this.canvas.offsetTop}px)`;
            transformStyle = transformStyle.concat(` rotate(${image.angle}rad)`)
            this.imageContainer.style.transform = transformStyle;
            document.body.appendChild(this.imageContainer);
            this.imageContainer.appendChild(leftTop);
            this.imageContainer.appendChild(leftBottom);
            this.imageContainer.appendChild(rightTop);
            this.imageContainer.appendChild(rightBottom);
        }
    }
    deleteBorder(){
        if (this.imageContainer){
            this.imageContainer?.remove();
            this.imageContainer = null;
        }
        const containers = document.getElementsByClassName('image-container');
        const squares = document.getElementsByClassName('square');
        const containerArray = Array.from(containers);
        const squaresArray = Array.from(squares);

        containerArray.forEach(function(container) {
            container.remove();
        });
        squaresArray.forEach(function(square) {
            square.remove();
        });
    }
    setCursor(cursor: cursorClass) {
        cursors.forEach(c => {
            if (c === cursor) this.canvas.classList.add(c)
            else this.canvas.classList.remove(c)
        })
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
                img: img, isDragging: false, isResizing: false, isRotating: false, isUpload: true, angle: 0};
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
