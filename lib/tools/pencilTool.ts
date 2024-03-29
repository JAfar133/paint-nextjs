import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";
import settingState from "@/store/settingState";
import {Point} from "@/lib/tools/shapes/arcTool";

export default class PencilTool extends Tool {

    mouse:Point = {x: 0, y: 0};

    ppts: Point[] = [];
    protected sendSocketFinish(){
        this.socket.send(JSON.stringify({
            method: 'draw',
            id: this.id,
            username: userState.user?.username,
            figure: {
                type: 'finish',
                draw: true
            }
        }));
    }
    protected down(mouseX: number, mouseY: number, mouse: boolean = true){
        const {scaledX, scaledY} = canvasState.getScaledPoint(mouseX, mouseY)
        this.mouseDown = true;
        const {tempCtx, tempCanvas} = canvasState.createTempCanvas();
        tempCtx.drawImage(canvasState.bufferCanvas,0,0)
        canvasState.addUndo(tempCanvas);
        if(settingState.globalAlpha !== 1){
            this.tempCtx.globalAlpha = settingState.globalAlpha;
            this.tempCtx.lineWidth = settingState.strokeWidth;
            this.tempCtx.strokeStyle = settingState.strokeColor;
            this.tempCtx.lineCap = "round";
            this.tempCtx.lineJoin = "round";
            if(mouse){
                this.ppts.push({x: scaledX, y: scaledY});
                this.draw(scaledX, scaledY);
            }
        }
        else {
            this.tempCtx.beginPath();
            this.tempCtx.moveTo(scaledX, scaledY);
            this.tempCtx.lineWidth = settingState.strokeWidth;
            this.tempCtx.strokeStyle = settingState.strokeColor;
            this.tempCtx.lineCap = "round";
            this.tempCtx.lineJoin = "round";
            if(mouse){
                draw(this.tempCtx, scaledX, scaledY);
                this.sendSocketDraw();
            }
        }
    }
    protected move(mouseX: number, mouseY: number) {
        const {scaledX, scaledY} = canvasState.getScaledPoint(mouseX, mouseY)
        this.mouse.x = scaledX;
        this.mouse.y = scaledY;
        if (this.mouseDown && this.canDraw) {
            this.sendSocketDraw();
            if(settingState.globalAlpha !==1){
                this.ppts.push({x: this.mouse.x, y: this.mouse.y});
                this.draw(scaledX, scaledY);
            }
            else {
                draw(this.tempCtx, scaledX, scaledY);
            }
        }
        document.onmousemove = null;
        document.ontouchmove = null;
    }
    protected up() {
        this.mouseDown = false;
        this.sendSocketFinish();
        canvasState.bufferCtx.drawImage(this.tempCanvas,0,0);
        canvasState.draw();
        this.tempCtx.clearRect(0,0, this.tempCanvas.width, this.tempCanvas.height);
        this.ppts = [];
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
        }
        else {
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = strokeWidth;
            mouse.x+=ctx.canvas.width/2;
            draw(ctx, mouse.x, mouse.y)
        }

    }

    protected draw(x: number, y: number) {
        this.ppts.push({x: this.mouse.x, y: this.mouse.y});
        this.sendSocketDraw();
        drawLine(this.tempCtx, this.mouse, this.ppts);
    }
}

function draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.lineTo(x, y);
    ctx.stroke();
    canvasState.draw(ctx.canvas);
}

function drawLine(tempCtx: CanvasRenderingContext2D, mouse: Point, ppts: Point[]) {
    ppts.push({x: mouse.x, y: mouse.y});
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
    canvasState.draw(tempCtx.canvas);
}