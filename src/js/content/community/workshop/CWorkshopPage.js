import {CCommunityBase} from "community/common/CCommunityBase";

import {FBrowseWorkshops} from "community/workshop/FBrowseWorkshops";

export class CWorkshopPage extends CCommunityBase {

    constructor() {
        super([
            FBrowseWorkshops,
        ])
    }
}