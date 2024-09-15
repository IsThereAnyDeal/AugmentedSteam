
export default class CapacityInfo {

    public closeToFull: boolean;
    public utilization: number;

    constructor(closeToFull: boolean = false, utilization: number) {
        this.closeToFull = closeToFull;
        this.utilization = utilization;
    }
}
