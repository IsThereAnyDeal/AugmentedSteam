
function getAllSubids(): string[] {
    const result: string[] = [];
    for (const node of document.querySelectorAll<HTMLInputElement>("input[name=subid]")) {
        if (node.value) {
            result.push(node.value);
        }
    }
    return result;
}

export default {
    getAllSubids
}
