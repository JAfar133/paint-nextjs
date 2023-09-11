"use client";

import React, {useEffect, useRef, useState} from 'react';
import '../app/canvas.scss'
import {canvasSize, cn} from "@/lib/utils";
import {observer} from "mobx-react-lite";

import canvasState, {Message} from "../store/canvasState";
import userState from "@/store/userState";
import {useParams} from "next/navigation";
import UserService from "@/lib/api/UserService";
import toolState from "@/store/toolState";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {MessageSquare, Terminal} from "lucide-react";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import websocketService from "@/lib/api/WebsocketService";


const Canvas = observer(() => {

    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const circleOverlayRef = useRef<HTMLDivElement>(null);
    const [message, setMessage] = useState<string>("");
    const params = useParams();
    const messagesRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    };
    useEffect(() => {
        scrollToBottom();
    }, [canvasState.messages]);
    useEffect(() => {
        if (mainCanvasRef.current) {
            const canvas = mainCanvasRef.current;
            canvasState.setCanvas(mainCanvasRef.current);
            const image = localStorage.getItem("image");
            if (image) {
                UserService.getGalleryImage(image)
                    .then(response => {
                        canvasState.drawByDataUrl(response.data);
                    })
                    .catch(e => console.log(e))
            } else {
                UserService.getImage(params.id)
                    .then(response => {
                        canvasState.drawByDataUrl(response.data);
                    })
                    .catch(e => console.log(e))
            }
        }

    }, [mainCanvasRef, params.id]);
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'я')) {
                e.preventDefault();
                canvasState.undo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [])
    useEffect(() => {
        const fetchData = async () => {
            if (canvasState.canvasId) {
                try {
                    const messages = await UserService.getMessages(canvasState.canvasId);
                    canvasState.setMessages(messages);
                } catch (error) {
                    console.error("An error occurred while fetching messages:", error);
                }
            }
        };

        fetchData();
    }, [canvasState.canvasId]);

    useEffect(() => {
        window.addEventListener('mousemove', websocketService.handleMouseMove)
        window.addEventListener('touchmove', websocketService.handleTouchMove)
        return () => {
            window.removeEventListener('mousemove', websocketService.handleMouseMove)
            window.removeEventListener('touchmove', websocketService.handleTouchMove)
            window.removeEventListener('mouseup', mouseUpHandler)
        }
    }, [userState.color, canvasState.socket])
    useEffect(() => {
        websocketService.websocketWorker(params)
    }, [userState.loading])

    const mouseMoveHandler = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const canvas = mainCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        const circleOverlay = circleOverlayRef.current;
        if (circleOverlay && ctx && (toolState.tool.type === "pencil" || toolState.tool.type === "eraser")) {
            circleOverlay.style.display = 'block';
            const x = e.pageX - circleOverlay.clientWidth / 2 - 1 + 'px';
            const y = e.pageY - circleOverlay.clientHeight / 2 - 1 + 'px';
            circleOverlay.style.transform = `translate(${x}, ${y})`;
            circleOverlay.style.width = String(`${ctx.lineWidth}px`);
            circleOverlay.style.height = String(`${ctx.lineWidth}px`);
        }
    }
    const mouseDownHandler = () => {
        window.addEventListener('mouseup', mouseUpHandler);
        window.addEventListener('touchend', mouseUpHandler);
        if (toolState.tool.type !== "text") canvasState.addUndo(mainCanvasRef.current?.toDataURL());
    }
    const mouseUpHandler = () => {
        canvasState.saveCanvas();
        window.removeEventListener('mouseup', mouseUpHandler);
        window.removeEventListener('touchend', mouseUpHandler);
    }
    const mouseEnterHandler = () => {
        if (toolState.tool) {
            if (toolState.tool.type === "text") {
                mainCanvasRef.current?.classList.add('cursor-text');
            } else if (toolState.tool.type === "arc") {
                mainCanvasRef.current?.classList.add('cursor-cell');
            } else if (toolState.tool.type === "drag") {
                mainCanvasRef.current?.classList.add('cursor-move');
            } else {
                mainCanvasRef.current?.classList.add('cursor-crosshair');
            }
        }
    }
    const sendMessage = () => {
        websocketService.sendWebsocketMessage(message);
        setMessage("");
    }

    return (
        <>
            <div className="canvas__container">
                <canvas className="canvas main_canvas"
                        width={canvasSize.width}
                        height={canvasSize.height}
                        ref={mainCanvasRef}
                        onMouseDown={() => mouseDownHandler()}
                        onTouchStart={() => mouseDownHandler()}
                        onMouseMove={(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => mouseMoveHandler(e)}
                        onMouseEnter={() => mouseEnterHandler()}
                        onMouseLeave={() => canvasState.mouseLeaveHandler()}
                >
                </canvas>
                <div ref={circleOverlayRef} className="circle-overlay"></div>
            </div>
            <div className="fixed right-2 bottom-2 z-[200]">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm"><MessageSquare/></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-transparent">
                        <Card className="w-[350px] right-10 absolute border-black bottom-0 bg-transparent">
                            <CardHeader className="bg-card">
                                <CardTitle>Чат</CardTitle>
                                <CardDescription>Напиши что-нибудь!</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[360px] gap-3 flex flex-col overflow-auto py-5 backdrop-blur-md"
                                         ref={messagesRef}>
                                {
                                    canvasState.messages.map(message =>
                                        <div
                                            className={cn("w-full flex justify-end ",
                                                message.username === userState.user?.username ? "justify-end" : "justify-start")}
                                            key={message.id}>
                                            <Alert className="max-w-[230px] border-none"
                                                   variant={message.username === userState.user?.username ? "test" : "toolbar"}>
                                                <Terminal className="h-4 w-4"/>
                                                <AlertTitle>{message.text}</AlertTitle>
                                                <AlertDescription style={{fontSize: 12}}
                                                                  className="flex justify-between">
                                                    <p style={{color: message.color}}>{message.username}</p>
                                                    <p>{new Date(message.date).toLocaleTimeString()}</p>
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    )
                                }

                            </CardContent>
                            <CardFooter className="flex flex-col gap-6 py-4 end bg-card">
                                <Input
                                    id="name"
                                    value={message}
                                    onChange={(e) => {
                                        setMessage(e.target.value)
                                    }
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                />
                                <Button className="w-full" onClick={() => sendMessage()}>Оправить</Button>
                            </CardFooter>
                        </Card>
                    </PopoverContent>
                </Popover>
            </div>
            <input type="text" id="text-input" style={{
                position: 'absolute',
                top: -100,
                left: -100,
                width: 1,
                height: 1,
            }}/>

        </>
    );
});

export default Canvas;