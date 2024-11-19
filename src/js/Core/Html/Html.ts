import DOMPurify from "dompurify";

export default class HTML {

    static formatUrl(link: string): string {
        const protocolReg = /^[a-z]+:\/\//;
        const _link = protocolReg.test(link) ? link : `//${link}`;
        return encodeURI(_link);
    }

    static escape(str: string): string {

        // @see https://stackoverflow.com/a/4835406
        const map: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return str.replace(/[&<>"']/g, (m: string): string => {
            if (!map[m]) {
                throw new Error();
            }
            return map[m]!;
        });
    }

    static toDom(html: string): DocumentFragment {
        const template = document.createElement("template");
        template.innerHTML = DOMPurify.sanitize(html);
        return template.content;
    }

    static toElement<T extends Element>(html: string): T|null {
        // @ts-ignore
        return HTML.toDom(html).firstElementChild;
    }

    private static _getNode(nodeOrSelector: Element|string|null): Element|null {
        let node: Element|null = typeof nodeOrSelector === "string"
            ? document.querySelector(nodeOrSelector)
            : nodeOrSelector;

        if (node instanceof Element) {
            return node;
        }

        console.warn(`${node} is not an Element.`);
        console.trace();
        return null;
    }

    static inner(nodeOrSelector: Element|string, html: string): Element|null {
        const node = HTML._getNode(nodeOrSelector);

        if (node) {
            node.innerHTML = DOMPurify.sanitize(html);
        }

        return node;
    }

    static replace(nodeOrSelector: Element|string, html: string): Element|null {
        const node = HTML._getNode(nodeOrSelector);

        if (!node) {
            return null;
        }

        const dom = HTML.toDom(html); // Support replacing with multiple nodes
        const firstElement = dom.firstElementChild; // Save reference before emptying the docFrag
        node.replaceWith(dom);

        return firstElement;
    }

    static wrap<T extends Element>(
        wrapperHtml: string,
        startElementOrSelector: Element|string,
        endElementOrSelector: Element|string|null = startElementOrSelector
    ): T|null {
        const startElement = HTML._getNode(startElementOrSelector);
        if (!startElement) {
            return null;
        }

        const endElement = endElementOrSelector === null
            ? (startElement.parentElement?.lastElementChild ?? null)
            : HTML._getNode(endElementOrSelector);

        const wrappedNodes = [startElement];
        for (let cur = startElement; cur.nextElementSibling !== null && cur !== endElement; cur = cur.nextElementSibling) {
            wrappedNodes.push(cur.nextElementSibling);
        }

        const wrapperElement = HTML.toElement<T>(wrapperHtml);
        if (!wrapperElement) {
            return null;
        }

        startElement.replaceWith(wrapperElement);
        wrapperElement.append(...wrappedNodes);
        return wrapperElement;
    }

    private static _adjacent(nodeOrSelector: Element|string, position: InsertPosition, html: string): Element|null {
        const node = HTML._getNode(nodeOrSelector);
        if (node) {
            node.insertAdjacentHTML(position, DOMPurify.sanitize(html));
        }
        return node;
    }

    static beforeBegin(nodeOrSelector: Element|string|null, html: string): void {
        if (!nodeOrSelector) { return; }
        HTML._adjacent(nodeOrSelector, "beforebegin", html);
    }

    static afterBegin(nodeOrSelector: Element|string|null, html: string): void {
        if (!nodeOrSelector) { return; }
        HTML._adjacent(nodeOrSelector, "afterbegin", html);
    }

    static beforeEnd(nodeOrSelector: Element|string|null, html: string): void {
        if (!nodeOrSelector) { return; }
        HTML._adjacent(nodeOrSelector, "beforeend", html);
    }

    static afterEnd(nodeOrSelector: Element|string|null, html: string): void {
        if (!nodeOrSelector) { return; }
        HTML._adjacent(nodeOrSelector, "afterend", html);
    }
}
