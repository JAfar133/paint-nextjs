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
    startX: number = 0;
    startY: number = 0;
    prevKey: PrevKey = new PrevKey("", -1, -1);
    prevKeyArray: PrevKey[] = [];

    mouseUpHandler(e: MouseEvent) {
        this.mouseDown = false;
        this.startX = e.offsetX;
        this.startY = e.offsetY;
        this.prevKeyArray = [];
        this.prevKey = new PrevKey("", -1, -1);
        document.onkeydown = this.inputEventHandler.bind(this);
        document.onmousedown = this.handleGlobalMouseDown.bind(this);
    }
    handleGlobalMouseDown(e: MouseEvent) {
        const canvas = this.canvas as Node;
        if (e.target && !canvas.contains(e.target as Node)) {
            document.onkeydown = null;
            document.onmousedown = null;
        }
    }
    inputEventHandler = (e: KeyboardEvent) => {
        e.preventDefault()
        const px = (this.ctx.font.match(/\d+(?=px)/) || [0])[0];
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'я')) {
            if (this.prevKeyArray?.length) {
                const prevKey = this.prevKeyArray.pop();
                this.startX = prevKey?.x || this.startX;
                this.startY = prevKey?.y || this.startY;
            }
            return
        }
        if (e.key === "Backspace") {
            e.preventDefault();
            if (this.prevKeyArray.length) {
                const prevKey = this.prevKeyArray.pop();
                this.startX = prevKey?.x || this.startX;
                this.startY = prevKey?.y || this.startY;
                canvasState.undo();
            }
        }
        if (e.key.length === 1) {
            canvasState.addUndo(this.canvas.toDataURL())
            const prevKeyLength = this.prevKey ? this.ctx.measureText(this.prevKey.key).width : 0;
            this.prevKey.key = e.key;

            this.prevKey.x = this.startX;
            this.prevKey.y = this.startY;
            this.prevKeyArray.push(new PrevKey(this.prevKey.key, this.prevKey.x, this.prevKey.y));

            this.startX += prevKeyLength;
            this.print(e.key, this.startX, this.startY + Number(px) * 0.2)
            this.socket.send(JSON.stringify({
                method: 'draw',
                id: this.id,
                username: userState.user?.username,
                figure: {
                    fillStyle: this.ctx.fillStyle,
                    font: this.ctx.font,
                    type: this.type,
                    text: e.key,
                    startX: this.startX,
                    startY: this.startY + Number(px) * 0.2
                }
            }));


        } else if (e.key === "Enter") {
            this.startX = this.prevKeyArray[0].x || this.startX;
            this.startY = this.prevKeyArray[this.prevKeyArray.length - 1].y + Number(px) || this.startY + Number(px)
            this.prevKey.key = "";
            this.prevKey.x = this.startX;
            this.prevKey.y = this.startY;
        }
    };
    print(text: string, startX: number, startY: number) {
        this.ctx.fillText(text, startX, startY);
    }


    mouseDownHandler(e: MouseEvent) {
        this.mouseDown = true;
        this.prevKey.key = "";
        this.ctx.font = settingState.font;
        this.ctx.beginPath();
        this.ctx.moveTo(e.offsetX, e.offsetY);
    }

    mouseMoveHandler(e: MouseEvent) {

    }

    static draw(ctx: CanvasRenderingContext2D, text: string, startX: number, startY: number, fillStyle: string, font: string) {
        ctx.font = font;
        ctx.fillStyle = fillStyle;
        ctx.fillText(text, startX, startY);
    }

    touchEndHandler(e: TouchEvent): void {
        this.mouseDown = false;
        this.startX = e.touches[0].clientX - this.offsetLeft;
        this.startY = e.touches[0].clientY - this.offsetTop;
        this.prevKeyArray = [];
        this.prevKey = new PrevKey("", -1, -1);
        document.onkeydown = this.inputEventHandler.bind(this);
        const textInput = document.getElementById("text-input") as HTMLInputElement;
        textInput.focus();
    }

    touchMoveHandler(e: TouchEvent): void {
    }

    touchStartHandler(e: TouchEvent): void {
        this.mouseDown = true;
        this.prevKey.key = "";
        this.ctx.font = settingState.font;
        this.ctx.beginPath();
        this.ctx.moveTo(e.touches[0].clientX - this.offsetLeft, e.touches[0].clientY - this.offsetTop);

    }

}
