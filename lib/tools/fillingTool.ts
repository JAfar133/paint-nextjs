import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";
import settingState from "@/store/settingState";
import canvasState from "@/store/canvasState";

export default class FillingTool extends Tool {
    pixelColor: string = '';
    mouseDownHandler(e: MouseEvent): void {

    }
    touchStartHandler(e: TouchEvent): void {
        const touch = e.touches[0];
        const x = touch.clientX - this.offsetLeft;
        const y = touch.clientY - this.offsetTop;
        this.pixelColor = this.getPixelColor(x, y)
        this.draw(x, y, this.ctx.fillStyle.toString())
        this.sendDrawWebsocket(x, y)
    }
    sendDrawWebsocket(x: number, y: number){
        this.socket.send(JSON.stringify({
            method: 'draw',
            id: this.id,
            username: userState.user?.username,
            figure: {
                fillStyle: this.ctx.fillStyle,
                type: this.type,
                x: x - this.canvas.width/2,
                y: y,
                tolerance: settingState.fillingTolerance
            }
        }));
    }

    mouseUpHandler(e: MouseEvent) {
        super.mouseUpHandler(e);
        const x = e.offsetX,
            y = e.offsetY;
        this.pixelColor = this.getPixelColor(x, y)
        this.draw(x, y, this.ctx.fillStyle.toString())
        this.sendDrawWebsocket(x, y)
    }

    mouseMoveHandler(e: MouseEvent): void {
    }

    touchEndHandler(e: TouchEvent): void {
    }

    touchMoveHandler(e: TouchEvent): void {
    }

    draw(x: number, y: number, fillColor: string) {
        floodFill(this.ctx,x, y, fillColor, settingState.fillingTolerance)
    }

    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string, tolerance: number = 5) {
        floodFill(ctx,x + ctx.canvas.width/2, y, fillColor, tolerance)
    }
    getPixelColor(x: number, y: number): string {
        const imageData = this.ctx.getImageData(x, y, 1, 1);
        const pixelData = imageData.data;
        const color = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
        return color;
    }

}


function floodFill(ctx: CanvasRenderingContext2D, startX: number, startY: number, newColor: string, tolerance: number = 5): void {
    const width = canvasState.canvasWidth;
    const height = canvasState.canvasHeight;
    startX-=canvasState.canvasX;
    startY-=canvasState.canvasY;
    const casData = ctx.getImageData(canvasState.canvasX, canvasState.canvasY, width, height);
    const stack: [number, number][] = [];

    const i = (startY * width + startX) * 4;
    const targetColor = {
        r: casData.data[i],
        g: casData.data[i + 1],
        b: casData.data[i + 2],
        a: casData.data[i + 3]
    };

    const replacementColor = normalizeColor(newColor);

    if (!replacementColor) {
        console.error("Invalid replacement color.");
        return;
    }

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
    ctx.putImageData(casData, canvasState.canvasX,canvasState.canvasY);
    canvasState.clearOutside(ctx);
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

function normalizeColor(color: string): { r: number; g: number; b: number; a: number } | null {
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
