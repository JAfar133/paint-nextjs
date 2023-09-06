import React from 'react';
import {cn} from "@/lib/utils";

interface CustomSelectProps<T extends number | string> {
    value: T;
    options: T[];
    onChange: (value: T) => void;
    classname: string;
    id: string;
}

const CustomSelect = <T extends number | string>({value, options, onChange, classname, id}: CustomSelectProps<T>) =>
    <select
        className={cn("bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-accent dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500",classname)}
        id={id}
        value={value}
        onChange={event => onChange(event.target.value as T)}
    >
        {
            options.map((b) =>
                <option value={b} key={b}>{b}</option>
            )
        }

    </select>;

export default CustomSelect;