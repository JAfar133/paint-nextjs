"use client";
import React, {useEffect, useState} from 'react';
import AuthService from "@/lib/api/AuthService";
import userState from "@/store/userState";
import UserService from "@/lib/api/UserService";
import {useRouter} from "next/navigation";
import NextImage from "next/image"
import Loader from "react-js-loader";
interface Image {
    url: string,
    src: string,
}

const DrawList = () => {
        const [drawings, setDrawings] = useState<string[]>();
        const [images, setImages] = useState<Image[]>();
        const router = useRouter();
        const [loading, setLoading] = useState<boolean>(true);

        useEffect(() => {
            AuthService.check()
                .then(response => {
                    const user = response.data.user;
                    userState.setUser({_id: user._id, username: user.username, email: user.email, role: user.role});
                    userState.setIsAuth(true);
                    UserService.getImages()
                        .then(res => {
                            setDrawings(res.data);
                        }).finally(()=>setLoading(false));
                })
                .finally(() => userState.setLoading(false));
        }, []);

        useEffect(() => {
            if (drawings) {
                getImages();
            }
        }, [drawings]);

        const getImages = async () => {
            if (drawings) {
                const imagesPromises = drawings.map(async (draw) => {
                    try {
                        const res = await UserService.getImage(draw);
                        return {url: draw, src: res.data};
                    } catch (error) {
                        console.error(`An error occurred while fetching image for ${draw}:`, error);
                        return {url: draw, src: null};
                    }
                });

                const imagesData = await Promise.all(imagesPromises);
                const filteredImagesData = imagesData.filter((image) => image.src !== null);
                setImages(filteredImagesData);
            }
        };


        const redirectToDraw = (url: string) => {
            router.push(`/draw/${url}`)
        }

        return <div className="w-full pt-20 pl-10 flex flex-wrap justify-center">
            {loading && <div className="absolute top-1/2 left-1/2 translate-x-[-50%]">
              <Loader type="bubble-scale" bgColor={"#FFFFFF"} title={"Загружаем ваши работы"} color={'#FFFFFF'} size={100} />
            </div>}
            {!loading && images &&
                images.map((image, index) => (
                    < div className="m-5 max-w-md" key={image.url}>
                        <span>№: {index} url:{image.url}</span>
                        <div className="border-2 border-primary hover:bg-gray-400 transition duration-300 cursor-pointer"
                             onClick={() => redirectToDraw(image.url)}>
                            <NextImage width={500} height={400} src={image.src} alt=""/>
                        </div>
                    </div>
                ))
            }
            {!loading && !images &&
                <div className="text-center">У вас пока нет работ</div>
            }
        </div>;
    }
;

export default DrawList;
