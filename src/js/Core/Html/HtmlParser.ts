
export default class HTMLParser {

    private static getVariable(source: string|Element|Document, regex: RegExp): string|null {
        if (typeof source === "string") {
            const m = source.match(regex);
            return m && m[1] ? m[1] : null;
        }

        for (const node of source.querySelectorAll<HTMLScriptElement>("script")) {
            if (node.textContent) {
                const m = node.textContent.match(regex)
                if (m) {
                    return m && m[1] ? m[1] : null;
                }
            }
        }

        return null;
    }

    static getStringVariable(nameOrRegex: string|RegExp, source: string|Element|Document = document): string|null {
        const regex = typeof nameOrRegex === "string"
            ? new RegExp(`${nameOrRegex}\\s*=\\s*['"](.+?)['"];`)
            : nameOrRegex;
        return this.getVariable(source, regex);
    }

    static getIntVariable(nameOrRegex: string|RegExp, source: string|Element|Document = document): number|null {
        const regex = typeof nameOrRegex === "string"
            ? new RegExp(`${nameOrRegex}\\s*=\\s*(.+?);`)
            : nameOrRegex;
        const v = this.getVariable(source, regex);
        return v ? Number(v) : null;
    }

    static getArrayVariable<T>(nameOrRegex: string|RegExp, source: string|Element|Document = document): T[]|null {
        const regex = typeof nameOrRegex === "string"
            ? new RegExp(`${nameOrRegex}\\s*=\\s*(\\[.+?]);`)
            : nameOrRegex;
        const v = this.getVariable(source, regex);
        return v ? JSON.parse(v) : null;
    }

    static getObjectVariable<T extends Record<string, any>>(nameOrRegex: string|RegExp, source: string|Element|Document = document): T|null {
        const regex = typeof nameOrRegex === "string"
            ? new RegExp(`${nameOrRegex}\\s*=\\s*(\\{.+?});`)
            : nameOrRegex;
        const v = this.getVariable(source, regex);
        return v ? JSON.parse(v) : null;
    }
}
