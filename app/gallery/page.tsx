"use client";
import React, {useEffect, useState} from 'react';
import AuthService from "@/lib/api/AuthService";
import userState from "@/store/userState";
import UserService from "@/lib/api/UserService";
import NextImage from "next/image";
import canvasState from "@/store/canvasState";
import {useRouter} from "next/navigation";
import {observer} from "mobx-react-lite";
import Loader from "react-js-loader";
interface Image {
    src: string,
    image_name: string
}

const Page = observer(() => {
    const router = useRouter();
    const [drawings, setDrawings] = useState<Image[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
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
        UserService.getGalleryImages()
            .then(res => {
                setDrawings(res.data);
            })
            .finally(()=>setLoading(false));
    }, []);

    const redirectToDraw = (image: string) => {
        localStorage.setItem("image", image)
        router.push(`/draw/${canvasState.canvasId}`)
    }

    return (
        <div>
            <h1 className="pt-28 text-center text-3xl">Галлерея</h1>
            <p className="text-center text-amber-300 pt-2">by Mikhail Golovach</p>
            <div className="w-full pt-14 pl-10 flex flex-wrap justify-center">
                {loading && <div className="absolute top-1/2 left-1/2 translate-x-[-50%]">
                    <Loader type="bubble-scale" bgColor={"#FFFFFF"} title={"Загружаем рисунки"} color={'#FFFFFF'} size={100} />
                </div>}
                {!loading && drawings &&
                    drawings.map((image, index) => (
                        < div className="m-5 max-w-md" key={image.image_name}>
                            <div
                                className="border-2 w-[450px] h-[250px] h border-primary hover:bg-gray-400 transition duration-300 cursor-pointer"
                                onClick={() => redirectToDraw(image.image_name)}
                            >
                                <NextImage style={{height: '100%', width: '100%'}} width={320} height={200} src={image.src} alt=""/>
                            </div>
                        </div>
                    ))
                }
                {!loading && !drawings && <div className="text-center">Галлерея пуста</div>

                }

            </div>
        </div>
    );
});

export default Page;