import {defineConfig} from "@lingui/cli";
import {formatter} from "@lingui/format-po";

export default defineConfig({
    locales: ["en", "de"],
    sourceLocale: "en",
    compileNamespace: "ts",
    catalogs: [
        {
            path: "<rootDir>/src/locales/{locale}/messages",
            include: ["<rootDir>/src"],
        },
    ],
    format: formatter({lineNumbers: false}),
});
