import {CStoreBase} from "store/common/CStoreBase";

export class CStore extends CStoreBase {

    getAllSubids() {
        const result = [];
        for (const node of document.querySelectorAll("input[name=subid]")) {
            if (node.value) {
                result.push(node.value);
            }
        }
        return result;
    }
}
