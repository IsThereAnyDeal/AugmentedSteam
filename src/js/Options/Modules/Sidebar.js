import {HTML} from "../../Core/Html/Html";

class Sidebar {

    static _scrollTo(selector) {
        const node = document.querySelector(selector);
        if (!node) { return; }
        const topOffset = window.scrollY + node.getBoundingClientRect().top - 50;
        window.scrollTo({"top": topOffset, "left": 0, "behavior": "smooth"});
    }

    static _highlight(node) {
        const currentSelected = document.querySelector(".subentry.is-selected");

        if (!node.id) {
            if (currentSelected) {
                currentSelected.classList.remove(".is-selected");
            }
            return;
        }

        const sidebarEntry = document.querySelector(`.subentry[data-block-sel='#${node.id}']`);
        if (!sidebarEntry) { return; }

        if (currentSelected === sidebarEntry) {
            return;
        } else if (currentSelected) {
            currentSelected.classList.remove("is-selected");
        }

        sidebarEntry.classList.add("is-selected");

        const currentHighlight = document.querySelector(".content_section.is-highlighted");
        if (currentHighlight) {
            currentHighlight.classList.remove("is-highlighted");
        }
        node.classList.add("is-highlighted");
    }

    static _handleClick(e) {
        Sidebar._handleCategoryClick(e);
        Sidebar._handleSubentryClick(e);
    }

    static _handleCategoryClick(e) {
        const category = e.target.closest(".category.sidebar_entry");
        if (category === null) {
            return;
        }

        const row = category.closest(".tab_row");

        const contentNode = document.querySelector(row.dataset.blockSel);
        const selectedContent = document.querySelector(".content.selected");
        const newContent = contentNode.closest(".content");

        const hasSubentries = row.querySelector(".subentries");

        if (newContent !== selectedContent) {
            selectedContent.classList.remove("selected");

            const nodes = document.querySelectorAll(".tab_row.expanded");
            for (const node of nodes) {
                node.classList.remove("expanded");
            }

            newContent.classList.add("selected");

            // scroll only when changing content
            if (hasSubentries) {
                Sidebar._scrollTo(row.dataset.blockSel);
            } else {
                window.scrollTo(0, 0);
            }
        }

        const wasExpanded = row.classList.toggle("expanded", !row.classList.contains("expanded") || !hasSubentries);
        row.classList.toggle("collapsed", !wasExpanded);
    }

    static _handleSubentryClick(e) {

        const subentry = e.target.closest(".subentry");
        if (!subentry) { return; }

        const row = subentry.closest(".tab_row");
        if (!row) { return; }

        Sidebar._scrollTo(subentry.dataset.blockSel);
    }

    static _scrollHandler() {

        if (Sidebar._scrollTimeout) {
            return;
        }

        Sidebar._scrollTimeout = window.setTimeout(() => {
            Sidebar._scrollTimeout = null;

            for (const node of Sidebar._contentNodes) {
                const rect = node.getBoundingClientRect();

                if ((rect.top < 0 && rect.bottom > window.innerHeight) || rect.top > 0) {
                    Sidebar._highlight(node);
                    return;
                }
            }
        }, 100);
    }

    static create() {

        Sidebar._contentNodes = [];

        document.querySelectorAll(".tab_row").forEach(row => {

            const block = document.querySelector(row.dataset.blockSel);
            if (!block) {
                console.warn("Missing data-block-sel attribute on sidebar entry");
                return;
            }

            // Only create subentries for the settings
            const sections = block.querySelectorAll(".settings .content_section");
            if (sections.length === 0) { return; }

            row.classList.add(row.classList.contains("selected") ? "expanded" : "collapsed");

            HTML.beforeEnd(row.firstElementChild, '<div class="category__triangle">&#9664;</div>');

            let subentries = "";
            sections.forEach(section => {
                subentries
                    += `<li class="sidebar_entry subentry" data-block-sel="#${section.id}">
                            ${section.firstElementChild.textContent}
                        </li>`;
                Sidebar._contentNodes.push(section);
            });
            HTML.beforeEnd(row, `<ul class="subentries">${subentries}</ul>`);
        });

        document.querySelector("#side_bar").addEventListener("click", Sidebar._handleClick);
        document.addEventListener("scroll", Sidebar._scrollHandler);
        Sidebar._scrollHandler();
    }

}

export {Sidebar};
