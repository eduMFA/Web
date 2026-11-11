import {defineConfig, globalIgnores} from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([...nextCoreWebVitals, globalIgnores(["src/locales/*/messages.ts"])]);
