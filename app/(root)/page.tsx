"use client";

import React, {useEffect, useState} from 'react';
import {Button} from "@/components/ui/button";
import {ButtonVariant} from "@/lib/utils";
import Link from "next/link";
import AuthService from "@/lib/api/AuthService";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";

const RootPage = () => {

    const [variant, setVariant] = useState<ButtonVariant>("premium");

    useEffect(()=>{
        AuthService.check()
            .then(response=>{
                const user = response.data.user;
                userState.setUser({_id: user._id, username: user.username, email: user.email})
                userState.setIsAuth(true)
            })
    },[])
    const handleMouseEnter = () =>{
        setVariant("golden")
    }

    const handleMouseLeave = () =>{
        setVariant("premium")
    }

    return (
        <div className="h-full p-4 space-y-2 pt-20 flex justify-center">
            <div className="justify-between flex w-2/3 h-full items-center gap-17">
                <div className="w-full">
                    <h1 className="text-8xl">Создай свой уникальный рисунок</h1>
                    <Link href={`/draw/${canvasState.canvasId}`}>
                        <Button
                            variant={variant}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            style={{ width: 200 }}
                            className="h-14 text-xl mt-14 text-white border-0"
                        >
                            Начать
                        </Button>
                    </Link>
                </div>
                <div className="w-full">
                    <img style={{borderRadius: 40}} src="https://images.unsplash.com/photo-1525909002-1b05e0c869d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGFpbnR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60" alt=""/>
                </div>
            </div>
        </div>
    );
};

export default RootPage;