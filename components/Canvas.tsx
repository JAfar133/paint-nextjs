"use client";

import React, {Ref, useEffect, useRef, useState} from 'react';
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
import {ChevronLeft, ChevronRight, MessageSquare, Pause, Play, Search, Terminal} from "lucide-react";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import websocketService from "@/lib/api/WebsocketService";
import settingState from "@/store/settingState";
import RangeSlider from "react-bootstrap-range-slider";
import {useTheme} from "next-themes";
import {Toggle} from "@/components/ui/toggle";
import PencilTool from "@/lib/tools/pencilTool";
import TextTool from "@/lib/tools/textTool";

const Canvas = observer(() => {

    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const canvasMain = useRef<HTMLDivElement>(null);
    const canvasContainer = useRef<HTMLDivElement>(null);
    const circleOverlayRef = useRef<HTMLDivElement>(null);
    const [message, setMessage] = useState<string>("");
    const chatRef = useRef<HTMLDivElement | null>(null);
    const chatBtnRef = useRef<HTMLButtonElement | null>(null);
    const params = useParams();
    const messagesRef = useRef<HTMLDivElement>(null);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    useEffect(() => {
        if(mainCanvasRef.current){
            const width = window.innerWidth >= 768 ? window.innerWidth - 300 : window.innerWidth;
            const height = window.innerHeight - 155;
            mainCanvasRef.current.width = width;
            mainCanvasRef.current.height = height;
            mainCanvasRef.current.style.width = `${width}px`;
            mainCanvasRef.current.style.height = `${height}px`;
            mainCanvasRef.current.style.aspectRatio = `auto ${width} / ${height}`
        }
    }, [mainCanvasRef]);

    const scrollToBottom = () => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    };
    useEffect(() => {
        if(userState.isChatOpen){
            setTimeout(()=>{
                scrollToBottom();
            },10)
        }
    }, [canvasState.messages, userState.isChatOpen, messagesRef.current]);
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
            canvasState.setCursor("cursor-none")

        }

    }, [mainCanvasRef, params.id]);
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'Z' || e.key === 'Я')) {
                e.preventDefault();
                canvasState.redo();
            }
            else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'я')) {
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
    },[canvasContainer, circleOverlayRef])
    useEffect(()=>{
        if(circleOverlayRef.current){
            canvasState.circleOverlayRef = circleOverlayRef.current;
        }
    },[circleOverlayRef])
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
        if(canvasContainer.current){
            canvasContainer.current.addEventListener('mousemove', websocketService.handleMouseMove)
            canvasContainer.current.addEventListener('touchmove', websocketService.handleTouchMove)
            return () => {
                canvasContainer.current?.removeEventListener('mousemove', websocketService.handleMouseMove)
                canvasContainer.current?.removeEventListener('touchmove', websocketService.handleTouchMove)
                window.removeEventListener('mouseup', mouseUpHandler)
            }
        }

    }, [canvasContainer])
    useEffect(() => {
        websocketService.websocketWorker(params)
    }, [userState.loading])

    const mouseMoveHandler = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if(canvasState.canvasCursor === 'cursor-none'){
            mouseEnterHandler()
        }
        drawCircleOverlay(e.clientX, e.clientY);
    }
    const drawCircleOverlay = (x: number, y: number) => {
        if (canvasState.circleOverlayRef && canvasMain.current) {
            if(toolState.tool &&
                (toolState.tool.type === "pencil"
                    || toolState.tool.type === "eraser"
                    || (toolState.tool.type === "line"
                        || toolState.tool.type === "arrow"
                        || toolState.tool.type === "arc")
                    && settingState.lineCap === 'round')){
                canvasState.circleOverlayRef.style.display = 'block';
                const xTransform = x - canvasState.circleOverlayRef.clientWidth / 2 - 1 + 'px';
                const yTransform = y - canvasMain.current.offsetTop  - canvasState.circleOverlayRef.clientHeight / 2 - 1 + 'px';
                canvasState.circleOverlayRef.style.transform = `translate(${xTransform}, ${yTransform})`;
                canvasState.circleOverlayRef.style.width = String(`${settingState.strokeWidth*canvasState.scale}px`);
                canvasState.circleOverlayRef.style.height = String(`${settingState.strokeWidth*canvasState.scale}px`);
                if(settingState.strokeWidth===1){
                    canvasState.circleOverlayRef.style.borderRadius = '0';
                } else {
                    canvasState.circleOverlayRef.style.borderRadius = '50%';
                }
            }
            else {
                canvasState.circleOverlayRef.style.display = 'none'
            }
        }
    }
    const mouseDownHandler = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent> | React.TouchEvent<HTMLCanvasElement>) => {
        if ((e.nativeEvent instanceof MouseEvent && e.nativeEvent.button !== 1) || e.nativeEvent instanceof TouchEvent) {
            window.addEventListener('mouseup', mouseUpHandler);
            window.addEventListener('touchend', mouseUpHandler);
            if (!(toolState.tool instanceof TextTool || toolState.tool instanceof PencilTool)) {
                const {tempCtx, tempCanvas} = canvasState.createTempCanvas(canvasState.bufferCanvas.width, canvasState.bufferCanvas.height);
                tempCtx.drawImage(canvasState.bufferCanvas,0,0)
                canvasState.addUndo(tempCanvas);
            }
        }
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
    const handleChatOpen = () => {
        if(userState.isChatOpen) {
            userState.setIsChatOpen(false);
        } else {
            userState.unreadMessages = 0;
            userState.setIsChatOpen(true);
        }
    }
    useEffect(() => {
        // @ts-ignore
        const handleWindowClick = (event) => {
            if (chatRef.current && !chatRef.current.contains(event.target) && chatBtnRef.current && !chatBtnRef.current.contains(event.target)) {
                userState.setIsChatOpen(false);
            }
        };

        window.addEventListener('click', handleWindowClick);
        window.addEventListener('mousemove', canvasState.activateAllVideo);
        return () => {
            window.removeEventListener('click', handleWindowClick);
            window.removeEventListener('mousemove', canvasState.activateAllVideo);
        };
    }, []);
    return (
        <div id="canvas" ref={canvasMain} onClick={()=>canvasState.activateAllVideo()}
            className="relative">

            <div className="grid-container" id="grid-container"></div>
            <div className="absolute left-0 z-[200] p-1 flex gap-1">
                <Search width={16} color="gray"></Search>
                <span className="text-gray-400">{Math.floor(canvasState.scale*100)}%</span>
            </div>
            <div className="canvas__container" id="canvas__container" ref={canvasContainer}>
                <canvas className="canvas main_canvas"
                        onMouseMove={(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => mouseMoveHandler(e)}
                        ref={mainCanvasRef}
                        onMouseDown={(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => mouseDownHandler(e)}
                        onTouchStart={(e: React.TouchEvent<HTMLCanvasElement>) => mouseDownHandler(e)}
                        onMouseEnter={() => mouseEnterHandler()}
                        onMouseLeave={() => canvasState.mouseLeaveHandler()}
                >
                </canvas>
                { canvasState.currentVideoPlaying !== null &&
                    <div className="absolute right-3 z-[500] flex items-center">

                        {(userState.canPauseVideo || userState.isAdmin()) &&
                            <Toggle size="sm"
                                pressed={canvasState.animationFrameId === null}
                                className="mr-4"
                                onClick={() => {
                                    canvasState.toggleVideoPlay();
                                    websocketService.sendWebsocket(JSON.stringify({
                                        method: "toggle_video_play",
                                        id: canvasState.canvasId,
                                        username: userState.user?.username,
                                    }))
                                }}>
                            {canvasState.animationFrameId !== null ? <Pause/> : <Play/>}
                        </Toggle>}
                        <RangeSlider
                            className="w-100"
                            value={canvasState.volumeLevel}
                            onWheel={e=>{
                                const value = e.deltaY > 0
                                    ? Math.max(1, canvasState.volumeLevel - 1)
                                    : Math.min(100, canvasState.volumeLevel + 1);
                                canvasState.setVideoSound(value);
                            }}
                            onChange={e => {
                                const newValue = parseInt(e.target.value);
                                canvasState.setVideoSound(newValue);
                            }}
                            variant={useTheme().theme === "dark" ? "secondary" : "light"}
                        />
                    </div> }
                {userState.isAdmin() &&
                    <div className="absolute left-0 top-10 gap-2 p-2">
                        <Button className="relative" size='icon' variant="default"
                                onClick={()=>setIsAdminPanelOpen(!isAdminPanelOpen)}>
                            {!isAdminPanelOpen ? <ChevronRight/> : <ChevronLeft/>}
                        </Button>
                        <div
                            className={`admin_panel w-max flex flex-col absolute left-0 top-10 gap-2 p-2 bg-opacity-75 ${
                                isAdminPanelOpen ? 'open' : ''
                            }`}
                        >   <Button variant='destructive' size='sm' onClick={()=>{
                                websocketService.sendWebsocket(JSON.stringify({
                                    method: "give_play_video",
                                    id: canvasState.canvasId,
                                    username: userState.user?.username,
                                    color: userState.color
                                }))
                            }}>Дать доступ к видео</Button>
                            <Button variant='destructive' size='sm' onClick={()=>{
                                websocketService.sendWebsocket(JSON.stringify({
                                    method: "giveaway_play_video",
                                    id: canvasState.canvasId,
                                    username: userState.user?.username,
                                    color: userState.color
                                }))
                            }}>Забрать доступ к видео</Button>
                            <Button variant='destructive' size='sm' onClick={()=>{
                                websocketService.sendWebsocket(JSON.stringify({
                                    method: "block_pause_video",
                                    id: canvasState.canvasId,
                                    username: userState.user?.username,
                                    color: userState.color
                                }))
                            }}>Запретить ставить на паузу</Button>
                            <Button variant='destructive' size='sm' onClick={()=>{
                                websocketService.sendWebsocket(JSON.stringify({
                                    method: "permit_pause_video",
                                    id: canvasState.canvasId,
                                    username: userState.user?.username,
                                    color: userState.color
                                }))
                            }}>Разрешить ставить на паузу</Button>
                            {userState.user?.role === 'admin' && <><Button variant='destructive' size='sm' onClick={()=>{
                                websocketService.sendWebsocket(JSON.stringify({
                                    method: "give_admin_role",
                                    id: canvasState.canvasId,
                                    username: userState.user?.username,
                                    color: userState.color
                                }))
                            }}>Дать временные админ парва</Button>
                            <Button variant='destructive' size='sm' onClick={()=>{
                                websocketService.sendWebsocket(JSON.stringify({
                                    method: "giveaway_admin_role",
                                    id: canvasState.canvasId,
                                    username: userState.user?.username,
                                    color: userState.color
                                }))
                            }}>Забрать временные админ парва</Button></>}
                        </div>
                    </div>
                }
            </div>

            <div ref={circleOverlayRef} className="circle-overlay"></div>
            <div className="fixed right-2 bottom-2 z-[200]">
                <Popover>
                    <PopoverTrigger asChild ref={chatBtnRef}>
                        <Button variant={userState.unreadMessages <  5 ? "outline" : "destructive"} onClick={handleChatOpen} size="sm">
                            <MessageSquare/>
                            <div className="absolute bottom-0 right-[5px]">
                                {userState.unreadMessages > 0
                                    ? <span className={userState.unreadMessages <  5 ? "bg-purple-900" : "bg-gray-900"} style={{borderRadius: '1rem', padding: '1px 5px', fontSize: 11}}>{userState.unreadMessages}</span>
                                    : ''
                                }
                            </div>

                        </Button>

                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-transparent" ref={chatRef}>
                        <Card className="md:w-[350px] w-[280px] md:right-10 absolute border-black bottom-0 bg-transparent">
                            <CardHeader className="bg-card">
                                <CardTitle>Чат</CardTitle>
                                <CardDescription>Напиши что-нибудь!</CardDescription>
                            </CardHeader>
                            <CardContent className="md:h-[360px] h-[320px] gap-3 flex flex-col overflow-auto py-5 backdrop-blur-md"
                                         ref={messagesRef}>
                                {
                                    canvasState.messages.map(message =>
                                        <div
                                            className={cn("w-full flex justify-end ",
                                                message.username === userState.user?.username ? "justify-end" : "justify-start")}
                                            key={message.id}>
                                            <Alert className="md:max-w-[230px] max-w-[160px] border-none"
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
                                    autoComplete="off"
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

        </div>
    );
});

export default Canvas;