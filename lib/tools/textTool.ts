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
    textInput = document.getElementById("text-input") as HTMLInputElement;

    mouseUpHandler(e: MouseEvent) {
        e.preventDefault();
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
        e.preventDefault();
        // @ts-ignore
        const key = e.key || e.target.value.toString().slice(-1)

        const px = (this.ctx.font.match(/\d+(?=px)/) || [0])[0];
        if ((e.ctrlKey || e.metaKey) && (key === 'z' || key === 'я')) {
            if (this.prevKeyArray?.length) {
                const prevKey = this.prevKeyArray.pop();
                this.startX = prevKey?.x || this.startX;
                this.startY = prevKey?.y || this.startY;
            }
            return
        }
        if (key === "Backspace") {
            e.preventDefault();
            if (this.prevKeyArray.length) {
                const prevKey = this.prevKeyArray.pop();
                this.startX = prevKey?.x || this.startX;
                this.startY = prevKey?.y || this.startY;
                canvasState.undo();
            }
        }
        if (key.length === 1) {
            canvasState.addUndo(canvasState.getDataUrlCanvas())
            const prevKeyLength = this.prevKey ? this.ctx.measureText(this.prevKey.key).width : 0;
            this.prevKey.key = key;

            this.prevKey.x = this.startX;
            this.prevKey.y = this.startY;
            this.prevKeyArray.push(new PrevKey(this.prevKey.key, this.prevKey.x, this.prevKey.y));

            this.startX += prevKeyLength;
            this.print(key, this.startX, this.startY + Number(px) * 0.2)
            this.socket.send(JSON.stringify({
                method: 'draw',
                id: this.id,
                username: userState.user?.username,
                figure: {
                    fillStyle: this.ctx.fillStyle,
                    font: this.ctx.font,
                    type: this.type,
                    text: key,
                    startX: this.startX - this.canvas.width/2,
                    startY: this.startY + Number(px) * 0.2
                }
            }));


        } else if (key === "Enter") {
            this.startX = this.prevKeyArray[0].x || this.startX;
            this.startY = this.prevKeyArray[this.prevKeyArray.length - 1].y + Number(px) || this.startY + Number(px)
            this.prevKey.key = "";
            this.prevKey.x = this.startX;
            this.prevKey.y = this.startY;
        }
    };
    print(text: string, startX: number, startY: number) {
        this.ctx.fillText(text, startX, startY);
        canvasState.clearOutside(this.ctx);
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
        ctx.fillText(text, startX + ctx.canvas.width/2, startY);
        canvasState.clearOutside(ctx);
    }

    touchEndHandler(e: TouchEvent): void {
        this.mouseDown = false;
        this.prevKeyArray = [];
        this.prevKey = new PrevKey("", -1, -1);
        this.textInput.onkeydown = null;
    }

    touchMoveHandler(e: TouchEvent): void {
    }

    touchStartHandler(e: TouchEvent): void {
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
