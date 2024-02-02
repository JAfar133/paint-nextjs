
export interface GradientData {
    value: number;
    data: number[]
}
export interface Gradient {
    [key: string]: GradientData[];
}
export const gradient: Gradient = {
    apcp: [
        {value: 0, data: [111, 111, 111]},
        {value: 0.6, data: [60, 116, 160]},
        {value: 1.5, data: [56,154,255]},
        {value: 6, data: [59, 161, 161]},
        {value: 8, data: [59, 161, 61]},
        {value: 10, data: [130, 161, 59]},
        {value: 15, data: [161, 161, 59]},
        {value: 20, data: [161, 59, 59]},
        {value: 25, data: [161, 59, 161]},
        {value: 35, data: [168, 168, 168]},
    ],
    wind: [
        {value: 0, data: [39,87,159]},
        {value: 1, data: [29,81,159]},
        {value: 3, data: [47,143,169]},
        {value: 5, data: [44,141,114]},
        {value: 7, data: [60,165,60]},
        {value: 9, data: [26,159,26]},
        {value: 11, data: [167,153,48]},
        {value: 13, data: [159,120,35]},
        {value: 15, data: [161,89,68]},
        {value: 17, data: [129,40,66]},
        {value: 19, data: [175,57,126]},
        {value: 21, data: [106,48,147]},
        {value: 24, data: [81,63,163]},
        {value: 27, data: [77,109,141]},
        {value: 29, data: [106,146,152]},
        {value: 36, data: [115,44,165]},
        {value: 46, data: [125,0,165]},
    ],
    tmp: [
        {value: 203, data: [115, 70, 105]},
        {value: 218, data: [202, 172, 195]},
        {value: 233, data: [162, 70, 145]},
        {value: 248, data: [143, 89, 169]},
        {value: 258, data: [157, 219, 217]},
        {value: 265, data: [106, 191, 181]},
        {value: 269, data: [100, 166, 189]},
        {value: 273, data: [93, 133, 198]},
        {value: 274, data: [68, 125, 99]},
        {value: 283, data: [128, 147, 24]},
        {value: 294, data: [243, 183, 4]},
        {value: 303, data: [232, 83, 25]},
        {value: 320, data: [125, 45, 13]},
    ],
    pres: [
        {value: 900, data: [8, 16, 48]},
        {value: 950, data: [0, 32, 96]},
        {value: 995, data: [0, 117, 146]},
        {value: 1000, data: [26, 140, 147]},
        {value: 1005, data: [103, 162, 155]},
        {value: 1010, data: [182, 182, 182]},
        {value: 1015, data: [176, 174, 152]},
        {value: 1024, data: [163, 116, 67]},
        {value: 1030, data: [159, 81, 44]},
        {value: 1038, data: [142, 47, 57]},
        {value: 1046, data: [111, 24, 64]},
        {value: 1080, data: [48, 8, 24]}
    ],
    rh: [
        {value: 0, data: [173, 85, 56]},
        {value: 30, data: [173, 110, 56]},
        {value: 40, data: [173, 146, 56]},
        {value: 50, data: [105, 173, 56]},
        {value: 60, data: [56, 173, 121]},
        {value: 70, data: [56, 174, 173]},
        {value: 75, data: [56, 160, 173]},
        {value: 80, data: [56, 157, 173]},
        {value: 83, data: [56, 148, 173]},
        {value: 87, data: [56, 135, 173]},
        {value: 90, data: [56, 132, 173]},
        {value: 93, data: [56, 123, 173]},
        {value: 97, data: [56, 98, 157]},
        {value: 100, data: [56, 70, 114]}
    ]
}

export const units: {[key: string]: string} = {
    wind: 'м/с',
    apcp: 'мм',
    tmp: '°C',
    pres: 'гПа',
    rh: '%',
}