"use client";

import React, {useEffect, useState} from 'react';
import {Button} from "@/components/ui/button";
import {ButtonVariant} from "@/lib/utils";
import Link from "next/link";
import AuthService from "@/lib/api/AuthService";
import userState from "@/store/userState";
import canvasState from "@/store/canvasState";
import MapLazy from "@/components/Map/MapLazy/MapLazy";

const RootPage = () => {

    const [variant, setVariant] = useState<ButtonVariant>("premium");

    useEffect(()=>{
        AuthService.check()
            .then(response=>{
                const user = response.data.user;
                userState.setUser({_id: user._id, username: user.username, email: user.email, role: user.role});
                userState.setIsAuth(true);
                userState.canPlayVideo = true;
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
            <div className="md:flex-nowrap flex-wrap flex w-2/3 h-full items-center gap-4">
                <div className="w-full">
                    <h1 className="md:text-4xl text-4xl">А я все думал когда же ты появишься</h1>
                    <Link href={`/draw/${canvasState.canvasId}`}>
                        <Button
                            variant={variant}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            style={{ width: 200 }}
                            className="h-14 text-xl mt-14 text-white border-0"
                        >
                            Не нажимай!
                        </Button>
                    </Link>
                </div>
                <div className="w-full">
                    <img style={{borderRadius: 40}} src="/gosling.webp" alt=""/>
                </div>
            </div>
        </div>
    );
};

export default RootPage;