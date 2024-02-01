"use client";

import React from 'react';
import Link from "next/link";
import {Flame, Menu as MenuIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";
import NavbarAvatar from "@/components/NavbarAvatar";
import userState from "@/store/userState";
import {observer} from "mobx-react-lite";
import canvasState from "@/store/canvasState";
import {Menu, Popover, Position} from "evergreen-ui";

const Navbar = observer(() => {

    return (
        <div className="w-full fixed py-2 items-center px-6 flex justify-between bg-secondary border-b border-primary/10 shadow-gray-500 shadow-md">
            <div className="logo hidden md:flex">
                <Link href="/">Logo</Link>
            </div>
            <div className="menu gap-7 hidden md:flex items-center">
                <Link href={`/draw/${canvasState.canvasId}`}>
                    <Button variant="premium" className="pl-5">Начать рисовать<Flame className="ml-2 w-5 text-amber-500 fill-amber-300"/></Button>
                </Link>
                <Link href={`/gallery`}>
                    <Button variant="ghost" className="pl-5">Галлерея</Button>
                </Link>
                    <ThemeToggle />
                { !userState._isAuth ?  <>
                                <Link href="/login">Login</Link>
                                <Link href="/signup">Signup</Link>
                            </>
                         :  <NavbarAvatar />
                }
            </div>

            <Popover
              position={Position.BOTTOM_LEFT}
              content={
                <Menu>
                  <Menu.Group>
                    <Menu.Item>
                      <Link href={`/draw/${canvasState.canvasId}`}>
                        <div className="flex">Начать рисовать<Flame className="ml-2 w-5 text-amber-500 fill-amber-300"/></div>
                      </Link>
                    </Menu.Item>
                    <Menu.Item>
                      <Link href={`/gallery`}>
                        Галлерея
                      </Link>
                    </Menu.Item>
                  </Menu.Group>
                  <Menu.Divider />
                  <Menu.Group>
                    { !userState._isAuth ?
                        <>
                          <Menu.Item intent="danger"><Link href="/login">Login</Link></Menu.Item>
                          <Menu.Item intent="danger"><Link href="/signup">Signup</Link></Menu.Item>
                        </>
                        :  <NavbarAvatar />
                    }
                  </Menu.Group>
                </Menu>
              }
            >
              <MenuIcon className="block md:hidden" />
            </Popover>
          <ThemeToggle className="md:hidden"/>
        </div>
    );
});

export default Navbar;