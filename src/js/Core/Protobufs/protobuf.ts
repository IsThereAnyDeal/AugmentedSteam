import Long from "long";
import protobufjs from "protobufjs/minimal";

protobufjs.util.Long = Long;
protobufjs.configure();

export {protobufjs};