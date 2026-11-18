import type {Metadata} from "next";
import {TokenTester} from "./token-tester";
import {testerSetting} from "../../../server/token-tester/config";

export const metadata: Metadata = {title: "Token Tester | eduMFA"};

export default function TokenTesterPage() {
    return (
        <TokenTester
            serviceUrl={testerSetting("ORIGIN") ? "/api/token-tester" : undefined}
            passkeysEnabled={!!(process.env.EDUMFA_PASSKEY_TEST_USER && process.env.EDUMFA_PASSKEY_TEST_REALM)}
        />
    );
}
