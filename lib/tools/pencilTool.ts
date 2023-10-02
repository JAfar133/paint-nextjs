import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";
import {action} from "mobx";

export default class PencilTool extends Tool {
    lastCircleX: number = -1;
    lastCircleY: number = -1;

    mouseUpHandler(e: MouseEvent) {
        this.mouseDown = false;
        this.sendSocketFinish();
        this.lastCircleX = -1;
        this.lastCircleY = -1;
    }

    mouseDownHandler(e: MouseEvent) {
        if(this.canDraw){
            this.mouseDown = true;
            this.ctx.beginPath();
            this.ctx.moveTo(e.offsetX, e.offsetY);
        }
    }

    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            const x = e.offsetX;
            const y = e.offsetY;
            this.sendSocketDraw(x, y);
            this.draw(x, y);
        }
        document.onmousemove = null;
    }

    handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            let x = e.offsetX - this.offsetLeft;
            let y = e.offsetY - this.offsetTop;
            this.sendSocketDraw(x, y);
            this.draw(x, y)
        }
    }

    touchMoveHandler(e: TouchEvent) {
        if (this.mouseDown && this.canDraw) {
            const touch = e.touches[0];
            const x = touch.clientX - this.offsetLeft;
            const y = touch.clientY - this.offsetTop;
            this.sendSocketDraw(x, y);
            this.draw(x, y);
        }
        e.preventDefault();
    }

    sendSocketDraw(x: number, y: number) {
        this.socket.send(JSON.stringify({
            method: 'draw',
            id: this.id,
            username: userState.user?.username,
            figure: {
                strokeWidth: this.ctx.lineWidth,
                strokeStyle: this.ctx.strokeStyle,
                type: this.type,
                x: x - this.canvas.width/2,
                y: y,
                lastCircleX: this.lastCircleX - this.canvas.width/2,
                lastCircleY: this.lastCircleY,
            }
        }));
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

    touchStartHandler(e: TouchEvent) {
        const touch = e.touches[0];
        const x = touch.clientX - this.offsetLeft;
        const y = touch.clientY - this.offsetTop;
        this.mouseDown = true;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        e.preventDefault();
    }

    touchEndHandler(e: TouchEvent) {
        this.mouseDown = false;
        this.sendSocketFinish();
        this.lastCircleX = -1;
        this.lastCircleY = -1;
        e.preventDefault();
    }


    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, lastCircleX: number, lastCircleY: number, strokeStyle: string, strokeWidth: number) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWidth;
        drawCircle(ctx, ctx.canvas.width/2 + x, y, ctx.canvas.width/2 + lastCircleX, lastCircleY)
    }

    draw(x: number, y: number) {
        drawCircle(this.ctx, x, y, this.lastCircleX, this.lastCircleY);
        this.lastCircleX = x;
        this.lastCircleY = y;
    }

}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, lastCircleX: number, lastCircleY: number) {
    if (lastCircleX!==-1 && lastCircleY!==-1) {
        ctx.beginPath();
        ctx.moveTo(lastCircleX, lastCircleY);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, ctx.lineWidth / 2, 0, 2 * Math.PI);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    canvasState.clearOutside(ctx);
}