import Feature from "@Content/Modules/Context/Feature";
import {L} from "@Core/Localization/Localization";
import {
    __apppageEabanner,
    __apppageEaheader,
    __apppageFranchise,
    __apppageGreenlight,
    __apppageLegal,
    __apppageMorefromfranchise,
    __apppageRecentupdates,
    __apppageWorkshop,
    __homepageCurators,
    __homepageSidebar,
    __homepageTabs,
    __homepageTopnewreleases,
} from "@Strings/_strings";
import type CStoreFront from "@Content/Features/Store/Storefront/CStoreFront";
import ContextType from "@Content/Modules/Context/ContextType";
import DOMHelper from "@Content/Modules/DOMHelper";
import Customizer from "@Content/Features/Store/Common/Customizer/Customizer.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import type {CustomizerSetup} from "@Content/Features/Store/Common/Customizer/CustomizerSetup";

export default class FCustomizer extends Feature<CApp|CStoreFront> {

    override apply(): void {

        const target = document.querySelector("#cart_status_data");
        if (!target) {
            return;
        }
        const anchor = target.firstElementChild ?? undefined;

        if (this.context.type === ContextType.APP) {
            (new Customizer({
                target,
                anchor,
                props: {
                    type: "app",
                    setup: this.getAppPageSetup()
                }
            }));
        } else if (this.context.type === ContextType.STORE_FRONT) {
            document.addEventListener("renderComplete", () => {
                (new Customizer({
                    target,
                    anchor,
                    props: {
                        type: "frontpage",
                        setup: this.getFrontPageSetup(),
                        dynamicSelector: ".home_page_body_ctn .home_ctn:not(.esi-customizer), .home_pagecontent_ctn"
                    }
                }));
            });
            DOMHelper.insertScript("scriptlets/Store/Common/storeFrontCustomizer.js");
        }
    }

    private getAppPageSetup(): CustomizerSetup {

        function getParentEl(selector: string): HTMLElement|null {
            const el = document.querySelector(selector);
            return el && el.closest(".game_page_autocollapse_ctn");
        }

        return [
            ["franchisenotice", ".franchise_notice", L(__apppageFranchise)],
            ["eaheader", ".early_access_header:not(.es_coupon_info)", L(__apppageEaheader)],
            ["eabanner", ".early_access_banner", L(__apppageEabanner)],
            ["recentupdates", "[data-featuretarget=events-row]", L(__apppageRecentupdates)],
            ["reviews", "#game_area_reviews"],
            ["about", getParentEl("#game_area_description")],
            ["contentwarning", getParentEl("#game_area_content_descriptors")],
            ["sysreq", getParentEl(".sys_req")],
            ["legal", getParentEl("#game_area_legal"), L(__apppageLegal)],
            ["moredlcfrombasegame", "#moredlcfrombasegame_block"],
            ["franchise", "#franchise_block", L(__apppageMorefromfranchise)],
            ["morelikethis", "#recommended_block"],
            ["recommendedbycurators", ".steam_curators_block"],
            ["customerreviews", "#app_reviews_hash"],
            ["workshop", getParentEl("[href^='https://steamcommunity.com/workshop/browse']"), L(__apppageWorkshop)],
            ["greenlight", getParentEl("[href^='https://steamcommunity.com/greenlight']"), L(__apppageGreenlight)],
        ];
    }

    private getFrontPageSetup(): CustomizerSetup {

        function getParentEl(selector: string): HTMLElement|null {
            const el = document.querySelector<HTMLElement>(selector);
            return el && el.closest<HTMLElement>(".home_ctn");
        }

        return [
            ["featuredrecommended", ".home_cluster_ctn"],
            ["trendingamongfriends", ".friends_recently_purchased", "", true],
            ["discoveryqueue", ".discovery_queue_ctn"],
            ["curators", ".steam_curators_ctn", L(__homepageCurators)],
            ["morecuratorrecommendations", ".apps_recommended_by_curators_ctn", L(__homepageCurators)],
            ["fromdevelopersandpublishersthatyouknow", ".recommended_creators_ctn"],
            ["popularvrgames", ".best_selling_vr_ctn"],
            ["homepagetabs", ".tab_container", L(__homepageTabs)],
            ["gamesstreamingnow", ".live_streams_ctn", "", true],
            ["updatesandoffers", ".marketingmessage_area", "", true],
            ["topnewreleases", ".top_new_releases", L(__homepageTopnewreleases)],
            ["homepagesidebar", "body:not(.no_home_gutter) .home_page_gutter", L(__homepageSidebar)],
            ["specialoffers", getParentEl(".special_offers")],
            ["browsesteam", getParentEl(".big_buttons.home_page_content")],
            ["recentlyupdated", getParentEl(".recently_updated_block")],
            ["under", getParentEl("[class*='specials_under']")],
        ];
    }
}

