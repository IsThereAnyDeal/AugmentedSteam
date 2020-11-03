import {HTML} from "./Html";

class HTMLParser {
    static clearSpecialSymbols(string) {
        return string.replace(/[\u00AE\u00A9\u2122]/g, "");
    }

    static htmlToDOM(html) {
        return HTML.fragment(html);
    }

    static htmlToElement(html) {
        return HTML.element(html);
    }

    static getVariableFromText(text, name, type) {
        let regex;
        if (type === "object") {
            regex = new RegExp(`${name}\\s*=\\s*(\\{.+?\\});`);
        } else if (type === "array") { // otherwise array
            regex = new RegExp(`${name}\\s*=\\s*(\\[.+?\\]);`);
        } else if (type === "int") {
            regex = new RegExp(`${name}\\s*=\\s*(.+?);`);
        } else if (type === "string") {
            regex = new RegExp(`${name}\\s*=\\s*(\\".+?\\");`);
        } else {
            return null;
        }

        const m = text.match(regex);
        if (m) {
            if (type === "int") {
                return parseInt(m[1]);
            }
            return JSON.parse(m[1]);
        }

        return null;
    }

    static getVariableFromDom(variableName, type, dom) {
        const _dom = dom || document;
        const nodes = _dom.querySelectorAll("script");
        for (const node of nodes) {
            const m = HTMLParser.getVariableFromText(node.textContent, variableName, type);
            if (m) {
                return m;
            }
        }
        return null;
    }
}

export {HTMLParser};
