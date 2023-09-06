"use client";

import React from 'react';
import Link from "next/link";
import {Flame, Menu} from "lucide-react";
import {Button} from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";
import NavbarAvatar from "@/components/NavbarAvatar";
import userState from "@/store/userState";
import {observer} from "mobx-react-lite";
import canvasState from "@/store/canvasState";

const Navbar = observer(() => {

    const paint_id = "fawwd123hgbsqwe"

    return (
        <div className="w-full fixed py-2 items-center px-6 flex justify-between bg-secondary border-b border-primary/10 shadow-gray-500 shadow-md">
            <div className="logo hidden md:flex">
                <Link href="/">Logo</Link>
            </div>
            <div className="menu gap-7 hidden md:flex items-center">
                <Link href={`/draw/${canvasState.canvasId}`}>
                    <Button variant="premium" className="pl-5">Начать рисовать<Flame className="ml-2 w-5 text-amber-500 fill-amber-300"/></Button>
                </Link>
                <Link href={`/gallery`}>
                    <Button variant="ghost" className="pl-5">Галлерея</Button>
                </Link>
                    <ThemeToggle />
                { !userState._isAuth ?  <>
                                <Link href="/login">Login</Link>
                                <Link href="/signup">Signup</Link>
                            </>
                         :  <NavbarAvatar />
                }
            </div>
            <Menu className="block md:hidden" />
        </div>
    );
});

export default Navbar;