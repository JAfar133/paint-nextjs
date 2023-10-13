import Tool from "@/lib/tools/tool";
import settingState from "@/store/settingState";
import canvasState from "@/store/canvasState";
import userState from "@/store/userState";

class PrevKey {
    constructor(public key: string, public x: number, public y: number) {
        this.key = key;
        this.x = x;
        this.y = y;
    }
}

export default class TextTool extends Tool {
    private startX: number = 0;
    private startY: number = 0;
    private prevKey: PrevKey = new PrevKey("", -1, -1);
    private prevKeyArray: PrevKey[] = [];
    private textInput = document.getElementById("text-input") as HTMLInputElement;

    protected mouseUpHandler(e: MouseEvent) {
        if(this.mouseDown){
            e.preventDefault();
            this.mouseDown = false;
            const {scaledX, scaledY} = canvasState.getScaledPoint(e.offsetX, e.offsetY)
            this.startX = scaledX;
            this.startY = scaledY;
            this.prevKeyArray = [];
            this.prevKey = new PrevKey("", -1, -1);
            document.onkeydown = this.inputEventHandler.bind(this);
            document.onmousedown = this.handleGlobalMouseDown.bind(this);
            canvasState.drawTextLine(scaledX, scaledY)
        }
    }
    protected handleGlobalMouseDown(e: MouseEvent) {
        const canvas = this.canvas as Node;
        if (e.target && !canvas.contains(e.target as Node)) {
            document.onkeydown = null;
            document.onmousedown = null;
        }
    }
    protected inputEventHandler = (e: KeyboardEvent) => {
        e.preventDefault();
        // @ts-ignore
        const key = e.key || e.target.value.toString().slice(-1)

        const px = (canvasState.bufferCtx.font.match(/\d+(?=px)/) || [0])[0];
        if ((e.ctrlKey || e.metaKey) && (key === 'z' || key === 'я')) {
            if (this.prevKeyArray?.length) {
                const prevKey = this.prevKeyArray.pop();
                this.startX = prevKey?.x || this.startX;
                this.startY = prevKey?.y || this.startY;
                canvasState.drawTextLine(this.startX, this.startY)
                canvasState.undo();
            }
            return
        }
        if (key === "Backspace") {
            e.preventDefault();
            if (this.prevKeyArray.length) {
                const prevKey = this.prevKeyArray.pop();
                this.startX = prevKey?.x || this.startX;
                this.startY = prevKey?.y || this.startY;
                canvasState.drawTextLine(this.startX, this.startY)
                canvasState.undo();
            }
        }
        if (key.length === 1) {
            canvasState.addUndo(canvasState.bufferCanvas.toDataURL());
            this.print(key, this.startX, this.startY + Number(px) * 0.2)
            this.socket.send(JSON.stringify({
                method: 'draw',
                id: this.id,
                username: userState.user?.username,
                figure: {
                    fillStyle: canvasState.bufferCtx.fillStyle,
                    globalAlpha: settingState.globalAlpha,
                    font: canvasState.bufferCtx.font,
                    type: this.type,
                    text: key,
                    startX: this.startX - canvasState.bufferCanvas.width/2,
                    startY: this.startY + Number(px) * 0.2
                }
            }));
            canvasState.drawTextLine(this.startX + canvasState.bufferCtx.measureText(e.key).width, this.startY)
            this.prevKey.key = key;

            this.prevKey.x = this.startX;
            this.prevKey.y = this.startY;
            this.prevKeyArray.push(new PrevKey(this.prevKey.key, this.prevKey.x, this.prevKey.y));

            this.startX += canvasState.bufferCtx.measureText(e.key).width;

        } else if (key === "Enter") {
            this.startX = this.prevKeyArray[0].x || this.startX;
            this.startY = this.prevKeyArray[this.prevKeyArray.length - 1].y + Number(px) || this.startY + Number(px)
            this.prevKey.key = "";
            this.prevKey.x = this.startX;
            this.prevKey.y = this.startY;
            canvasState.drawTextLine(this.startX, this.startY)
        }

    };
    protected print(text: string, startX: number, startY: number) {
        canvasState.bufferCtx.globalAlpha = settingState.globalAlpha;
        canvasState.bufferCtx.fillText(text, startX, startY);

        canvasState.draw();
        canvasState.bufferCtx.beginPath();
    }


    protected mouseDownHandler(e: MouseEvent) {
        if(this.canDraw && e.button !== 1){
            this.mouseDown = true;
            this.prevKey.key = "";
            const {scaledX, scaledY} = canvasState.getScaledPoint(e.offsetX, e.offsetY)
            canvasState.bufferCtx.font = settingState.font;
            canvasState.bufferCtx.beginPath();
            canvasState.bufferCtx.moveTo(scaledX,scaledY);
        }
    }

    protected mouseMoveHandler(e: MouseEvent) {

    }

    static draw(ctx: CanvasRenderingContext2D, text: string, startX: number, startY: number,
                fillStyle: string, font: string, globalAlpha: number) {
        ctx.font = font;
        ctx.fillStyle = fillStyle;
        ctx.globalAlpha = globalAlpha;
        ctx.fillText(text, startX + ctx.canvas.width/2, startY);
        canvasState.draw();
    }

    protected touchEndHandler(e: TouchEvent): void {
        this.mouseDown = false;
        this.prevKeyArray = [];
        this.prevKey = new PrevKey("", -1, -1);
        this.textInput.onkeydown = null;
    }

    protected touchMoveHandler(e: TouchEvent): void {
    }

    protected touchStartHandler(e: TouchEvent): void {
        e.preventDefault();
        this.mouseDown = true;
        this.startX = e.touches[0].clientX - this.offsetLeft;
        this.startY = e.touches[0].clientY - this.offsetTop;
        this.prevKey.key = "";
        this.ctx.font = settingState.font;
        this.ctx.beginPath();
        this.ctx.moveTo(e.touches[0].clientX - this.offsetLeft, e.touches[0].clientY - this.offsetTop);
        setTimeout(() => {
            this.textInput.focus();
            this.textInput.onkeydown = this.inputEventHandler.bind(this);
        }, 200);
    }

}
