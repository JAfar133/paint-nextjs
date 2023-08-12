import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";

interface Point {
    x: number;
    y: number;
}

export default class ArcTool extends Tool {
    startPoint: Point | null = null;
    controlPoint: Point | null = null;
    endPoint: Point | null = null;

    mouseDownHandler(e: MouseEvent) {
        const canvas = e.target as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
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

    static draw(ctx: CanvasRenderingContext2D, startPoint: Point, endPoint: Point, controlPoint: Point,
                strokeStyle: string, strokeWith: number) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWith;
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.bezierCurveTo(
            controlPoint.x, controlPoint.y,
            controlPoint.x, controlPoint.y,
            endPoint.x, endPoint.y
        );
        ctx.stroke();
    }
    draw(startPoint: Point, endPoint: Point, controlPoint: Point) {
        this.ctx.beginPath();
        this.ctx.moveTo(startPoint.x, startPoint.y);
        this.ctx.bezierCurveTo(
            controlPoint.x, controlPoint.y,
            controlPoint.x, controlPoint.y,
            endPoint.x, endPoint.y
        );
        this.ctx.stroke();
    }

    mouseMoveHandler(e: MouseEvent): void {
        // Какой же паттерн применить ;_)
    }

    mouseUpHandler(e: MouseEvent): void {
        super.mouseUpHandler(e)
    }
}