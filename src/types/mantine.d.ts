import { MantineTheme } from "@mantine/core";

declare module "@mantine/core" {
    export interface MantineThemeOther {}

    export interface MantineSizes {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        tv: string;
        "4k": string;
    }
}
