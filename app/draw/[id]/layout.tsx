import '../../globals.scss'
import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import Navbar from "@/components/Navbar";
import React from "react";
import {ThemeProvider} from "@/components/theme-provider";

import {cn} from "@/lib/utils";
import Toolbar from "@/components/Toolbar";

const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
  title: 'Draw',
  description: 'Твори, рисуй, удивляй',
}

export default function DrawLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
      <html lang="en">
      <body className={cn("bg-secondary", inter.className)}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
      </ThemeProvider>
      </body>
      </html>
  )
}
