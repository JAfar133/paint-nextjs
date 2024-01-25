import {Params} from "next/dist/shared/lib/router/utils/route-matcher";
import {BASE_SOCKET_URL} from "@/lib/config";
import canvasState from "@/store/canvasState";
import {toast} from "@/components/ui/use-toast";
import userState from "@/store/userState";
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
import FillingTool from "@/lib/tools/fillingTool";
import Tool from "@/lib/tools/tool";

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
                        this.disconnect(msg);
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
                        this.cursorCanvasContainerHandler(msg);
                        break;
                    case "play_video":
                        canvasState.playVideoById(msg.video_id);
                        break;
                    case "stop_video":
                        canvasState.stopVideoById(msg.video_id);
                        break;
                    case "play_audio":
                        this.handleAudio(msg.audio_id, true)
                        break;
                    case "stop_audio":
                        this.handleAudio(msg.audio_id, false)
                        break;
                    case "give_play_video":
                        userState.canPlayVideo = true;
                        break;
                    case "giveaway_play_video":
                        userState.canPlayVideo = false;
                        break;

                }
            }
        };
    };

    handleAudio(id: string, start: boolean) {
        const audio = document.getElementById(id) as HTMLAudioElement
        console.log(id, start)
        if(audio) {
            if(start) {
                const promise = audio.play();

                if(promise !== undefined){
                    promise.then(() => {
                    }).catch(async error => {
                        canvasState.confirm(()=>{
                            audio.play();
                        }, ()=>{

                        });
                    });
                }
            } else {
                audio.pause()
            }

        }
    }

    handleMouseMove(e: MouseEvent) {
        if(canvasState.canvasMain){
            const centerX = canvasState.canvasX + canvasState.rectWidth/2*canvasState.scale;
            const centerY = canvasState.canvasY + canvasState.rectHeight/2*canvasState.scale + canvasState.canvas.getBoundingClientRect().top;
            const offsetX = e.pageX - centerX;
            const offsetY = e.pageY - centerY;
            if (canvasState.socket) {
                canvasState.socket.send(JSON.stringify({
                    method: "user_cursor",
                    id: canvasState.canvasId,
                    username: userState.user?.username,
                    point: {
                        x: offsetX,
                        y: offsetY
                    },
                    canvasContainer: true,
                    scale: canvasState.scale,
                    color: userState.color
                }));
            }
        }
    }

    handleTouchMove(e: TouchEvent) {
        const centerX = canvasState.canvas.width / 2;
        const offsetX = e.touches[0].pageX - centerX;
        const offsetY = e.touches[0].clientY;
        if (canvasState.socket) {
            canvasState.socket.send(JSON.stringify({
                method: "user_cursor",
                id: canvasState.canvasId,
                username: userState.user?.username,
                point: {
                    x: offsetX,
                    y: offsetY
                },
                scale: canvasState.scale,
                color: userState.color
            }));
        }
    }
    sendWebsocketMessage(message: string) {
        this.sendWebsocket(JSON.stringify({
            method: "message",
            id: canvasState.canvasId,
            username: userState.user?.username,
            message: message,
            color: userState.color
        }))
    }

    sendWebsocket(message: string) {
        if (canvasState.socket) {
            canvasState.socket.send(message)
        }
    }

    private cursorCanvasContainerHandler(msg: any) {
        if (msg.point && canvasState.canvas) {
            const cursorElementId = `cursor-${msg.username}`;
            let cursorElement = document.getElementById(cursorElementId);

            if (!cursorElement) {
                const newCursorElement = document.createElement("div");
                newCursorElement.id = cursorElementId;
                newCursorElement.classList.add("user-cursor");
                if(canvasState.canvasContainer){
                    canvasState.canvasContainer.appendChild(newCursorElement);
                }
                cursorElement = newCursorElement;
            }
            const centerX = canvasState.canvasX + canvasState.rectWidth/2*canvasState.scale;
            const centerY = canvasState.canvasY + canvasState.rectHeight/2*canvasState.scale;
            cursorElement.style.left = `${centerX}px`;
            cursorElement.style.top = `${centerY}px`;
            cursorElement.style.color = msg.color;
            let cursorX = msg.point.x;
            let cursorY = msg.point.y;
            cursorElement.textContent = msg.username;
            cursorElement.style.transform = `translate(${cursorX*canvasState.scale/msg.scale-10}px, ${cursorY*canvasState.scale/msg.scale}px)`;

        }
    }

    private drawHandler(msg: any) {
        if (canvasState.canvas) {
            const figure = msg.figure;
            this.figureDraw(canvasState.bufferCtx, figure)
            canvasState.fill()
        }
    }
    private disconnect(msg: any){
        const cursorElementId = `cursor-${msg.username}`;
        let cursorElement = document.getElementById(cursorElementId);
        if(cursorElement){
            cursorElement.remove();
        }
        toast({
            description: `Пользователь ${msg.username} отключился`,
        });
    }

    private figureDraw(
        ctx: CanvasRenderingContext2D,
        figure: any
    ) {
        const draw: { [key: string]: (ctx: CanvasRenderingContext2D, figure: any) => void } = {
            "pencil": (ctx, figure) => {
                PencilTool.draw(ctx, figure.mouse, figure.ppts, figure.strokeStyle, figure.strokeWidth,figure.globalAlpha)
            },
            "square": (ctx, figure) => SquareTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke,figure.globalAlpha,figure.lineJoin as CanvasLineJoin),
            "eraser": (ctx, figure) => EraserTool.eraser(ctx, figure.x, figure.y, figure.strokeStyle, figure.strokeWidth),
            "line": (ctx, figure) => LineTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.strokeStyle, figure.strokeWidth,figure.globalAlpha,figure.lineCap as CanvasLineCap),
            "circle": (ctx, figure) => CircleTool.draw(ctx, figure.x, figure.y, figure.r, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke,figure.globalAlpha,figure.lineJoin as CanvasLineJoin),
            "ellipse": (ctx, figure) => EllipseTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke,figure.globalAlpha,figure.lineJoin as CanvasLineJoin),
            "right-triangle": (ctx, figure) => RightTriangleTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke,figure.globalAlpha,figure.lineJoin as CanvasLineJoin),
            "straight-triangle": (ctx, figure) => StraightTriangleTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke,figure.globalAlpha,figure.lineJoin as CanvasLineJoin),
            "text": (ctx, figure) => TextTool.draw(ctx, figure.text, figure.startX, figure.startY, figure.fillStyle, figure.font,figure.globalAlpha),
            "arc": (ctx, figure) => ArcTool.draw(ctx, figure.startPoint, figure.endPoint, figure.controlPoint, figure.strokeStyle, figure.strokeWidth,figure.globalAlpha,figure.lineCap as CanvasLineCap),
            "arrow": (ctx, figure) => ArrowTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.strokeStyle, figure.strokeWidth,figure.globalAlpha,figure.lineCap as CanvasLineCap),
            "shit": (ctx, figure) => ShitTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke,figure.globalAlpha,figure.lineJoin as CanvasLineJoin),
            "five_star": (ctx, figure) => FiveStarTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke,figure.globalAlpha,figure.lineJoin as CanvasLineJoin),
            "four_star": (ctx, figure) => FourStarTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke,figure.globalAlpha,figure.lineJoin as CanvasLineJoin),
            "six_star": (ctx, figure) => SixStarTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth, figure.isFill, figure.isStroke,figure.globalAlpha,figure.lineJoin as CanvasLineJoin),
            "filling": (ctx, figure) => FillingTool.draw(ctx, figure.x, figure.y, figure.fillStyle,figure.tolerance,figure.globalAlpha),
            "finish": (ctx, msg) => {
                if (msg.draw == true && Tool.tempCanvas){
                    ctx.drawImage(Tool.tempCanvas,0,0);
                    canvasState.draw();
                    Tool.tempCtx?.clearRect(0,0, Tool.tempCanvas.width, Tool.tempCanvas.height)
                }
                ctx.beginPath()
            },
        };

        return draw[figure.type](ctx, figure);
    }
}

export default new WebsocketService();