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
                    <style
                        dangerouslySetInnerHTML={{
                            __html: `
                                html {
                                    /* Dynamic font scaling based on viewport width */
                                    /* Base: 16px at 1920px (120em) */
                                    /* Scales from 12px (mobile) to 18px (8K) */
                                    font-size: clamp(12px, 0.625vw, 18px);
                                }
                                @media (max-width: 768px) {
                                    /* Mobile: fixed 16px */
                                    html {
                                        font-size: 16px;
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
