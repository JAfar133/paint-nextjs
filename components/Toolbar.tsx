"use client";

import React, {useEffect, useState} from 'react';
import NavbarAvatar from "@/components/NavbarAvatar";
import ThemeToggle from "@/components/theme-toggle";
import {Download, Save} from "lucide-react";
import {Toggle} from "@/components/ui/toggle";
import {Button} from "@/components/ui/button";
import canvasState from "@/store/canvasState";
import toolState from "@/store/toolState";
import CustomSelect from "@/components/CustomSelect";
import {observer} from "mobx-react-lite";
import settingState from "@/store/settingState";
import userState from "@/store/userState";
import UserService from "@/lib/api/UserService";
import {useParams} from "next/navigation";
import {AiOutlineClear, AiOutlinePlusSquare} from "react-icons/ai";
import {IoReturnUpBackOutline, IoReturnUpForward} from "react-icons/io5";
import _ from 'lodash'
import {ClientTool, cn, fonts, fontWeights, toolClasses, tools} from "@/lib/utils";
import InputColor, {Color} from "react-input-color";

const toolDivClass = "ml-3 flex flex-col content-center";

const Toolbar = observer(() => {

            const params = useParams();

            const [toolPressed, setToolPressed] = useState<ClientTool | null>(tools[0])
            const [strokeWidth, setStrokeWidth] = useState(settingState.strokeWidth);
            const [fillColor, setFillColor] = useState<Color | null>(settingState.fillColor);
            const [strokeColor, setStrokeColor] = useState<Color | null>(settingState.strokeColor);
            const [textSize, setTextSize] = useState<number>(settingState.textSize);
            const [textFont, setTextFont] = useState<string>(settingState.textFont);
            const [fontWeight, setFontWeight] = useState<string>(settingState.textFont);

            const findToolByName = (name: string): ClientTool | null => {
                const tool = _.find(tools, {name: name})
                return tool || null;
            }
            const setTool = (toolName: string) => {
                if (toolPressed && toolName === toolPressed.name) setToolPressed(tools[0]);
                else setToolPressed(findToolByName(toolName));
            }

            useEffect(() => {
                toolFactory();
            }, [toolPressed, canvasState.canvas, canvasState.socket, canvasState.canvasId]);
            const toolFactory = (): void => {
                if (!canvasState.canvas || !toolPressed) {
                    return;
                }

                const ToolClass = toolClasses[toolPressed.name];
                if (ToolClass && canvasState.socket) {
                    toolState.setTool(new ToolClass(canvasState.canvas, canvasState.socket, canvasState.canvasId, toolPressed.name));
                }
            }

            const download = () => {
                const dataURL = canvasState.canvas.toDataURL();
                const a = document.createElement('a');
                a.href = dataURL;
                a.download = canvasState.canvasId + ".jpg";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }

            const handleFillColorTool = (color: Color) => {
                setFillColor(color);
                if (toolState.tool) {
                    settingState.setFillColor(color);
                    toolState.fill();
                }
            }
            const handleStrokeColorTool = (color: Color) => {
                setStrokeColor(color);
                if (toolState.tool) {
                    settingState.setStrokeColor(color);
                    toolState.fill();
                }
            }

            const handleStrokeWidthTool = (width: number) => {
                setStrokeWidth(width)
                if (toolState.tool) {
                    settingState.setWidth(width);
                    toolState.fill();
                }
            }
            const handleTextSizeTool = (size: number) => {
                setTextSize(size)
                if (toolState.tool) {
                    settingState.setTextSize(size);
                    toolState.fill();
                }
            }
            const handleTextFontTool = (font: string) => {
                setTextFont(font)
                if (toolState.tool) {
                    settingState.setTextFont(font);
                    toolState.fill();
                }
            }
            const handleTextWeightTool = (weight: string) => {
                setFontWeight(weight)
                if (toolState.tool) {
                    settingState.setFontWeight(weight);
                    toolState.fill();
                }
            }
            const savetoUser = () => {
                if (userState._isAuth) {
                    UserService.saveDrawing(params.id)
                        .then(() => {
                            alert("Сохранено")
                        })
                        .catch(err => {
                            alert(err.response.data)
                        })
                }
            }
            const saveOnServer = () => {
                canvasState.saveCanvas()
            }

            return (
                <div className={"fixed w-full m-0 flex justify-between top-0 py-3 px-7 items-center bg-toolbar"}>
                    <div className="flex items-center gap-10">
                        <div className="flex items-center ">
                            <div className={toolDivClass}>
                                <Button variant="ghost" size="sm" onClick={() => download()}><Download
                                    className="h-6 w-6"/></Button>
                                <label htmlFor="" style={{fontSize: 10}} className="m-auto">Скачать</label>
                            </div>
                            <div className={toolDivClass}>
                                <Button variant="ghost" size="sm" onClick={() => saveOnServer()}><Save
                                    className="h-6 w-6"/></Button>
                                <label htmlFor="" style={{fontSize: 10}} className="m-auto">Сохранить</label>
                            </div>
                            <div className={toolDivClass}>
                                <Button variant="ghost" size="sm" onClick={() => savetoUser()}><AiOutlinePlusSquare
                                    className="h-6 w-6"/></Button>
                                <label htmlFor="" style={{fontSize: 10}} className="m-auto">Добавить к себе</label>
                            </div>
                            <div className={toolDivClass}>
                                <Button variant="ghost" size="sm" onClick={() => canvasState.clearCanvas()}><AiOutlineClear
                                    className="h-6 w-6"/></Button>
                                <label htmlFor="" style={{fontSize: 10}} className="m-auto">Очистить</label>
                            </div>
                            <div className={toolDivClass}>
                                <Button variant="ghost" size="sm" onClick={() => canvasState.undo()}><IoReturnUpBackOutline
                                    className="h-6 w-6"/></Button>
                                <label htmlFor="" style={{fontSize: 10}} className="m-auto">Отменить</label>
                            </div>
                            <div className={toolDivClass}>
                                <Button variant="ghost" size="sm" onClick={() => canvasState.redo()}><IoReturnUpForward
                                    className="h-6 w-6"/></Button>
                                <label htmlFor="" style={{fontSize: 10}} className="m-auto">Вернуть</label>
                            </div>
                        </div>
                        <div className="items-center flex flex-wrap">
                            {
                                tools.map((tool) =>
                                    <div className={toolDivClass} key={tool.name}>
                                        <Toggle size="sm"
                                                pressed={toolPressed?.name === tool.name}
                                                id={tool.name}
                                                className="m-auto"
                                                onClick={() => {
                                                    setTool(tool.name)
                                                }}>
                                            <tool.icon className="h-6 w-6"/>
                                        </Toggle>
                                        <label htmlFor={tool.name} style={{fontSize: 10}}
                                               className="m-auto">{tool.description}</label>
                                    </div>
                                )
                            }
                        </div>
                        <div className="flex items-center">
                            {toolPressed?.strokeWidth && <div className={cn(toolDivClass, "gap-2")}>
                              <CustomSelect id="width" classname="w-12 m-auto h-7"
                                            value={strokeWidth}
                                            options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200]}
                                            onChange={handleStrokeWidthTool}/>
                              <label htmlFor="width" style={{fontSize: 10}} className="ml-1 m-auto">Толщина</label>
                            </div>}
                            {toolPressed?.name === 'text'
                                && <>
                                <div className={cn(toolDivClass, "gap-2")}>
                                  <CustomSelect id="width" classname="w-12 m-auto h-7"
                                                value={textSize}
                                                options={[8, 9, 10, 12, 14, 16, 18, 20, 24, 26, 30, 36, 40, 50, 100, 200]}
                                                onChange={handleTextSizeTool}/>
                                  <label htmlFor="width" style={{fontSize: 10}} className="m-auto">Размер текста</label>
                                </div>
                                <div className={cn(toolDivClass, "gap-2")}>
                                  <CustomSelect id="width" classname="w-20 m-auto h-7"
                                                value={textFont}
                                                options={fonts}
                                                onChange={handleTextFontTool}/>
                                  <label htmlFor="width" style={{fontSize: 10}} className="m-auto">Шрифт</label>
                                </div>
                                <div className={cn(toolDivClass, "gap-2")}>
                                  <CustomSelect id="width" classname="w-20 m-auto h-7"
                                                value={fontWeight}
                                                options={fontWeights}
                                                onChange={handleTextWeightTool}/>
                                  <label htmlFor="width" style={{fontSize: 10}} className="m-auto">Насыщенность</label>
                                </div>
                              </>
                            }
                            {toolPressed?.fillColor && <>
                              <div className={cn(toolDivClass, "gap-3 color-input")}>
                                <InputColor
                                  initialValue={fillColor?.hex || '#000'}
                                  onChange={handleFillColorTool}
                                  placement="right"
                                />
                                <label htmlFor="fill" style={{fontSize: 10}} className="m-auto">Заливка</label>
                              </div>
                            </>}
                            {toolPressed?.strokeColor && <div className={cn(toolDivClass, "gap-3 color-input")}>
                              <InputColor
                                initialValue={strokeColor?.hex || '#000'}
                                onChange={handleStrokeColorTool}
                                placement="right"
                              />
                              <label htmlFor="stroke" style={{fontSize: 10}} className="m-auto">Цвет</label>
                            </div>}
                        </div>
                    </div>
                    <div className="flex gap-7 items-center">
                        <ThemeToggle/>
                        <NavbarAvatar/>
                    </div>

                </div>
            );
        }
    )
;

export default Toolbar;