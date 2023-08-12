"use client";

import React, {useEffect, useState} from 'react';
import {useTheme} from "next-themes";
import {Moon, Sun} from "lucide-react";

const ThemeToggle = () => {
    const [isLight,setIsLight] = useState(false);
    const { setTheme, resolvedTheme } = useTheme()

    const handleToggle = () => {
        setTheme(isLight ? "dark" : "light")
        setIsLight(!isLight)
    }

    useEffect(() => {
        setIsLight(resolvedTheme == "light");
    }, [resolvedTheme]);

    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox"
                   checked={isLight}
                   onChange={handleToggle}
                   className="sr-only peer"/>
            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                { isLight ? <Sun className="text-yellow-600"/> : <Moon/>}
            </span>
        </label>
    );
};

export default ThemeToggle;