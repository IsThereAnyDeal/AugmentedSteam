
// Most of the code here comes from dselect.js
import {HTML} from "../../../Core/Html/Html";
import {Localization} from "../../../Core/Localization/Localization";
import {SyncedStorage} from "../../../Core/Storage/SyncedStorage";

class Sortbox {

    static init() {
        this._activeDropLists = {};
        this._lastSelectHideTime = 0;

        document.addEventListener("mousedown", e => this._handleMouseClick(e));
    }

    static _handleMouseClick(e) {
        for (const key of Object.keys(this._activeDropLists)) {
            if (!this._activeDropLists[key]) { continue; }

            const ulAboveEvent = e.target.closest("ul");

            if (ulAboveEvent && ulAboveEvent.id === `${key}_droplist`) { continue; }

            this._hide(key);
        }
    }

    static _highlightItem(id, index, bSetSelected) {
        const droplist = document.querySelector(`#${id}_droplist`);
        const trigger = document.querySelector(`#${id}_trigger`);
        const rgItems = droplist.getElementsByTagName("a");

        if (index >= 0 && index < rgItems.length) {
            const item = rgItems[index];

            if (typeof trigger.highlightedItem !== "undefined" && trigger.highlightedItem !== index) {
                rgItems[trigger.highlightedItem].className = "inactive_selection";
            }

            trigger.highlightedItem = index;
            rgItems[index].className = "highlighted_selection";

            let yOffset = rgItems[index].offsetTop + rgItems[index].clientHeight;
            let curVisibleOffset = droplist.scrollTop + droplist.clientHeight;
            let bScrolledDown = false;
            const nMaxLoopIterations = rgItems.length;
            let nLoopCounter = 0;

            while (curVisibleOffset < yOffset && nLoopCounter++ < nMaxLoopIterations) {
                droplist.scrollTop += rgItems[index].clientHeight;
                curVisibleOffset = droplist.scrollTop + droplist.clientHeight;
                bScrolledDown = true;
            }

            if (!bScrolledDown) {
                nLoopCounter = 0;
                yOffset = rgItems[index].offsetTop;
                curVisibleOffset = droplist.scrollTop;
                while (curVisibleOffset > yOffset && nLoopCounter++ < nMaxLoopIterations) {
                    droplist.scrollTop -= rgItems[index].clientHeight;
                    curVisibleOffset = droplist.scrollTop;
                }
            }

            if (bSetSelected) {
                HTML.inner(trigger, item.innerHTML);
                const input = document.querySelector(`#${id}`);
                input.value = item.id;
                input.dispatchEvent(new Event("change"));

                this._hide(id);
            }
        }
    }

    static _onFocus(id) {
        this._activeDropLists[id] = true;
    }

    static _onBlur(id) {
        if (!this._classCheck(document.querySelector(`#${id}_trigger`), "activetrigger")) { this._activeDropLists[id] = false; }
    }

    static _hide(id) {
        const droplist = document.querySelector(`#${id}_droplist`);
        const trigger = document.querySelector(`#${id}_trigger`);

        const d = new Date();
        this._lastSelectHideTime = d.valueOf();

        trigger.className = "trigger";
        droplist.className = "dropdownhidden";
        this._activeDropLists[id] = false;
        trigger.focus();
    }

    static _show(id) {
        const d = new Date();
        if (d - this._lastSelectHideTime < 50) { return; }

        const droplist = document.querySelector(`#${id}_droplist`);
        const trigger = document.querySelector(`#${id}_trigger`);

        trigger.className = "activetrigger";
        droplist.className = "dropdownvisible";
        this._activeDropLists[id] = true;
        trigger.focus();
    }

    static _onTriggerClick(id) {
        if (!this._classCheck(document.querySelector(`#${id}_trigger`), "activetrigger")) {
            this._show(id);
        }
    }

    static _classCheck(element, className) {
        return new RegExp(`\\b${className}\\b`).test(element.className);
    }

    /**
     * NOTE FOR ADDON REVIEWER:
     * Elements returned by this function are already sanitized (calls to HTML class),
     * so they can be safely inserted without being sanitized again.
     * If we would sanitize them again, all event listeners would be lost due to
     * DOMPurify only returning HTML strings.
     */
    static get(name, options, initialOption, changeFn, storageOption) {

        const id = `sort_by_${name}`;
        let reversed = initialOption.endsWith("_DESC");

        const arrowDown = "↓";
        const arrowUp = "↑";

        const box = HTML.element(
            `<div class="es-sortbox es-sortbox--${name}">
                <div class="es-sortbox__label">${Localization.str.sort_by}</div>
                <div class="es-sortbox__container">
                    <input id="${id}" type="hidden" name="${name}" value="${initialOption}">
                    <a class="trigger" id="${id}_trigger"></a>
                    <div class="es-dropdown">
                        <ul id="${id}_droplist" class="es-dropdown__list dropdownhidden"></ul>
                    </div>
                </div>
                <span class="es-sortbox__reverse">${arrowDown}</span>
            </div>`
        );

        const input = box.querySelector(`#${id}`);

        function getTrimmedValue(val) { return val.replace(/(_ASC|_DESC)$/, ""); }

        function onChange(val, reversed) {
            const _val = getTrimmedValue(val);
            changeFn(_val, reversed);
            if (storageOption) { SyncedStorage.set(storageOption, `${_val}_${reversed ? "DESC" : "ASC"}`); }
        }

        input.addEventListener("change", () => { onChange(input.value.replace(`${id}_`, ""), reversed); });

        // Trigger changeFn for initial option
        if (initialOption !== "default_ASC") {
            input.dispatchEvent(new Event("change"));
        }

        const reverseEl = box.querySelector(".es-sortbox__reverse");
        reverseEl.addEventListener("click", () => {
            reversed = !reversed;
            reverseEl.textContent = reversed ? arrowUp : arrowDown;
            onChange(input.value.replace(`${id}_`, ""), reversed);
        });
        if (reversed) { reverseEl.textContent = arrowUp; }

        const trigger = box.querySelector(`#${id}_trigger`);
        trigger.addEventListener("focus", () => this._onFocus(id));
        trigger.addEventListener("blur", () => this._onBlur(id));
        trigger.addEventListener("click", () => this._onTriggerClick(id));

        const ul = box.querySelector("ul");
        const trimmedOption = getTrimmedValue(initialOption);
        for (let i = 0; i < options.length; ++i) {
            const [key, text] = options[i];

            let toggle = "inactive";
            if (key === trimmedOption) {
                box.querySelector(`#${id}`).value = key;
                box.querySelector(".trigger").textContent = text;
                toggle = "highlighted";
            }

            HTML.beforeEnd(ul,
                `<li>
                    <a class="${toggle}_selection" tabindex="99999" id="${id}_${key}">${text}</a>
                </li>`);

            const a = ul.querySelector("li:last-child > a");

            // a.href = "javascript:DSelectNoop()";
            a.addEventListener("mouseover", () => this._highlightItem(id, i, false));
            a.addEventListener("click", () => this._highlightItem(id, i, true));
        }

        return box;
    }
}

export {Sortbox};
