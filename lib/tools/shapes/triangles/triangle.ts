import Shape from "@/lib/tools/shapes/Shape";

export default abstract class Triangle extends Shape {
    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {

            this.width = e.offsetX;
            this.height = e.offsetY;
            this.draw(this.startX, this.startY, this.width, this.height)
        }
        document.onmousemove = null;
    }
    touchMoveHandler(e: TouchEvent) {
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

    handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown && this.canDraw) {
            this.width = e.offsetX - this.offsetLeft;
            this.height = e.offsetY - this.offsetTop;

            this.draw(this.startX, this.startY, this.width, this.height)
        }
    }

    abstract draw(x0: number, y0: number, x1: number, y1: number): void;
}