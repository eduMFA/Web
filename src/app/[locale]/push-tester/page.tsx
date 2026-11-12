import type {Metadata} from "next";
import {PushTester} from "./push-tester";

export const metadata: Metadata = {title: "Push Token Tester | eduMFA"};

export default function PushTesterPage() {
    return <PushTester serviceUrl={process.env.NEXT_PUBLIC_PUSH_TESTER_URL?.trim()} />;
}
