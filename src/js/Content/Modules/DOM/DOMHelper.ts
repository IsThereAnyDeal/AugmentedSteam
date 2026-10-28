import browser from "webextension-polyfill";
import ExtensionResources from "@Core/ExtensionResources";

export default class DOMHelper {

    static selectLastNode<T extends Element=Element>(parent: HTMLElement|Document, selector: string): T|null {
        const nodes = parent.querySelectorAll<T>(selector);
        return nodes[nodes.length - 1] ?? null;
    }

    static insertRemoteStylesheet(url: string): void {
        const stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.type = "text/css";
        stylesheet.href = url;
        document.head.appendChild(stylesheet);
    }

    static insertStylesheet(path: string): void {
        const stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.type = "text/css";
        stylesheet.href = ExtensionResources.getURL(path);
        document.head.appendChild(stylesheet);
    }

    static insertCSS(content: string): void {
        const style = document.createElement("style");
        style.textContent = content;
        document.head.appendChild(style);
    }

    /**
     * @see https://stackoverflow.com/a/9517879
     */
    static insertScript(path: string, params: Record<string, any>|undefined=undefined): void {
        let s = document.createElement("script");
        s.src = browser.runtime.getURL(path);
        // @ts-ignore
        s.onload = function() { this.remove(); };

        if (params) {
            s.dataset.params = JSON.stringify(params);
        }

        // see also "Dynamic values in the injected code" section in this answer
        (document.head || document.documentElement).appendChild(s);
    }
}
