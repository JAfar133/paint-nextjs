import PencilTool from "@/lib/tools/pencilTool";
import canvasState from "@/store/canvasState";
import userState from "@/store/userState";
import settingState from "@/store/settingState";
import Tool from "@/lib/tools/tool";

export default class EraserTool extends Tool {
    static eraser(ctx: CanvasRenderingContext2D, x: number, y: number, strokeStyle: string, strokeWith: number) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = strokeWith;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        drawLine(ctx, x + ctx.canvas.width/2, y);
    }
    mouseUpHandler(e: MouseEvent) {
        this.mouseDown = false;
        this.sendSocketFinish();

    }

    mouseDownHandler(e: MouseEvent) {
        if(this.canDraw && canvasState.bufferCtx){
            this.mouseDown = true;
            const {scaledX, scaledY} = canvasState.getScaledPoint(e.offsetX, e.offsetY)
            canvasState.bufferCtx.beginPath();
            canvasState.bufferCtx.moveTo(scaledX, scaledY);
            this.draw(scaledX, scaledY);
        }
    }

    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            const {scaledX, scaledY} = canvasState.getScaledPoint(e.offsetX, e.offsetY)
            this.draw(scaledX, scaledY);
        }
        document.onmousemove = null;
    }

    handleGlobalMouseMove(e: MouseEvent) {
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
            this.draw(x, y)
        }
    }

    touchMoveHandler(e: TouchEvent) {
        if (this.mouseDown && this.canDraw) {
            const touch = e.touches[0];
            const x = touch.clientX - this.offsetLeft;
            const y = touch.clientY - this.offsetTop;
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
                strokeWidth: canvasState.bufferCtx.lineWidth,
                strokeStyle: canvasState.bufferCtx.strokeStyle,
                globalAlpha: settingState.globalAlpha,
                type: this.type,
                x: x - canvasState.bufferCanvas.width/2,
                y: y
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
        e.preventDefault();
    }

    draw(x: number, y: number) {
        this.sendSocketDraw(x,y);
        canvasState.bufferCtx.lineCap = "round";
        canvasState.bufferCtx.lineJoin = "round";
        canvasState.bufferCtx.strokeStyle = "white";
        drawLine(canvasState.bufferCtx, x, y);
    }
}

function drawLine(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.lineTo(x, y);
    ctx.stroke();
    canvasState.draw();
}