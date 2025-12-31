import type { FC } from "react";

import { createStyles } from "@mantine/core";
import Image from "next/image";
import Link from "next/link";

import { env } from "src/env/client.mjs";

const useStyles = createStyles((theme) => {
    return {
        image: {
            objectFit: "scale-down",
            width: 100,
            [`@media (max-width: ${theme.breakpoints.sm}px)`]: { width: 80 },
        },
        titleLink: {
            "&:hover": { filter: "brightness(90%)" },
            alignItems: "center",
            display: "flex",
            marginBottom: 20,
            marginTop: 20,
            transition: "all 500ms ease",
        },
    };
});

/** Logo link component to be used to display app branding */
export const Logo: FC = () => {
    const { classes } = useStyles();

    return (
        <Link className={classes.titleLink} href="/">
            <Image
                alt={`${env.NEXT_PUBLIC_APP_NAME} logo`}
                className={classes.image}
                height={50}
                src={env.NEXT_PUBLIC_LOGO_PATH}
                width={200}
            />
        </Link>
    );
};
