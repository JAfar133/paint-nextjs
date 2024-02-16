import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";
import settingState from "@/store/settingState";

export default abstract class Shape extends Tool {

    protected startX: number = -1;
    protected startY: number = -1;
    protected width: number = -1;
    protected height: number = -1;

    protected down(mouseX: number, mouseY: number) {
        this.mouseDown = true;
        canvasState.bufferCtx.beginPath();
        const {scaledX, scaledY} = canvasState.getScaledPoint(mouseX, mouseY)
        this.startX = scaledX;
        this.startY = scaledY;
        this.tempCtx.clearRect(0,0,this.tempCanvas.width, this.tempCanvas.height)
        this.tempCtx.drawImage(canvasState.bufferCanvas, 0, 0);
    }
    protected up() {
        this.mouseDown = false;
        canvasState.bufferCtx.beginPath();
        this.sendSocketDraw();
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

    protected abstract draw(x: number, y: number, w: number, h: number): void
}