import Tool from "@/lib/tools/tool";
import userState from "@/store/userState";

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
                x: x,
                y: y
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
        floodFill(this.ctx,x, y, fillColor)
    }

    static draw(ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string) {
        floodFill(ctx,x, y, fillColor)
    }
    getPixelColor(x: number, y: number): string {
        const imageData = this.ctx.getImageData(x, y, 1, 1);
        const pixelData = imageData.data;
        const color = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
        return color;
    }

}


function floodFill(ctx: CanvasRenderingContext2D, startX: number, startY: number, newColor: string): void {
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

    while (stack.length > 0) {
        const [x, y] = stack.pop() as [number, number];
        const currentIndex = (y * width + x) * 4;
        const currentColor = {
            r: casData.data[currentIndex],
            g: casData.data[currentIndex + 1],
            b: casData.data[currentIndex + 2],
            a: casData.data[currentIndex + 3]
        };
        if (colorsMatch(currentColor, targetColor)) {
            casData.data[currentIndex] = replacementColor.r;
            casData.data[currentIndex + 1] = replacementColor.g;
            casData.data[currentIndex + 2] = replacementColor.b;
            casData.data[currentIndex + 3] = replacementColor.a;

            if (!isOutOfBounds(x + 1, y)) stack.push([x + 1, y]);
            if (!isOutOfBounds(x - 1, y)) stack.push([x - 1, y]);
            if (!isOutOfBounds(x, y + 1)) stack.push([x, y + 1]);
            if (!isOutOfBounds(x, y - 1)) stack.push([x, y - 1]);
        }
    }

    ctx.putImageData(casData, 0, 0);
}

function colorsMatch(color1: { r: number; g: number; b: number; a: number }, color2: { r: number; g: number; b: number; a: number }): boolean {
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
