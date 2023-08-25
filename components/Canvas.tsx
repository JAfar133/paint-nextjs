"use client";

import React, {useEffect, useRef, useState} from 'react';
import '../app/canvas.scss'
import {canvasSize} from "@/lib/utils";
import {observer} from "mobx-react-lite";

import canvasState from "../store/canvasState";
import userState from "@/store/userState";
import {useParams} from "next/navigation";
import UserService from "@/lib/api/UserService";
import toolState from "@/store/toolState";
import {websocketWorker} from "@/lib/webSocketWorker";


const Canvas = observer(() => {

    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const circleOverlayRef = useRef<HTMLDivElement>(null);
    const params = useParams();

    useEffect(() => {
        if (mainCanvasRef.current) {
            const canvas = mainCanvasRef.current;
            canvasState.setCanvas(mainCanvasRef.current);
            UserService.getImage(params.id)
                .then(response => {
                    const img = new Image();
                    img.src = response.data;
                    const ctx = canvas.getContext('2d')
                    img.onload = () => {
                        ctx?.clearRect(0, 0, canvas.width, canvas.height);
                        ctx?.drawImage(img, 0, 0);
                        ctx?.stroke();
                    }
                })
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
        const handleMove = (e: MouseEvent) => {
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
                    }
                }));
            }
        }

        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', mouseUpHandler)
        return () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', mouseUpHandler)
        }
    }, [canvasState.socket])
    useEffect(() => {
        websocketWorker(params)
    }, [userState.loading])

    const mouseMoveHandler = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const canvas = mainCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        const circleOverlay = circleOverlayRef.current;
        if (circleOverlay && ctx && (toolState.tool.type === "pencil" || toolState.tool.type === "eraser")) {
            circleOverlay.style.display = 'block'
            const x = e.pageX - circleOverlay.clientWidth / 2 - 1 + 'px';
            const y = e.pageY - circleOverlay.clientHeight / 2 - 1 + 'px';
            circleOverlay.style.transform = `translate(${x}, ${y})`;
            circleOverlay.style.width = String(`${ctx.lineWidth}px`);
            circleOverlay.style.height = String(`${ctx.lineWidth}px`);
        }
    }
    const mouseDownHandler = () => {
        if (toolState.tool.type !== "text") canvasState.addUndo(mainCanvasRef.current?.toDataURL())
    }
    const mouseUpHandler = () => {
        canvasState.saveCanvas();
    }
    const mouseEnterHandler = () => {
        if (toolState.tool) {
            if (toolState.tool.type === "text") {
                mainCanvasRef.current?.classList.add('cursor-text')
            } else if (toolState.tool.type === "arc") {
                mainCanvasRef.current?.classList.add('cursor-cell')
            } else {
                mainCanvasRef.current?.classList.add('cursor-crosshair')
            }
        }
    }
    const mouseLeaveHandler = () => {
        if (circleOverlayRef.current) circleOverlayRef.current.style.display = 'none';
        mainCanvasRef.current?.classList.remove('cursor-crosshair')
        mainCanvasRef.current?.classList.remove('cursor-text')
        mainCanvasRef.current?.classList.remove('cursor-cell')
    }
    return (
        <div className="canvas__container">
            <canvas className="canvas main_canvas"
                    width={canvasSize.width}
                    height={canvasSize.height}
                    ref={mainCanvasRef}
                    onMouseDown={() => mouseDownHandler()}
                    onMouseMove={(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => mouseMoveHandler(e)}
                    onMouseEnter={() => mouseEnterHandler()}
                    onMouseLeave={() => mouseLeaveHandler()}
            >
            </canvas>
            <div ref={circleOverlayRef} className="circle-overlay"></div>
        </div>
    );
});

export default Canvas;