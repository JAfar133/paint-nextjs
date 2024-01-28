import React from 'react';
import dynamic from "next/dynamic";
type Props = {}

function MapLazy() {
    const Map =  dynamic(
        () => {
            return  import('../Map')
        },
        {
            ssr: false // This line is important. It's what prevents server-side render
        }
    )
    return (
            <Map />
    )
}

export default React.memo<Props>(MapLazy);
