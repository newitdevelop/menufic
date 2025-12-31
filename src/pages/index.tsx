import { type NextPage } from "next";
import { NextSeo } from "next-seo";

import { Footer } from "src/components/Footer";
import { NavHeader } from "src/components/Header";
import VenueSelection from "src/components/VenueSelection/VenueSelection";

/** Homepage to select a venue and view their menu */
const LandingPage: NextPage = () => {
    return (
        <>
            <NextSeo
                description="Select your venue to view our menus and make reservations."
                title="Select Your Venue"
            />
            <NavHeader showLoginButton withShadow />
            <VenueSelection />
            <Footer />
        </>
    );
};

export const getStaticProps = async () => ({
    props: { messages: (await import("src/lang/en.json")).default },
});

export default LandingPage;
