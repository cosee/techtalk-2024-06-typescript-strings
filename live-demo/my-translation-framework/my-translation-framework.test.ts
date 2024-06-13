import {describe, expect, it} from "vitest";
import {setLanguage, t} from "./my-translation-framework";

describe("translation", () => {
    it("shows german value, filling placeholders", () => {
        setLanguage("de")
        expect(t("title")).toEqual("Willkommen")
        expect(t("greeting", { username: "Nils"})).toEqual("Hallo Nils")
    })

    it("shows english value", () => {
        setLanguage("en")

        expect(t("title")).toEqual("Welcome")
        expect(t("greeting", { username: "Nils"})).toEqual("Hello Nils")
    })
})