export default abstract class Tool {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    socket: WebSocket;
    id: string | string[];
    type: string;
    mouseDown: boolean = false;
    offsetTop: number;
    offsetLeft: number;


    constructor(canvas: HTMLCanvasElement, socket: WebSocket, id: string | string[], type: string) {
        this.canvas = canvas;
        this.socket = socket;
        this.offsetTop = canvas.offsetTop;
        this.offsetLeft = canvas.offsetLeft;
        this.type = type;
        this.id = id;
        this.ctx = canvas?.getContext('2d')!;
        this.destroyEvents();
        this.listen();
    }

    listen() {
        this.canvas.onmousemove = this.mouseMoveHandler.bind(this);
        this.canvas.onmousedown = this.mouseDownHandler.bind(this);
        this.canvas.onmouseup = this.mouseUpHandler.bind(this);
        this.canvas.onmouseout = this.mouseOutHandler.bind(this);
    };
    mouseUpHandler(e: MouseEvent) {
        document.onmousemove = null;
        document.onmouseup = null;
    }
    abstract mouseDownHandler(e: MouseEvent): void;
    abstract mouseMoveHandler(e: MouseEvent):void;
    handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown) {
            this.mouseMoveHandler(e);
        }
    }
    handleGlobalMouseUp(e: MouseEvent) {
        this.mouseUpHandler(e);
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
        window.onkeydown = null;
        document.onmousemove = null;
        document.onmouseup = null;
        this.canvas.onmousemove = null;
        this.canvas.onmousedown = null;
        this.canvas.onmouseup = null;
    }
    mouseOutHandler(e: MouseEvent){
        document.onmousemove = this.handleGlobalMouseMove.bind(this);
        document.onmouseup = this.handleGlobalMouseUp.bind(this);
    }
}