import {makeAutoObservable} from "mobx";
import UserService from "@/lib/api/UserService";
import toolState from "@/store/toolState";
import DragTool from "@/lib/tools/dragTool";
import userState from "@/store/userState";
import settingState from "@/store/settingState";
import TextTool from "@/lib/tools/textTool";

export type cursorClass =
    "cursor-move" | "cursor-grab" | "cursor-text" | "cursor-cell" |
    "cursor-grabbing" | "cursor-nwse-resize" | "cursor-alias" | "cursor-crosshair" |
    "cursor-nesw-resize" | "cursor-ew-resize" | "cursor-ns-resize" | "cursor-auto" | "cursor-none"
export const cursors: cursorClass[] =
    ["cursor-move", "cursor-grab", "cursor-text", "cursor-cell", "cursor-none",
        "cursor-grabbing", "cursor-nwse-resize", "cursor-alias", "cursor-crosshair",
        "cursor-nesw-resize", "cursor-ew-resize", "cursor-ns-resize", "cursor-auto"]

export interface Message {
    id: string,
    username: string,
    text: string,
    date: Date,
    color: string
}
export interface UserCanvas {
    id: string,
    username: string,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    order: number
}

class CanvasState {
    // @ts-ignore
    canvas: HTMLCanvasElement;
    canvas_id: string;
    socket: WebSocket | null = null;
    undoList: HTMLCanvasElement[] = [];
    redoList: HTMLCanvasElement[] = [];
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
    circleOverlayRef: HTMLDivElement | null = null;
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
    gridCanvas: HTMLCanvasElement | null= null;
    gridCtx: CanvasRenderingContext2D | null= null;
    textX: number | null = null;
    textY: number | null = null;
    userCanvases: Map<string, UserCanvas> = new Map<string, UserCanvas>();
    layerOrder: number = 0;
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
    debounceTimeOut: any = null;
    drawTextLine(x: number, y: number){
        this.textX = x;
        this.textY = y;
        let vline = document.getElementById('vline');
        if(!vline){
            vline = document.createElement('div');
            vline.id = "vline";
            this.canvasContainer?.appendChild(vline);
        }
        if (this.debounceTimeOut) {
            vline.style.animation = 'none'
            clearTimeout(this.debounceTimeOut);
        }

        this.debounceTimeOut = setTimeout(function() {
            vline!.style.animation = 'fadeInOut 1s ease infinite'
        }, 100);
        vline.style.height = `${settingState.textSize*this.scale}px`
        vline.style.transform = `translate(${this.canvasX + x*this.scale}px, ${this.canvasY + y*this.scale - settingState.textSize/2*this.scale}px)`
    }
    deleteTextLine(){
        document.getElementById("vline")?.remove();
        this.textX = null;
        this.textY = null;
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

        this.scale = this.scale * scaleFactor;

        this.canvasX -= (e.offsetX - this.canvasX) * (scaleFactor - 1);
        this.canvasY -= (e.offsetY - this.canvasY) * (scaleFactor - 1);
        this.draw();
        if(this.circleOverlayRef){
            const xTransform = e.offsetX - this.circleOverlayRef.clientWidth / 2 + 'px';
            const yTransform = e.offsetY - this.circleOverlayRef.clientHeight / 2 + 'px';
            this.circleOverlayRef.style.transform = `translate(${xTransform}, ${yTransform})`;
            this.circleOverlayRef.style.width = String(`${Math.floor(settingState.strokeWidth*this.scale)}px`);
            this.circleOverlayRef.style.height = String(`${Math.floor(settingState.strokeWidth*this.scale)}px`);
        }
        if(settingState.strokeWidth===1){
            this.circleOverlayRef!.style.borderRadius = '0';
        } else {
            this.circleOverlayRef!.style.borderRadius = '50%';
        }
    }

    draw(canvas?: HTMLCanvasElement, websocket?: boolean): void {
        const ctx = this.canvas.getContext('2d')
        if(toolState.tool?.type === "text"){
            if(this.textX && this.textY)
            this.drawTextLine(this.textX, this.textY)
        }
        else {
            this.deleteTextLine();
        }
        const usersCanvases = Array.from(this.userCanvases.values());
        if(ctx){
            this.bufferCtx.globalAlpha = 1;
            ctx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
            ctx.setTransform(this.scale, 0, 0, this.scale, this.canvasX, this.canvasY);
            ctx.imageSmoothingEnabled = this.scale <= 3;
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
            if(usersCanvases.length > 0){
                usersCanvases
                    .sort((a, b) => a.order - b.order)
                    .forEach(ucanvas=>{
                        if(ucanvas.order > this.layerOrder){
                            ctx.drawImage(this.bufferCanvas, 0,0);
                        }
                        ctx.drawImage(ucanvas.canvas, 0, 0)
                    })
            } else {
                ctx.drawImage(this.bufferCanvas, 0,0);
            }

            if(canvas){
                ctx.drawImage(canvas, 0, 0);
            }
            ctx.resetTransform();
            // this.grid()

            if (toolState.tool instanceof DragTool) {
                this.drawBorder();
            }
        }
    }
    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.bufferCanvas = document.createElement('canvas');
        this.savedCanvasWithoutImage = document.createElement('canvas');
        this.bufferCtx = this.bufferCanvas.getContext('2d')!;
        this.bufferCtx.imageSmoothingEnabled = false;
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

    addUndo(data: HTMLCanvasElement) {
        this.undoList.push(data);
    }

    addRedo(data: HTMLCanvasElement) {
        this.redoList.push(data);
    }

    undo() {
        if (this.undoList.length) {
            const {tempCtx, tempCanvas} = this.createTempCanvas();
            tempCtx.drawImage(this.bufferCanvas,0,0)
            this.addRedo(tempCanvas);
            let canvas = this.undoList.pop();
            if(canvas){
                this.drawCanvas(canvas);
                if(toolState.tool instanceof TextTool){
                    toolState.tool.undo(true);
                }
            }
        }
        this.sendDataUrl(this.bufferCanvas.toDataURL());
    }

    redo() {
        if (this.redoList.length) {
            const canvas = this.redoList.pop();
            if(canvas){
                const {tempCtx, tempCanvas} = this.createTempCanvas();
                tempCtx.drawImage(this.bufferCanvas,0,0)
                this.addUndo(tempCanvas);
                this.drawCanvas(canvas);
                this.sendDataUrl(canvas.toDataURL());
            }
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

    drawCanvas(canvas: HTMLCanvasElement) {
        this.bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
        this.bufferCtx.drawImage(canvas, 0, 0);
        this.draw();
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
                    const {tempCtx, tempCanvas} = this.createTempCanvas();
                    tempCtx.drawImage(this.bufferCanvas,0,0);
                    this.undoList.push(tempCanvas);
                    this.draw();
                }
            }
        }
    }

    clearCanvas() {
        Array.from(this.userCanvases.values()).forEach((c)=>{
            c.ctx.clearRect(0,0,c.canvas.width,c.canvas.height);
        })
        this.clear()
        this.saveCanvas();
        this.deleteBorder();
        if(toolState.tool instanceof TextTool){
            toolState.tool.clearPrevKeyArray();
        }
        if (this.socket) {
            this.socket.send(JSON.stringify({
                method: "clear",
                username: userState.user?.username,
                id: this.canvasId,
            }))
        }
    }

    saveCanvas() {
        const {tempCanvas, tempCtx} = this.createTempCanvas();
        Array.from(this.userCanvases.values()).forEach(ucanvas=>{
            tempCtx.drawImage(ucanvas.canvas, 0, 0)
        })
        tempCtx.drawImage(this.bufferCanvas, 0,0);
        UserService.saveImage(this.canvasId, tempCanvas.toDataURL())
            .catch(e => console.log(e))
        localStorage.removeItem("image")
    }

    mouseLeaveHandler = () => {
        if(this.circleOverlayRef){
            this.circleOverlayRef.style.display = 'none';
        }
        cursors.forEach(cursor => this.canvas.classList.remove(cursor))
    }

    clear() {
        if(toolState.tool){
            toolState.tool.tempCtx.clearRect(0,0,toolState.tool.tempCanvas.width, toolState.tool.tempCanvas.height)
        }
        this.bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
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
    getScaledPoint(x: number, y: number){
        let scaledX = Math.floor((x - this.canvasX) / this.scale);
        let scaledY = Math.floor((y - this.canvasY) / this.scale);
        if(settingState.strokeWidth%2 !== 0){
            scaledX+=0.5;
            scaledY+=0.5;
        }

        return {scaledX, scaledY}
    }
    grid(){
        const gridContainer = document.getElementById('grid-container');
        if(gridContainer){
            gridContainer.style.position = 'absolute';
            gridContainer.style.left = `0`
            gridContainer.style.top = `0`
            gridContainer.style.transform = `scale(${this.scale})`
            gridContainer.style.width = `${this.bufferCanvas.width}px`
            gridContainer.style.height = `${this.bufferCanvas.height}px`
            gridContainer.style.gridTemplateColumns = `repeat(${this.bufferCanvas.width},1px)`
            gridContainer.style.zIndex = '1000'
        }
    }
    drawGrid(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D){
        const pixelSize = 2; // Размер пикселя (ширина и высота)
        ctx.strokeStyle = 'gray'
        // Рисуем сетку из пикселей
        for (let x = 0; x < canvas.width; x += pixelSize) {
            for (let y = 0; y < canvas.height; y += pixelSize) {
                ctx.strokeRect(x+0.5, y+0.5, pixelSize, pixelSize);
            }
        }
    }
    createTempCanvas(width?: number, height?: number):{tempCanvas: HTMLCanvasElement, tempCtx: CanvasRenderingContext2D}{
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width || this.bufferCanvas.width;
        tempCanvas.height = height || this.bufferCanvas.height;
        const tempCtx = tempCanvas.getContext('2d')!;
        return {tempCanvas, tempCtx}
    }
    fix_dpi() {
        const canvas = this.canvas;
        let style = {
            height() {
                return + getComputedStyle(canvas).getPropertyValue('height').slice(0,-2);
            },
            width() {
                return + getComputedStyle(canvas).getPropertyValue('width').slice(0,-2);
            }
        }
        const width = (style.width() * window.devicePixelRatio).toString();
        const height = (style.height() * window.devicePixelRatio).toString();
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);


    }
    fit(contains:boolean) {
        return (parentWidth: number, parentHeight: number, childWidth: number, childHeight: number, scale = 1, offsetX = 0.5, offsetY = 0.5) => {
            const childRatio = childWidth / childHeight
            const parentRatio = parentWidth / parentHeight
            let width = parentWidth * scale
            let height = parentHeight * scale

            if (contains ? (childRatio > parentRatio) : (childRatio < parentRatio)) {
                height = width / childRatio
            } else {
                width = height * childRatio
            }

            return {
                width,
                height,
                offsetX: (parentWidth - width) * offsetX,
                offsetY: (parentHeight - height) * offsetY
            }
        }
    }
}

export default new CanvasState();
