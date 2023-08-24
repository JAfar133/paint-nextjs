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
                userState.setUser({_id: 142124,username: `Гость${(+new Date).toString(16)}`, email: `Гость${(+new Date).toString(16)}`})
            })
            .finally(() => userState.setLoading(false))
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