import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";

export default abstract class Shape extends Tool {

    startX: number = -1;
    startY: number = -1;
    saved: string = "";
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
        if(this.startX > -1 && this.startY > -1 && this.width !== -1){
            this.socket.send(JSON.stringify({
                method: 'draw',
                id: this.id,
                username: userState.user?.username,
                figure: {
                    fillStyle: this.ctx.fillStyle,
                    strokeStyle: this.ctx.strokeStyle,
                    strokeWidth: this.ctx.lineWidth,
                    type: this.type,
                    x: this.startX,
                    y: this.startY,
                    w: this.width,
                    h: this.height,
            }}))
        }

    }
    abstract draw(x: number, y: number, w: number, h: number): void
}