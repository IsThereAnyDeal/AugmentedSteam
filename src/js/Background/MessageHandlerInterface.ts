
export default interface MessageHandlerInterface {
    handle(message: any): Promise<any|undefined>;
}
