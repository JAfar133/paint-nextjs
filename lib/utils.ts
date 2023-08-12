import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import {Circle, Eraser, Pencil, Spline, Star, Triangle, TriangleRight, Type} from "lucide-react";
import {MdOutlineRectangle, MdOutlineTimeline} from "react-icons/md";
import PencilTool from "@/lib/tools/pencilTool";
import SquareTool from "@/lib/tools/shapes/squareTool";
import CircleTool from "@/lib/tools/shapes/circleTool";
import StraightTriangleTool from "@/lib/tools/shapes/triangles/straightTriangleTool";
import RightTriangleTool from "@/lib/tools/shapes/triangles/rightTriangleTool";
import LineTool from "@/lib/tools/shapes/lineTool";
import EraserTool from "@/lib/tools/eraserTool";
import TextTool from "@/lib/tools/textTool";
import ArcTool from "@/lib/tools/shapes/arcTool";
import Tool from "@/lib/tools/tool";
import {BsArrowUpRight} from "react-icons/bs";
import ArrowTool from "@/lib/tools/shapes/arrowTool";
import {FiveStarTool} from "@/lib/tools/shapes/stars/fiveStarTool";
import {GiCardRandom} from "react-icons/gi";
import {ShitTool} from "@/lib/tools/shapes/shitTool";
import {PiStarFour} from "react-icons/pi";
import {FourStarTool} from "@/lib/tools/shapes/stars/fourStarTool";
import {TbJewishStar} from "react-icons/tb";
import {SixStarTool} from "@/lib/tools/shapes/stars/SixStarTool";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ButtonVariant = "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | "premium" | "golden";

export const canvasSize = {height: 800, width: 1200}

export interface ClientTool {
  icon: any;
  name: string;
  description: string;
  fillColor: boolean;
  strokeColor: boolean;
  strokeWidth: boolean;
}
export const tools: ClientTool[] = [
  {
    icon: Pencil,
    name: "pencil",
    description: "Карандаш",
    fillColor: false,
    strokeColor: true,
    strokeWidth: true,
  },
  {
    icon: Circle,
    name: "circle",
    description: "Круг",
    fillColor: true,
    strokeColor: true,
    strokeWidth: true,
  },
  {
    icon: MdOutlineRectangle,
    name: "square",
    description: "Прямоугольник",
    fillColor: true,
    strokeColor: true,
    strokeWidth: true,
  },
  {
    icon: TriangleRight,
    name: "straight-triangle",
    description: "Треугольник1",
    fillColor: true,
    strokeColor: true,
    strokeWidth: true,
  },
  {
    icon: Triangle,
    name: "right-triangle",
    description: "Треугольник2",
    fillColor: true,
    strokeColor: true,
    strokeWidth: true,
  },
  {
    icon: PiStarFour,
    name: "four_star",
    description: "Звезда 4",
    fillColor: true,
    strokeColor: true,
    strokeWidth: true,
  },
  {
    icon: Star,
    name: "five_star",
    description: "Звезда 5",
    fillColor: true,
    strokeColor: true,
    strokeWidth: true,
  },
  {
    icon: TbJewishStar,
    name: "six_star",
    description: "Звезда 6",
    fillColor: true,
    strokeColor: true,
    strokeWidth: true,
  },
  {
    icon: GiCardRandom,
    name: "shit",
    description: "??",
    fillColor: true,
    strokeColor: true,
    strokeWidth: true,
  },
  {
    icon: MdOutlineTimeline,
    name: "line",
    description: "Прямая",
    fillColor: false,
    strokeColor: true,
    strokeWidth: true,
  },
  {
    icon: BsArrowUpRight,
    name: "arrow",
    description: "Стрелка",
    fillColor: false,
    strokeColor: true,
    strokeWidth: true,
  },
  {
    icon: Spline,
    name: "arc",
    description: "Дуга",
    fillColor: false,
    strokeColor: true,
    strokeWidth: true,
  },
  {
    icon: Type,
    name: "text",
    description: "Текст",
    fillColor: true,
    strokeColor: false,
    strokeWidth: false,
  },
  {
    icon: Eraser,
    name: "eraser",
    description: "Ластик",
    fillColor: false,
    strokeColor: false,
    strokeWidth: true,
  },
]

export const toolClasses: { [key: string]: new (canvas: HTMLCanvasElement, socket: WebSocket, id: string | string[], type: string) => Tool } = {
  "pencil": PencilTool,
  "square": SquareTool,
  "circle": CircleTool,
  "straight-triangle": StraightTriangleTool,
  "right-triangle": RightTriangleTool,
  "line": LineTool,
  "eraser": EraserTool,
  "text": TextTool,
  "arc": ArcTool,
  "arrow": ArrowTool,
  "four_star": FourStarTool,
  "five_star": FiveStarTool,
  "six_star": SixStarTool,
  "shit": ShitTool,
};

export const figureDraw = (
    ctx: CanvasRenderingContext2D,
    figure: any
) => {
  const draw: { [key: string]: (ctx: CanvasRenderingContext2D, figure: any) => void } = {
    "pencil": (ctx, figure) => PencilTool.draw(ctx, figure.x, figure.y, figure.strokeStyle, figure.strokeWidth),
    "square": (ctx, figure) => SquareTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
    "eraser": (ctx, figure) => EraserTool.draw(ctx, figure.x, figure.y, figure.strokeStyle, figure.strokeWidth),
    "line": (ctx, figure) => LineTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.strokeStyle, figure.strokeWidth),
    "circle": (ctx, figure) => CircleTool.draw(ctx, figure.x, figure.y, figure.r, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
    "right-triangle": (ctx, figure) => RightTriangleTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
    "straight-triangle": (ctx, figure) => StraightTriangleTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
    "text": (ctx, figure) => TextTool.draw(ctx, figure.text, figure.startX, figure.startY, figure.fillStyle, figure.font),
    "arc": (ctx, figure) => ArcTool.draw(ctx, figure.startPoint, figure.endPoint, figure.controlPoint, figure.strokeStyle, figure.strokeWidth),
    "arrow": (ctx, figure) => ArrowTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.strokeStyle, figure.strokeWidth),
    "shit": (ctx, figure) => ShitTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
    "five_star": (ctx, figure) => FiveStarTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
    "four_star": (ctx, figure) => FourStarTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
    "six_star": (ctx, figure) => SixStarTool.draw(ctx, figure.x, figure.y, figure.w, figure.h, figure.fillStyle, figure.strokeStyle, figure.strokeWidth),
    "finish": (ctx, figure) => ctx.beginPath(),
  };

  return draw[figure.type](ctx, figure);
}

export const fonts: string[] = [
    'Arial',
    'Georgia',
    'sans-serif',
    'Comic Sans MS',
    'Verdana',
    'Times New Roman',
    'Courier New'
]

export const fontWeights: string[] = [
  'normal',
  'bold',
  '500',
  '600',
  '700',
  '800',
  '900'
]
