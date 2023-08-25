import {BASE_SOCKET_URL} from "@/lib/config";
import canvasState from "@/store/canvasState";
import userState from "@/store/userState";
import {toast} from "@/components/ui/use-toast";
import {Params} from "next/dist/shared/lib/router/utils/route-matcher";
import settingState from "@/store/settingState";
import PencilTool from "@/lib/tools/pencilTool";
import SquareTool from "@/lib/tools/shapes/squareTool";
import EraserTool from "@/lib/tools/eraserTool";
import LineTool from "@/lib/tools/shapes/lineTool";
import CircleTool from "@/lib/tools/shapes/circleTool";
import RightTriangleTool from "@/lib/tools/shapes/triangles/rightTriangleTool";
import StraightTriangleTool from "@/lib/tools/shapes/triangles/straightTriangleTool";
import TextTool from "@/lib/tools/textTool";
import ArcTool from "@/lib/tools/shapes/arcTool";
import ArrowTool from "@/lib/tools/shapes/arrowTool";
import {ShitTool} from "@/lib/tools/shapes/shitTool";
import {FiveStarTool} from "@/lib/tools/shapes/stars/fiveStarTool";
import {FourStarTool} from "@/lib/tools/shapes/stars/fourStarTool";
import {SixStarTool} from "@/lib/tools/shapes/stars/SixStarTool";
import EllipseTool from "@/lib/tools/shapes/ellipseTool";

export const websocketWorker = (params: Params) => {

    const socket = new WebSocket(BASE_SOCKET_URL);
    canvasState.setSocket(socket);
    canvasState.setCanvasId(params.id);

    socket.onerror = () => {
        toast({
            title : 'Ошибка',
            description: 'соединение по вебсокет недоступно',
        });
    };

    socket.onopen = () => {
        if (!userState.loading) {
            socket.send(
                JSON.stringify({
                    id: params.id,
                    username: localStorage.getItem("username"),
                    method: "connection",
                })
            );
        }
    };

    socket.onmessage = (event) => {
        let msg = JSON.parse(event.data);
        if(msg.count) canvasState.setUserCount(msg.count);
        if(msg.users) canvasState.setUsers(msg.users);
        if(msg.method === "connection" && msg.username === userState.user?.username && msg.color) {
            console.log(msg)
            userState.setColor(msg.color);
        }
        if (msg.method === "message") {
            canvasState.setMessages([...canvasState.messages, msg.message])
        }
        if (msg.username != userState.user?.username) {
            switch (msg.method) {
                case "connection":
                    toast({
                        description: `Пользователь ${msg.username} присоединился`,
                    });
                    break;
                case "disconnect":
                    toast({
                        description: `Пользователь ${msg.username} отключился`,
                    });
                    break;
                case "draw":
                    drawHandler(msg);
                    break;
                case "clear":
                    canvasState.clear();
                    break;
                case "draw_url":
                    canvasState.drawByDataUrl(msg.dataUrl);
                    break;
                case "user_cursor":
                    cursorHandler(msg);
                    break;

            }
        }
    };
};

const cursorHandler = (msg: any) => {
    if (msg.point && canvasState.canvas) {
        const cursorElementId = `cursor-${msg.username}`;
        let cursorElement = document.getElementById(cursorElementId);

        if (!cursorElement) {
            const newCursorElement = document.createElement("div");
            newCursorElement.id = cursorElementId;
            newCursorElement.classList.add("user-cursor");
            document.body.appendChild(newCursorElement);
            cursorElement = newCursorElement;

        }
        cursorElement.style.color = msg.color;
        const cursorX = msg.point.x;
        const cursorY = msg.point.y;
        cursorElement.textContent = msg.username;

        cursorElement.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    }
}


const drawHandler = (msg: any) => {
    if (canvasState.canvas) {
        const figure = msg.figure;
        const ctx = canvasState.canvas.getContext('2d')
        if (ctx !== null) {
            figureDraw(ctx, figure)
            settingState.fillCtx()
        }
    }
}
const figureDraw = (
    ctx: CanvasRenderingContext2D,
    figure: any
) => {
    const draw: { [key: string]: (ctx: CanvasRenderingContext2D, figure: any) => void } = {
        "pencil": (ctx, figure) => PencilTool.draw(ctx, figure.x, figure.y, figure.lastCircleX, figure.lastCircleY, figure.strokeStyle, figure.strokeWidth),
        "square": (ctx, figure) => SquareTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
        "eraser": (ctx, figure) => EraserTool.eraser(ctx, figure.x, figure.y, figure.strokeStyle, figure.strokeWidth),
        "line": (ctx, figure) => LineTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.strokeStyle, figure.strokeWidth),
        "circle": (ctx, figure) => CircleTool.draw(ctx, figure.x, figure.y, figure.r, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
        "ellipse": (ctx, figure) => EllipseTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
        "right-triangle": (ctx, figure) => RightTriangleTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
        "straight-triangle": (ctx, figure) => StraightTriangleTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
        "text": (ctx, figure) => TextTool.draw(ctx, figure.text, figure.startX, figure.startY, figure.fillStyle, figure.font),
        "arc": (ctx, figure) => ArcTool.draw(ctx, figure.startPoint, figure.endPoint, figure.controlPoint, figure.strokeStyle, figure.strokeWidth),
        "arrow": (ctx, figure) => ArrowTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.strokeStyle, figure.strokeWidth),
        "shit": (ctx, figure) => ShitTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
        "five_star": (ctx, figure) => FiveStarTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
        "four_star": (ctx, figure) => FourStarTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
        "six_star": (ctx, figure) => SixStarTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
        "finish": (ctx) => ctx.beginPath(),
    };

    return draw[figure.type](ctx, figure);
}
