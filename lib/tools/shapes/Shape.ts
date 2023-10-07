import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";
import settingState from "@/store/settingState";

export default abstract class Shape extends Tool {

    protected startX: number = -1;
    protected startY: number = -1;
    protected width: number = -1;
    protected height: number = -1;

    protected mouseDownHandler(e: MouseEvent) {
        if(this.canDraw && this.canDraw && e.button !== 1){
            this.mouseDown = true;
            canvasState.bufferCtx.beginPath();
            const {scaledX, scaledY} = this.getScaledPoint(e.offsetX, e.offsetY, canvasState.canvasX, canvasState.canvasY, canvasState.scale)
            this.startX = scaledX;
            this.startY = scaledY;
            this.tempCtx.clearRect(0,0,this.tempCanvas.width, this.tempCanvas.height)
            this.tempCtx.drawImage(canvasState.bufferCanvas, 0, 0);
        }
    }
    protected mouseUpHandler(e: MouseEvent) {
        if(this.mouseDown){
            super.mouseUpHandler(e)
            this.mouseDown = false;
            this.sendSocketDraw();
        }
    }
    protected sendSocketDraw(){
        if(this.startX > -1 && this.startY > -1 && this.width !== -1){
            this.socket.send(JSON.stringify({
                method: 'draw',
                id: this.id,
                username: userState.user?.username,
                figure: {
                    fillStyle: settingState.fillColor,
                    strokeStyle: settingState.strokeColor,
                    strokeWidth: settingState.strokeWidth,
                    globalAlpha: settingState.globalAlpha,
                    lineJoin: settingState.lineJoin,
                    isFill: canvasState.isFill,
                    isStroke: canvasState.isStroke,
                    type: this.type,
                    x: this.startX - canvasState.bufferCanvas.width/2,
                    y: this.startY,
                    w: this.width,
                    h: this.height,
                }}))
        }
        this.sendSocketFinish();
    }
    protected touchEndHandler(e: TouchEvent): void {
        this.mouseDown = false;
        this.sendSocketDraw();
    }

    protected touchMoveHandler(e: TouchEvent): void {
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

    protected touchStartHandler(e: TouchEvent): void {
        this.mouseDown = true;
        this.ctx.beginPath();
        const touch = e.touches[0];
        const x = touch.clientX - this.offsetLeft;
        const y = touch.clientY - this.offsetTop;
        this.startX = x;
        this.startY = y;
        e.preventDefault();
    }
    protected abstract draw(x: number, y: number, w: number, h: number): void
}