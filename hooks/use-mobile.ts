import * as React from "react";

// Tailwind breakpoint: sm = 640px
const MOBILE_BREAKPOINT = 640;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: 640px) and (max-width: 1023px)`);
    const onChange = () => {
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    mql.addEventListener("change", onChange);
    setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isTablet;
}
