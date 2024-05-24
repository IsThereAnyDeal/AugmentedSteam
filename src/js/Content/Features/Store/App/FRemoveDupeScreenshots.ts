import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";

export default class FRemoveDupeScreenshots extends Feature<CApp> {

    // @ts-ignore
    private _screenshots: NodeListOf<HTMLElement>

    override checkPrerequisites(): boolean {
        this._screenshots = document.querySelectorAll(".highlight_screenshot");
        return this._screenshots.length > 1;
    }

    override apply(): void {

        // Remove duplicate screenshots otherwise the highlight player will always scroll to the first one
        const ids: Set<string> = new Set();

        for (const node of this._screenshots) {
            const id = CSS.escape(node.id); // ends with file extension

            if (ids.has(id)) {
                node.remove();
                document.querySelectorAll(`#${id.replace("highlight_", "thumb_")}`)[1]!.remove();
            } else {
                ids.add(id);
            }
        }
    }
}
