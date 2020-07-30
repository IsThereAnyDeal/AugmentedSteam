import {ASFeature} from "modules/ASFeature";

import {ExtensionResources, HTML, Localization} from "core";
import {ExtensionLayer} from "common";
import {ProfileData} from "community/common";
import Config from "config";

export class FStyleSelection extends ASFeature {

    checkPrerequisites() {
        return window.location.pathname.includes("/settings");
    }

    apply() {
        
        let html =
            `<div class='group_content group_summary'>
                <div class='formRow'>
                    ${Localization.str.custom_style}:
                    <span class='formRowHint' data-tooltip-text='${Localization.str.custom_style_help}'>(?)</span>
                </div>
                <div class="es_profile_group">
                    <div id='es_style_select'>
                        <select name='es_style' id='es_style' class='gray_bevel dynInput'>
                            <option id='remove' value='remove'>${Localization.str.noneselected}</option>
                            <option id='goldenprofile' value='goldenprofile'>Lunar Sale 2019</option>
                            <option id='holiday2014' value='holiday2014'>Holiday Profile 2014</option>
                            <option id='blue' value='blue'>Blue Theme</option>
                            <option id='clear' value='clear'>Clear Theme</option>
                            <option id='green' value='green'>Green Theme</option>
                            <option id='orange' value='orange'>Orange Theme</option>
                            <option id='pink' value='pink'>Pink Theme</option>
                            <option id='purple' value='purple'>Purple Theme</option>
                            <option id='red' value='red'>Red Theme</option>
                            <option id='teal' value='teal'>Teal Theme</option>
                            <option id='yellow' value='yellow'>Yellow Theme</option>
                            <option id='grey' value='grey'>Grey Theme</option>
                        </select>
                    </div>
                    <img id='es_style_preview' class="es_profile_preview" src=''>
                    <div id="es_style_buttons" class="es_profile_buttons">
                        <span id='es_style_remove_btn' class='btn_grey_white_innerfade btn_small'>
                            <span>${Localization.str.remove}</span>
                        </span>&nbsp;
                        <span id='es_style_save_btn' class='btn_grey_white_innerfade btn_small btn_disabled'>
                            <span>${Localization.str.save}</span>
                        </span>
                    </div>
                </div>
            </div>`;

        HTML.beforeBegin(".group_content_bodytext", html);

        ExtensionLayer.runInPageContext(() => { SetupTooltips({ tooltipCSSClass: "community_tooltip" }); });

        let styleSelectNode = document.querySelector("#es_style");

        let currentStyle = ProfileData.getStyle();
        if (currentStyle) {
            styleSelectNode.value = currentStyle;

            let imgNode = document.querySelector("#es_style_preview");
            imgNode.src = ExtensionResources.getURL("img/profile_styles/" + currentStyle + "/preview.png");

            if (currentStyle === "remove") {
                imgNode.style.display = "none";
            }
        }

        styleSelectNode.addEventListener("change", function(){
            let imgNode = document.querySelector("#es_style_preview");
            if (styleSelectNode.value === "remove") {
                imgNode.style.display = "none";
            } else {
                imgNode.style.display = "block";
                imgNode.src = ExtensionResources.getURL("img/profile_styles/" + styleSelectNode.value + "/preview.png");
            }

            // Enable the "save" button
            document.querySelector("#es_style_save_btn").classList.remove("btn_disabled");
        });

        document.querySelector("#es_style_save_btn").addEventListener("click", async function(e) {
            if (e.target.closest("#es_style_save_btn").classList.contains("btn_disabled")) { return; }
            await ProfileData.clearOwn();

            let selectedStyle = encodeURIComponent(styleSelectNode.value);
            window.location.href = Config.ApiServerHost+`/v01/profile/style/edit/save/?style=${selectedStyle}`;
        });

        document.querySelector("#es_style_remove_btn").addEventListener("click", async function(e) {
            await ProfileData.clearOwn();
            window.location.href = Config.ApiServerHost + "/v01/profile/style/edit/delete/";
        });
    }
}
