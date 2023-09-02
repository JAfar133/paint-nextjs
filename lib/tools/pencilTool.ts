import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";

export default class PencilTool extends Tool {
    lastCircleX: number | null = null;
    lastCircleY: number | null = null;

    mouseUpHandler(e: MouseEvent) {
        this.mouseDown = false;
        this.sendSocketFinish();
        this.lastCircleX = null;
        this.lastCircleY = null;
    }

    mouseDownHandler(e: MouseEvent) {
        this.mouseDown = true;
        this.ctx.beginPath();
        this.ctx.moveTo(e.offsetX, e.offsetY);
    }

    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown) {
            this.sendSocketDraw(e.offsetX, e.offsetY);
            this.draw(e.offsetX, e.offsetY)
        }
        document.onmousemove = null;
    }

    handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown) {
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
            this.sendSocketDraw(x, y);
            this.draw(x, y)
        }
    }

    touchMoveHandler(e: TouchEvent) {
        if (this.mouseDown) {
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
                x: x,
                y: y,
                lastCircleX: this.lastCircleX,
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
        this.lastCircleX = null;
        this.lastCircleY = null;
        e.preventDefault();
    }


    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, lastCircleX: number | null, lastCircleY: number | null, strokeStyle: string, strokeWidth: number) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWidth;

        drawCircle(ctx, x, y, lastCircleX, lastCircleY)
    }

    draw(x: number, y: number) {
        drawCircle(this.ctx, x, y, this.lastCircleX, this.lastCircleY);
        this.lastCircleX = x;
        this.lastCircleY = y;
    }

}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, lastCircleX: number | null, lastCircleY: number | null) {

    if (lastCircleX && lastCircleY) {
        ctx.beginPath();
        ctx.moveTo(lastCircleX, lastCircleY);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, ctx.lineWidth / 2, 0, 2 * Math.PI);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();

}