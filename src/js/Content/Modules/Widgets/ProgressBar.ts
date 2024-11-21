import self_ from "./ProgressBar.svelte";
import Settings from "@Options/Data/Settings";
import ReactDOM from "@Content/Steam/ReactDOM";

export default class ProgressBar {

    private static build(page: "legacy"|"react", node: HTMLElement|null): void {
        if (!Settings.show_progressbar || !node) {
            return;
        }

        new self_({
            target: node.parentElement!,
            anchor: node.nextElementSibling ?? undefined,
            props: {page}
        });
    }

    static buildLegacy(): void {
        this.build("legacy", document.querySelector("#global_actions"));
    }

    static buildReact(): void {
        this.build("legacy", ReactDOM.globalActions());
    }
}
