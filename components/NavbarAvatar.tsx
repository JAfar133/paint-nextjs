"use client";
import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Avatar, AvatarImage} from "@/components/ui/avatar";
import userState from "@/store/userState";
import {useRouter} from "next/navigation";
import {observer} from "mobx-react-lite";
import canvasState from "@/store/canvasState";


const NavbarAvatar = observer(() => {
    const router = useRouter();
    const newDraw = () =>{
        canvasState.setCanvasId(`f${(+new Date).toString(16)}`)
        router.push(`/draw/${canvasState.canvasId}`)
    }
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                    <AvatarImage src="https://github.com/shadcn.png"/>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>{userState.user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                {userState._isAuth
                    ? <>
                        <DropdownMenuGroup>
                            <DropdownMenuItem className="cursor-pointer">
                                Профиль
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={()=>newDraw()}>
                                Новый рисунок
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={()=>router.push('/user/drawing')}>
                                Мои работы
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                Настройки
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem className="cursor-pointer" onClick={()=>userState.logout()}>
                            Выйти
                        </DropdownMenuItem>
                    </>
                    : <DropdownMenuGroup>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => {
                            localStorage.setItem("current_draw_url", window.location.pathname)
                            router.push('/login')
                        }}>
                            Войти
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => {
                            localStorage.setItem("current_draw_url", window.location.pathname)
                            router.push('/signup')
                        }}>
                            Зарегестрироваться
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                }
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

export default NavbarAvatar;