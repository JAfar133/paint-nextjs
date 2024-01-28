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
            <MapLazy/>
        </div>
    );
};

export default RootPage;