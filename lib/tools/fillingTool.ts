import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";
import settingState from "@/store/settingState";
import canvasState from "@/store/canvasState";

export default class FillingTool extends Tool {
    protected mouseDownHandler(e: MouseEvent): void {

    }
    protected touchStartHandler(e: TouchEvent): void {
        if(this.canDraw) {
            const touch = e.touches[0];
            const x = touch.clientX - this.offsetLeft;
            const y = touch.clientY - this.offsetTop;
            this.draw(x, y, this.ctx.fillStyle.toString())
            this.sendDrawWebsocket(x, y)
        }
    }
    private sendDrawWebsocket(x: number, y: number){
        this.socket.send(JSON.stringify({
            method: 'draw',
            id: this.id,
            username: userState.user?.username,
            figure: {
                fillStyle: canvasState.bufferCtx.fillStyle,
                globalAlpha: settingState.globalAlpha,
                type: this.type,
                x: x - canvasState.bufferCanvas.width/2,
                y: y,
                tolerance: settingState.fillingTolerance
            }
        }));
    }

    protected mouseUpHandler(e: MouseEvent) {
        if(this.canDraw && e.button !== 1){
            super.mouseUpHandler(e);
            const {scaledX, scaledY} = this.getScaledPoint(e.offsetX, e.offsetY, canvasState.canvasX, canvasState.canvasY, canvasState.scale)
            const x = Math.floor(scaledX),
                y = Math.floor(scaledY);
            floodFill(canvasState.bufferCtx,x, y, settingState.fillColor, settingState.fillingTolerance, settingState.globalAlpha)
            this.sendDrawWebsocket(x, y)
        }
    }

    protected mouseMoveHandler(e: MouseEvent): void {
    }

    protected touchEndHandler(e: TouchEvent): void {
    }

    protected touchMoveHandler(e: TouchEvent): void {
    }

    protected draw(x: number, y: number, fillColor: string) {
        floodFill(canvasState.bufferCtx,x, y, fillColor, settingState.fillingTolerance, settingState.globalAlpha)
    }

    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string, tolerance: number = 5, globalAlpha: number) {
        floodFill(ctx,x + ctx.canvas.width/2, y, fillColor, tolerance, globalAlpha)
    }

}


function floodFill(ctx: CanvasRenderingContext2D, startX: number, startY: number, newColor: string, tolerance: number = 5, globalAlpha: number = 1 ): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const casData = ctx.getImageData(0, 0, width, height);
    const stack: [number, number][] = [];
    const i = (startY * width + startX) * 4;
    const targetColor = {
        r: casData.data[i],
        g: casData.data[i + 1],
        b: casData.data[i + 2],
        a: casData.data[i + 3]
    };
    let replacementColor;
    const normalizedColor = normalizeColor(newColor);
    if(!normalizedColor){
        console.error("Invalid replacement color.");
        return;
    }
    if(globalAlpha !==1){
        normalizedColor.a = globalAlpha*255;
    }
    if(colorsMatch(targetColor, normalizedColor)){
        replacementColor = combineColors(targetColor, normalizedColor);
        replacementColor.a = Math.floor(globalAlpha*255);
    }
    else {
        replacementColor = combineColors(targetColor, normalizedColor);
    }
    console.log(targetColor, replacementColor)
    if (colorsMatch(targetColor, replacementColor)) {
        return;
    }

    stack.push([startX, startY]);

    const isOutOfBounds = (x: number, y: number) => x < 0 || x >= width || y < 0 || y >= height;
    let stackCount = 0;
    while (stack.length > 0) {
        const [x, y] = stack.pop() as [number, number];
        const currentIndex = (y * width + x) * 4;
        const currentColor = {
            r: casData.data[currentIndex],
            g: casData.data[currentIndex + 1],
            b: casData.data[currentIndex + 2],
            a: casData.data[currentIndex + 3]
        };
        if(stackCount > (width + 2) * (height + 2)) break;
        if (colorsMatchWithTolerance(currentColor, targetColor, tolerance)) {
            if(colorsMatch(currentColor, replacementColor)) continue;
            stackCount++;
            casData.data[currentIndex] = replacementColor.r;
            casData.data[currentIndex + 1] = replacementColor.g;
            casData.data[currentIndex + 2] = replacementColor.b;
            casData.data[currentIndex + 3] = replacementColor.a;

            if (!isOutOfBounds(x + 1, y)) {
                stack.push([x + 1, y]);
            }
            if (!isOutOfBounds(x - 1, y)) {
                stack.push([x - 1, y]);
            }
            if (!isOutOfBounds(x, y + 1)) {
                stack.push([x, y + 1]);
            }
            if (!isOutOfBounds(x, y - 1)) {
                stack.push([x, y - 1]);
            }
        }
    }
    ctx.putImageData(casData, 0,0);
    canvasState.draw();
}
interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}
function colorsMatchWithTolerance(color1: Color, color2: Color, tolerance: number = 5): boolean {
    return (
        Math.abs(color1.r - color2.r) <= tolerance &&
        Math.abs(color1.g - color2.g) <= tolerance &&
        Math.abs(color1.b - color2.b) <= tolerance &&
        Math.abs(color1.a - color2.a) <= tolerance
    );
}
function colorsMatch(color1: Color, color2: Color): boolean {
    return (
        color1.r === color2.r &&
        color1.g === color2.g &&
        color1.b === color2.b &&
        color1.a === color2.a
    );
}

export function normalizeColor(color: string): Color | null {
    if (color.startsWith("#")) {
        const hex = color.slice(1);
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return { r, g, b, a: 255 };
    } else if (color.startsWith("rgba")) {
        const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (rgbaMatch) {
            const r = parseInt(rgbaMatch[1]);
            const g = parseInt(rgbaMatch[2]);
            const b = parseInt(rgbaMatch[3]);
            const a = parseFloat(rgbaMatch[4]) * 255;
            return { r, g, b, a };
        }
    }

    return null;
}

function combineColors(bg: Color, color: Color): Color {
    const a = color.a/255;
    const r = Math.round((1 - a) * bg.r + a * color.r);
    const g = Math.round((1 - a) * bg.g + a * color.g);
    const b = Math.round((1 - a) * bg.b + a * color.b);
    return {r, g, b, a: color.a};
}
