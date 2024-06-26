"use client";

import React, {useEffect} from 'react';
import Canvas from "@/components/Canvas";
import AuthService from "@/lib/api/AuthService";
import userState from "@/store/userState";
import {observer} from "mobx-react-lite";
import Toolbar from "@/components/Toolbar";
import {Toaster} from "@/components/ui/toaster";

const DrawPage = observer(() => {


    useEffect(() => {
        AuthService.check()
            .then(response => {
                const user = response.data.user;
                userState.setUser({_id: user._id, username: user.username, email: user.email, role: user.role})
                userState.setIsAuth(true)
                userState.canPlayVideo = true;
            })
            .catch(() => {
                const user = userState.randomUser;
                if (localStorage.getItem("username")) {
                    // @ts-ignore
                    user.username = localStorage.getItem("username")
                }
                userState.setUser(user)
            })
            .finally(() => {
                localStorage.setItem("username", userState.user?.username ?? `Гость${(+new Date).toString(16)}`)
                userState.setLoading(false)
            })
    }, [])


    return (
        <>
            <Toaster/>
            <Toolbar/>
            <Canvas/>
        </>
    );
});


export default DrawPage;