import {Link} from "@heroui/react";
import React from "react";
import {Trans} from "@lingui/react/macro";

export const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-800 text-white py-4">
            <div className="container mx-auto px-4 text-center">
                <p>
                    <Trans id="Footer.copyright">© 2026 eduMFA. All rights reserved.</Trans>
                </p>
                <Link
                    href="https://www.fu-berlin.de/en/redaktion/impressum/"
                    className="text-white hover:text-gray-300"
                >
                    <Trans id="Footer.imprint">Imprint</Trans>
                </Link>
            </div>
        </footer>
    );
};
