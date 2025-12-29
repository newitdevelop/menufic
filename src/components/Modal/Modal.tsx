import type { FC } from "react";

import { Modal as MantineModal, useMantineTheme } from "@mantine/core";

import type { ModalProps } from "@mantine/core";

interface Props extends ModalProps {
    loading?: boolean;
}

export const Modal: FC<Props> = ({ loading = false, ...rest }) => {
    const theme = useMantineTheme();
    return (
        <MantineModal
            closeOnClickOutside={!loading}
            closeOnEscape={!loading}
            overlayBlur={0}
            overlayOpacity={0.55}
            styles={{
                modal: { background: theme.white },
                overlay: { backdropFilter: 'blur(2px)' }
            }}
            withCloseButton={!loading}
            withinPortal
            zIndex={1000}
            {...rest}
        />
    );
};
