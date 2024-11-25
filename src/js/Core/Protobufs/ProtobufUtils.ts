import type Long from "long";

function getNumber(value: Long|Number|null|undefined): number|null {
    if (value === null || value === undefined) {
        return null;
    }

    return Number(value);
}

export default {
    getNumber
}