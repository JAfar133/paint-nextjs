import Tool from "@/lib/tools/tool";
import settingState from "@/store/settingState";
import userState from "@/store/userState";

export default class PencilTool extends Tool {

    mouseUpHandler(e: MouseEvent) {
        this.mouseDown = false;
        this.socket.send(JSON.stringify({
            method: 'draw',
            id: this.id,
            figure: {
                type: 'finish',
            }
        }))
    }

    mouseDownHandler(e: MouseEvent) {
        this.mouseDown = true;
        this.ctx.beginPath();
        this.ctx.moveTo(e.offsetX, e.offsetY);
    }

    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown) {
            this.socket.send(JSON.stringify({
                method: 'draw',
                id: this.id,
                figure: {
                    strokeWidth: this.ctx.lineWidth,
                    strokeStyle: this.ctx.strokeStyle,
                    type: this.type,
                    x: e.offsetX,
                    y: e.offsetY
                }
            }))
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
            }
            else if(e.pageY < this.offsetTop) {
                x = e.offsetX - this.offsetLeft;
                y = e.offsetY - this.offsetTop;
            }
            else {
                x = e.offsetX - this.offsetLeft;
                y = e.offsetY + this.offsetTop;
            }
            this.socket.send(JSON.stringify({
                method: 'draw',
                id: this.id,
                username: userState.user?.username,
                figure: {
                    strokeWidth: this.ctx.lineWidth,
                    strokeStyle: this.ctx.strokeStyle,
                    type: this.type,
                    x: x,
                    y: y
                }
            }))
            this.draw(x, y)
        }
    }
    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, strokeStyle: string, strokeWidth: number){
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWidth;
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    draw(x: number, y: number) {
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

}