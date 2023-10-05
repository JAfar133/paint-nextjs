import {canvasSize, ToolName} from "@/lib/utils";

export default abstract class Tool {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    socket: WebSocket;
    id: string | string[];
    type: ToolName;
    mouseDown: boolean = false;
    offsetTop: number;
    offsetLeft: number;
    canDraw: boolean = true;
    tempImage: HTMLImageElement;
    tempCanvas: HTMLCanvasElement;
    tempCtx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, socket: WebSocket, id: string | string[], type: ToolName) {
        this.canvas = canvas;
        this.socket = socket;
        this.tempImage = new Image();
        this.tempCanvas = document.createElement('canvas');
        this.tempCtx = this.tempCanvas.getContext('2d')!;
        this.tempCanvas.width = canvasSize.width;
        this.tempCanvas.height = canvasSize.height;
        this.offsetTop = canvas.getBoundingClientRect().top;
        this.offsetLeft = canvas.getBoundingClientRect().left;
        this.type = type;
        this.id = id;
        this.ctx = canvas?.getContext('2d')!;
        this.destroyEvents();
        this.listen();

    }
    sendSocketFinish(){
        this.socket.send(JSON.stringify({
            method: 'draw',
            id: this.id,
            figure: {
                type: 'finish',
            }
        }));
    }
    protected getScaledPoint(x: number, y: number, canvasX: number, canvasY: number, scale: number){
        const scaledX = (x - canvasX) / scale;
        const scaledY = (y - canvasY) / scale;
        return {scaledX, scaledY}
    }
    listen() {
        this.canvas.onmousemove = this.mouseMoveHandler.bind(this);
        this.canvas.onmousedown = this.mouseDownHandler.bind(this);
        this.canvas.onmouseup = this.mouseUpHandler.bind(this);
        this.canvas.onmouseout = this.mouseOutHandler.bind(this);
        // Добавьте обработчики событий касания
        this.canvas.ontouchmove = this.touchMoveHandler.bind(this);
        this.canvas.ontouchstart = this.touchStartHandler.bind(this);
        this.canvas.ontouchend = this.touchEndHandler.bind(this);
    }

    mouseUpHandler(e: MouseEvent) {
        document.onmousemove = null;
        document.onmouseup = null;
    }

    abstract touchMoveHandler(e: TouchEvent): void;

    abstract touchStartHandler(e: TouchEvent): void;

    abstract touchEndHandler(e: TouchEvent): void;

    abstract mouseDownHandler(e: MouseEvent): void;

    abstract mouseMoveHandler(e: MouseEvent): void;

    handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown) {
            this.mouseMoveHandler(e);
        }
    }

    handleGlobalMouseUp(e: MouseEvent) {
        if (this.mouseDown) {
            this.mouseUpHandler(e);
        }
    }

    destroyEvents() {
        document.onkeydown = null;
        document.onmousemove = null;
        document.onmouseup = null;
        this.canvas.onmousemove = null;
        this.canvas.onmousedown = null;
        this.canvas.onmouseup = null;
        this.canvas.ontouchmove = null;
        this.canvas.ontouchstart = null;
        this.canvas.ontouchend = null;
    }

    mouseOutHandler() {
        document.onmousemove = this.handleGlobalMouseMove.bind(this);
        document.onmouseup = this.handleGlobalMouseUp.bind(this);
    }

}