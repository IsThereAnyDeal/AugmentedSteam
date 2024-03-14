import esbuild from "esbuild"
import pluginSvelte from "esbuild-svelte";
import {marked} from "marked";
import path from "path";
import sveltePreprocess from "svelte-preprocess";
import fs from "node:fs/promises";
import YAML from "yaml";
import ManifestBuilder from "../manifest/ManifestBuilder.mjs";
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
            js: ["js/dompurify.js", "js/browser-polyfill.js", ...js],
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
    const rootDir = path.resolve(__dirname, "../../../");
    const srcDir = path.resolve(rootDir, "src");
    const distDir = path.resolve(rootDir, `dist-es/${options.dev ? "dev" : "prod"}.${options.browser}`);

    try {
        await fs.rm(distDir, {recursive: true});
    } catch {}

    await fs.mkdir(distDir, {recursive: true});

    // TODO replace with imports?
    for (let dir of ["html", "img", "json", "localization"]) {
        await fs.cp(`${srcDir}/${dir}`, `${distDir}/${dir}`, {recursive: true});
    }
    await fs.cp(`${rootDir}/LICENSE`, `${distDir}/LICENSE`);

    let manifestPlugin = manifestPreprocess();

    await esbuild.build({
        entryPoints: [
            {out: "browser-polyfill", in: `${rootDir}/node_modules/webextension-polyfill/dist/browser-polyfill.js`},
            {out: "dompurify", in: `${rootDir}/node_modules/dompurify/dist/purify.js`}
        ],
        outdir: `${distDir}/js/`,
        entryNames: "[name]",
        bundle: true,
        minify: true,
        sourcemap: false,
        splitting: false,
        mainFields: ["svelte", "browser", "module", "main"],
        conditions: ["svelte", "browser"],
        logLevel: "warning",
    });

    let result = await esbuild.build({
        entryPoints: [
            // stylesheets - NOTE, in: main stylesheet added during build, based on browser
            {out: "augmentedsteam", in: `${srcDir}/css/augmentedsteam.css`},
            {out: "options", in: `${srcDir}/css/options.css`},
            // pages
            {out: "background", in: `${srcDir}/js/Background/background.js`},
            {out: "options", in: `${srcDir}/js/Options/options.js`},
            {out: "community/app", in: `${srcDir}/js/Content/Features/Community/App/PApp.js`},
            {out: "community/badges", in: `${srcDir}/js/Content/Features/Community/Badges/PBadges.js`},
            {out: "community/booster_creator", in: `${srcDir}/js/Content/Features/Community/BoosterCreator/PBoosterCreator.js`},
            {out: "community/default", in: `${srcDir}/js/Content/Features/Community/PDefaultCommunity.js`},
            {out: "community/edit_guide", in: `${srcDir}/js/Content/Features/Community/EditGuide/PEditGuide.js`},
            {out: "community/friends_and_groups", in: `${srcDir}/js/Content/Features/Community/FriendsAndGroups/PFriendsAndGroups.js`},
            {out: "community/friends_that_play", in: `${srcDir}/js/Content/Features/Community/FriendsThatPlay/PFriendsThatPlay.js`},
            {out: "community/gamecard", in: `${srcDir}/js/Content/Features/Community/GameCard/PGameCard.js`},
            {out: "community/games", in: `${srcDir}/js/Content/Features/Community/Games/PGames.js`},
            {out: "community/global_stats", in: `${srcDir}/js/Content/Features/Community/GlobalStats/PGlobalStats.js`},
            {out: "community/group_home", in: `${srcDir}/js/Content/Features/Community/GroupHome/PGroupHome.js`},
            {out: "community/guides", in: `${srcDir}/js/Content/Features/Community/Guides/PGuides.js`},
            {out: "community/inventory", in: `${srcDir}/js/Content/Features/Community/Inventory/PInventory.js`},
            {out: "community/market_home", in: `${srcDir}/js/Content/Features/Community/MarketHome/PMarketHome.js`},
            {out: "community/market_listing", in: `${srcDir}/js/Content/Features/Community/MarketListing/PMarketListing.js`},
            {out: "community/market_search", in: `${srcDir}/js/Content/Features/Community/MarketSearch/PMarketSearch.js`},
            {out: "community/myworkshop", in: `${srcDir}/js/Content/Features/Community/MyWorkshop/PMyWorkshop.js`},
            {out: "community/profile_activity", in: `${srcDir}/js/Content/Features/Community/ProfileActivity/PProfileActivity.js`},
            {out: "community/profile_edit", in: `${srcDir}/js/Content/Features/Community/ProfileEdit/PProfileEdit.js`},
            {out: "community/profile_home", in: `${srcDir}/js/Content/Features/Community/ProfileHome/PProfileHome.js`},
            {out: "community/profile_stats", in: `${srcDir}/js/Content/Features/Community/ProfileStats/PProfileStats.js`},
            {out: "community/recommended", in: `${srcDir}/js/Content/Features/Community/Recommended/PRecommended.js`},
            {out: "community/shared_files", in: `${srcDir}/js/Content/Features/Community/SharedFiles/PSharedFiles.js`},
            {out: "community/trade_offer", in: `${srcDir}/js/Content/Features/Community/TradeOffer/PTradeOffer.js`},
            {out: "community/workshop", in: `${srcDir}/js/Content/Features/Community/Workshop/PWorkshop.js`},
            {out: "community/workshop_browse", in: `${srcDir}/js/Content/Features/Community/WorkshopBrowse/PWorkshopBrowse.js`},
            {out: "store/account", in: `${srcDir}/js/Content/Features/Store/Account/PAccount.js`},
            {out: "store/agecheck", in: `${srcDir}/js/Content/Features/Store/AgeCheck/PAgecheck.js`},
            {out: "store/app", in: `${srcDir}/js/Content/Features/Store/App/PApp.js`},
            {out: "store/bundle", in: `${srcDir}/js/Content/Features/Store/Bundle/PBundle.js`},
            {out: "store/cart", in: `${srcDir}/js/Content/Features/Store/Cart/PCart.js`},
            {out: "store/charts", in: `${srcDir}/js/Content/Features/Store/Charts/PCharts.js`},
            {out: "store/default", in: `${srcDir}/js/Content/Features/Store/PDefaultStore.js`},
            {out: "store/frontpage", in: `${srcDir}/js/Content/Features/Store/Storefront/PStoreFront.js`},
            {out: "store/funds", in: `${srcDir}/js/Content/Features/Store/Funds/PFunds.js`},
            {out: "store/licences", in: `${srcDir}/js/Content/Features/Store/Licenses/PLicenses.js`},
            {out: "store/points_shop", in: `${srcDir}/js/Content/Features/Store/PointsShop/PPointsShop.js`},
            {out: "store/registerkey", in: `${srcDir}/js/Content/Features/Store/RegisterKey/PRegisterKey.js`},
            {out: "store/search", in: `${srcDir}/js/Content/Features/Store/Search/PSearch.js`},
            {out: "store/sub", in: `${srcDir}/js/Content/Features/Store/Sub/PSub.js`},
            {out: "store/wishlist", in: `${srcDir}/js/Content/Features/Store/Wishlist/PWishlist.js`},
            {out: "extra/holidayprofile", in: `${srcDir}/js/Steam/holidayprofile.js`}
        ],
        publicPath: "/public/",
        globalName: "_as",
        format: "iife",
        outdir: distDir,
        outbase: srcDir,
        entryNames: "[ext]/[dir]/[name]",
        assetNames: "[dir]/[name]",
        bundle: true,
        minify: !options.dev,
        sourcemap: options.dev,
        splitting: false,
        mainFields: ["svelte", "browser", "module", "main"],
        conditions: ["svelte", "browser"],
        metafile: true,
        logLevel: "warning",
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
            "__BROWSER__": JSON.stringify(options.browser)
        },
        loader: {
            // ".svg": "file",
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
