import { createGetInitialProps } from "@mantine/next";
import Document, { Head, Html, Main, NextScript } from "next/document";

import { theme } from "src/styles/theme";

const getInitialProps = createGetInitialProps();

export default class MyDocument extends Document {
    static getInitialProps = getInitialProps;

    render() {
        return (
            <Html lang="en">
                <Head>
                    <link href="/favicons/favicon.ico" rel="icon" />
                    <link href="/favicons/favicon-32x32.png" rel="icon" sizes="32x32" type="image/png" />
                    <link href="/favicons/favicon-16x16.png" rel="icon" sizes="16x16" type="image/png" />
                    <link href="/manifest.webmanifest" rel="manifest" />
                    <meta content={theme.dark.dark[0]} media="(prefers-color-scheme: dark)" name="theme-color" />
                    {/* Comprehensive polyfills for Smart TVs (Hisense, Samsung Tizen, LG WebOS, Philips) */}
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
                                // Console polyfill for very old TVs
                                if (typeof console === 'undefined') {
                                    window.console = { log: function() {}, error: function() {}, warn: function() {} };
                                }

                                // Array.prototype.find polyfill
                                if (!Array.prototype.find) {
                                    Array.prototype.find = function(predicate) {
                                        if (this == null) throw new TypeError('Array.prototype.find called on null or undefined');
                                        for (var i = 0; i < this.length; i++) {
                                            if (predicate(this[i], i, this)) return this[i];
                                        }
                                    };
                                }

                                // Array.prototype.findIndex polyfill
                                if (!Array.prototype.findIndex) {
                                    Array.prototype.findIndex = function(predicate) {
                                        if (this == null) throw new TypeError('Array.prototype.findIndex called on null or undefined');
                                        for (var i = 0; i < this.length; i++) {
                                            if (predicate(this[i], i, this)) return i;
                                        }
                                        return -1;
                                    };
                                }

                                // Array.prototype.includes polyfill (LG WebOS 2.x compatibility)
                                if (!Array.prototype.includes) {
                                    Array.prototype.includes = function(searchElement) {
                                        return this.indexOf(searchElement) !== -1;
                                    };
                                }

                                // String.prototype.includes polyfill
                                if (!String.prototype.includes) {
                                    String.prototype.includes = function(search, start) {
                                        return this.indexOf(search, start) !== -1;
                                    };
                                }

                                // Object.assign polyfill (Samsung Tizen 2.x compatibility)
                                if (typeof Object.assign !== 'function') {
                                    Object.assign = function(target) {
                                        if (target == null) throw new TypeError('Cannot convert undefined or null to object');
                                        var to = Object(target);
                                        for (var i = 1; i < arguments.length; i++) {
                                            var source = arguments[i];
                                            if (source != null) {
                                                for (var key in source) {
                                                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                                                        to[key] = source[key];
                                                    }
                                                }
                                            }
                                        }
                                        return to;
                                    };
                                }

                                // Object.keys polyfill (very old TVs)
                                if (!Object.keys) {
                                    Object.keys = function(obj) {
                                        var keys = [];
                                        for (var k in obj) {
                                            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                                                keys.push(k);
                                            }
                                        }
                                        return keys;
                                    };
                                }

                                // Promise.finally polyfill
                                if (typeof Promise !== 'undefined' && !Promise.prototype.finally) {
                                    Promise.prototype.finally = function(callback) {
                                        var P = this.constructor;
                                        return this.then(
                                            function(value) { return P.resolve(callback()).then(function() { return value; }); },
                                            function(reason) { return P.resolve(callback()).then(function() { throw reason; }); }
                                        );
                                    };
                                }

                                // Array.from polyfill (Philips TV compatibility)
                                if (!Array.from) {
                                    Array.from = function(arrayLike) {
                                        var items = Object(arrayLike);
                                        var len = Math.max(0, items.length);
                                        var arr = new Array(len);
                                        for (var i = 0; i < len; i++) {
                                            arr[i] = items[i];
                                        }
                                        return arr;
                                    };
                                }

                                // Number.isNaN polyfill
                                if (!Number.isNaN) {
                                    Number.isNaN = function(value) {
                                        return typeof value === 'number' && isNaN(value);
                                    };
                                }

                                // requestAnimationFrame polyfill for smooth animations
                                (function() {
                                    var lastTime = 0;
                                    var vendors = ['webkit', 'moz'];
                                    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
                                        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
                                        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
                                                                      window[vendors[x] + 'CancelRequestAnimationFrame'];
                                    }
                                    if (!window.requestAnimationFrame) {
                                        window.requestAnimationFrame = function(callback) {
                                            var currTime = new Date().getTime();
                                            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                                            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
                                            lastTime = currTime + timeToCall;
                                            return id;
                                        };
                                    }
                                    if (!window.cancelAnimationFrame) {
                                        window.cancelAnimationFrame = function(id) { clearTimeout(id); };
                                    }
                                })();

                                // CustomEvent polyfill (Samsung Tizen compatibility)
                                (function() {
                                    if (typeof window.CustomEvent === 'function') return;
                                    function CustomEvent(event, params) {
                                        params = params || { bubbles: false, cancelable: false, detail: null };
                                        var evt = document.createEvent('CustomEvent');
                                        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
                                        return evt;
                                    }
                                    CustomEvent.prototype = window.Event.prototype;
                                    window.CustomEvent = CustomEvent;
                                })();
                            `,
                        }}
                    />
                    <style
                        dangerouslySetInnerHTML={{
                            __html: `
                                /* Smart TV CSS optimizations */
                                * {
                                    /* Hardware acceleration for Samsung Tizen and LG WebOS */
                                    -webkit-backface-visibility: hidden;
                                    -moz-backface-visibility: hidden;
                                    backface-visibility: hidden;

                                    /* Force GPU acceleration for smoother rendering */
                                    -webkit-transform: translateZ(0);
                                    -moz-transform: translateZ(0);
                                    transform: translateZ(0);
                                }

                                html {
                                    /* Fallback for older browsers */
                                    font-size: 16px;

                                    /* Dynamic font scaling based on viewport width */
                                    /* Base: 16px at 1920px (120em) */
                                    /* Scales from 12px (mobile) to 18px (8K) */
                                    font-size: clamp(12px, 0.625vw, 18px);

                                    /* Smooth scrolling for TVs with remote controls */
                                    -webkit-overflow-scrolling: touch;
                                    scroll-behavior: smooth;
                                }

                                body {
                                    /* Optimize rendering for TV displays */
                                    -webkit-font-smoothing: antialiased;
                                    -moz-osx-font-smoothing: grayscale;
                                    text-rendering: optimizeLegibility;
                                }

                                /* Image rendering optimization for TVs */
                                img {
                                    /* Better image quality on TVs */
                                    image-rendering: -webkit-optimize-contrast;
                                    image-rendering: crisp-edges;

                                    /* Prevent layout shift */
                                    max-width: 100%;
                                    height: auto;
                                }

                                /* Transition optimizations for older TVs */
                                * {
                                    /* Use only GPU-friendly properties in transitions */
                                    -webkit-transition-property: opacity, transform;
                                    -moz-transition-property: opacity, transform;
                                    transition-property: opacity, transform;
                                }

                                /* Flexbox fallbacks for older Samsung/LG TVs */
                                .flex {
                                    display: -webkit-box;
                                    display: -moz-box;
                                    display: -ms-flexbox;
                                    display: -webkit-flex;
                                    display: flex;
                                }

                                /* Grid fallbacks for very old TVs */
                                @supports not (display: grid) {
                                    .grid {
                                        display: block;
                                    }
                                }

                                /* Prevent text selection on TVs (better UX with remote) */
                                @media (min-width: 1440px) {
                                    * {
                                        -webkit-user-select: none;
                                        -moz-user-select: none;
                                        -ms-user-select: none;
                                        user-select: none;
                                    }

                                    /* Allow selection for input fields */
                                    input, textarea {
                                        -webkit-user-select: text;
                                        -moz-user-select: text;
                                        -ms-user-select: text;
                                        user-select: text;
                                    }
                                }

                                @media (max-width: 768px) {
                                    /* Mobile: fixed 16px */
                                    html {
                                        font-size: 16px;
                                    }
                                }

                                /* Reduce memory usage on older TVs */
                                @media (min-width: 1440px) {
                                    * {
                                        /* Disable blur effects on TVs (heavy on GPU) */
                                        backdrop-filter: none !important;
                                        -webkit-backdrop-filter: none !important;
                                    }
                                }
                            `,
                        }}
                    />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
