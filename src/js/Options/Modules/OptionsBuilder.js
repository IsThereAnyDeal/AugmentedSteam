import {HTML} from "../../Core/Html/Html";
import OptionsSetup from "./Data/OptionsSetup";
import {OptionsTranslator} from "./OptionsTranslator";

class OptionsBuilder {

    static _buildCheckboxes() {

        const nodes = document.querySelectorAll("div[data-dynamic]");
        for (const node of nodes) {
            const setting = node.dataset.dynamic;
            const locale = OptionsTranslator.getTranslation(OptionsSetup[setting]) || OptionsSetup[setting];

            node.classList.add("option");

            let button = "";
            if (node.dataset.dynamicColor) {
                button = `<div class="option__buttons">
                              <input type="color" id="${setting}_color" data-setting="${setting}_color">
                              <button id="${setting}_default">${OptionsTranslator.getTranslation("theworddefault")}</button>
                          </div>`;
            }

            HTML.inner(node, `
                <input type="checkbox" id="${setting}" data-setting="${setting}">
                <label class='option__label' for="${setting}">${locale}</label>
                ${button}`);
        }

    }

    static _buildSelect() {

        const nodes = document.querySelectorAll("div[data-dynamic-select]");
        for (const node of nodes) {
            const setting = node.dataset.dynamicSelect;

            const locale = OptionsTranslator.getTranslation(OptionsSetup[setting][0]);
            const values = OptionsSetup[setting][1];

            let optionsHtml = "";
            for (const [optionValue, optionLocale] of values) {
                optionsHtml += `<option value="${optionValue}">${OptionsTranslator.getTranslation(optionLocale)}</option>`;
            }

            node.classList.add("option");
            HTML.inner(node, `
                <label class='option__label' for="${setting}">${locale}</label>
                <select id="${setting}" data-setting="${setting}">${optionsHtml}</select>`);
        }
    }

    static _buildWrapped() {

        const nodes = document.querySelectorAll("div[data-dynamic-wrap]");
        for (const node of nodes) {
            const setting = node.dataset.dynamicWrap;
            node.classList.add("option");
            HTML.inner(node, `
                    <input type="checkbox" id="${setting}" data-setting="${setting}">
                    <label class='option__label' for="${setting}">${node.innerHTML}</label>
                `);
        }
    }

    static build() {
        this._buildCheckboxes();
        this._buildSelect();
        this._buildWrapped();
    }

}

export {OptionsBuilder};
