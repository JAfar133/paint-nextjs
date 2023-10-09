import '../../globals.scss'
import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import Navbar from "@/components/Navbar";
import React from "react";
import {ThemeProvider} from "@/components/theme-provider";
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import {cn} from "@/lib/utils";

const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
    title: 'Draw',
    description: 'Draw with tour friends',
    viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
}

export default function DrawLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className={cn("bg-secondary overflow-hidden", inter.className)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
        </ThemeProvider>
        </body>
        </html>
    )
}
