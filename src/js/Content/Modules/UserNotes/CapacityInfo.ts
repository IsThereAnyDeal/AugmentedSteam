
export default class CapacityInfo {

    public closeToFull: boolean;
    public utilization: number|null;

    constructor(closeToFull: boolean = false, utilization: number|null = null) {
        this.closeToFull = closeToFull;
        this.utilization = utilization;
    }
}
