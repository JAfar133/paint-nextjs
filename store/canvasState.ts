import {makeAutoObservable} from "mobx";
import UserService from "@/lib/api/UserService";
import {Point} from "@/lib/tools/shapes/arcTool";
import toolState from "@/store/toolState";
import DragTool, {getImageCenter, getNewPointPosition} from "@/lib/tools/dragTool";
import userState from "@/store/userState";

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
    canvasWidth: number = 1200;
    canvasHeight: number = 600;
    canvasX: number = 0;
    canvasY: number = 0;
    savedCanvas: string | null = null;
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
        const circleOverlay = document.getElementsByClassName('circle-overlay');
        const containerArray = Array.from(containers);
        const squaresArray = Array.from(squares);
        const circleOverlayArray = Array.from(circleOverlay);

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
        // e.preventDefault();
        // const scaleFactor = this.scaleMultiplier;
        // const delta = e.deltaY > 0 ? 1 / scaleFactor : scaleFactor;
        // const ctx = this.canvas.getContext('2d');
        // if (ctx) {
        //     if (!this.savedCanvas) {
        //         this.savedCanvas = this.getDataUrlCanvas();
        //     }
        //
        //     // Сохраняем текущие координаты центра канваса
        //     const centerX = this.canvasX + this.canvasWidth / 2;
        //     const centerY = this.canvasY + this.canvasHeight / 2;
        //
        //     // Изменяем масштаб канваса
        //     this.canvasWidth *= delta;
        //     this.canvasHeight *= delta;
        //     //
        //     // // Обновляем координаты канваса так, чтобы центр оставался на месте
        //     this.canvasX = centerX - this.canvasWidth / 2;
        //     this.canvasY = centerY - this.canvasHeight / 2;
        //
        //     this.scale *= delta;
        //     this.drawScroll(ctx, this.savedCanvas);
        // }
    }
    //
    // drawScroll(ctx: CanvasRenderingContext2D, dataUrl: string) {
    //     const img = new Image();
    //     img.src = dataUrl;
    //     img.onload = () => {
    //         ctx.save();
    //         ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    //         ctx.scale(this.scale, this.scale)
    //         ctx.drawImage(img, this.canvasX, this.canvasY, this.canvasWidth, this.canvasHeight);
    //         ctx.restore();
    //     };
    // }
    draw(scale: number, translatePos: Point) {
        const img = new Image();
        const ctx = this.canvas.getContext('2d');
        img.src = this.getDataUrlCanvas();
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
        this.canvas.onwheel = this.wheelHandler.bind(this);
        this.canvas.onmousemove = this.trackMouse.bind(this);
        this.canvasX = this.canvas.width/2-this.canvasWidth/2;
        this.canvasY = 50;
        this.clear();
    }

    addUndo(data: any) {
        this.undoList.push(data);
    }

    addRedo(data: any) {
        this.redoList.push(data);
    }

    addCurrentContextToUndo() {
        this.undoList.push(this.getDataUrlCanvas())
    }

    undo() {
        if (this.undoList.length) {
            let dataUrl = this.undoList.pop();
            this.addRedo(this.getDataUrlCanvas());
            this.drawCanvas(dataUrl);
            this.sendDataUrl(dataUrl);
        } else {
            this.addRedo(this.getDataUrlCanvas());
            this.clear();
            this.saveCanvas();
        }
    }

    redo() {
        if (this.redoList.length) {
            let dataUrl = this.redoList.pop();
            this.addUndo(this.getDataUrlCanvas())
            this.drawCanvas(dataUrl);
            this.sendDataUrl(dataUrl);
        }
    }

    sendDataUrl(dataUrl: string) {
        if (this.socket) {
            this.socket.send(JSON.stringify({
                method: "draw_url",
                username: userState.user?.username,
                id: this.canvasId,
                dataUrl: dataUrl
            }))
        }
    }
    drawCanvas(dataUrl: string){
        const ctx = this.canvas.getContext('2d')
        let img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            if (ctx) {
                ctx.drawImage(img, this.canvasX, this.canvasY, this.canvasWidth, this.canvasHeight);
            }
        }
    }
    drawByDataUrl(dataUrl: string, options: { clearRect: boolean, imageEdit: boolean } = {
        clearRect: true,
        imageEdit: false
    }) {
        const ctx = this.canvas.getContext('2d')
        let img = new Image();
        img.src = dataUrl;

        if (options.imageEdit) {
            toolState.addImageForEdit({imageX: this.canvasX, imageY: this.canvasY, offsetX: 0, offsetY: 0,
                img: img, isDragging: false, isResizing: false, isRotating: false, isUpload: true, angle: 0});
            if(this.socket){
                toolState.setTool(new DragTool(this.canvas, this.socket, this.canvasId, "drag"))
            }
        }

        img.onload = () => {
            if(ctx){
                if(img.width > 0 && img.height > 0){
                    options.clearRect && ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    ctx.drawImage(img, this.canvasX, this.canvasY, img.width, img.height);
                }
            }
        }
    }


    clearCanvas() {
        this.clear()
        this.saveCanvas();
        this.savedCanvasWithoutImage = '';
        this.deleteBorder();
        if (this.socket) {
            this.socket.send(JSON.stringify({
                method: "clear",
                id: this.canvasId,
            }))
        }
    }

    clearOutside(ctx: CanvasRenderingContext2D){
        const fullCanvasImageData = ctx.getImageData(this.canvasX, this.canvasY, this.canvasWidth, this.canvasHeight);
        ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height)
        ctx.putImageData(fullCanvasImageData, this.canvasX, this.canvasY)
    }

    saveCanvas() {
        UserService.saveImage(this.canvasId, this.getDataUrlCanvas())
            .catch(e => console.log(e))
        localStorage.removeItem("image")
    }

    getDataUrlCanvas(canvas?: HTMLCanvasElement){
        const canvas1 = canvas || this.canvas;
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.canvasWidth;
        tempCanvas.height = this.canvasHeight;
        if(tempCtx){
            tempCtx.drawImage(canvas1, this.canvasX, this.canvasY, this.canvasWidth, this.canvasHeight, 0, 0, this.canvasWidth, this.canvasHeight);
        }
        return tempCanvas.toDataURL();

    }
    mouseLeaveHandler = () => {
        this.canvas.classList.remove('cursor-crosshair');
        this.canvas.classList.remove('cursor-text');
        this.canvas.classList.remove('cursor-cell');
        cursors.forEach(cursor=>this.canvas.classList.remove(cursor))
    }
    clear() {
        const ctx = this.canvas.getContext('2d')
        if (ctx) {
            ctx.clearRect(0,0,this.canvas.width, this.canvas.height)
            ctx.fillStyle = 'rgba(255,255,255,1)';
            ctx.fillRect(this.canvasX, this.canvasY, this.canvasWidth, this.canvasHeight);
        }
    }
}

export default new CanvasState();
