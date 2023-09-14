import {Context, ContextType} from "../../../modulesContent";
import FLincensesSummary from "./FLincensesSummary";

export class CLicenses extends Context {

    constructor() {

        super(ContextType.LICENSES, [
            FLincensesSummary,
        ]);
    }
}
