import {makeAutoObservable} from "mobx";
import UserService from "@/lib/api/UserService";
import toolState from "@/store/toolState";
import DragTool from "@/lib/tools/dragTool";
import userState from "@/store/userState";
import settingState from "@/store/settingState";

export type cursorClass =
    "cursor-move" | "cursor-grab" | "cursor-text" | "cursor-cell" |
    "cursor-grabbing" | "cursor-nwse-resize" | "cursor-alias" | "cursor-crosshair" |
    "cursor-nesw-resize" | "cursor-ew-resize" | "cursor-ns-resize" | "cursor-auto"
export const cursors: cursorClass[] =
    ["cursor-move", "cursor-grab", "cursor-text", "cursor-cell",
        "cursor-grabbing", "cursor-nwse-resize", "cursor-alias", "cursor-crosshair",
        "cursor-nesw-resize", "cursor-ew-resize", "cursor-ns-resize", "cursor-auto"]

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
    scale: number = 0.5;
    offsetX: number = 0;
    offsetY: number = 0;
    savedCanvasWithoutImage: HTMLCanvasElement | null = null;
    savedCtxWithoutImage: CanvasRenderingContext2D | null = null;
    canvasMain: HTMLDivElement | null = null;
    canvasContainer: HTMLDivElement | null = null;
    centerX: number = 0;
    centerY: number = 0;
    mouseDown: boolean = false;
    mouseDownStartX: number = -1;
    mouseDownStartY: number = -1;
    imageContainer: HTMLDivElement | null = null;
    canvasCursor: cursorClass = 'cursor-auto';
    savedCursor: cursorClass | null = null;
    rectWidth: number = 1920;
    rectHeight: number = 1080;
    canvasX: number = 0;
    canvasY: number = 0;
    // @ts-ignore
    bufferCanvas: HTMLCanvasElement;
    // @ts-ignore
    bufferCtx: CanvasRenderingContext2D;
    constructor() {
        this.canvas_id = `f${(+new Date).toString(16)}`;
        makeAutoObservable(this);
    }


    drawBorder() {
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

        if (ctx && image && this.imageContainer && this.canvasContainer) {
            this.imageContainer.style.display = 'block';
            const newWidth = image.img.width*this.scale;
            const newHeight = image.img.height*this.scale;
            this.imageContainer.style.width = `${newWidth}px`;
            this.imageContainer.style.height = `${newHeight}px`;
            leftTop.style.transform = `translate(-5px, -5px) scale(${this.scale})`;
            leftBottom.style.transform = `translate(-5px, ${newHeight}px) scale(${this.scale})`;
            rightTop.style.transform = `translate(${newWidth}px, -5px) scale(${this.scale})`;
            rightBottom.style.transform = `translate(${newWidth}px, ${newHeight}px) scale(${this.scale})`;
            let transformStyle = `translate(${image.imageX*this.scale+this.canvasX}px, ${image.imageY*this.scale+this.canvasY}px)`;
            transformStyle = transformStyle.concat(` rotate(${image.angle}rad)`)
            this.imageContainer.style.transform = transformStyle;
            this.canvasContainer.appendChild(this.imageContainer);
            this.imageContainer.appendChild(leftTop);
            this.imageContainer.appendChild(leftBottom);
            this.imageContainer.appendChild(rightTop);
            this.imageContainer.appendChild(rightBottom);
        }
    }

    deleteBorder() {
        if (this.imageContainer) {
            this.imageContainer.remove();
            this.imageContainer = null;
        }
        const containers = document.getElementsByClassName('image-container');
        const squares = document.getElementsByClassName('square');
        const containerArray = Array.from(containers);
        const squaresArray = Array.from(squares);

        containerArray.forEach(function (container) {
            container.remove();
        });
        squaresArray.forEach(function (square) {
            square.remove();
        });
    }

    setCursor(cursor: cursorClass) {
        cursors.forEach(c => {
            if (this.canvasMain) {
                if (c === cursor) {
                    this.canvasMain.classList.add(c);
                    this.canvasCursor = c;
                }
                else this.canvasMain.classList.remove(c)
            }
        })

    }
    wheelHandler(e: WheelEvent) {
        e.preventDefault();
        const zoomSpeed = 0.1;
        let scaleFactor = e.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;

        this.scale *= scaleFactor;
        if (this.scale < 0.05) {
            this.scale = 0.05;
            scaleFactor = 1;
        } else if (this.scale > 32) {
            this.scale = 32;
            scaleFactor = 1;
        }

        this.canvasX -= (e.offsetX - this.canvasX) * (scaleFactor - 1);
        this.canvasY -= (e.offsetY - this.canvasY) * (scaleFactor - 1);
        this.draw();
    }

    draw(canvas?: HTMLCanvasElement){
        const ctx = this.canvas.getContext('2d')
        if(ctx){
            this.bufferCtx.globalAlpha = 1;
            this.fill();
            ctx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
            ctx.setTransform(this.scale, 0, 0, this.scale, this.canvasX, this.canvasY);
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
            ctx.drawImage(this.bufferCanvas, 0,0);
            if(canvas){
                ctx.drawImage(canvas, 0, 0);
            }
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            if (toolState.tool && toolState.tool.type === "drag") {
                this.drawBorder();
            }
        }
    }
    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown && this.canvasContainer) {
            e.preventDefault()
            const offsetX = e.pageX;
            const offsetY = e.pageY;

            const deltaX = offsetX - this.mouseDownStartX;
            const deltaY = offsetY - this.mouseDownStartY;
            this.canvasX += deltaX;
            this.canvasY += deltaY;
            this.draw();

            this.mouseDownStartX = offsetX;
            this.mouseDownStartY = offsetY;
        }
    }
    mouseDownHandler(e: MouseEvent){
        if (e.button === 1) {
            this.mouseDownStartX = e.pageX;
            this.mouseDownStartY = e.pageY;
            this.mouseDown = true;
            if(toolState.tool){
                toolState.tool.canDraw = false;
            }
            this.savedCursor = this.canvasCursor;
            this.setCursor('cursor-grabbing')
        }
    }
    mouseUpHandler(e: MouseEvent){
        if(this.mouseDown && toolState.tool){
            toolState.tool.canDraw = true;
        }
        this.mouseDown = false;
        if(this.savedCursor){
            this.setCursor(this.savedCursor);
            this.savedCursor = null;
        }

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
        this.bufferCanvas = document.createElement('canvas');
        this.savedCanvasWithoutImage = document.createElement('canvas');
        this.bufferCtx = this.bufferCanvas.getContext('2d')!;
        this.savedCtxWithoutImage = this.savedCanvasWithoutImage.getContext('2d')!;
        this.bufferCanvas.width = this.rectWidth;
        this.bufferCanvas.height = this.rectHeight;
        this.savedCanvasWithoutImage.width = this.rectWidth;
        this.savedCanvasWithoutImage.height = this.rectHeight;
        setTimeout(()=>{
            if(this.canvasMain){
                this.canvasMain.onwheel = this.wheelHandler.bind(this);
                this.canvasMain.onmousemove = this.mouseMoveHandler.bind(this)
                this.canvasMain.onmousedown = this.mouseDownHandler.bind(this)
                window.onmouseup = this.mouseUpHandler.bind(this)

            }
        },100)
        this.canvas.onwheel = this.wheelHandler.bind(this);
        this.canvasX = this.canvas.width /2 - this.rectWidth/2*this.scale
        this.canvasY = 50;
        this.centerX =  this.canvas.width / 2;
        this.centerY =  this.canvas.height / 2 + this.canvasY + 50;

        this.draw();
    }

    addUndo(data: any) {
        this.undoList.push(data);
    }

    addRedo(data: any) {
        this.redoList.push(data);
    }

    addCurrentContextToUndo() {
        this.undoList.push(this.bufferCanvas.toDataURL())
    }

    undo() {
        if (this.undoList.length) {
            let dataUrl = this.undoList.pop();
            this.addRedo(this.bufferCanvas.toDataURL());

            this.drawCanvas(dataUrl);
            this.sendDataUrl(dataUrl);
        } else {
            this.addRedo(this.bufferCanvas.toDataURL());
            this.clear();
            this.saveCanvas();
        }
    }

    redo() {
        if (this.redoList.length) {
            let dataUrl = this.redoList.pop();
            this.addUndo(this.bufferCanvas.toDataURL())
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

    drawCanvas(dataUrl: string) {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            this.bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
            this.bufferCtx.drawImage(img, 0, 0);
            this.draw();
        }
    }

    drawByDataUrl(dataUrl: string, options: { clearRect: boolean, imageEdit: boolean } = {
        clearRect: true,
        imageEdit: false
    }) {
        let img = new Image();
        img.src = dataUrl;

        if (options.imageEdit) {
            toolState.addImageForEdit({
                imageX: 0, imageY: 0, offsetX: 0, offsetY: 0,
                img: img, isDragging: false, isResizing: false, isRotating: false, isUpload: true, angle: 0
            });
            if (this.socket) {
                const tool = new  DragTool(this.canvas, this.socket, this.canvasId, "drag");
                toolState.setTool(new DragTool(this.canvas, this.socket, this.canvasId, "drag"))
            }
            img.onload = () => {
                if (img.width > 0 && img.height > 0) {
                    options.clearRect && this.bufferCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.bufferCtx.drawImage(img, 0, 0, img.width, img.height);
                    this.draw();
                }
            }
        } else {
            img.onload = () => {
                if (img.width > 0 && img.height > 0) {
                    options.clearRect && this.bufferCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.bufferCtx.drawImage(img, 0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
                    this.draw();
                }
            }
        }
    }

    clearCanvas() {
        this.clear()
        this.saveCanvas();
        this.deleteBorder();
        if (this.socket) {
            this.socket.send(JSON.stringify({
                method: "clear",
                id: this.canvasId,
            }))
        }
    }

    saveCanvas() {
        UserService.saveImage(this.canvasId, this.bufferCanvas.toDataURL())
            .catch(e => console.log(e))
        localStorage.removeItem("image")
    }

    mouseLeaveHandler = () => {
        cursors.forEach(cursor => this.canvas.classList.remove(cursor))
    }

    clear() {
        if(toolState.tool){
            toolState.tool.tempCtx.clearRect(0,0,toolState.tool.tempCanvas.width, toolState.tool.tempCanvas.height)
        }
        this.bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height)
        this.bufferCtx.fillStyle = 'rgba(255,255,255,1)';
        this.bufferCtx.fillRect(0,0, this.bufferCanvas.width, this.bufferCanvas.height);
        this.draw();
    }
    set fillColor(color: string) {
        this.bufferCtx.fillStyle = color;
    }

    set strokeColor(color: string) {
        this.bufferCtx.strokeStyle = color;
    }
    set lineJoin(join: CanvasLineJoin){
        this.bufferCtx.lineJoin = join;
    }
    set lineCap(cap: CanvasLineCap){
        this.bufferCtx.lineCap = cap;
    }

    set lineWidth(width: number) {
        this.bufferCtx.lineWidth = width;
    }

    set font(font: string) {
        this.bufferCtx.font = font
    }
    set globalAlpha(alpha: number) {
        this.bufferCtx.globalAlpha = alpha
    }
    fill(){
        this.strokeColor = settingState.strokeColor || '#000';
        this.fillColor = settingState.fillColor || '#000';
        this.lineWidth = settingState.strokeWidth;
        this.font = settingState.font;
        this.lineCap = settingState.lineCap;
        this.lineJoin = settingState.lineJoin;
    }
}

export default new CanvasState();
