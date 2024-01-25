"use client";

import React, {ChangeEvent, useEffect, useRef, useState} from 'react';
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
import RangeSlider from "react-bootstrap-range-slider";
import {useTheme} from "next-themes";
import {HoverCard, HoverCardContent, HoverCardTrigger} from "@/components/ui/hover-card";
import websocketService from "@/lib/api/WebsocketService";
import {Modal} from "react-bootstrap";
import {ConfirmDialog} from "primereact/confirmdialog";

const toolDivClass = "ml-3 flex flex-col content-center";

const Toolbar = observer(() => {

            const params = useParams();
            const audioTestRef = useRef<HTMLAudioElement | null>(null);
            const [videoPlay, setVideoPlay] = useState<boolean>(false)
            const [audioPlay, setAudioPlay] = useState<boolean>(false)
            const [videoPlaying, setVideoPlaying] = useState<HTMLVideoElement | null>(null)
            const [audioPlaying, setAudioPlaying] = useState<HTMLAudioElement | null>(null)
            const [toolPressed, setToolPressed] = useState<ClientTool>(tools[1])
            const findToolByName = (name: ToolName): ClientTool => {
                const tool = _.find(tools, {name: name})
                return tool || tools[1];
            }
            const setTool = (toolName: ToolName) => {
                if (toolPressed && toolName === toolPressed.name) setToolPressed(tools[1]);
                else setToolPressed(findToolByName(toolName));
                canvasState.fill();
                canvasState.deleteTextLine();
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
                if (toolState.tool) {
                    settingState.setWidth(width);
                    canvasState.fill();
                }
            }
            const handleTextSizeTool = (size: number) => {
                if (toolState.tool) {
                    settingState.setTextSize(size);
                    canvasState.fill();
                }
            }
            const handleTextFontTool = (font: string) => {
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


            const playVideo = (id: string) => {
              const video = document.getElementById(id) as HTMLVideoElement;
              if(video != null) {
                if (!videoPlay || (canvasState.currentVideoPlaying !== null && video !== canvasState.currentVideoPlaying)) {
                  canvasState.playVideo(video)
                  setVideoPlay(true)
                  websocketService.sendWebsocket(JSON.stringify({
                    method: "play_video",
                    video_id: video.id,
                    id: canvasState.canvasId,
                    username: userState.user?.username,
                  }))
                } else {
                  canvasState.stopVideo(video)
                  setVideoPlay(false)
                  websocketService.sendWebsocket(JSON.stringify({
                    method: "stop_video",
                    video_id: video.id,
                    id: canvasState.canvasId,
                    username: userState.user?.username,
                  }))
                }
              }
            };

            const playAudio = (audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
              const audio = audioRef.current

              if(audio) {
                if(!audioPlay) {
                  // audio.play()
                  websocketService.sendWebsocket(JSON.stringify({
                    method: "play_audio",
                    audio_id: audio.id,
                    id: canvasState.canvasId,
                    username: userState.user?.username,
                  }))
                  setAudioPlay(true)
                } else {
                  // audio.pause()
                  websocketService.sendWebsocket(JSON.stringify({
                    method: "stop_audio",
                    audio_id: audio.id,
                    id: canvasState.canvasId,
                    username: userState.user?.username,
                  }))
                  setAudioPlay(false)
                }
              }
            }
            return (
                <>
                    <div className="toolbar-top fixed bg-toolbar top-0 w-full z-[99] max-h-[155px]">
                        <div className="toolbar-menu w-full m-0 flex justify-between py-3 px-7 items-center z-[100]">
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
                            </div>
                            <div className="flex gap-7 items-center">
                                <HoverCard>
                                    <HoverCardTrigger>
                                        <div className="flex gap-1">
                                            <span>{canvasState.userCount}</span>
                                            <Users/>
                                        </div>
                                    </HoverCardTrigger>
                                    <HoverCardContent>
                                        <p>подключенные пользователи</p>
                                        {
                                            canvasState.users !== null && canvasState.users.map((user, idx) =>
                                                <p key={user}
                                                   style={{color: user === userState.user?.username ? 'green' : 'secondary'}}>
                                                    {idx + 1}. {user} {user === userState.user?.username ? '<- Ты' : ''}
                                                </p>
                                            )
                                        }
                                    </HoverCardContent>
                                </HoverCard>
                                <ThemeToggle/>
                                <NavbarAvatar/>
                            </div>
                        </div>
                        <div className={"toolbar-tools border-t-2 w-full m-0 flex py-3 px-7 items-center"} style={{top: 75}}>
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
                    <div className="toolbar-setting fixed w-[300px] right-0 top-[155px] h-full bg-toolbar p-7 pr-3">
                        <div className="flex flex-wrap justify-start flex-col gap-3 text-xs">
                            {toolPressed?.fillColor && <>
                              <div className={"flex gap-3 color-input text-xs"}>
                                <label htmlFor="fill" className="w-[80px] mr-2">Заливка</label>
                                <input type="color" value={settingState.fillColor}
                                       onChange={e=>handleFillColorTool(e.target.value)}
                                       name="fill" id="fill"/>
                              </div>
                            </>}
                            {toolPressed?.strokeColor && <div className="flex gap-3 color-input">
                              <label htmlFor="stroke" className="w-[80px] mr-2">Цвет</label>
                              <input type="color" value={settingState.strokeColor}
                                     onChange={e=>handleStrokeColorTool(e.target.value)}
                                     name="stroke" id="stroke"/>
                            </div>}
                            {toolPressed?.strokeWidth && <div className="flex gap-3 items-center">
                              <label htmlFor="width" className="w-[80px] mr-2">Толщина</label>
                              <RangeSlider
                                onWheel={e=>{
                                    const value = e.deltaY > 0
                                        ? Math.max(1, settingState.strokeWidth - 1)
                                        : Math.min(200, settingState.strokeWidth + 1);
                                    handleStrokeWidthTool(value);
                                }}
                                min={1}
                                max={200}
                                className="w-100"
                                value={settingState.strokeWidth}
                                onChange={e => {
                                    handleStrokeWidthTool(parseInt(e.target.value))
                                }}
                                variant={useTheme().theme === "dark" ? "secondary" : "light"}
                              />
                            </div>}
                            {toolPressed?.name === 'text'
                                && <>
                                <div className="flex gap-3 items-center">
                                  <label htmlFor="width" className="w-[80px] mr-2">Размер текста</label>
                                  <RangeSlider
                                    min={1}
                                    max={200}
                                    className="w-100"
                                    value={settingState.textSize}
                                    onWheel={e=>{
                                        const value = e.deltaY > 0
                                            ? Math.max(1, settingState.textSize - 1)
                                            : Math.min(200, settingState.textSize + 1);
                                        handleTextSizeTool(value);
                                    }}
                                    onChange={e => {
                                        handleTextSizeTool(parseInt(e.target.value))
                                    }}
                                    variant={useTheme().theme === "dark" ? "secondary" : "light"}
                                  />
                                </div>
                                <div className="flex gap-3 items-center">
                                  <label htmlFor="width" className="w-[80px] mr-2">Шрифт</label>
                                  <CustomSelect id="width" classname="w-20 h-7"
                                                value={settingState.textFont}
                                                options={fonts}
                                                onChange={handleTextFontTool}/>
                                </div>
                                <div className="flex gap-3 items-center">
                                  <label htmlFor="width" className="w-[80px] mr-2">Насыщенность</label>
                                  <CustomSelect id="width" classname="w-20 h-7"
                                                value={settingState.fontWeight}
                                                options={fontWeights}
                                                onChange={handleTextWeightTool}/>
                                </div>
                              </>
                            }
                            {toolPressed?.fillColor && toolPressed.strokeColor &&
                              <div className="flex flex-col gap-3 text-xs">
                                <div className="flex gap-3 items-center">
                                  <label htmlFor="isFill" className="w-[80px] mr-2">Заливка</label>
                                  <select
                                    name="isFill"
                                    className="w-[150px]"
                                    value={canvasState.isFill.toString()}
                                    onChange={(e) => {
                                        canvasState.isFill = e.target.value === 'true'
                                    }}>
                                    <option value="true">Сплошной цвет</option>
                                    <option value="false">Без заливки</option>
                                  </select>
                                </div>
                                <div className="flex gap-3 items-center">
                                  <label htmlFor="isStroke" className="w-[80px] mr-2">Контур</label>
                                  <select
                                    name="isStroke"
                                    className="w-[150px]"
                                    value={canvasState.isStroke.toString()}
                                    onChange={(e) => {
                                        canvasState.isStroke = e.target.value === 'true'
                                    }}>
                                    <option value="true">Сплошной цвет</option>
                                    <option value="false">Без контура</option>
                                  </select>
                                </div>
                                  { toolPressed.name !== "circle" && toolPressed.name !== "ellipse" && canvasState.isStroke &&
                                    <div className="flex gap-3 items-center">
                                        <label htmlFor="lineJoin" className="w-[80px] mr-2">Углы</label>
                                        <select
                                          name="lineJoin"
                                          className="w-[150px] text-xs"
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
                              <div className="flex gap-3 items-center">
                                <label htmlFor="lineCap" className="w-[80px] mr-2">Линии</label>
                                <select
                                  className="w-100"
                                  name="lineCap"
                                  value={settingState.lineCap}
                                  onChange={(e) => {
                                      handleLineCapTool(e.target.value as CanvasLineCap)
                                  }}>
                                  <option value="butt">Прямые</option>
                                  <option value="round">Скругленные</option>
                                  <option value="square">Прямые с добавлением</option>
                                </select>
                              </div>}
                            { toolPressed.name === "filling" &&
                              <div className="flex gap-3 items-center">
                                <label htmlFor="width" className="w-[80px] mr-2">Допуск</label>
                                <RangeSlider
                                  min={1}
                                  max={255}
                                  className="w-100"
                                  value={settingState.fillingTolerance}
                                  onWheel={e=>{
                                      const value = e.deltaY > 0
                                          ? Math.max(1, settingState.fillingTolerance - 1)
                                          : Math.min(255, settingState.fillingTolerance + 1);
                                      handleFillingTolerance(value);
                                  }}
                                  onChange={e => {
                                      handleFillingTolerance(parseInt(e.target.value))
                                  }}
                                  variant={useTheme().theme === "dark" ? "secondary" : "light"}
                                />
                              </div>
                            }
                            { toolPressed.name !== "eraser" && toolPressed.name !== "drag" && <div className="flex gap-3 items-center">
                              <label htmlFor="width" className="w-[80px] mr-2">Прозрачность</label>
                              <RangeSlider
                                className="w-100"
                                value={Math.round(settingState.globalAlpha * 100)}
                                onWheel={e=>{
                                    const value = e.deltaY > 0
                                        ? Math.max(0, settingState.globalAlpha-1/100)
                                        : Math.min(1, settingState.globalAlpha+1/100);
                                    settingState.setGlobalAlpha(value);
                                }}
                                onChange={e => {
                                    const newValue = parseFloat(e.target.value);
                                    settingState.setGlobalAlpha(newValue / 100);
                                }}
                                variant={useTheme().theme === "dark" ? "secondary" : "light"}
                              />
                            </div>}
                          { canvasState.currentVideoPlaying !== null && <div className="flex gap-3 items-center">
                            <label htmlFor="volume" className="w-[80px] mr-2">Звук</label>
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
                          {userState._isAuth && userState.user?.role == 'admin' &&
                            <>
                              <Button variant='destructive' size='sm' onClick={()=>{
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
                            </>
                          }

                            <div className="videos overflow-y-auto max-h-[340px] w-full flex flex-col gap-3">
                            {
                              canvasState.ids.map(id=>
                                  <div>
                                    <video key={id} width="640" height="360" controls loop style={{display: 'none'}} id={id}>
                                      <source src={`/${id}.mp4`} type="video/mp4" />
                                    </video>
                                    {(userState._isAuth || userState.canPlayVideo) &&<Button
                                        className="w-full"
                                        variant={
                                      canvasState.currentVideoPlaying !== null
                                            && canvasState.currentVideoPlaying.id === id ? "premium" : "default"} size="sm" onClick={()=>{ playVideo(id) }}>{id}</Button>
                                    }
                                  </div>
                              )
                            }
                          </div>
                          <ConfirmDialog id="dlg_confirmation" icon="pi pi-exclamation-triangle"/>
                        </div>

                    </div>
                </>
            );
        }
    )
;

export default Toolbar;