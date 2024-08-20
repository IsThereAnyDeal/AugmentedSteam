import Feature from "@Content/Modules/Context/Feature";
import type CGuides from "@Content/Features/Community/Guides/CGuides";
import Settings from "@Options/Data/Settings";
import HTML from "@Core/Html/Html";

export default class FRemoveGuidesLangFilter extends Feature<CGuides> {

    override checkPrerequisites(): boolean {
        return Settings.removeguideslanguagefilter;
    }

    override apply(): void {

        for (const node of document.querySelectorAll(".rightDetailsBlock .browseOption")) {
            const linkNode = node.querySelector("a");
            if (!linkNode) { continue; }

            const newLink = new URL(linkNode.href);

            // Note the param is "requiredtags[0]" here for whatever reason
            if (newLink.searchParams.has("requiredtags[0]")) {
                newLink.searchParams.delete("requiredtags[0]");

                linkNode.href = newLink.href;

                /*
                 * There's no `onclick` attribute when filtering by Most Popular,
                 * so avoid replacing the node and breaking the day select dropdown.
                 */
                if (node.hasAttribute("onclick")) {
                    const newTab = HTML.replace(node, node.outerHTML)!; // Sanitize click listeners

                    newTab.addEventListener("click", () => {
                        window.location.href = newLink.href;
                    });
                }
            }
        }

        for (const node of document.querySelectorAll<HTMLAnchorElement>(".guides_home_view_all_link > a")) {
            const newLink = new URL(node.href);

            // First "View All" link might be for showing hidden categories
            if (newLink.searchParams.has("requiredtags[]")) {
                newLink.searchParams.delete("requiredtags[]");

                node.href = newLink.href;
            }
        }

        for (const node of document.querySelectorAll<HTMLAnchorElement>(".guide_home_category_selection")) {
            const newLink = new URL(node.href);

            // Set param to first value (category tag), which will delete the others (language tag)
            newLink.searchParams.set("requiredtags[]", newLink.searchParams.get("requiredtags[]") ?? "");

            node.href = newLink.href;
        }
    }
}
