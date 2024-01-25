import '../globals.scss'
import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import Navbar from "@/components/Navbar";
import React from "react";
import {ThemeProvider} from "@/components/theme-provider";

import {cn} from "@/lib/utils";

const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
  title: 'Auth',
  description: 'Твори, рисуй, удивляй',
}

export default function AuthLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
      <html lang="en">
      <body className={cn("bg-secondary", inter.className)}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <Navbar/>
        {children}
      </ThemeProvider>
      </body>
      </html>
  )
}
