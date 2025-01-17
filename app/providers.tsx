'use client'

import {HeroUIProvider} from "@heroui/system"
import React from "react";

export function Providers({children}: { children: React.ReactNode }) {
    return (
        <HeroUIProvider>
            {children}
        </HeroUIProvider>
    )
}