class FCustomizer extends ASFeature {

    apply() {
        if (this.context instanceof CAppPage) {
            this._customizeAppPage();
        } else if (this.context instanceof CStoreFrontPage) {
            this._customizeFrontPage();
        }
    }

    _customizeAppPage() {

        let node = DOMHelper.selectLastNode(document, ".purchase_area_spacer");
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
            let node = document.querySelector("#es_customize_btn .home_customize_btn.active");
            if (!node) { return; }
            node.classList.remove("active");
        });

        for (let sel of ["#game_area_description", "#game_area_content_descriptors", ".sys_req", "#game_area_legal"]) {
            let el = document.querySelector(sel);
            if (!el) { continue; }
            let parent = el.closest(".game_page_autocollapse_ctn");
            if (!parent) { continue; }
            parent.setAttribute("data-parent-of", sel);
        }

        let workshop = document.querySelector("[href^='https://steamcommunity.com/workshop/browse']");
        let greenlight = document.querySelector("[href^='https://steamcommunity.com/greenlight']");

        let customizer = new FCustomizer.Customizer("customize_apppage");
        customizer
            .add("franchisenotice", ".franchise_notice", Localization.str.apppage_franchise)
            .add("eaheader", ".early_access_header", Localization.str.apppage_eaheader)
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

        if (workshop) customizer.add("workshop", workshop.closest(".game_page_autocollapse_ctn"), Localization.str.apppage_workshop);
        if (greenlight) customizer.add("greenlight", greenlight.closest(".game_page_autocollapse_ctn"), Localization.str.apppage_greenlight);

        customizer.build();
    }

    _customizeFrontPage() {

        // TODO position when takeover link is active (big banner at the top of the front page)
        HTML.beforeEnd(".home_page_content",
            `<div class="home_pagecontent_ctn clearfix" style="margin-bottom: 5px; margin-top: 3px;">
                <div id="es_customize_btn" class="home_actions_ctn">
                    <div class="home_btn home_customize_btn" style="z-index: 13;">${Localization.str.customize}</div>
                    <div class='home_viewsettings_popup'>
                        <div class='home_viewsettings_instructions' style='font-size: 12px;'>${Localization.str.apppage_sections}</div>
                    </div>
                </div>
            </div>`);

        document.querySelector("#es_customize_btn").addEventListener("click", ({ target }) => {
            target.classList.toggle("active");
        });

        document.body.addEventListener("click", ({ target }) => {
            if (target.closest("#es_customize_btn")) { return; }

            let node = document.querySelector("#es_customize_btn .home_customize_btn.active");
            if (!node) { return; }

            node.classList.remove("active");
        });

        setTimeout(() => {

            let specialoffers = document.querySelector(".special_offers");
            let browsesteam = document.querySelector(".big_buttons.home_page_content");
            let recentlyupdated = document.querySelector(".recently_updated_block");
            let under = document.querySelector("[class*='specials_under']");

            let customizer = new FCustomizer.Customizer("customize_frontpage");
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

            if (specialoffers) customizer.add("specialoffers", specialoffers.parentElement);
            if (browsesteam) customizer.add("browsesteam", browsesteam.parentElement);
            if (recentlyupdated) customizer.add("recentlyupdated", recentlyupdated.parentElement);
            if (under) customizer.add("under", under.parentElement.parentElement);

            let dynamicNodes = document.querySelectorAll(".home_page_body_ctn .home_ctn:not(.esi-customizer), .home_pagecontent_ctn");
            for (let node of dynamicNodes) {
                if (node.closest(".esi-customizer") || node.querySelector(".esi-customizer") || node.style.display === "none") { continue; }

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
        let textNode = node.querySelector("h1, h2, .home_title, .home_section_title");
        if (!textNode) return "";
        let str = "";
        for (let node of textNode.childNodes) {
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
        let value = this.settings[name];
        return (typeof value === "undefined") || value;
    }

    add(name, targets, text, forceShow) {

        let elements;

        if (typeof targets === "string") {
            elements = Array.from(document.querySelectorAll(targets));
        } else if (targets instanceof NodeList) {
            elements = Array.from(targets);
        } else {
            elements = targets ? [targets] : [];
        }

        if (!elements.length) return this;

        let state = this._getValue(name);

        let isValid = false;

        elements.forEach((element, i) => {
            if (getComputedStyle(element).display === "none" && !forceShow) {
                elements.splice(i, 1);
                return;
            }

            if (typeof text !== "string" || text === "") {
                text = this._textValue(element).toLowerCase();
                if (text === "") return;
            }

            isValid = true;
        });

        if (!isValid) return this;

        for (let element of elements) {
            element.classList.toggle("esi-shown", state);
            element.classList.toggle("esi-hidden", !state);
            element.classList.add("esi-customizer");
            element.dataset.es_name = name;
            element.dataset.es_text = text;
        }

        return this;
    }

    addDynamic(node) {
        let text = this._textValue(node).toLowerCase();
        if (text === "") return;

        this.add(`dynamic_${text}`, node, text);
    }

    build() {

        let customizerEntries = new Map();

        for (let element of document.querySelectorAll(".esi-customizer")) {

            let name = element.dataset.es_name;

            if (customizerEntries.has(name)) {
                customizerEntries.get(name).push(element);
            } else {

                let state = element.classList.contains("esi-shown");
                let text = element.dataset.es_text;

                HTML.beforeEnd("#es_customize_btn .home_viewsettings_popup",
                    `<div class="home_viewsettings_checkboxrow ellipsis" id="${name}">
                        <div class="home_viewsettings_checkbox ${state ? 'checked' : ''}"></div>
                        <div class="home_viewsettings_label">${text}</div>
                    </div>`);

                customizerEntries.set(name, [element]);
            }
        }

        for (let [name, elements] of customizerEntries) {
            let checkboxrow = document.getElementById(name);
            checkboxrow.addEventListener("click", e => {
                let state = !checkboxrow.querySelector(".checked");

                for (let element of elements) {
                    element.classList.toggle("esi-shown", state);
                    element.classList.toggle("esi-hidden", !state);
                }

                e.target.closest(".home_viewsettings_checkboxrow")
                    .querySelector(".home_viewsettings_checkbox").classList.toggle("checked", state);

                this._updateValue(name, state);
            });
        }
    }
}
