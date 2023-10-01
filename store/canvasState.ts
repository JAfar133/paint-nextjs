import {makeAutoObservable} from "mobx";
import UserService from "@/lib/api/UserService";
import toolState from "@/store/toolState";
import DragTool from "@/lib/tools/dragTool";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";

export type cursorClass =
    "cursor-move" | "cursor-grab" | "cursor-text" | "cursor-cell" |
    "cursor-grabbing" | "cursor-nwse-resize" | "cursor-alias" | "cursor-crosshair" |
    "cursor-nesw-resize" | "cursor-ew-resize" | "cursor-ns-resize"
export const cursors: cursorClass[] =
    ["cursor-move", "cursor-grab", "cursor-text", "cursor-cell",
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
    savedCanvasWithoutImage: string = '';
    canvasWidth: number = 1200;
    canvasHeight: number = 600;
    canvasX: number = 0;
    canvasTop: number = 0;
    canvasLeft: number = 0;
    canvasY: number = 0;
    canvasContainerRef: HTMLDivElement | null = null;
    centerX: number = 0;
    centerY: number = 0;
    imageContainer: HTMLDivElement | null = null;

    constructor() {
        this.canvas_id = `f${(+new Date).toString(16)}`
        makeAutoObservable(this);
    }



    drawBorder() {
        const ctx = this.canvas.getContext('2d')
        const container = document.querySelector('#canvas');
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

        if (ctx && image && this.imageContainer) {
            this.imageContainer.style.display = 'block';
            this.imageContainer.style.width = `${image.img.width}px`;
            this.imageContainer.style.height = `${image.img.height}px`;

            leftTop.style.transform = `translate(-5px, -5px)`;
            leftBottom.style.transform = `translate(-5px, ${image.img.height}px)`;
            rightTop.style.transform = `translate(${image.img.width}px, -5px)`;
            rightBottom.style.transform = `translate(${image.img.width}px, ${image.img.height}px)`;
            let transformStyle = `translate(${image.imageX}px, ${image.imageY}px) scale(${this.scale})`;
            transformStyle = transformStyle.concat(` rotate(${image.angle}rad)`)
            this.imageContainer.style.transform = transformStyle;
            document.body.appendChild(this.imageContainer);
            this.imageContainer.appendChild(leftTop);
            this.imageContainer.appendChild(leftBottom);
            this.imageContainer.appendChild(rightTop);
            this.imageContainer.appendChild(rightBottom);
        }
    }

    deleteBorder() {
        if (this.imageContainer) {
            this.imageContainer?.remove();
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
            if (this.canvasContainerRef) {
                if (c === cursor) this.canvasContainerRef.classList.add(c)
                else this.canvasContainerRef.classList.remove(c)
            }
        })

    }

    wheelHandler(e: WheelEvent) {
        e.preventDefault();
        const scaleFactor = this.scaleMultiplier;
        const delta = e.deltaY > 0 ? 1 / scaleFactor : scaleFactor;
        const ctx = this.canvas.getContext('2d');

        if (ctx) {
            if (this.scale * delta > 0.05 && this.scale * delta < 15) {
                const deltaX = (this.centerX - e.pageX)*0.1;
                const deltaY = (this.centerY - e.pageY)*0.1;
                if(this.scale < this.scale*delta){
                    this.canvasLeft +=deltaX;
                    this.canvasTop +=deltaY;
                    this.centerX += deltaX;
                    this.centerY += deltaY;
                    this.canvas.style.left = `${this.canvasLeft}px`;
                    this.canvas.style.top = `${this.canvasTop}px`;
                }

                else {
                    this.canvasLeft -=deltaX;
                    this.canvasTop -=deltaY;
                    this.centerX -= deltaX;
                    this.centerY -= deltaY;
                    this.canvas.style.left = `${this.canvasLeft}px`;
                    this.canvas.style.top = `${this.canvasTop}px`;
                }
                this.scale *= delta;
                this.canvas.style.transform = `scale(${this.scale})`;
            }

            if (toolState.tool.type === "drag") {
                this.drawBorder();
            }
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
        setTimeout(()=>{
            if(this.canvasContainerRef){
                this.canvasContainerRef.onwheel = this.wheelHandler.bind(this);
            }
        },100)

        this.canvas.onwheel = this.wheelHandler.bind(this);
        this.canvasX = this.canvas.width / 2 - this.canvasWidth / 2;
        this.canvasY = 50;
        this.centerX =  this.canvas.width / 2;
        this.centerY =  this.canvas.height/2 + 100;

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

    drawCanvas(dataUrl: string) {
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
            toolState.addImageForEdit({
                imageX: this.canvasX, imageY: this.canvasY, offsetX: 0, offsetY: 0,
                img: img, isDragging: false, isResizing: false, isRotating: false, isUpload: true, angle: 0
            });
            if (this.socket) {
                toolState.setTool(new DragTool(this.canvas, this.socket, this.canvasId, "drag"))
            }
        }

        img.onload = () => {
            if (ctx) {
                if (img.width > 0 && img.height > 0) {
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

    clearOutside(ctx: CanvasRenderingContext2D) {
        const fullCanvasImageData = ctx.getImageData(this.canvasX, this.canvasY, this.canvasWidth, this.canvasHeight);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.putImageData(fullCanvasImageData, this.canvasX, this.canvasY)
    }

    saveCanvas() {
        UserService.saveImage(this.canvasId, this.getDataUrlCanvas())
            .catch(e => console.log(e))
        localStorage.removeItem("image")
    }

    getDataUrlCanvas(canvas?: HTMLCanvasElement) {
        const canvas1 = canvas || this.canvas;
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.canvasWidth;
        tempCanvas.height = this.canvasHeight;
        if (tempCtx) {
            tempCtx.drawImage(canvas1, this.canvasX, this.canvasY, this.canvasWidth, this.canvasHeight, 0, 0, this.canvasWidth, this.canvasHeight);
        }
        return tempCanvas.toDataURL();
    }

    mouseLeaveHandler = () => {
        this.canvas.classList.remove('cursor-crosshair');
        this.canvas.classList.remove('cursor-text');
        this.canvas.classList.remove('cursor-cell');
        cursors.forEach(cursor => this.canvas.classList.remove(cursor))
    }

    clear() {
        const ctx = this.canvas.getContext('2d')
        if (ctx) {
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
            ctx.fillStyle = 'rgba(255,255,255,1)';
            ctx.fillRect(this.canvasX, this.canvasY, this.canvasWidth, this.canvasHeight);
        }
    }
}

export default new CanvasState();
