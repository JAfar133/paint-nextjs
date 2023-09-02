import {Params} from "next/dist/shared/lib/router/utils/route-matcher";
import {BASE_SOCKET_URL} from "@/lib/config";
import canvasState from "@/store/canvasState";
import {toast} from "@/components/ui/use-toast";
import userState from "@/store/userState";
import settingState from "@/store/settingState";
import PencilTool from "@/lib/tools/pencilTool";
import SquareTool from "@/lib/tools/shapes/squareTool";
import EraserTool from "@/lib/tools/eraserTool";
import LineTool from "@/lib/tools/shapes/lineTool";
import CircleTool from "@/lib/tools/shapes/circleTool";
import EllipseTool from "@/lib/tools/shapes/ellipseTool";
import RightTriangleTool from "@/lib/tools/shapes/triangles/rightTriangleTool";
import StraightTriangleTool from "@/lib/tools/shapes/triangles/straightTriangleTool";
import TextTool from "@/lib/tools/textTool";
import ArcTool from "@/lib/tools/shapes/arcTool";
import ArrowTool from "@/lib/tools/shapes/arrowTool";
import {ShitTool} from "@/lib/tools/shapes/shitTool";
import {FiveStarTool} from "@/lib/tools/shapes/stars/fiveStarTool";
import {FourStarTool} from "@/lib/tools/shapes/stars/fourStarTool";
import {SixStarTool} from "@/lib/tools/shapes/stars/SixStarTool";

class WebsocketService {
    websocketWorker(params: Params) {

        const socket = new WebSocket(BASE_SOCKET_URL);
        canvasState.setSocket(socket);
        canvasState.setCanvasId(params.id);

        socket.onerror = () => {
            toast({
                title: 'Ошибка',
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
            if (msg.count) canvasState.setUserCount(msg.count);
            if (msg.users) canvasState.setUsers(msg.users);
            if (msg.method === "connection" && msg.username === userState.user?.username && msg.color) {
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
                        this.drawHandler(msg);
                        break;
                    case "clear":
                        canvasState.clear();
                        break;
                    case "draw_url":
                        canvasState.drawByDataUrl(msg.dataUrl);
                        break;
                    case "user_cursor":
                        this.cursorHandler(msg);
                        break;

                }
            }
        };
    };

    handleMouseMove(e: MouseEvent) {
        if (canvasState.socket) {
            const centerX = window.innerWidth / 2;
            const offsetX = e.pageX - centerX;
            canvasState.socket.send(JSON.stringify({
                method: "user_cursor",
                id: canvasState.canvasId,
                username: userState.user?.username,
                point: {
                    x: offsetX,
                    y: e.pageY
                },
                screen: {
                    height: window.innerHeight,
                    width: window.innerWidth
                },
                color: userState.color
            }));
        }
    }

    handleTouchMove(e: TouchEvent) {
        if (canvasState.socket) {
            const centerX = window.innerWidth / 2;
            const offsetX = e.touches[0].pageX - centerX - 10;
            canvasState.socket.send(JSON.stringify({
                method: "user_cursor",
                id: canvasState.canvasId,
                username: userState.user?.username,
                point: {
                    x: offsetX,
                    y: e.touches[0].clientY
                },
                screen: {
                    height: window.innerHeight,
                    width: window.innerWidth
                },
                color: userState.color
            }));
        }
    }

    sendWebsocketMessage(message: string) {
        if (canvasState.socket) {
            canvasState.socket.send(JSON.stringify({
                method: "message",
                id: canvasState.canvasId,
                username: userState.user?.username,
                message: message,
                color: userState.color
            }))
        }
    }

    private cursorHandler(msg: any) {
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

    private drawHandler(msg: any) {
        if (canvasState.canvas) {
            const figure = msg.figure;
            const ctx = canvasState.canvas.getContext('2d')
            if (ctx !== null) {
                this.figureDraw(ctx, figure)
                settingState.fillCtx()
            }
        }
    }

    private figureDraw(
        ctx: CanvasRenderingContext2D,
        figure: any
    ) {
        const draw: { [key: string]: (ctx: CanvasRenderingContext2D, figure: any) => void } = {
            "pencil": (ctx, figure) => PencilTool.draw(ctx, figure.x, figure.y, figure.lastCircleX, figure.lastCircleY, figure.strokeStyle, figure.strokeWidth),
            "square": (ctx, figure) => SquareTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke),
            "eraser": (ctx, figure) => EraserTool.eraser(ctx, figure.x, figure.y, figure.strokeStyle, figure.strokeWidth),
            "line": (ctx, figure) => LineTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.strokeStyle, figure.strokeWidth),
            "circle": (ctx, figure) => CircleTool.draw(ctx, figure.x, figure.y, figure.r, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke),
            "ellipse": (ctx, figure) => EllipseTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke),
            "right-triangle": (ctx, figure) => RightTriangleTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke),
            "straight-triangle": (ctx, figure) => StraightTriangleTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke),
            "text": (ctx, figure) => TextTool.draw(ctx, figure.text, figure.startX, figure.startY, figure.fillStyle, figure.font),
            "arc": (ctx, figure) => ArcTool.draw(ctx, figure.startPoint, figure.endPoint, figure.controlPoint, figure.strokeStyle, figure.strokeWidth),
            "arrow": (ctx, figure) => ArrowTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.strokeStyle, figure.strokeWidth),
            "shit": (ctx, figure) => ShitTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke),
            "five_star": (ctx, figure) => FiveStarTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke),
            "four_star": (ctx, figure) => FourStarTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke),
            "six_star": (ctx, figure) => SixStarTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke),
            "finish": (ctx) => ctx.beginPath(),
        };

        return draw[figure.type](ctx, figure);
    }
}

export default new WebsocketService();