"use client";

import React, {useEffect} from 'react';
import Canvas from "@/components/Canvas";
import {canvasSize} from "@/lib/utils";
import AuthService from "@/lib/api/AuthService";
import userState from "@/store/userState";
import {observer} from "mobx-react-lite";
import canvasState from "@/store/canvasState";
import Toolbar from "@/components/Toolbar";

const DrawPage = observer(() => {

    useEffect(() => {
        AuthService.check()
            .then(response => {
                const user = response.data.user;
                userState.setUser({_id: user._id, username: user.username, email: user.email})
                userState.setIsAuth(true)
            })
            .catch(err => {
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
            <div style={{width: canvasSize.width, height: canvasSize.height}} className="canvas bg-white mx-auto mt-28">
                <Canvas/>
            </div>
        </div>
    );
});


export default DrawPage;