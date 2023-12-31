import Shape from "@/lib/tools/shapes/Shape";
import canvasState from "@/store/canvasState";

export default abstract class Triangle extends Shape {
    protected mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            const {scaledX, scaledY} = canvasState.getScaledPoint(e.offsetX, e.offsetY)
            this.width = scaledX;
            this.height = scaledY;
            this.draw(this.startX, this.startY, this.width, this.height)
        }
        document.onmousemove = null;
    }
    protected touchMoveHandler(e: TouchEvent) {
        if (this.mouseDown && this.canDraw) {
            const touch = e.touches[0];
            const x = touch.clientX - this.offsetLeft;
            const y = touch.clientY - this.offsetTop;
            this.width = x;
            this.height = y;
            this.draw(this.startX, this.startY, this.width, this.height);
        }
        document.ontouchmove = null;
    }

    protected handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            this.width = e.offsetX - this.offsetLeft;
            this.height = e.offsetY - this.offsetTop;

            this.draw(this.startX, this.startY, this.width, this.height)
        }
    }

    protected abstract draw(x0: number, y0: number, x1: number, y1: number): void;
}