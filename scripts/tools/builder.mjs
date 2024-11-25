import esbuild from "esbuild"
import pluginSvelte from "esbuild-svelte";
import {marked} from "marked";
import path from "path";
import sveltePreprocess from "svelte-preprocess";
import fs from "node:fs/promises";
import YAML from "yaml";
import ManifestBuilder from "./manifestBuilder.mjs";
import manifestPreprocess from "./manifestPreprocess.mjs";

const __dirname = import.meta.dirname;

function* contentScripts(srcDir, distDir, metafile, contentScriptsMap) {
    let outputMap = new Map();
    for (let [outfilePath, output] of Object.entries(metafile.outputs)) {
        if (!output.entryPoint) {
            continue;
        }

        outputMap.set(path.relative(srcDir, output.entryPoint), {
            js: [path.relative(distDir, outfilePath).replaceAll("\\", "/")],
            css: output.cssBundle ? [path.relative(distDir, output.cssBundle).replaceAll("\\", "/")] : []
        });
    }

    for (let [srcfilePath, settings] of contentScriptsMap.entries()) {
        srcfilePath = path.relative(srcDir, srcfilePath)
        if (!outputMap.has(srcfilePath)) {
            continue;
        }

        let {matches, excludes} = settings;
        let {js, css} = outputMap.get(srcfilePath);

        yield {
            matches,
            excludes,
            js: [...js],
            css: ["css/augmentedsteam.css", ...css]
        };
    }
}

async function buildChangelog(path) {

    const changelog = await fs.readFile(path, {
        "encoding": "utf8",
        "flag": "r"
    });
    const json = YAML.parse(changelog);

    const result = {};
    for (const [version, md] of Object.entries(json)) {
        result[version] = marked(md);
    }

    return {
        contents: result,
        lastVersion: Object.keys(result)[0]
    };
}

export default async function(options) {
    const rootDir = path.resolve(__dirname, "../../");
    const srcDir = path.resolve(rootDir, "src");
    const distDir = path.resolve(rootDir, `dist/${options.dev ? "dev" : "prod"}.${options.browser}`);

    try {
        await fs.rm(distDir, {recursive: true});
    } catch {}

    await fs.mkdir(distDir, {recursive: true});

    for (let dir of ["html", "img", "localization/compiled", "scriptlets"]) {
        await fs.cp(`${srcDir}/${dir}`, `${distDir}/${dir}`, {recursive: true});
    }
    await fs.cp(`${rootDir}/LICENSE`, `${distDir}/LICENSE`);

    let manifestPlugin = manifestPreprocess();

    let result = await esbuild.build({
        entryPoints: [
            // stylesheets - NOTE, in: main stylesheet added during build, based on browser
            {out: "augmentedsteam", in: `${srcDir}/css/augmentedsteam.css`},
            // options
            {out: "options", in: `${srcDir}/js/Options/options.ts`},
            // background
            {out: "background", in: `${srcDir}/js/Background/background.ts`},
            {out: "offscreen_domparser", in: `${srcDir}/js/Background/offscreen_domparser.ts`},
            // content
            {out: "community/app", in: `${srcDir}/js/Content/Features/Community/App/PApp.ts`},
            {out: "community/badges", in: `${srcDir}/js/Content/Features/Community/Badges/PBadges.ts`},
            {out: "community/booster_creator", in: `${srcDir}/js/Content/Features/Community/BoosterCreator/PBoosterCreator.ts`},
            {out: "community/default", in: `${srcDir}/js/Content/Features/Community/PDefaultCommunity.ts`},
            {out: "community/edit_guide", in: `${srcDir}/js/Content/Features/Community/EditGuide/PEditGuide.ts`},
            {out: "community/friends_and_groups", in: `${srcDir}/js/Content/Features/Community/FriendsAndGroups/PFriendsAndGroups.ts`},
            {out: "community/friends_that_play", in: `${srcDir}/js/Content/Features/Community/FriendsThatPlay/PFriendsThatPlay.ts`},
            {out: "community/gamecard", in: `${srcDir}/js/Content/Features/Community/GameCard/PGameCard.ts`},
            {out: "community/games", in: `${srcDir}/js/Content/Features/Community/Games/PGames.ts`},
            {out: "community/group_home", in: `${srcDir}/js/Content/Features/Community/GroupHome/PGroupHome.ts`},
            {out: "community/guides", in: `${srcDir}/js/Content/Features/Community/Guides/PGuides.ts`},
            {out: "community/inventory", in: `${srcDir}/js/Content/Features/Community/Inventory/PInventory.ts`},
            {out: "community/market_home", in: `${srcDir}/js/Content/Features/Community/MarketHome/PMarketHome.ts`},
            {out: "community/market_listing", in: `${srcDir}/js/Content/Features/Community/MarketListing/PMarketListing.ts`},
            {out: "community/market_search", in: `${srcDir}/js/Content/Features/Community/MarketSearch/PMarketSearch.ts`},
            {out: "community/myworkshop", in: `${srcDir}/js/Content/Features/Community/MyWorkshop/PMyWorkshop.ts`},
            {out: "community/profile_activity", in: `${srcDir}/js/Content/Features/Community/ProfileActivity/PProfileActivity.ts`},
            {out: "community/profile_edit", in: `${srcDir}/js/Content/Features/Community/ProfileEdit/PProfileEdit.ts`},
            {out: "community/profile_home", in: `${srcDir}/js/Content/Features/Community/ProfileHome/PProfileHome.ts`},
            {out: "community/profile_stats", in: `${srcDir}/js/Content/Features/Community/ProfileStats/PProfileStats.ts`},
            {out: "community/recommended", in: `${srcDir}/js/Content/Features/Community/Recommended/PRecommended.ts`},
            {out: "community/shared_files", in: `${srcDir}/js/Content/Features/Community/SharedFiles/PSharedFiles.ts`},
            {out: "community/trade_offer", in: `${srcDir}/js/Content/Features/Community/TradeOffer/PTradeOffer.ts`},
            {out: "community/workshop", in: `${srcDir}/js/Content/Features/Community/Workshop/PWorkshop.ts`},
            {out: "community/workshop_browse", in: `${srcDir}/js/Content/Features/Community/WorkshopBrowse/PWorkshopBrowse.ts`},
            {out: "store/account", in: `${srcDir}/js/Content/Features/Store/Account/PAccount.ts`},
            {out: "store/agecheck", in: `${srcDir}/js/Content/Features/Store/AgeCheck/PAgecheck.ts`},
            {out: "store/app", in: `${srcDir}/js/Content/Features/Store/App/PApp.ts`},
            {out: "store/bundle", in: `${srcDir}/js/Content/Features/Store/Bundle/PBundle.ts`},
            {out: "store/cart", in: `${srcDir}/js/Content/Features/Store/Cart/PCart.ts`},
            {out: "store/default", in: `${srcDir}/js/Content/Features/Store/PDefaultStore.ts`},
            {out: "store/frontpage", in: `${srcDir}/js/Content/Features/Store/Storefront/PStoreFront.ts`},
            {out: "store/funds", in: `${srcDir}/js/Content/Features/Store/Funds/PFunds.ts`},
            {out: "store/licences", in: `${srcDir}/js/Content/Features/Store/Licenses/PLicenses.ts`},
            {out: "store/points_shop", in: `${srcDir}/js/Content/Features/Store/PointsShop/PPointsShop.ts`},
            {out: "store/registerkey", in: `${srcDir}/js/Content/Features/Store/RegisterKey/PRegisterKey.ts`},
            {out: "store/search", in: `${srcDir}/js/Content/Features/Store/Search/PSearch.ts`},
            {out: "store/sub", in: `${srcDir}/js/Content/Features/Store/Sub/PSub.ts`},
            {out: "store/wishlist", in: `${srcDir}/js/Content/Features/Store/Wishlist/PWishlist.ts`},
            {out: "extra/holidayprofile", in: `${srcDir}/js/Steam/holidayprofile.js`}
        ],
        globalName: "_as",
        format: "iife",
        outdir: distDir,
        outbase: srcDir,
        entryNames: "[ext]/[dir]/[name]",
        assetNames: "[dir]/[name]",
        bundle: true,
        minify: !options.dev,
        sourcemap: true,
        splitting: false,
        mainFields: ["svelte", "browser", "module", "main"],
        conditions: ["svelte", "browser"],
        metafile: true,
        logLevel: "warning",
        alias: { // https://github.com/protobufjs/protobuf.js/pull/1548#issuecomment-1175477976
            /**
             * https://github.com/protobufjs/protobuf.js/issues/997 The original inquire module contains
             * usage of eval, which triggers a CSP violation. Currently we always generates static code
             * for protos, so there is no need for any reflection, thus we don't need inquire to work.
             */
            "@protobufjs/inquire": path.join(__dirname, "../patches/inquire.js"),
        },
        plugins: [
            pluginSvelte({
                preprocess: sveltePreprocess({
                    sourceMap: true
                }),
                compilerOptions: {
                    hydratable: false,
                    css: "external",
                    dev: options.dev
                }
            }),
            {
                name: "extension-assets",
                setup(build) {
                    build.onResolve({ filter: /extension:\/\// }, args => {
                        return {
                            path: options.browser === "firefox"
                                ? args.path.replace("extension://", "moz-extension://__MSG_@@extension_id__/")
                                : args.path.replace("extension://", "chrome-extension://__MSG_@@extension_id__/"),
                            external: true
                        }
                    })
                },
            },
            manifestPlugin.plugin
        ],
        define: {
            "__FIREFOX": JSON.stringify(options.browser === "firefox"),
            "__CHROME": JSON.stringify(options.browser === "chrome"),
            "__EDGE": JSON.stringify(options.browser === "edge")
        },
        loader: {
            ".svg": "file",
            ".png": "file",
            // ".gif": "file",
            // ".jpg": "file"
        }
    });

    /**
     * Build changelog
     */
    let {contents: changelog, lastVersion: version} = await buildChangelog(`${rootDir}/changelog.yml`);
    await fs.writeFile(`${distDir}/changelog.json`, JSON.stringify(changelog));

    /**
     * Build manifest
     */
    let builder = new ManifestBuilder();
    builder.version(version)
    for (let script of contentScripts(srcDir, distDir, result.metafile, manifestPlugin.map)) {
        builder.contentScript(script);
    }
    let manifest = builder.build({
        dev: options.dev,
        browser: options.browser
    });

    await fs.writeFile(`${distDir}/manifest.json`, JSON.stringify(manifest, null, 2));
}
