import {HTML} from "../../Core/Html/Html";
import {Localization} from "../../Core/Localization/Localization";
import {TimeUtils} from "../../modulesCore";

class Sidebar {

    static _scrollTo(node) {
        if (!node) { return; }
        const topOffset = window.scrollY + node.getBoundingClientRect().top - 50;
        window.scrollTo({"top": topOffset, "left": 0, "behavior": "smooth"});
    }

    static _highlight(contentNode, sidebarNode) {
        const currentSelected = document.querySelector(".js-sb-sec.is-selected");

        if (currentSelected === sidebarNode) {
            return;
        } else if (currentSelected) {
            currentSelected.classList.remove("is-selected");
        }

        sidebarNode.classList.add("is-selected");

        const currentHighlight = document.querySelector(".js-section.is-highlighted");
        if (currentHighlight) {
            currentHighlight.classList.remove("is-highlighted");
        }
        contentNode.classList.add("is-highlighted");
    }

    static _handleClick(e) {
        Sidebar._handleCategoryClick(e);
        Sidebar._handleSectionClick(e);
    }

    static _handleCategoryClick(e) {
        const category = e.target.closest(".js-sb-cat");
        if (category === null) {
            return;
        }

        const contentId = category.dataset.id;
        const newPage = document.querySelector(`.js-content[data-id='${contentId}']`).closest(".js-page");
        const currentPage = document.querySelector(".js-page.is-open");

        const group = category.closest(".js-sb-grp");
        const hasSections = group.querySelector(".js-sb-sections");

        if (newPage !== currentPage) {
            currentPage.classList.remove("is-open");
            newPage.classList.add("is-open");

            const nodes = document.querySelectorAll(".js-sb-grp.is-selected");
            for (const node of nodes) {
                node.classList.remove("is-selected");
            }

            // scroll only when changing content
            if (hasSections) {
                Sidebar._scrollTo(newPage);
            } else {
                window.scrollTo(0, 0);
            }
        }

        group.classList.toggle("is-selected");
    }

    static _handleSectionClick(e) {

        const section = e.target.closest(".js-sb-sec");
        if (!section) { return; }

        const row = section.closest(".js-sb-grp");
        if (!row) { return; }

        for (const [contentNode, sidebarNode] of Sidebar._contentNodes) {
            if (sidebarNode === section) {
                Sidebar._scrollTo(contentNode);
                return;
            }
        }
    }

    static _scrollHandler() {

        if (!this._timer) {
            this._timer = TimeUtils.resettableTimer(() => {
                for (const [contentNode, sidebarNode] of Sidebar._contentNodes) {
                    const rect = contentNode.getBoundingClientRect();

                    if ((rect.top < 0 && rect.bottom > window.innerHeight) || rect.top > 0) {
                        Sidebar._highlight(contentNode, sidebarNode);
                        return;
                    }
                }
            }, 100);
        } else if (!this._timer.running) {
            this._timer.reset();
        }
    }

    static create() {

        Sidebar._contentNodes = [];

        const categories = [
            ["general", "options.general"],
            ["store", "store"],
            ["price", "price"],
            ["community", "community"],
            ["news", "news"],
            ["about", "about"],
        ];

        const sidebarEl = document.querySelector(".js-sb");

        for (const [contentId, localeKey] of categories) {
            const contentEl = document.querySelector(`.js-content[data-id='${contentId}']`);

            let multiClass = "";
            let sectionsNode = null;

            if (contentEl) {

                const sections = contentEl.querySelectorAll(".js-section");
                if (sections.length > 0) {
                    sectionsNode = document.createElement("ul");
                    sectionsNode.classList.add("sidebar__children", "js-sb-sections");

                    multiClass = " sidebar__item--multi";
                    sections.forEach(section => {
                        const sectionMenu = document.createElement("li");
                        sectionMenu.classList.add("sidebar__item", "sidebar__item--child", "js-sb-sec");
                        sectionMenu.innerText = section.querySelector(".js-section-head").textContent;

                        sectionsNode.append(sectionMenu);
                        Sidebar._contentNodes.push([section, sectionMenu]);
                    });
                }

            } else {
                console.warn("Content for sidebar entry not found");
            }

            const groupNode = HTML.toElement(
                `<div class="sidebar__group js-sb-grp">
                    <a class="sidebar__item sidebar__item--cat${multiClass} js-sb-cat" data-id="${contentId}">
                        ${Localization.getString(localeKey)}
                    </a>
                </div>`
            );

            if (sectionsNode) {
                groupNode.append(sectionsNode);
            }

            sidebarEl.append(groupNode);
        }

        sidebarEl.addEventListener("click", Sidebar._handleClick);
        document.addEventListener("scroll", Sidebar._scrollHandler);
        Sidebar._scrollHandler();
    }

}

export {Sidebar};
