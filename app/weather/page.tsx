"use client";
import React, {useEffect} from 'react';
import AuthService from "@/lib/api/AuthService";
import userState from "@/store/userState";
import {observer} from "mobx-react-lite";
import MapLazy from "@/components/Map/MapLazy/MapLazy";
import 'leaflet/dist/leaflet.css'

const Page = observer(() => {
    useEffect(() => {
        AuthService.check()
            .then(response => {
                const user = response.data.user;
                userState.setUser({_id: user._id, username: user.username, email: user.email, role: user.role});
                userState.setIsAuth(true);

            })
            .finally(() => {
                userState.setLoading(false);
            });
    }, []);

    return (
        <MapLazy/>
    );
});

export default Page;