import { type NextPage } from "next";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";

import { Footer } from "src/components/Footer";
import { NavHeader } from "src/components/Header";
import { LanguageSelector } from "src/components/LanguageSelector";
import VenueSelection from "src/components/VenueSelection/VenueSelection";

/** Homepage to select a venue and view their menu */
const LandingPage: NextPage = () => {
    const router = useRouter();
    const language = (router.query?.lang as string) || "PT";

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
