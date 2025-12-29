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
                modal: {
                    background: theme.white,
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) !important'
                },
                overlay: {
                    backdropFilter: 'blur(2px)',
                    position: 'fixed'
                }
            }}
            withCloseButton={!loading}
            withinPortal
            target="body"
            trapFocus={false}
            lockScroll={false}
            centered
            zIndex={10000}
            {...rest}
        />
    );
};
