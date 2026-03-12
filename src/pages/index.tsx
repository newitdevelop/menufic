import { useEffect, useState } from "react";
import { type NextPage } from "next";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";
import { Box, Text } from "@mantine/core";

import { Footer } from "src/components/Footer";
import { NavHeader } from "src/components/Header";
import { LanguageSelector } from "src/components/LanguageSelector";
import VenueSelection from "src/components/VenueSelection/VenueSelection";
import { LANGUAGES, getFlagUrl } from "src/constants/languages";
import { isSmartTV } from "src/utils/detectSmartTV";

/** Homepage to select a venue and view their menu */
const LandingPage: NextPage = () => {
    const router = useRouter();
    const language = (router.query?.lang as string) || "PT";
    const [isTV, setIsTV] = useState(false);
    useEffect(() => { setIsTV(isSmartTV()); }, []);

    const handleLanguageChange = (newLang: string) => {
        const currentQuery = { ...router.query };
        if (newLang === "PT") {
            delete currentQuery.lang;
        } else {
            currentQuery.lang = newLang;
        }
        router.push(
            {
                pathname: router.pathname,
                query: currentQuery,
            },
            undefined,
            { shallow: false }
        );
    };

    // Number key shortcuts for language switching (1=PT, 2=EN, 3=ES, 4=FR, 5=DE, 6=IT)
    useEffect(() => {
        const languageMap: Record<string, string> = {
            "1": "PT", "2": "EN", "3": "ES", "4": "FR", "5": "DE", "6": "IT",
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
            if (languageMap[event.key]) {
                event.preventDefault();
                handleLanguageChange(languageMap[event.key]!);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    return (
        <>
            <NextSeo
                description="Select your venue to view our menus and make reservations."
                title="Select Your Venue"
            />
            <NavHeader
                showLoginButton
                withShadow
                languageSelector={
                    <LanguageSelector
                        currentLanguage={language}
                        onLanguageChange={handleLanguageChange}
                    />
                }
            />
            <VenueSelection />
            <Footer copyrightOnly />

            {/* Fixed bottom language bar — TV only */}
            {isTV && <Box
                sx={{
                    alignItems: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.88)",
                    bottom: 0,
                    display: "flex",
                    gap: 6,
                    justifyContent: "center",
                    left: 0,
                    padding: "8px 16px",
                    position: "fixed",
                    right: 0,
                    zIndex: 200,
                }}
            >
                {LANGUAGES.map((lang) => (
                    <Box
                        component="button"
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        sx={(theme) => ({
                            "&:focus": { outline: `2px solid ${theme.colors.blue[4]}`, outlineOffset: 2 },
                            "&:hover": { backgroundColor: theme.colors.blue[6] },
                            alignItems: "center",
                            backgroundColor: language.toUpperCase() === lang.code
                                ? theme.colors.blue[7]
                                : "rgba(255,255,255,0.12)",
                            border: "none",
                            borderRadius: theme.radius.sm,
                            color: "white",
                            cursor: "pointer",
                            display: "flex",
                            fontSize: 13,
                            fontWeight: 600,
                            gap: 6,
                            padding: "5px 12px",
                            transition: "background 0.2s",
                        })}
                    >
                        <Box
                            alt={lang.label}
                            component="img"
                            {...getFlagUrl(lang.countryCode, "small")}
                            sx={{ borderRadius: 2 }}
                        />
                        {lang.code}
                        <Text sx={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>
                            {lang.shortcut}
                        </Text>
                    </Box>
                ))}
            </Box>}
        </>
    );
};

export const getServerSideProps = async (context: any) => {
    const lang = (context.query?.lang as string)?.toUpperCase() || "PT";

    // Map language codes to file names (all lowercase)
    const langFile = lang.toLowerCase();

    let messages;
    try {
        // Try to load the requested language file
        messages = (await import(`src/lang/${langFile}.json`)).default;
    } catch (error) {
        // Fallback to English if language file doesn't exist
        console.warn(`Language file ${langFile}.json not found, falling back to en.json`);
        messages = (await import("src/lang/en.json")).default;
    }

    return {
        props: { messages },
    };
};

export default LandingPage;
