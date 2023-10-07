import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";
import settingState from "@/store/settingState";
import {Point} from "@/lib/tools/shapes/arcTool";

export default class PencilTool extends Tool {

    mouse:Point = {x: 0, y: 0};

    ppts: Point[] = [];
    protected mouseUpHandler(e: MouseEvent) {
        this.mouseDown = false;
        this.sendSocketFinish();
        if(canvasState.globalAlpha !==1){
            canvasState.bufferCtx.drawImage(this.tempCanvas,0,0);
            canvasState.draw();
            this.tempCtx.clearRect(0,0, this.tempCanvas.width, this.tempCanvas.height);
            this.ppts = [];
        }
    }
    protected sendSocketFinish(){
        this.socket.send(JSON.stringify({
            method: 'draw',
            id: this.id,
            figure: {
                type: 'finish',
                draw: true
            }
        }));
    }
    protected mouseDownHandler(e: MouseEvent) {
        if(this.canDraw){
            this.mouseDown = true;
            if(settingState.globalAlpha !== 1){
                this.tempCtx.globalAlpha = settingState.globalAlpha;
                this.tempCtx.lineWidth = settingState.strokeWidth;
                this.tempCtx.strokeStyle = settingState.strokeColor;
                this.tempCtx.lineCap = "round";
                this.tempCtx.lineJoin = "round";
            }
            else {
                const {scaledX, scaledY} = this.getScaledPoint(e.offsetX, e.offsetY, canvasState.canvasX, canvasState.canvasY, canvasState.scale)
                canvasState.bufferCtx.beginPath();
                canvasState.bufferCtx.moveTo(scaledX, scaledY);
            }

        }
    }

    protected mouseMoveHandler(e: MouseEvent) {
        const {scaledX, scaledY} = this.getScaledPoint(e.offsetX, e.offsetY, canvasState.canvasX, canvasState.canvasY, canvasState.scale)
        this.mouse.x = scaledX;
        this.mouse.y = scaledY;
        if (this.mouseDown && this.canDraw) {
            this.sendSocketDraw();
            if(settingState.globalAlpha !==1){
                this.ppts.push({x: this.mouse.x, y: this.mouse.y});
                this.draw(scaledX, scaledY);
            }
            else {
                canvasState.bufferCtx.lineWidth = settingState.strokeWidth;
                canvasState.bufferCtx.strokeStyle = settingState.strokeColor;
                canvasState.bufferCtx.lineCap = "round";
                canvasState.bufferCtx.lineJoin = "round";
                draw(canvasState.bufferCtx, this.mouse.x, this.mouse.y);
            }
        }
        document.onmousemove = null;
    }

    protected handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            let x;
            let y;
            if ((e.pageY < (this.offsetTop + this.canvas.height)) && e.pageY > this.offsetTop) {
                x = e.offsetX - this.offsetLeft;
                y = e.offsetY;
            } else if (e.pageY < this.offsetTop) {
                x = e.offsetX - this.offsetLeft;
                y = e.offsetY - this.offsetTop;
            } else {
                x = e.offsetX - this.offsetLeft;
                y = e.offsetY + this.offsetTop;
            }
            this.sendSocketDraw();
            this.draw(x, y)
        }
    }

    protected touchMoveHandler(e: TouchEvent) {
        if (this.mouseDown && this.canDraw) {
            const touch = e.touches[0];
            const x = touch.clientX - this.offsetLeft;
            const y = touch.clientY - this.offsetTop;
            this.sendSocketDraw();
            this.draw(x, y);
        }
        e.preventDefault();
    }

    private sendSocketDraw() {
        this.socket.send(JSON.stringify({
            method: 'draw',
            id: this.id,
            username: userState.user?.username,
            figure: {
                strokeWidth: settingState.strokeWidth,
                strokeStyle: settingState.strokeColor,
                globalAlpha: settingState.globalAlpha,
                type: this.type,
                mouse: {x: this.mouse.x - this.tempCanvas.width/2, y: this.mouse.y},
                ppts: this.ppts
            }
        }));
    }


    protected touchStartHandler(e: TouchEvent) {
        const touch = e.touches[0];
        const x = touch.clientX - this.offsetLeft;
        const y = touch.clientY - this.offsetTop;
        this.mouseDown = true;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        e.preventDefault();
    }

    protected touchEndHandler(e: TouchEvent) {
        this.mouseDown = false;
        this.sendSocketFinish();
        e.preventDefault();
    }


    static draw(ctx: CanvasRenderingContext2D, mouse: Point, ppts: Point[], strokeStyle: string, strokeWidth: number, globalAlpha: number) {
        if(globalAlpha !== 1){
            if(Tool.tempCtx == null){
                Tool.tempCanvas = document.createElement('canvas');
                Tool.tempCanvas.width = ctx.canvas.width;
                Tool.tempCanvas.height = ctx.canvas.height;
                Tool.tempCtx = Tool.tempCanvas.getContext('2d')!;
            }
            Tool.tempCtx.lineCap = "round";
            Tool.tempCtx.lineJoin = "round";
            Tool.tempCtx.strokeStyle = strokeStyle;
            Tool.tempCtx.lineWidth = strokeWidth;
            Tool.tempCtx.globalAlpha = globalAlpha;
            mouse.x+=Tool.tempCtx.canvas.width/2;
            drawLine(Tool.tempCtx, mouse, ppts);
            canvasState.draw(Tool.tempCanvas!);
        }
        else {
            canvasState.bufferCtx.lineCap = "round";
            canvasState.bufferCtx.lineJoin = "round";
            canvasState.bufferCtx.strokeStyle = strokeStyle;
            canvasState.bufferCtx.lineWidth = strokeWidth;
            mouse.x+=canvasState.bufferCanvas.width/2;
            draw(ctx, mouse.x, mouse.y)
        }

    }

    protected draw(x: number, y: number) {
        drawLine(this.tempCtx, this.mouse, this.ppts);
        canvasState.draw(this.tempCtx.canvas);
    }
}

function draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.lineTo(x, y);
    ctx.stroke();
    canvasState.draw();
}

function drawLine(tempCtx: CanvasRenderingContext2D, mouse: Point, ppts: Point[]) {
    if(ppts.length < 3){
        const b = ppts[0];
        if(b){
            tempCtx.beginPath();
            tempCtx.arc(b.x,b.y,settingState.strokeWidth/2, 0, Math.PI*2, !0);
            tempCtx.fill();
            tempCtx.closePath();
        }
        return;
    }
    tempCtx.clearRect(0,0,tempCtx.canvas.width, tempCtx.canvas.height);
    tempCtx.beginPath();
    tempCtx.moveTo(ppts[0].x, ppts[0].y);
    for (var i = 1; i< ppts.length -2; i++){
        const c = (ppts[i].x + ppts[i + 1].x) / 2;
        const d = (ppts[i].y + ppts[i + 1].y) / 2;
        tempCtx.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d);
    }
    tempCtx.quadraticCurveTo(
        ppts[i].x,
        ppts[i].y,
        ppts[i + 1].x,
        ppts[i + 1].y
    );
    tempCtx.stroke();
}