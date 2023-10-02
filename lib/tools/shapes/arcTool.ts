import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";

export interface Point {
    x: number;
    y: number;
}

export default class ArcTool extends Tool {
    startPoint: Point | null = null;
    controlPoint: Point | null = null;
    endPoint: Point | null = null;

    mouseDownHandler(e: MouseEvent) {
        if(e.button !== 1 && this.canDraw){
            const canvas = e.target as HTMLCanvasElement;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - this.canvas.width/2;
            const y = e.clientY - rect.top;
            if (!this.startPoint) {
                this.startPoint = { x, y };
            } else if (!this.controlPoint) {
                this.controlPoint = { x, y };
            } else if (!this.endPoint) {
                this.endPoint = { x, y };
                this.socket.send(JSON.stringify({
                    method: 'draw',
                    id: this.id,
                    username: userState.user?.username,
                    figure: {
                        strokeStyle: this.ctx.strokeStyle,
                        strokeWidth: this.ctx.lineWidth,
                        type: this.type,
                        startPoint: this.startPoint,
                        controlPoint: this.controlPoint,
                        endPoint: this.endPoint,
                    }
                }))
                this.draw(this.startPoint, this.endPoint, this.controlPoint);
                this.startPoint = null;
                this.controlPoint = null;
                this.endPoint = null;
            }
        }
    }

    static draw(ctx: CanvasRenderingContext2D, startPoint: Point, endPoint: Point, controlPoint: Point,
                strokeStyle: string, strokeWith: number) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWith;
        ctx.beginPath();
        ctx.moveTo(startPoint.x + ctx.canvas.width/2, startPoint.y);
        ctx.bezierCurveTo(
            controlPoint.x + ctx.canvas.width/2, controlPoint.y,
            controlPoint.x + ctx.canvas.width/2, controlPoint.y,
            endPoint.x + ctx.canvas.width/2, endPoint.y
        );
        ctx.stroke();
        canvasState.clearOutside(ctx);
    }
    draw(startPoint: Point, endPoint: Point, controlPoint: Point) {
        this.ctx.beginPath();
        this.ctx.moveTo(startPoint.x + this.ctx.canvas.width/2, startPoint.y);
        this.ctx.bezierCurveTo(
            controlPoint.x + this.ctx.canvas.width/2, controlPoint.y,
            controlPoint.x + this.ctx.canvas.width/2, controlPoint.y,
            endPoint.x + this.ctx.canvas.width/2, endPoint.y
        );
        this.ctx.stroke();
        canvasState.clearOutside(this.ctx);
    }

    mouseMoveHandler(e: MouseEvent): void {

    }

    mouseUpHandler(e: MouseEvent): void {
        super.mouseUpHandler(e)
    }
    touchEndHandler(e: TouchEvent): void {
    }

    touchMoveHandler(e: TouchEvent): void {
    }

    touchStartHandler(e: TouchEvent): void {
    }
}