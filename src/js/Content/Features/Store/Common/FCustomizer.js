import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {ContextType, DOMHelper, Feature} from "../../../modulesContent";

export default class FCustomizer extends Feature {

    apply() {
        if (this.context.type === ContextType.APP) {
            this._customizeAppPage();
        } else if (this.context.type === ContextType.STORE_FRONT) {
            this._customizeFrontPage();
        }
    }

    _customizeAppPage() {

        const node = DOMHelper.selectLastNode(document, ".purchase_area_spacer");
        node.style.height = "auto";

        HTML.beforeEnd(node,
            `<div id="es_customize_btn">
                <div class="home_btn home_customize_btn">${Localization.str.customize}</div>
                <div class='home_viewsettings_popup'>
                    <div class="home_viewsettings_instructions">${Localization.str.apppage_sections}</div>
                </div>
            </div>
            <div style="clear: both;"></div>`);

        document.querySelector("#es_customize_btn").addEventListener("click", e => {
            e.target.classList.toggle("active");
        });

        document.body.addEventListener("click", e => {
            if (e.target.closest("#es_customize_btn")) { return; }
            const node = document.querySelector("#es_customize_btn .home_customize_btn.active");
            if (!node) { return; }
            node.classList.remove("active");
        });

        for (const sel of ["#game_area_description", "#game_area_content_descriptors", ".sys_req", "#game_area_legal"]) {
            const el = document.querySelector(sel);
            if (!el) { continue; }
            const parent = el.closest(".game_page_autocollapse_ctn");
            if (!parent) { continue; }
            parent.setAttribute("data-parent-of", sel);
        }

        const workshop = document.querySelector("[href^='https://steamcommunity.com/workshop/browse']");
        const greenlight = document.querySelector("[href^='https://steamcommunity.com/greenlight']");

        const customizer = new FCustomizer.Customizer("customize_apppage");
        customizer
            .add("franchisenotice", ".franchise_notice", Localization.str.apppage_franchise)
            .add("eaheader", ".early_access_header:not(.es_coupon_info)", Localization.str.apppage_eaheader)
            .add("eabanner", ".early_access_banner", Localization.str.apppage_eabanner)
            .add("recentupdates", "#events_root", Localization.str.apppage_recentupdates)
            .add("reviews", "#game_area_reviews")
            .add("about", "[data-parent-of='#game_area_description']")
            .add("contentwarning", "[data-parent-of='#game_area_content_descriptors']")
            .add("steamchart", "#steam-charts")
            .add("surveys", "#performance_survey")
            .add("steamspy", "#steam-spy")
            .add("sysreq", "[data-parent-of='.sys_req']")
            .add("legal", "[data-parent-of='#game_area_legal']", Localization.str.apppage_legal)
            .add("moredlcfrombasegame", "#moredlcfrombasegame_block")
            .add("franchise", "#franchise_block", Localization.str.apppage_morefromfranchise)
            .add("morelikethis", "#recommended_block")
            .add("recommendedbycurators", ".steam_curators_block")
            .add("customerreviews", "#app_reviews_hash");

        if (workshop) {
            customizer.add("workshop", workshop.closest(".game_page_autocollapse_ctn"), Localization.str.apppage_workshop);
        }
        if (greenlight) {
            customizer.add("greenlight", greenlight.closest(".game_page_autocollapse_ctn"), Localization.str.apppage_greenlight);
        }

        customizer.build();
    }

    _customizeFrontPage() {

        // TODO position when takeover link is active (big banner at the top of the front page)
        HTML.beforeEnd(".home_page_content",
            `<div class="es_customize_homepage_ctn">
                <div id="es_customize_btn">
                    <div class="home_btn home_customize_btn">${Localization.str.customize}</div>
                    <div class="home_viewsettings_popup">
                        <div class="home_viewsettings_instructions">${Localization.str.apppage_sections}</div>
                    </div>
                </div>
            </div>`);

        document.querySelector("#es_customize_btn").addEventListener("click", ({target}) => {
            target.classList.toggle("active");
        });

        document.body.addEventListener("click", ({target}) => {
            if (target.closest("#es_customize_btn")) { return; }

            const node = document.querySelector("#es_customize_btn .home_customize_btn.active");
            if (!node) { return; }

            node.classList.remove("active");
        });

        setTimeout(() => {

            const specialoffers = document.querySelector(".special_offers");
            const browsesteam = document.querySelector(".big_buttons.home_page_content");
            const recentlyupdated = document.querySelector(".recently_updated_block");
            const under = document.querySelector("[class*='specials_under']");

            const customizer = new FCustomizer.Customizer("customize_frontpage");
            customizer
                .add("featuredrecommended", ".home_cluster_ctn")
                .add("trendingamongfriends", ".friends_recently_purchased")
                .add("discoveryqueue", ".discovery_queue_ctn")
                .add("curators", ".steam_curators_ctn", Localization.str.homepage_curators)
                .add("morecuratorrecommendations", ".apps_recommended_by_curators_ctn", Localization.str.homepage_curators)
                .add("fromdevelopersandpublishersthatyouknow", ".recommended_creators_ctn")
                .add("popularvrgames", ".best_selling_vr_ctn")
                .add("homepagetabs", ".tab_container", Localization.str.homepage_tabs)
                .add("gamesstreamingnow", ".live_streams_ctn", "", true)
                .add("updatesandoffers", ".marketingmessage_area", "", true)
                .add("topnewreleases", ".top_new_releases", Localization.str.homepage_topnewreleases)
                .add("steamlabs", ".labs_cluster")
                .add("homepagesidebar", "body:not(.no_home_gutter) .home_page_gutter", Localization.str.homepage_sidebar);

            if (specialoffers) { customizer.add("specialoffers", specialoffers.parentElement); }
            if (browsesteam) { customizer.add("browsesteam", browsesteam.parentElement); }
            if (recentlyupdated) { customizer.add("recentlyupdated", recentlyupdated.parentElement); }
            if (under) { customizer.add("under", under.parentElement.parentElement); }

            for (const node of document.querySelectorAll(
                ".home_page_body_ctn .home_ctn:not(.esi-customizer), .home_pagecontent_ctn"
            )) {
                if (node.closest(".esi-customizer")
                    || node.querySelector(".esi-customizer")
                    || node.style.display === "none") { continue; }

                customizer.addDynamic(node);
            }

            customizer.build();
        }, 1000); // TODO Need a more consistent solution here
    }
}

FCustomizer.Customizer = class {

    constructor(settingsName) {
        this.settingsName = settingsName;
        this.settings = SyncedStorage.get(settingsName);
    }

    _textValue(node) {
        const textNode = node.querySelector("h1, h2, .home_title, .home_section_title");
        if (!textNode) { return ""; }
        let str = "";
        for (const node of textNode.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                str += node.textContent.trim();
            }
        }
        return str;
    }

    _updateValue(name, value) {
        this.settings[name] = value;
        SyncedStorage.set(this.settingsName, this.settings);
    }

    _getValue(name) {
        const value = this.settings[name];
        return (typeof value === "undefined") || value;
    }

    add(name, targets, text, forceShow) {

        let _text = text;
        let elements;

        if (typeof targets === "string") {
            elements = Array.from(document.querySelectorAll(targets));
        } else if (targets instanceof NodeList) {
            elements = Array.from(targets);
        } else {
            elements = targets ? [targets] : [];
        }

        if (!elements.length) { return this; }

        const state = this._getValue(name);

        let isValid = false;

        elements.forEach((element, i) => {
            if (getComputedStyle(element).display === "none" && !forceShow) {
                elements.splice(i, 1);
                return;
            }

            if (typeof _text !== "string" || _text === "") {
                _text = this._textValue(element).toLowerCase();
                if (_text === "") { return; }
            }

            isValid = true;
        });

        if (!isValid) { return this; }

        for (const element of elements) {
            element.classList.toggle("esi-shown", state);
            element.classList.toggle("esi-hidden", !state);
            element.classList.add("esi-customizer");
            element.dataset.esName = name;
            element.dataset.esText = _text;
        }

        return this;
    }

    addDynamic(node) {
        const text = this._textValue(node).toLowerCase();
        if (text === "") { return; }

        this.add(`dynamic_${text}`, node, text);
    }

    build() {

        const customizerEntries = new Map();

        for (const element of document.querySelectorAll(".esi-customizer")) {

            const name = element.dataset.esName;

            if (customizerEntries.has(name)) {
                customizerEntries.get(name).push(element);
            } else {

                const state = element.classList.contains("esi-shown");
                const text = element.dataset.esText;

                HTML.beforeEnd("#es_customize_btn .home_viewsettings_popup",
                    `<div class="home_viewsettings_checkboxrow ellipsis" id="${name}">
                        <div class="home_viewsettings_checkbox ${state ? "checked" : ""}"></div>
                        <div class="home_viewsettings_label">${text}</div>
                    </div>`);

                customizerEntries.set(name, [element]);
            }
        }

        for (const [name, elements] of customizerEntries) {
            const checkboxrow = document.getElementById(name);
            checkboxrow.addEventListener("click", e => {
                const state = !checkboxrow.querySelector(".checked");

                for (const element of elements) {
                    element.classList.toggle("esi-shown", state);
                    element.classList.toggle("esi-hidden", !state);
                }

                e.target.closest(".home_viewsettings_checkboxrow")
                    .querySelector(".home_viewsettings_checkbox").classList.toggle("checked", state);

                this._updateValue(name, state);
            });
        }
    }
};
