import {canvasSize, ToolName} from "@/lib/utils";

export default abstract class Tool {
    protected canvas: HTMLCanvasElement;
    protected ctx: CanvasRenderingContext2D;
    protected socket: WebSocket;
    protected id: string | string[];
    protected mouseDown: boolean = false;
    protected offsetTop: number;
    protected offsetLeft: number;
    protected tempImage: HTMLImageElement;
    private _type: ToolName;
    private _canDraw: boolean = true;
    private _tempCanvas: HTMLCanvasElement;
    private _tempCtx: CanvasRenderingContext2D;
    static tempCanvas: HTMLCanvasElement | null = null
    static tempCtx: CanvasRenderingContext2D | null = null;
    constructor(canvas: HTMLCanvasElement, socket: WebSocket, id: string | string[], type: ToolName) {
        this.canvas = canvas;
        this.socket = socket;
        this.tempImage = new Image();
        this._tempCanvas = document.createElement('canvas');
        this._tempCtx = this._tempCanvas.getContext('2d')!;
        this._tempCanvas.width = canvasSize.width;
        this._tempCanvas.height = canvasSize.height;
        this.offsetTop = canvas.getBoundingClientRect().top;
        this.offsetLeft = canvas.getBoundingClientRect().left;
        this._type = type;
        this.id = id;
        this.ctx = canvas?.getContext('2d')!;
        this.destroyEvents();
        this.listen();
    }
    protected sendSocketFinish(){
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
    protected listen() {
        this.canvas.onmousemove = this.mouseMoveHandler.bind(this);
        this.canvas.onmousedown = this.mouseDownHandler.bind(this);
        this.canvas.onmouseup = this.mouseUpHandler.bind(this);
        this.canvas.onmouseout = this.mouseOutHandler.bind(this);
        // Добавьте обработчики событий касания
        this.canvas.ontouchmove = this.touchMoveHandler.bind(this);
        this.canvas.ontouchstart = this.touchStartHandler.bind(this);
        this.canvas.ontouchend = this.touchEndHandler.bind(this);
    }

    protected mouseUpHandler(e: MouseEvent) {
        document.onmousemove = null;
        document.onmouseup = null;
    }

    protected abstract touchMoveHandler(e: TouchEvent): void;

    protected abstract touchStartHandler(e: TouchEvent): void;

    protected abstract touchEndHandler(e: TouchEvent): void;

    protected abstract mouseDownHandler(e: MouseEvent): void;

    protected abstract mouseMoveHandler(e: MouseEvent): void;

    protected handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown) {
            this.mouseMoveHandler(e);
        }
    }

    protected handleGlobalMouseUp(e: MouseEvent) {
        if (this.mouseDown) {
            this.mouseUpHandler(e);
        }
    }

    protected destroyEvents() {
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

    protected mouseOutHandler() {
        document.onmousemove = this.handleGlobalMouseMove.bind(this);
        document.onmouseup = this.handleGlobalMouseUp.bind(this);
    }


    get type(): ToolName {
        return this._type;
    }

    set type(value: ToolName) {
        this._type = value;
    }

    get canDraw(): boolean {
        return this._canDraw;
    }

    set canDraw(value: boolean) {
        this._canDraw = value;
    }

    get tempCanvas(): HTMLCanvasElement {
        return this._tempCanvas;
    }

    set tempCanvas(value: HTMLCanvasElement) {
        this._tempCanvas = value;
    }

    get tempCtx(): CanvasRenderingContext2D {
        return this._tempCtx;
    }

    set tempCtx(value: CanvasRenderingContext2D) {
        this._tempCtx = value;
    }
}