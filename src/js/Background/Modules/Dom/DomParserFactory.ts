import type DomParserInterface from "@Background/Modules/Dom/DomParserInterface";
import OffscreenDomParser from "@Background/Modules/Dom/OffscreenDomParser";
import NativeDomParser from "@Background/Modules/Dom/NativeDomParser";

export default class DomParserFactory {

    private static parser: DomParserInterface|null = null;

    public static getParser(): DomParserInterface {
        if (!this.parser) {
            // @ts-expect-error
            this.parser = __CHROME || __EDGE
                ? new OffscreenDomParser()
                : new NativeDomParser();
        }
        return this.parser!;
    }
}
