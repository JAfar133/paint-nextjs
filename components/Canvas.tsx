"use client";

import React, {useEffect, useRef, useState} from 'react';
import '../app/canvas.scss'
import {cn} from "@/lib/utils";
import {observer} from "mobx-react-lite";

import canvasState from "../store/canvasState";
import userState from "@/store/userState";
import {useParams} from "next/navigation";
import UserService from "@/lib/api/UserService";
import toolState from "@/store/toolState";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {MessageSquare, Search, Terminal} from "lucide-react";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import websocketService from "@/lib/api/WebsocketService";


const Canvas = observer(() => {

    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const canvasMain = useRef<HTMLDivElement>(null);
    const canvasContainer = useRef<HTMLDivElement>(null);
    const circleOverlayRef = useRef<HTMLDivElement>(null);
    const [message, setMessage] = useState<string>("");
    const params = useParams();
    const messagesRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if(mainCanvasRef.current){
            mainCanvasRef.current.width = window.innerWidth;
            mainCanvasRef.current.height = window.innerHeight - 155
        }
    }, [mainCanvasRef]);

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
            canvasState.setCanvas(canvas);
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
    useEffect(()=>{
        if(canvasMain.current){
            canvasState.canvasMain = canvasMain.current;
        }
    },[canvasMain])
    useEffect(()=>{
        if(canvasContainer.current){
            canvasState.canvasContainer = canvasContainer.current;
        }
    },[canvasContainer])
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
        if(canvasMain.current){
            canvasMain.current.addEventListener('mousemove', websocketService.handleMouseMove)
            canvasMain.current.addEventListener('touchmove', websocketService.handleTouchMove)
            return () => {
                canvasMain.current?.removeEventListener('mousemove', websocketService.handleMouseMove)
                canvasMain.current?.removeEventListener('touchmove', websocketService.handleTouchMove)
                window.removeEventListener('mouseup', mouseUpHandler)
            }
        }

    }, [canvasMain, userState.color, canvasState.socket])
    useEffect(() => {
        websocketService.websocketWorker(params)
    }, [userState.loading])

    const mouseMoveHandler = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const canvas = mainCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        const circleOverlay = circleOverlayRef.current;
        if (circleOverlay && canvasMain.current && ctx) {
            if(toolState.tool.type === "pencil" || toolState.tool.type === "eraser"){
                circleOverlay.style.display = 'block';
                const x = e.clientX - circleOverlay.clientWidth / 2 - 1 + 'px';
                const y = e.clientY - canvasMain.current.offsetTop  - circleOverlay.clientHeight / 2 - 1 + 'px';
                circleOverlay.style.transform = `translate(${x}, ${y}) scale(${canvasState.scale})`;
                circleOverlay.style.width = String(`${ctx.lineWidth}px`);
                circleOverlay.style.height = String(`${ctx.lineWidth}px`);
            }
            else {
                circleOverlay.style.display = 'none'
            }
        }
    }
    const mouseDownHandler = () => {
        window.addEventListener('mouseup', mouseUpHandler);
        window.addEventListener('touchend', mouseUpHandler);
        if (toolState.tool.type !== "text") canvasState.addUndo(canvasState.getDataUrlCanvas());
    }
    const mouseUpHandler = () => {
        canvasState.saveCanvas();
        window.removeEventListener('mouseup', mouseUpHandler);
        window.removeEventListener('touchend', mouseUpHandler);
    }
    const mouseEnterHandler = () => {
        if (toolState.tool) {
            switch (toolState.tool.type) {
                case "text":
                    canvasState.setCursor('cursor-text');
                    break;
                case "drag":
                    canvasState.setCursor('cursor-move');
                    break;
                default:
                    canvasState.setCursor('cursor-crosshair');
            }
        }
    }
    const sendMessage = () => {
        websocketService.sendWebsocketMessage(message);
        setMessage("");
    }

    return (
        <div id="canvas" ref={canvasMain}
             onMouseMove={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => mouseMoveHandler(e)}
            className="relative">
            <div className="absolute left-0 z-[500] p-1 flex gap-1">
                <Search width={16} color="gray"></Search>
                <span className="text-gray-400">{Math.floor(canvasState.scale*100)}%</span>
            </div>
            <div className="canvas__container" id="canvas__container" ref={canvasContainer}>
                <canvas className="canvas main_canvas"
                        ref={mainCanvasRef}
                        onMouseDown={() => mouseDownHandler()}
                        onTouchStart={() => mouseDownHandler()}
                        onMouseEnter={() => mouseEnterHandler()}
                        onMouseLeave={() => canvasState.mouseLeaveHandler()}
                >
                </canvas>
            </div>
            <div ref={circleOverlayRef} className="circle-overlay"></div>
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

        </div>
    );
});

export default Canvas;