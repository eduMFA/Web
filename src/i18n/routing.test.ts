import {strict as assert} from "node:assert";
import {test} from "node:test";
import {detectLocale} from "./routing";

test("detects supported languages and regional variants", () => {
    assert.equal(detectLocale("de"), "de");
    assert.equal(detectLocale("DE-de,en;q=0.8"), "de");
    assert.equal(detectLocale("en-US,de;q=0.8"), "en");
});

test("respects quality values and skips unsupported languages", () => {
    assert.equal(detectLocale("fr,de;q=0.9,en;q=0.5"), "de");
    assert.equal(detectLocale("en;q=0.2,de;q=0.9"), "de");
    assert.equal(detectLocale("de;q=0,en;q=0.5"), "en");
    assert.equal(detectLocale("de;q=invalid,en;q=0.5"), "en");
    assert.equal(detectLocale("de;q=2,en;q=0.5"), "en");
});

test("falls back to English without a supported preference", () => {
    for (const header of [null, "", "fr-FR", "*", "de;q=0"]) {
        assert.equal(detectLocale(header), "en");
    }
});
