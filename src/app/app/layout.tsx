"use client";

import { MobileNav } from "@/components/ui/mobile-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <MobileNav />
        </>
    );
}
