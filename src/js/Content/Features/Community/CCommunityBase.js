import {CBase} from "../Common/CBase";
import {ContextType} from "../../modulesContent";
import FConfirmDeleteComment from "./FConfirmDeleteComment";
import FHideSpamComments from "./FHideSpamComments";
import FFavoriteEmoticons from "./FFavoriteEmoticons";

export class CCommunityBase extends CBase {

    constructor(type = ContextType.COMMUNITY_DEFAULT, features = []) {

        features.push(
            FConfirmDeleteComment,
            FHideSpamComments,
            FFavoriteEmoticons,
        );

        super(type, features);
    }
}
