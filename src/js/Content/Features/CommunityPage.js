import {Page} from "./Page";
import {CommentHandler} from "../Modules/Community/CommentHandler";

class CommunityPage extends Page {

    _pageSpecificFeatures() {
        super._pageSpecificFeatures();

        CommentHandler.hideSpamComments();
        CommentHandler.addFavoriteEmoticons();
    }

}

export {CommunityPage};
