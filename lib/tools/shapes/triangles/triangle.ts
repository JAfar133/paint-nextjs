import Shape from "@/lib/tools/shapes/Shape";

export default abstract class Triangle extends Shape {
    mouseMoveHandler(e: MouseEvent) {
        if (this.mouseDown) {

            this.width = e.offsetX;
            this.height = e.offsetY;
            console.log("width", this.width)
            this.draw(this.startX, this.startY, this.width, this.height)
        }
        document.onmousemove = null;
    }

    handleGlobalMouseMove(e: MouseEvent) {
        if (this.mouseDown) {
            if ((e.pageY < (this.offsetTop + this.canvas.height)) && e.pageY > this.offsetTop) {
                this.width = e.offsetX - this.offsetLeft;
                this.height = e.offsetY;
            }
            else if(e.pageY < this.offsetTop) {
                this.width = e.pageX - this.offsetLeft;
                this.height = e.pageY - this.offsetTop;
            }
            else {
                this.width = e.pageX - this.offsetLeft;
                this.height = e.pageY - this.offsetTop;
            }
            this.draw(this.startX, this.startY, this.width, this.height)
        }
    }

    abstract draw(x0: number, y0: number, x1: number, y1: number): void;
}