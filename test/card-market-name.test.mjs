import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {JSDOM} from "jsdom";
import ts from "typescript";

const helperPath = new URL("../src/js/Content/Features/Community/GameCard/MarketHashName.ts", import.meta.url);
const source = await readFile(helperPath, "utf8");
const compiled = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2021
    }
}).outputText;
const {englishBadgeUrl, marketCardNames, readCardName, readCardNames} = await import(
    `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

// The card markup of https://steamcommunity.com/id/przemo20/gamecards/620 (the page from #2393),
// trimmed to what the feature reads
function badgePage(cards) {
    return new JSDOM(`
        <div class="badge_card_set_cards">
            ${cards.map(([title, series, unowned]) => `
                <div class="badge_card_set_card ${unowned ? "unowned" : ""}">
                    <div class="game_card_ctn">
                        <img class="gamecard" src="https://community.akamai.steamstatic.com/economy/image/card">
                    </div>
                    <div class="badge_card_set_text badge_card_set_title ellipsis">
                        ${title}            <div style="clear: right"></div>
                    </div>
                    <div class="badge_card_set_text ellipsis">
                        ${series}
                    </div>
                </div>
            `).join("")}
        </div>
    `).window.document;
}

const german = badgePage([
    ["Chell", "1 von 8, Serie 1", true],
    ["Zerstörung", "2 von 8, Serie 1", true],
    ["Das Labor (2)", "6 von 8, Serie 1", false]
]);
const english = badgePage([
    ["Chell", "1 of 8, Series 1", true],
    ["Destruction", "2 of 8, Series 1", true],
    ["The Lab (2)", "6 of 8, Series 1", false]
]);

test("reads the card names from the title line of each card", () => {
    assert.deepEqual(readCardNames(german), ["Chell", "Zerstörung", "Das Labor"]);
    assert.deepEqual(readCardNames(english), ["Chell", "Destruction", "The Lab"]);
    assert.equal(readCardName(german.querySelector(".badge_card_set_card")), "Chell");
});

test("matches the English names to the cards by position", () => {
    assert.deepEqual(
        marketCardNames(readCardNames(german), readCardNames(english)),
        ["Chell", "Destruction", "The Lab"]
    );
});

test("keeps the visible names when the English page lists a different number of cards", () => {
    const visible = readCardNames(german);
    assert.deepEqual(marketCardNames(visible, ["Chell", "Destruction"]), visible);
    assert.deepEqual(marketCardNames(visible, []), visible);
});

test("asks for the English page and keeps the other parameters", () => {
    assert.equal(
        englishBadgeUrl("https://steamcommunity.com/id/przemo20/gamecards/620?l=german&border=1"),
        "https://steamcommunity.com/id/przemo20/gamecards/620?l=english&border=1"
    );
    assert.equal(
        englishBadgeUrl("https://steamcommunity.com/profiles/76561197960287930/gamecards/620"),
        "https://steamcommunity.com/profiles/76561197960287930/gamecards/620?l=english"
    );
});
