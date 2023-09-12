
export default abstract class Tool {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    bufferCanvas: HTMLCanvasElement;
    bufferCtx: CanvasRenderingContext2D;

    socket: WebSocket;
    id: string | string[];
    type: string;
    mouseDown: boolean = false;
    offsetTop: number;
    offsetLeft: number;
    saved: string = "";

    constructor(canvas: HTMLCanvasElement, socket: WebSocket, id: string | string[], type: string) {
        this.canvas = canvas;
        this.socket = socket;
        this.offsetTop = canvas.offsetTop;
        this.offsetLeft = canvas.offsetLeft;
        this.type = type;
        this.id = id;
        this.ctx = canvas?.getContext('2d')!;
        this.bufferCanvas = document.createElement('canvas');
        this.bufferCanvas.width = this.canvas.width;
        this.bufferCanvas.height = this.canvas.height;
        this.bufferCtx = this.bufferCanvas.getContext('2d')!;

        this.destroyEvents();
        this.listen();
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
        if(this.mouseDown){
            this.mouseUpHandler(e);
        }
    }
    set fillColor(color: string) {
        this.ctx.fillStyle = color;
    }

    set strokeColor(color: string) {
        this.ctx.strokeStyle = color;
    }

    set lineWidth(width: number) {
        this.ctx.lineWidth = width;
    }

    set font(font: string) {
        this.ctx.font = font
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
    mouseOutHandler(){
        document.onmousemove = this.handleGlobalMouseMove.bind(this);
        document.onmouseup = this.handleGlobalMouseUp.bind(this);
    }
}