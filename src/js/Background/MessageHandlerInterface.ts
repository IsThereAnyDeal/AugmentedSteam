
export default interface MessageHandlerInterface {
    handle(message: any): symbol|Promise<any>;
}
