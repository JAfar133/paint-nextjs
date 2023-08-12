import {BASE_SOCKET_URL} from "@/lib/config";
import canvasState from "@/store/canvasState";
import userState from "@/store/userState";
import {toast} from "@/components/ui/use-toast";
import {Params} from "next/dist/shared/lib/router/utils/route-matcher";
import settingState from "@/store/settingState";
import {figureDraw} from "@/lib/utils";

export const websocketWorker = (params: Params, setConnectionCount: React.Dispatch<React.SetStateAction<number>>) => {
    const socket = new WebSocket(BASE_SOCKET_URL)
    canvasState.setSocket(socket)
    canvasState.setCanvasId(params.id)

    if (!userState.loading) {
        socket.onopen = () => {
            socket.send(JSON.stringify({
                id: params.id,
                email: userState.user?.username || `Гость${(+new Date).toString(16)}`,
                method: "connection"
            }))
        }
    }
    socket.onmessage = (event) => {
        let msg = JSON.parse(event.data)
        if (msg.username != userState.user?.username) {
            switch (msg.method) {
                case "connection":
                    setConnectionCount(msg.count)
                    toast({
                        description: `Пользователь ${msg.email} присоеденился`
                    })
                    break;
                case "draw":
                    drawHandler(msg)
                    break;
                case "clear":
                    canvasState.clear()
                    break;
                case "draw_url":
                    canvasState.drawByDataUrl(msg.dataUrl)
                    break;
            }
        }
    }
}

const drawHandler = (msg: any) => {
    if (canvasState.canvas) {
        const figure = msg.figure;
        const ctx = canvasState.canvas.getContext('2d')
        if (ctx !== null) {
            figureDraw(ctx, figure)
            settingState.fillCtx()
        }
    }
}
