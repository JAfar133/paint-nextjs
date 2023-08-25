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
                userState.setUser({_id: user._id, username: user.username, email: user.email})
                userState.setIsAuth(true)
            })
            .catch(() => {
                const user = {
                    _id: (+new Date()),
                    username: `Гость${(+new Date).toString(16)}`,
                    email: `email${(+new Date).toString(16)}`
                }
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
        document.addEventListener("keydown", (event) => {
            if (event.key === " ") {
                event.preventDefault();
            }
        });
    }, [])


    return (
        <div className="">
            <Toolbar/>
            <Canvas/>
            <Toaster/>
        </div>
    );
});


export default DrawPage;