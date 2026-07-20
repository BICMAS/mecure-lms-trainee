

export function isIOS() {
    // Guard against SSR environments
    if (typeof window === "undefined" || typeof window.navigator === "undefined") {
        return false;
    }
    
    const ua = window.navigator.userAgent;
    const isIOSUA = /iphone|ipad|ipod/i.test(ua);
    
    // Handle iPadOS 13+ which spoofs macOS
    const isIPadOS13Plus = window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
    
    return isIOSUA || isIPadOS13Plus;
}

export function isStandalone() {
    // Guard against SSR environments
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return false;
    }
    
    try {
        return (
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any)?.standalone === true
        );
    } catch (error) {
        return false;
    }
}