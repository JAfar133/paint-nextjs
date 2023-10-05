"use client";

import React, {ChangeEvent, useEffect, useState} from 'react';
import NavbarAvatar from "@/components/NavbarAvatar";
import ThemeToggle from "@/components/theme-toggle";
import {Download, Save, Upload, Users} from "lucide-react";
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
import {ClientTool, cn, fonts, fontWeights, toolClasses, ToolName, tools} from "@/lib/utils";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Slider} from "@/components/ui/slider";

const toolDivClass = "ml-3 flex flex-col content-center";

const Toolbar = observer(() => {

            const params = useParams();

            const [toolPressed, setToolPressed] = useState<ClientTool>(tools[1])
            const [strokeWidth, setStrokeWidth] = useState(settingState.strokeWidth);
            const [textSize, setTextSize] = useState<number>(settingState.textSize);
            const [textFont, setTextFont] = useState<string>(settingState.textFont);
            const [fontWeight, setFontWeight] = useState<string>(settingState.textFont);

            const findToolByName = (name: ToolName): ClientTool => {
                const tool = _.find(tools, {name: name})
                return tool || tools[1];
            }
            const setTool = (toolName: ToolName) => {
                if (toolPressed && toolName === toolPressed.name) setToolPressed(tools[1]);
                else setToolPressed(findToolByName(toolName));
                canvasState.fill();
            }

            useEffect(() => {
                toolFactory();
            }, [toolPressed, canvasState.canvas, canvasState.socket, canvasState.canvasId]);

            useEffect(() => {
                if (toolState.tool) {
                    if(toolState.tool.type !== toolPressed.name) setTool(toolState.tool.type)
                    if(toolState.tool.type !== "drag") canvasState.deleteBorder();
                }
            }, [toolState.tool]);
            const toolFactory = (): void => {
                if (!canvasState.canvas || !toolPressed) {
                    return;
                }

                const ToolClass = toolClasses[toolPressed.name];
                if (ToolClass && canvasState.socket) {
                    if(toolState.tool && toolState.tool.type === toolPressed.name) return;
                    toolState.setTool(new ToolClass(canvasState.canvas, canvasState.socket, canvasState.canvasId, toolPressed.name));
                }
            }

            const download = () => {
                const dataURL = canvasState.bufferCanvas.toDataURL();
                const a = document.createElement('a');
                a.href = dataURL;
                a.download = canvasState.canvasId + ".jpg";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }

            const handleFillColorTool = (color: string) => {
                if (toolState.tool) {
                    settingState.setFillColor(color);
                    canvasState.fill();
                }
            }
            const handleStrokeColorTool = (color: string) => {
                if (toolState.tool) {
                    settingState.setStrokeColor(color);
                    canvasState.fill();
                }
            }

            const handleStrokeWidthTool = (width: number) => {
                setStrokeWidth(width)
                if (toolState.tool) {
                    settingState.setWidth(width);
                    canvasState.fill();
                }
            }
            const handleTextSizeTool = (size: number) => {
                setTextSize(size)
                if (toolState.tool) {
                    settingState.setTextSize(size);
                    canvasState.fill();
                }
            }
            const handleTextFontTool = (font: string) => {
                setTextFont(font)
                if (toolState.tool) {
                    settingState.setTextFont(font);
                    canvasState.fill();
                }
            }
            const handleFillingTolerance = (tolerance: number) => {
                if (toolState.tool) {
                    settingState.setFillingTolerance(tolerance);
                }
            }
            const handleTextWeightTool = (weight: string) => {
                setFontWeight(weight)
                if (toolState.tool) {
                    settingState.setFontWeight(weight);
                    canvasState.fill();
                }
            }
            const handleLineJoinTool = (lineJoin: CanvasLineJoin) => {
                if (toolState.tool) {
                    settingState.setLineJoin(lineJoin);
                    canvasState.fill();
                }
            }
            const handleLineCapTool = (lineCap: CanvasLineCap) => {
                if (toolState.tool) {
                    settingState.setLineCap(lineCap);
                    canvasState.fill();
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
            const imageUpload = (e: ChangeEvent<HTMLInputElement>) => {
                const target = e.target as HTMLInputElement;
                const file = target.files?.[0]
                if (file) {
                    const reader = new FileReader();

                    reader.onload = (event) => {
                        if (event.target) {
                            const dataUrl = event.target.result as string;
                            canvasState.addCurrentContextToUndo();
                            canvasState.drawByDataUrl(dataUrl, {clearRect: false, imageEdit: true});
                            canvasState.sendDataUrl(canvasState.bufferCanvas.toDataURL());
                            canvasState.saveCanvas();
                        }
                    };
                    reader.readAsDataURL(file);
                }
            };
            return (
                <>
                    <div className="fixed bg-toolbar top-0 w-full z-[99]">
                        <div
                            className={"w-full m-0 flex justify-between py-3 px-7 items-center z-[100]"}>
                            <div className="flex items-center gap-10 flex-wrap">
                                <div className="flex items-center ">
                                    <div className={toolDivClass}>
                                        <Button variant="ghost" size="sm" onClick={() => download()}><Download
                                            className="h-6 w-6"/></Button>
                                        <label htmlFor="" style={{fontSize: 10}} className="m-auto">Скачать</label>
                                    </div>
                                    <div className={toolDivClass}>
                                        <input id="picture" type="file" onChange={imageUpload} accept="image/*,.png"/>
                                        <label htmlFor="picture" className="upload_label">
                                            <Upload className="text-center h-6 w-6"/>
                                        </label>
                                        <label style={{fontSize: 10}} className="m-auto ">Загрузить</label>
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
                                        <Button variant="ghost" size="sm"
                                                onClick={() => canvasState.clearCanvas()}><AiOutlineClear
                                            className="h-6 w-6"/></Button>
                                        <label htmlFor="" style={{fontSize: 10}} className="m-auto">Очистить</label>
                                    </div>
                                    <div className={toolDivClass}>
                                        <Button variant="ghost" size="sm"
                                                onClick={() => canvasState.undo()}><IoReturnUpBackOutline
                                            className="h-6 w-6"/></Button>
                                        <label htmlFor="" style={{fontSize: 10}} className="m-auto">Отменить</label>
                                    </div>
                                    <div className={toolDivClass}>
                                        <Button variant="ghost" size="sm" onClick={() => canvasState.redo()}><IoReturnUpForward
                                            className="h-6 w-6"/></Button>
                                        <label htmlFor="" style={{fontSize: 10}} className="m-auto">Вернуть</label>
                                    </div>
                                </div>

                                <div className="flex items-center flex-wrap">
                                    {toolPressed?.strokeWidth && <div className={cn(toolDivClass, "gap-2")}>
                                      <CustomSelect id="width" classname="w-12 m-auto h-7"
                                                    value={strokeWidth}
                                                    options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200]}
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
                                        {/*<InputColor*/}
                                        {/*  initialValue={fillColor?.hex || '#000'}*/}
                                        {/*  onChange={handleFillColorTool}*/}
                                        {/*  placement="right"*/}
                                        {/*/>*/}
                                        <input type="color" value={settingState.fillColor}
                                               onChange={e=>handleFillColorTool(e.target.value)}
                                               name="fill" id="fill"/>
                                        <label htmlFor="fill" style={{fontSize: 10}} className="m-auto">Заливка</label>
                                      </div>
                                    </>}
                                    {toolPressed?.strokeColor && <div className={cn(toolDivClass, "gap-3 color-input")}>
                                      {/*<InputColor*/}
                                      {/*  initialValue={strokeColor?.hex || '#000'}*/}
                                      {/*  onChange={handleStrokeColorTool}*/}
                                      {/*  placement="right"*/}
                                      {/*/>*/}
                                      <input type="color" value={settingState.strokeColor}
                                             onChange={e=>handleStrokeColorTool(e.target.value)}
                                             name="stroke" id="stroke"/>
                                        <label htmlFor="stroke" style={{fontSize: 10}} className="m-auto">Цвет</label>
                                    </div>}
                                    {toolPressed?.fillColor && toolPressed.strokeColor &&
                                      <div className="ml-5 flex flex-col gap-1 text-sm">
                                        <div>
                                          <span style={{fontSize: 11, marginRight: 5}}>Заливка</span>
                                          <select
                                            className="w-[150px]"
                                            value={canvasState.isFill.toString()}
                                            onChange={(e) => {
                                              canvasState.isFill = e.target.value === 'true'
                                            }}>
                                            <option value="true">Сплошной цвет</option>
                                            <option value="false">Без заливки</option>
                                          </select>
                                        </div>
                                        <div>
                                          <span style={{fontSize: 11, marginRight: 12}}>Контур</span>
                                          <select
                                            className="w-[150px]"
                                            value={canvasState.isStroke.toString()}
                                            onChange={(e) => {
                                              canvasState.isStroke = e.target.value === 'true'
                                            }}>
                                            <option value="true">Сплошной цвет</option>
                                            <option value="false">Без контура</option>
                                          </select>
                                        </div>
                                          { toolPressed.name !== "circle" && toolPressed.name !== "ellipse" && <div>
                                          <span style={{fontSize: 11, marginRight: 24}}>Углы</span>
                                          <select
                                            className="w-[150px]"
                                            value={settingState.lineJoin}
                                            onChange={(e) => {
                                              handleLineJoinTool(e.target.value as CanvasLineJoin)
                                            }}>
                                            <option value="miter">Острые</option>
                                            <option value="round">Скругленные</option>
                                            <option value="bevel">Срезанные</option>
                                          </select>
                                        </div>}
                                      </div>
                                    }
                                    { (toolPressed.name === "arc" || toolPressed.name === "line" || toolPressed.name === "arrow") &&
                                        <div className="ml-4">
                                          <span style={{fontSize: 11, marginRight: 5}}>Линии</span>
                                          <select
                                            value={settingState.lineCap}
                                            onChange={(e) => {
                                                handleLineCapTool(e.target.value as CanvasLineCap)
                                            }}>
                                            <option value="butt">Прямые</option>
                                            <option value="round">Скругленные</option>
                                            <option value="square">Прямые с добавлением</option>
                                          </select>
                                        </div>}
                                    { toolPressed?.name === "filling" &&
                                      <div className={cn(toolDivClass, "gap-2")}>
                                        <CustomSelect id="width" classname="w-12 m-auto h-7"
                                                      value={settingState.fillingTolerance}
                                                      options={[0, 5, 25, 50, 75, 100, 125, 150, 175, 200, 225, 255]}
                                                      onChange={handleFillingTolerance}/>
                                        <label htmlFor="width" style={{fontSize: 10}} className="ml-1 m-auto">Допуск</label>
                                      </div>
                                    }
                                    <div className={cn(toolDivClass, "gap-2")}>
                                        <Slider
                                            max={100}
                                            step={1}
                                            value={[settingState.globalAlpha*100]}
                                            onValueChange={(value: number[]) => {
                                                settingState.setGlobalAlpha(value[0]/100)
                                            }}
                                            onValueCommit={() => {
                                                canvasState.fill()
                                            }}
                                            className={cn("w-[200px]")}
                                        />
                                        <label htmlFor="width" style={{fontSize: 10}} className="ml-1 m-auto">Прозрачность</label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-7 items-center">
                                <Popover>
                                    <PopoverTrigger>
                                        <div className="flex gap-1">
                                            <span>{canvasState.userCount}</span>
                                            <Users/>
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent>
                                        <p>подключенные пользователи</p>
                                        {
                                            canvasState.users !== null && canvasState.users.map((user, idx) =>
                                                <p key={user}
                                                   style={{color: user === userState.user?.username ? 'green' : 'secondary'}}>
                                                    {idx + 1}. {user} {user === userState.user?.username ? '<- Ты' : ''}
                                                </p>
                                            )
                                        }
                                    </PopoverContent>
                                </Popover>
                                <ThemeToggle/>
                                <NavbarAvatar/>
                            </div>
                        </div>
                        <div className={"border-t-2 w-full m-0 flex py-3 px-7 items-center"} style={{top: 75}}>
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
                        </div>
                    </div>
                </>
            );
        }
    )
;

export default Toolbar;