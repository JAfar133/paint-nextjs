import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";

export default abstract class Shape extends Tool {

    startX: number = -1;
    startY: number = -1;
    width: number = -1;
    height: number = -1;

    mouseDownHandler(e: MouseEvent) {
        if(this.canDraw && this.canDraw){
            this.mouseDown = true;
            canvasState.bufferCtx.beginPath();
            const {scaledX, scaledY} = this.getScaledPoint(e.offsetX, e.offsetY, canvasState.canvasX, canvasState.canvasY, canvasState.scale)
            this.startX = scaledX;
            this.startY = scaledY;
            this.saved = canvasState.getDataUrlCanvas(canvasState.bufferCanvas);
        }
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
                    fillStyle: canvasState.bufferCtx.fillStyle,
                    strokeStyle: canvasState.bufferCtx.strokeStyle,
                    strokeWidth: canvasState.bufferCtx.lineWidth,
                    isFill: canvasState.isFill,
                    isStroke: canvasState.isStroke,
                    type: this.type,
                    x: this.startX - canvasState.bufferCanvas.width/2,
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
        this.saved = canvasState.getDataUrlCanvas();
        e.preventDefault();
    }
    abstract draw(x: number, y: number, w: number, h: number): void
}