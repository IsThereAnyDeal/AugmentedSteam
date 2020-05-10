class FCustomizer extends ASFeature {

    apply() {
        if (this.context instanceof CAppPage) {
            this._customizeAppPage();
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

        let customizer = new Customizer("customize_apppage");
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
}