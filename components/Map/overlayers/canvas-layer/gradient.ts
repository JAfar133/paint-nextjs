
export interface GradientData {
    value: number;
    data: number[]
}
export interface Gradient {
    [key: string]: GradientData[];
}
export const gradient: Gradient = {
    apcp: [
        {value: 0, data: [111, 111, 111, 100]},
        {value: 0.6, data: [96,186,255]},
        {value: 1.5, data: [56,154,255]},
        {value: 3, data: [66,128,175]},
        {value: 6, data: [16,78,125]},
        {value: 8, data: [13,68,110]},
        {value: 10, data: [59,69,161]},
        {value: 15, data: [25,38,161]},
        {value: 20, data: [25,38,92]},
        {value: 25, data: [193,161,200]},
        {value: 35, data: [255,161,200]},
    ],
    wind: [
        {value: 0, data: [39,87,159]},
        {value: 1, data: [29,81,159]},
        {value: 3, data: [44,141,148]},
        {value: 5, data: [44,141,114]},
        {value: 7, data: [86,153,48]},
        {value: 11, data: [167,153,48]},
        {value: 13, data: [159,120,35]},
        {value: 16, data: [159,24,35]},
        {value: 19, data: [175,57,126]},
        {value: 24, data: [160,44,165]},
        {value: 36, data: [115,44,165]},
        {value: 46, data: [125,0,165]},
    ],
    tmp: [
        {value: 233, data: [213,172,217]},
        {value: 248, data: [172,172,217]},
        {value: 258, data: [125,148,217]},
        {value: 265, data: [83,136,217]},
        {value: 269, data: [59,188,231]},
        {value: 273, data: [157,219,249]},
        {value: 275, data: [157,205,187]},
        {value: 279, data: [157,205,113]},
        {value: 283, data: [74,147,89]},
        {value: 289, data: [116,147,24]},
        {value: 294, data: [243, 183, 4]},
        {value: 299, data: [243,169,4]},
        {value: 303, data: [208,219,25]},
        {value: 313, data: [243,109,4]},
        {value: 320, data: [208,50,25]},
    ],
    pres: [
        {value: 900, data: [89,18,147]},
        {value: 950, data: [112,70,147]},
        {value: 990, data: [42,70,147]},
        {value: 1000, data: [180,154,211]},
        {value: 1010, data: [219,183,172]},
        {value: 1015, data: [219,148,172]},
        {value: 1025, data: [219,113,71]},
        {value: 1035, data: [154,53,71]},
        {value: 1045, data: [151,12,5]},
        {value: 1080, data: [48, 8, 24]}
    ],
    rh: [
        {value: 0, data: [173,175,56]},
        {value: 30, data: [173,85,81]},
        {value: 50, data: [128,173,56]},
        {value: 70, data: [36,173,130]},
        {value: 80, data: [36,173,199]},
        {value: 87, data: [36,125,199]},
        {value: 90, data: [36,120,199]},
        {value: 100, data: [91,147,199]}
    ]
}

export const units: {[key: string]: string} = {
    wind: 'м/с',
    apcp: 'мм',
    tmp: '°C',
    pres: 'гПа',
    rh: '%',
}