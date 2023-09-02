import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";

export default abstract class Shape extends Tool {

    startX: number = -1;
    startY: number = -1;
    width: number = -1;
    height: number = -1;

    mouseDownHandler(e: MouseEvent) {
        this.mouseDown = true;
        this.ctx.beginPath();
        this.startX = e.offsetX;
        this.startY = e.offsetY;
        this.saved = this.canvas.toDataURL()
    }
    mouseUpHandler(e: MouseEvent) {
        super.mouseUpHandler(e)
        this.mouseDown = false;
        this.sendSocketDraw();

    }
    sendSocketDraw(){
        if(this.startX > -1 && this.startY > -1 && this.width !== -1){
            this.socket.send(JSON.stringify({
                method: 'draw',
                id: this.id,
                username: userState.user?.username,
                figure: {
                    fillStyle: this.ctx.fillStyle,
                    strokeStyle: this.ctx.strokeStyle,
                    strokeWidth: this.ctx.lineWidth,
                    isFill: canvasState.isFill,
                    isStroke: canvasState.isStroke,
                    type: this.type,
                    x: this.startX,
                    y: this.startY,
                    w: this.width,
                    h: this.height,
                }}))
        }
    }
    touchEndHandler(e: TouchEvent): void {
        this.mouseDown = false;
        this.sendSocketDraw();
    }

    touchMoveHandler(e: TouchEvent): void {
        if (this.mouseDown) {
            const touch = e.touches[0];
            const x = touch.clientX - this.offsetLeft;
            const y = touch.clientY - this.offsetTop;
            this.width = x - this.startX;
            this.height = y - this.startY;

            this.draw(this.startX, this.startY, this.width, this.height);
        }
        document.ontouchmove = null;
    }

    touchStartHandler(e: TouchEvent): void {
        this.mouseDown = true;
        this.ctx.beginPath();
        const touch = e.touches[0];
        const x = touch.clientX - this.offsetLeft;
        const y = touch.clientY - this.offsetTop;
        this.startX = x;
        this.startY = y;
        this.saved = this.canvas.toDataURL()
        e.preventDefault();
    }
    abstract draw(x: number, y: number, w: number, h: number): void
}