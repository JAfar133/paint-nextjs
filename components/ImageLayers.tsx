"use client";

import React, {useEffect} from 'react';
import {observer} from "mobx-react-lite";
import toolState from "@/store/toolState";
import NextImage from "next/image";
import DragTool from "@/lib/tools/dragTool";
import canvasState from "@/store/canvasState";
import {cn} from "@/lib/utils";

const ImageLayers = observer(() => {

    useEffect(() => {
        setTimeout(() => {
            if (canvasState.canvas) {
                const img = new Image();
                img.src = canvasState.bufferCanvas.toDataURL();
                const image = {
                    imageX: 0,
                    imageY: 0,
                    offsetX: 0,
                    offsetY: 0,
                    img: img,
                    isDragging: false,
                    isResizing: false,
                    isRotating: false,
                    isUpload: false,
                    angle: 0
                }
                if (toolState.imageForEditList.length === 0) {
                    toolState.addImageForEdit(image);
                } else {
                    toolState.imageForEditList = [image, ...toolState.imageForEditList.slice(1, toolState.imageForEditList.length)]
                }
            }
        }, 100)
    }, [canvasState.canvas])

    const toggleLayer = (index: number) => {
        toolState.setImageForEdit(toolState.imageForEditList[index]);
        if (canvasState.socket) {
            toolState.setTool(new DragTool(canvasState.canvas, canvasState.socket, canvasState.canvasId, "drag"))
        }
    }
    return (
        <>
            {toolState.imageForEditList.length > 0 &&
                      toolState.imageForEditList.map((image, index) =>
                          <div
                              className={cn("fixed bottom-0 cursor-pointer w-[50px] h-[50px] flex justify-center items-center z-[99]",
                              image === toolState.imageForEdit || toolState.imageForEditList.length === 1
                                  ? 'bg-gray-600 hover:bg-gray-700'
                                  : 'hover:bg-gray-500',)}
                              onClick={() => toggleLayer(index)} key={index} style={{left: `${index*54}px`}}>
                              <div className="w-[30px] h-[30px] flex items-center">
                                  <NextImage width={30} height={30} src={image.img.src} alt="layer"
                                             style={{transform: `rotate(${image.angle}rad)`}}/>
                              </div>
                          </div>
                      )
                  }
        </>
    );
});

export default ImageLayers;