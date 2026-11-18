import type {Metadata} from "next";
import {PushTester} from "./push-tester";

export const metadata: Metadata = {title: "Token Tester | eduMFA"};

export default function PushTesterPage() {
    return (
        <PushTester
            serviceUrl={process.env.PUSH_TESTER_ORIGIN ? "/api/push-tester" : undefined}
            passkeysEnabled={!!(process.env.EDUMFA_PASSKEY_TEST_USER && process.env.EDUMFA_PASSKEY_TEST_REALM)}
        />
    );
}
