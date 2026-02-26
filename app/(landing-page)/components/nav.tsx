"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface NavProps {
    transparent?: boolean;
    activeLink?: "produto" | "opensource" | "precos" | "docs" | "manifesto";
}

export function Nav({ transparent = false, activeLink }: NavProps) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        if (!transparent) return;

        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [transparent]);

    const navClasses = transparent
        ? `fixed top-0 w-full z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
              scrolled
                  ? "bg-background/80 backdrop-blur-md border-b border-border/80"
                  : "bg-transparent border-b border-transparent"
          }`
        : "sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md";

    const getLinkClasses = (link: NavProps["activeLink"]) => {
        const baseClasses = "hover:text-primary transition-colors";
        if (activeLink === link) {
            return "text-primary font-semibold transition-colors";
        }
        return baseClasses;
    };

    return (
        <nav className={navClasses}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center gap-8">
                        <Link className="flex items-center gap-2 group" href="/">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold font-display text-xl">
                                A
                            </div>
                            <span className="font-display font-bold text-lg tracking-tight text-foreground">
                                Aluminify
                            </span>
                        </Link>
                        <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
                            <Link
                                className={getLinkClasses("produto")}
                                href="/features"
                            >
                                Produto
                            </Link>
                            <Link
                                className={getLinkClasses("opensource")}
                                href="/opensource"
                            >
                                Open Source
                            </Link>
                            <Link
                                className={getLinkClasses("precos")}
                                href="/pricing"
                            >
                                Preços
                            </Link>
                            <Link
                                className={getLinkClasses("docs")}
                                href="/docs"
                            >
                                Docs
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-muted/70 sm:px-0 sm:py-0 sm:rounded-none"
                            href="/auth/login"
                        >
                            Login
                        </Link>
                        <Link
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            href="/auth/sign-up"
                        >
                            Criar Conta
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
