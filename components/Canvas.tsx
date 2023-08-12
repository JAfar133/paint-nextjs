"use client";

import React, {useEffect, useRef, useState} from 'react';
import '../app/canvas.scss'
import {canvasSize} from "@/lib/utils";
import {observer} from "mobx-react-lite";

import canvasState from "../store/canvasState";
import userState from "@/store/userState";
import {useParams} from "next/navigation";
import UserService from "@/lib/api/UserService";
import {Toaster} from "@/components/ui/toaster";
import toolState from "@/store/toolState";
import {websocketWorker} from "@/lib/webSocketWorker";

const Canvas = observer(() => {

    const [connectionCount, setConnectionCount] = useState(0)
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const params = useParams();

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvasState.setCanvas(canvasRef.current);
            UserService.getImage(params.id)
                .then(response=>{
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

    }, [canvasRef]);
    useEffect(()=>{
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
        websocketWorker(params, setConnectionCount)
    }, [userState.user, userState.loading])

    const mouseDownHandler = () => {
        if (toolState.tool.type !== "text") canvasState.addUndo(canvasRef.current?.toDataURL())
    }
    const mouseUpHandler = () => {
        canvasState.saveCanvas();
    }
    const mouseEnterHandler = () => {
        if(toolState.tool){
            if(toolState.tool.type==="text"){
                canvasRef.current?.classList.add('cursor-text')
            }
            else if(toolState.tool.type==="arc"){
                canvasRef.current?.classList.add('cursor-cell')
            }
            else {
                canvasRef.current?.classList.add('cursor-crosshair')
            }
        }
    }
    const mouseLeaveHandler = () => {
        canvasRef.current?.classList.remove('cursor-crosshair')
        canvasRef.current?.classList.remove('cursor-text')
        canvasRef.current?.classList.remove('cursor-cell')
    }
    return (
        <>
            <span className={"absolute top-20"} style={{zIndex: -1}}>Пользователей на холсте: {connectionCount}</span>
            <canvas className="canvas"
                    width={canvasSize.width}
                    height={canvasSize.height}
                    ref={canvasRef}
                    onMouseDown={() => mouseDownHandler()}
                    onMouseUp={() => mouseUpHandler()}
                    onMouseEnter={()=>mouseEnterHandler()}
                    onMouseLeave={()=>mouseLeaveHandler()}
            >
            </canvas>
            <Toaster/>
        </>
    );
});

export default Canvas;