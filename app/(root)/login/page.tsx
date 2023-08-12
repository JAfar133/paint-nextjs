"use client";

import React, {useState} from 'react';
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import AuthService from "@/lib/api/AuthService";
import userState from "@/store/userState";
import {useRouter} from "next/navigation";

const Page = () => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await AuthService.login({ email, password });
            userState.setUser(response.data.user)
            userState.setIsAuth(true)
            router.push('/')
        }catch (e: any) {
            if(e.response.data.errors){
                alert(e.response.data.errors.errors[0].msg)
            }
            else alert(e.response.data.message)
        }

    }
    return (
        <form onSubmit={handleSubmit} className="flex gap-6 flex-col xl:w-1/3 md:w-full m-auto pt-40">
            <h1 className="text-2xl">Авторизация</h1>
            <Input type="email" placeholder="email" value={email} onChange={(e)=>setEmail(e.target.value)}/>
            <Input type="password" placeholder="password" value={password} onChange={(e)=>setPassword(e.target.value)}/>
            <div className="flex justify-between items-center flex-wrap">
                <div className="flex items-center gap-3">
                    <div>Нет аккаунта?</div>
                    <Link className="p-1" href="/signup">Зарегестрироваться</Link>
                </div>
                <Button className="w-1/2">Войти</Button>
            </div>
        </form>
    );
};

export default Page;