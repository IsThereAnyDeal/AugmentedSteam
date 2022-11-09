import {HTML, SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature} from "../../../modulesContent";

export default class CustomizerFeature extends CallbackFeature {
    constructor(context, id, storageKey, customizerKey) {
        super(context);

        this.id = id;
        this.storageKey = storageKey;
        this.customizerKey = customizerKey;
    }

    setup() {
        this._initialized = false;

        HTML.beforeBegin(
            document.querySelector(".sys_req").parentNode,
            `<div id="${this.id}"></div>`,
        );

        if (SyncedStorage.get(this.storageKey)) {
            this.callback(this.customizerKey);
        }
    }

    callback(type) {
        if (type !== this.customizerKey || this._initialized) { return; }
        this._initialized = true;

        const node = document.getElementById(this.id);

        // This class adds a margin, so it'd waste space if it were already added before
        node.classList.add("game_area_description");

        HTML.inner(node, this.getContent());
    }

    getContent() {
        throw new Error("not implemented");
    }
}
