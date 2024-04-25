
export default interface ApiHandlerInterface {
    handle(message: any): Promise<any|undefined>;
}
