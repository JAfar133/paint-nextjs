import {canvasSize, ToolName} from "@/lib/utils";
import settingState from "@/store/settingState";
import userState from "@/store/userState";

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
        this._tempCtx.imageSmoothingEnabled = false;
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
            username: userState.user?.username,
            figure: {
                type: 'finish',
            }
        }));
    }
    protected listen() {
        this.canvas.onmousemove = this.mouseMoveHandler.bind(this);
        this.canvas.onmousedown = this.mouseDownHandler.bind(this);
        this.canvas.onmouseup = this.mouseUpHandler.bind(this);
        this.canvas.onmouseout = this.mouseOutHandler.bind(this);
        this.canvas.ontouchmove = this.touchMoveHandler.bind(this);
        this.canvas.ontouchstart = this.touchStartHandler.bind(this);
        this.canvas.ontouchend = this.touchEndHandler.bind(this);
    }

    protected touchMoveHandler(e: TouchEvent): void {
        if(e.touches.length !== 2) {
            const touch = e.touches[0];
            const x = touch.clientX - this.offsetLeft;
            const y = touch.clientY - this.offsetTop;
            this.move(x, y)
        }
    };

    protected touchStartHandler(e: TouchEvent): void {
        if(e.touches.length !== 2) {
            document.onmousemove = null;
            document.onmouseup = null;
            const touch = e.touches[0];
            const x = touch.clientX - this.offsetLeft;
            const y = touch.clientY - this.offsetTop;
            this.down(x, y, false)
        }
    };

    protected touchEndHandler(e: TouchEvent): void {
        if(e.changedTouches.length !== 2) {
            const touch = e.changedTouches[0];
            const x = touch.clientX - this.offsetLeft;
            const y = touch.clientY - this.offsetTop;
            this.up(x, y)
        }
    };

    protected mouseDownHandler(e: MouseEvent): void {
        if(e.button !== 1){
            this.down(e.offsetX, e.offsetY, true)
        }
    };

    protected mouseMoveHandler(e: MouseEvent): void {
        this.move(e.offsetX, e.offsetY)
    };
    protected mouseUpHandler(e: MouseEvent) {
        if(e.button !== 1) {
            document.onmousemove = null;
            document.onmouseup = null;
            this.up(e.offsetX, e.offsetY)
        }
    }

    protected abstract move(mouseX: number, mouseY: number): void;
    protected abstract down(mouseX: number, mouseY: number, mouse?: boolean): void;
    protected abstract up(mouseX: number, mouseY: number): void;

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
