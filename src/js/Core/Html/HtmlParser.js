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
        } else if (type === "array") {
            regex = new RegExp(`${name}\\s*=\\s*(\\[.+?\\]);`);
        } else if (type === "int") {
            regex = new RegExp(`${name}\\s*=\\s*(.+?);`);
        } else if (type === "string") {
            regex = new RegExp(`${name}\\s*=\\s*(\\".+?\\");`);
        } else {
            regex = new RegExp(name);
        }

        const m = text.match(regex);
        if (m) {
            if (type === "int") {
                return parseInt(m[1]);
            }

            try {
                return JSON.parse(m[1]);
            } catch {
                return null;
            }
        }

        return null;
    }

    static getVariableFromDom(name, type, dom = document) {
        for (const node of dom.querySelectorAll("script")) {
            const value = HTMLParser.getVariableFromText(node.textContent, name, type);

            if (value !== null) {
                return value;
            }
        }

        return null;
    }
}

export {HTMLParser};
