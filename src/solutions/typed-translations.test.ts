import {expect, test} from "vitest";
import {setLanguage, t} from "./typed-translations";


test("resolves german value", () => {
    setLanguage("de");
    expect(t("greeting", { username: "Nils" })).toEqual("Hallo Nils")
})

test("resolves english value", () => {
    setLanguage("en")
    expect(t("greeting", { username: "Nuls"})).toEqual("Hello Nuls")
})



