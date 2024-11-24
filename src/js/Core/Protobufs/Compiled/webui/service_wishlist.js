/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const CWishlist_AddToWishlist_Request = $root.CWishlist_AddToWishlist_Request = (() => {

    /**
     * Properties of a CWishlist_AddToWishlist_Request.
     * @exports ICWishlist_AddToWishlist_Request
     * @interface ICWishlist_AddToWishlist_Request
     * @property {number|null} [appid] CWishlist_AddToWishlist_Request appid
     * @property {ICUserInterface_NavData|null} [navdata] CWishlist_AddToWishlist_Request navdata
     */

    /**
     * Constructs a new CWishlist_AddToWishlist_Request.
     * @exports CWishlist_AddToWishlist_Request
     * @classdesc Represents a CWishlist_AddToWishlist_Request.
     * @implements ICWishlist_AddToWishlist_Request
     * @constructor
     * @param {ICWishlist_AddToWishlist_Request=} [properties] Properties to set
     */
    function CWishlist_AddToWishlist_Request(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlist_AddToWishlist_Request appid.
     * @member {number} appid
     * @memberof CWishlist_AddToWishlist_Request
     * @instance
     */
    CWishlist_AddToWishlist_Request.prototype.appid = 0;

    /**
     * CWishlist_AddToWishlist_Request navdata.
     * @member {ICUserInterface_NavData|null|undefined} navdata
     * @memberof CWishlist_AddToWishlist_Request
     * @instance
     */
    CWishlist_AddToWishlist_Request.prototype.navdata = null;

    /**
     * Creates a new CWishlist_AddToWishlist_Request instance using the specified properties.
     * @function create
     * @memberof CWishlist_AddToWishlist_Request
     * @static
     * @param {ICWishlist_AddToWishlist_Request=} [properties] Properties to set
     * @returns {CWishlist_AddToWishlist_Request} CWishlist_AddToWishlist_Request instance
     */
    CWishlist_AddToWishlist_Request.create = function create(properties) {
        return new CWishlist_AddToWishlist_Request(properties);
    };

    /**
     * Encodes the specified CWishlist_AddToWishlist_Request message. Does not implicitly {@link CWishlist_AddToWishlist_Request.verify|verify} messages.
     * @function encode
     * @memberof CWishlist_AddToWishlist_Request
     * @static
     * @param {ICWishlist_AddToWishlist_Request} message CWishlist_AddToWishlist_Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_AddToWishlist_Request.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.appid != null && Object.hasOwnProperty.call(message, "appid"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.appid);
        if (message.navdata != null && Object.hasOwnProperty.call(message, "navdata"))
            $root.CUserInterface_NavData.encode(message.navdata, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified CWishlist_AddToWishlist_Request message, length delimited. Does not implicitly {@link CWishlist_AddToWishlist_Request.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlist_AddToWishlist_Request
     * @static
     * @param {ICWishlist_AddToWishlist_Request} message CWishlist_AddToWishlist_Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_AddToWishlist_Request.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlist_AddToWishlist_Request message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlist_AddToWishlist_Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlist_AddToWishlist_Request} CWishlist_AddToWishlist_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_AddToWishlist_Request.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlist_AddToWishlist_Request();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.appid = reader.uint32();
                    break;
                }
            case 2: {
                    message.navdata = $root.CUserInterface_NavData.decode(reader, reader.uint32());
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlist_AddToWishlist_Request message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlist_AddToWishlist_Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlist_AddToWishlist_Request} CWishlist_AddToWishlist_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_AddToWishlist_Request.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlist_AddToWishlist_Request message.
     * @function verify
     * @memberof CWishlist_AddToWishlist_Request
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlist_AddToWishlist_Request.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.appid != null && message.hasOwnProperty("appid"))
            if (!$util.isInteger(message.appid))
                return "appid: integer expected";
        if (message.navdata != null && message.hasOwnProperty("navdata")) {
            let error = $root.CUserInterface_NavData.verify(message.navdata);
            if (error)
                return "navdata." + error;
        }
        return null;
    };

    /**
     * Creates a CWishlist_AddToWishlist_Request message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlist_AddToWishlist_Request
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlist_AddToWishlist_Request} CWishlist_AddToWishlist_Request
     */
    CWishlist_AddToWishlist_Request.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlist_AddToWishlist_Request)
            return object;
        let message = new $root.CWishlist_AddToWishlist_Request();
        if (object.appid != null)
            message.appid = object.appid >>> 0;
        if (object.navdata != null) {
            if (typeof object.navdata !== "object")
                throw TypeError(".CWishlist_AddToWishlist_Request.navdata: object expected");
            message.navdata = $root.CUserInterface_NavData.fromObject(object.navdata);
        }
        return message;
    };

    /**
     * Creates a plain object from a CWishlist_AddToWishlist_Request message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlist_AddToWishlist_Request
     * @static
     * @param {CWishlist_AddToWishlist_Request} message CWishlist_AddToWishlist_Request
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlist_AddToWishlist_Request.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.appid = 0;
            object.navdata = null;
        }
        if (message.appid != null && message.hasOwnProperty("appid"))
            object.appid = message.appid;
        if (message.navdata != null && message.hasOwnProperty("navdata"))
            object.navdata = $root.CUserInterface_NavData.toObject(message.navdata, options);
        return object;
    };

    /**
     * Converts this CWishlist_AddToWishlist_Request to JSON.
     * @function toJSON
     * @memberof CWishlist_AddToWishlist_Request
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlist_AddToWishlist_Request.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlist_AddToWishlist_Request
     * @function getTypeUrl
     * @memberof CWishlist_AddToWishlist_Request
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlist_AddToWishlist_Request.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlist_AddToWishlist_Request";
    };

    return CWishlist_AddToWishlist_Request;
})();

export const CWishlist_AddToWishlist_Response = $root.CWishlist_AddToWishlist_Response = (() => {

    /**
     * Properties of a CWishlist_AddToWishlist_Response.
     * @exports ICWishlist_AddToWishlist_Response
     * @interface ICWishlist_AddToWishlist_Response
     * @property {number|null} [wishlistCount] CWishlist_AddToWishlist_Response wishlistCount
     */

    /**
     * Constructs a new CWishlist_AddToWishlist_Response.
     * @exports CWishlist_AddToWishlist_Response
     * @classdesc Represents a CWishlist_AddToWishlist_Response.
     * @implements ICWishlist_AddToWishlist_Response
     * @constructor
     * @param {ICWishlist_AddToWishlist_Response=} [properties] Properties to set
     */
    function CWishlist_AddToWishlist_Response(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlist_AddToWishlist_Response wishlistCount.
     * @member {number} wishlistCount
     * @memberof CWishlist_AddToWishlist_Response
     * @instance
     */
    CWishlist_AddToWishlist_Response.prototype.wishlistCount = 0;

    /**
     * Creates a new CWishlist_AddToWishlist_Response instance using the specified properties.
     * @function create
     * @memberof CWishlist_AddToWishlist_Response
     * @static
     * @param {ICWishlist_AddToWishlist_Response=} [properties] Properties to set
     * @returns {CWishlist_AddToWishlist_Response} CWishlist_AddToWishlist_Response instance
     */
    CWishlist_AddToWishlist_Response.create = function create(properties) {
        return new CWishlist_AddToWishlist_Response(properties);
    };

    /**
     * Encodes the specified CWishlist_AddToWishlist_Response message. Does not implicitly {@link CWishlist_AddToWishlist_Response.verify|verify} messages.
     * @function encode
     * @memberof CWishlist_AddToWishlist_Response
     * @static
     * @param {ICWishlist_AddToWishlist_Response} message CWishlist_AddToWishlist_Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_AddToWishlist_Response.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.wishlistCount != null && Object.hasOwnProperty.call(message, "wishlistCount"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.wishlistCount);
        return writer;
    };

    /**
     * Encodes the specified CWishlist_AddToWishlist_Response message, length delimited. Does not implicitly {@link CWishlist_AddToWishlist_Response.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlist_AddToWishlist_Response
     * @static
     * @param {ICWishlist_AddToWishlist_Response} message CWishlist_AddToWishlist_Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_AddToWishlist_Response.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlist_AddToWishlist_Response message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlist_AddToWishlist_Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlist_AddToWishlist_Response} CWishlist_AddToWishlist_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_AddToWishlist_Response.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlist_AddToWishlist_Response();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.wishlistCount = reader.uint32();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlist_AddToWishlist_Response message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlist_AddToWishlist_Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlist_AddToWishlist_Response} CWishlist_AddToWishlist_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_AddToWishlist_Response.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlist_AddToWishlist_Response message.
     * @function verify
     * @memberof CWishlist_AddToWishlist_Response
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlist_AddToWishlist_Response.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.wishlistCount != null && message.hasOwnProperty("wishlistCount"))
            if (!$util.isInteger(message.wishlistCount))
                return "wishlistCount: integer expected";
        return null;
    };

    /**
     * Creates a CWishlist_AddToWishlist_Response message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlist_AddToWishlist_Response
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlist_AddToWishlist_Response} CWishlist_AddToWishlist_Response
     */
    CWishlist_AddToWishlist_Response.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlist_AddToWishlist_Response)
            return object;
        let message = new $root.CWishlist_AddToWishlist_Response();
        if (object.wishlistCount != null)
            message.wishlistCount = object.wishlistCount >>> 0;
        return message;
    };

    /**
     * Creates a plain object from a CWishlist_AddToWishlist_Response message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlist_AddToWishlist_Response
     * @static
     * @param {CWishlist_AddToWishlist_Response} message CWishlist_AddToWishlist_Response
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlist_AddToWishlist_Response.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults)
            object.wishlistCount = 0;
        if (message.wishlistCount != null && message.hasOwnProperty("wishlistCount"))
            object.wishlistCount = message.wishlistCount;
        return object;
    };

    /**
     * Converts this CWishlist_AddToWishlist_Response to JSON.
     * @function toJSON
     * @memberof CWishlist_AddToWishlist_Response
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlist_AddToWishlist_Response.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlist_AddToWishlist_Response
     * @function getTypeUrl
     * @memberof CWishlist_AddToWishlist_Response
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlist_AddToWishlist_Response.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlist_AddToWishlist_Response";
    };

    return CWishlist_AddToWishlist_Response;
})();

export const CWishlist_GetWishlist_Request = $root.CWishlist_GetWishlist_Request = (() => {

    /**
     * Properties of a CWishlist_GetWishlist_Request.
     * @exports ICWishlist_GetWishlist_Request
     * @interface ICWishlist_GetWishlist_Request
     * @property {number|Long|null} [steamid] CWishlist_GetWishlist_Request steamid
     */

    /**
     * Constructs a new CWishlist_GetWishlist_Request.
     * @exports CWishlist_GetWishlist_Request
     * @classdesc Represents a CWishlist_GetWishlist_Request.
     * @implements ICWishlist_GetWishlist_Request
     * @constructor
     * @param {ICWishlist_GetWishlist_Request=} [properties] Properties to set
     */
    function CWishlist_GetWishlist_Request(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlist_GetWishlist_Request steamid.
     * @member {number|Long} steamid
     * @memberof CWishlist_GetWishlist_Request
     * @instance
     */
    CWishlist_GetWishlist_Request.prototype.steamid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new CWishlist_GetWishlist_Request instance using the specified properties.
     * @function create
     * @memberof CWishlist_GetWishlist_Request
     * @static
     * @param {ICWishlist_GetWishlist_Request=} [properties] Properties to set
     * @returns {CWishlist_GetWishlist_Request} CWishlist_GetWishlist_Request instance
     */
    CWishlist_GetWishlist_Request.create = function create(properties) {
        return new CWishlist_GetWishlist_Request(properties);
    };

    /**
     * Encodes the specified CWishlist_GetWishlist_Request message. Does not implicitly {@link CWishlist_GetWishlist_Request.verify|verify} messages.
     * @function encode
     * @memberof CWishlist_GetWishlist_Request
     * @static
     * @param {ICWishlist_GetWishlist_Request} message CWishlist_GetWishlist_Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlist_Request.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.steamid != null && Object.hasOwnProperty.call(message, "steamid"))
            writer.uint32(/* id 1, wireType 1 =*/9).fixed64(message.steamid);
        return writer;
    };

    /**
     * Encodes the specified CWishlist_GetWishlist_Request message, length delimited. Does not implicitly {@link CWishlist_GetWishlist_Request.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlist_GetWishlist_Request
     * @static
     * @param {ICWishlist_GetWishlist_Request} message CWishlist_GetWishlist_Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlist_Request.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlist_GetWishlist_Request message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlist_GetWishlist_Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlist_GetWishlist_Request} CWishlist_GetWishlist_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlist_Request.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlist_GetWishlist_Request();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.steamid = reader.fixed64();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlist_GetWishlist_Request message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlist_GetWishlist_Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlist_GetWishlist_Request} CWishlist_GetWishlist_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlist_Request.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlist_GetWishlist_Request message.
     * @function verify
     * @memberof CWishlist_GetWishlist_Request
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlist_GetWishlist_Request.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.steamid != null && message.hasOwnProperty("steamid"))
            if (!$util.isInteger(message.steamid) && !(message.steamid && $util.isInteger(message.steamid.low) && $util.isInteger(message.steamid.high)))
                return "steamid: integer|Long expected";
        return null;
    };

    /**
     * Creates a CWishlist_GetWishlist_Request message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlist_GetWishlist_Request
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlist_GetWishlist_Request} CWishlist_GetWishlist_Request
     */
    CWishlist_GetWishlist_Request.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlist_GetWishlist_Request)
            return object;
        let message = new $root.CWishlist_GetWishlist_Request();
        if (object.steamid != null)
            if ($util.Long)
                (message.steamid = $util.Long.fromValue(object.steamid)).unsigned = false;
            else if (typeof object.steamid === "string")
                message.steamid = parseInt(object.steamid, 10);
            else if (typeof object.steamid === "number")
                message.steamid = object.steamid;
            else if (typeof object.steamid === "object")
                message.steamid = new $util.LongBits(object.steamid.low >>> 0, object.steamid.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a CWishlist_GetWishlist_Request message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlist_GetWishlist_Request
     * @static
     * @param {CWishlist_GetWishlist_Request} message CWishlist_GetWishlist_Request
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlist_GetWishlist_Request.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults)
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.steamid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.steamid = options.longs === String ? "0" : 0;
        if (message.steamid != null && message.hasOwnProperty("steamid"))
            if (typeof message.steamid === "number")
                object.steamid = options.longs === String ? String(message.steamid) : message.steamid;
            else
                object.steamid = options.longs === String ? $util.Long.prototype.toString.call(message.steamid) : options.longs === Number ? new $util.LongBits(message.steamid.low >>> 0, message.steamid.high >>> 0).toNumber() : message.steamid;
        return object;
    };

    /**
     * Converts this CWishlist_GetWishlist_Request to JSON.
     * @function toJSON
     * @memberof CWishlist_GetWishlist_Request
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlist_GetWishlist_Request.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlist_GetWishlist_Request
     * @function getTypeUrl
     * @memberof CWishlist_GetWishlist_Request
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlist_GetWishlist_Request.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlist_GetWishlist_Request";
    };

    return CWishlist_GetWishlist_Request;
})();

export const CWishlist_GetWishlist_Response = $root.CWishlist_GetWishlist_Response = (() => {

    /**
     * Properties of a CWishlist_GetWishlist_Response.
     * @exports ICWishlist_GetWishlist_Response
     * @interface ICWishlist_GetWishlist_Response
     * @property {Array.<ICWishlist_GetWishlist_Response_WishlistItem>|null} [items] CWishlist_GetWishlist_Response items
     */

    /**
     * Constructs a new CWishlist_GetWishlist_Response.
     * @exports CWishlist_GetWishlist_Response
     * @classdesc Represents a CWishlist_GetWishlist_Response.
     * @implements ICWishlist_GetWishlist_Response
     * @constructor
     * @param {ICWishlist_GetWishlist_Response=} [properties] Properties to set
     */
    function CWishlist_GetWishlist_Response(properties) {
        this.items = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlist_GetWishlist_Response items.
     * @member {Array.<ICWishlist_GetWishlist_Response_WishlistItem>} items
     * @memberof CWishlist_GetWishlist_Response
     * @instance
     */
    CWishlist_GetWishlist_Response.prototype.items = $util.emptyArray;

    /**
     * Creates a new CWishlist_GetWishlist_Response instance using the specified properties.
     * @function create
     * @memberof CWishlist_GetWishlist_Response
     * @static
     * @param {ICWishlist_GetWishlist_Response=} [properties] Properties to set
     * @returns {CWishlist_GetWishlist_Response} CWishlist_GetWishlist_Response instance
     */
    CWishlist_GetWishlist_Response.create = function create(properties) {
        return new CWishlist_GetWishlist_Response(properties);
    };

    /**
     * Encodes the specified CWishlist_GetWishlist_Response message. Does not implicitly {@link CWishlist_GetWishlist_Response.verify|verify} messages.
     * @function encode
     * @memberof CWishlist_GetWishlist_Response
     * @static
     * @param {ICWishlist_GetWishlist_Response} message CWishlist_GetWishlist_Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlist_Response.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.items != null && message.items.length)
            for (let i = 0; i < message.items.length; ++i)
                $root.CWishlist_GetWishlist_Response_WishlistItem.encode(message.items[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified CWishlist_GetWishlist_Response message, length delimited. Does not implicitly {@link CWishlist_GetWishlist_Response.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlist_GetWishlist_Response
     * @static
     * @param {ICWishlist_GetWishlist_Response} message CWishlist_GetWishlist_Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlist_Response.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlist_GetWishlist_Response message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlist_GetWishlist_Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlist_GetWishlist_Response} CWishlist_GetWishlist_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlist_Response.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlist_GetWishlist_Response();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    if (!(message.items && message.items.length))
                        message.items = [];
                    message.items.push($root.CWishlist_GetWishlist_Response_WishlistItem.decode(reader, reader.uint32()));
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlist_GetWishlist_Response message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlist_GetWishlist_Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlist_GetWishlist_Response} CWishlist_GetWishlist_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlist_Response.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlist_GetWishlist_Response message.
     * @function verify
     * @memberof CWishlist_GetWishlist_Response
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlist_GetWishlist_Response.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.items != null && message.hasOwnProperty("items")) {
            if (!Array.isArray(message.items))
                return "items: array expected";
            for (let i = 0; i < message.items.length; ++i) {
                let error = $root.CWishlist_GetWishlist_Response_WishlistItem.verify(message.items[i]);
                if (error)
                    return "items." + error;
            }
        }
        return null;
    };

    /**
     * Creates a CWishlist_GetWishlist_Response message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlist_GetWishlist_Response
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlist_GetWishlist_Response} CWishlist_GetWishlist_Response
     */
    CWishlist_GetWishlist_Response.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlist_GetWishlist_Response)
            return object;
        let message = new $root.CWishlist_GetWishlist_Response();
        if (object.items) {
            if (!Array.isArray(object.items))
                throw TypeError(".CWishlist_GetWishlist_Response.items: array expected");
            message.items = [];
            for (let i = 0; i < object.items.length; ++i) {
                if (typeof object.items[i] !== "object")
                    throw TypeError(".CWishlist_GetWishlist_Response.items: object expected");
                message.items[i] = $root.CWishlist_GetWishlist_Response_WishlistItem.fromObject(object.items[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a CWishlist_GetWishlist_Response message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlist_GetWishlist_Response
     * @static
     * @param {CWishlist_GetWishlist_Response} message CWishlist_GetWishlist_Response
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlist_GetWishlist_Response.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.arrays || options.defaults)
            object.items = [];
        if (message.items && message.items.length) {
            object.items = [];
            for (let j = 0; j < message.items.length; ++j)
                object.items[j] = $root.CWishlist_GetWishlist_Response_WishlistItem.toObject(message.items[j], options);
        }
        return object;
    };

    /**
     * Converts this CWishlist_GetWishlist_Response to JSON.
     * @function toJSON
     * @memberof CWishlist_GetWishlist_Response
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlist_GetWishlist_Response.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlist_GetWishlist_Response
     * @function getTypeUrl
     * @memberof CWishlist_GetWishlist_Response
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlist_GetWishlist_Response.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlist_GetWishlist_Response";
    };

    return CWishlist_GetWishlist_Response;
})();

export const CWishlist_GetWishlist_Response_WishlistItem = $root.CWishlist_GetWishlist_Response_WishlistItem = (() => {

    /**
     * Properties of a CWishlist_GetWishlist_Response_WishlistItem.
     * @exports ICWishlist_GetWishlist_Response_WishlistItem
     * @interface ICWishlist_GetWishlist_Response_WishlistItem
     * @property {number|null} [appid] CWishlist_GetWishlist_Response_WishlistItem appid
     * @property {number|null} [priority] CWishlist_GetWishlist_Response_WishlistItem priority
     * @property {number|null} [dateAdded] CWishlist_GetWishlist_Response_WishlistItem dateAdded
     */

    /**
     * Constructs a new CWishlist_GetWishlist_Response_WishlistItem.
     * @exports CWishlist_GetWishlist_Response_WishlistItem
     * @classdesc Represents a CWishlist_GetWishlist_Response_WishlistItem.
     * @implements ICWishlist_GetWishlist_Response_WishlistItem
     * @constructor
     * @param {ICWishlist_GetWishlist_Response_WishlistItem=} [properties] Properties to set
     */
    function CWishlist_GetWishlist_Response_WishlistItem(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlist_GetWishlist_Response_WishlistItem appid.
     * @member {number} appid
     * @memberof CWishlist_GetWishlist_Response_WishlistItem
     * @instance
     */
    CWishlist_GetWishlist_Response_WishlistItem.prototype.appid = 0;

    /**
     * CWishlist_GetWishlist_Response_WishlistItem priority.
     * @member {number} priority
     * @memberof CWishlist_GetWishlist_Response_WishlistItem
     * @instance
     */
    CWishlist_GetWishlist_Response_WishlistItem.prototype.priority = 0;

    /**
     * CWishlist_GetWishlist_Response_WishlistItem dateAdded.
     * @member {number} dateAdded
     * @memberof CWishlist_GetWishlist_Response_WishlistItem
     * @instance
     */
    CWishlist_GetWishlist_Response_WishlistItem.prototype.dateAdded = 0;

    /**
     * Creates a new CWishlist_GetWishlist_Response_WishlistItem instance using the specified properties.
     * @function create
     * @memberof CWishlist_GetWishlist_Response_WishlistItem
     * @static
     * @param {ICWishlist_GetWishlist_Response_WishlistItem=} [properties] Properties to set
     * @returns {CWishlist_GetWishlist_Response_WishlistItem} CWishlist_GetWishlist_Response_WishlistItem instance
     */
    CWishlist_GetWishlist_Response_WishlistItem.create = function create(properties) {
        return new CWishlist_GetWishlist_Response_WishlistItem(properties);
    };

    /**
     * Encodes the specified CWishlist_GetWishlist_Response_WishlistItem message. Does not implicitly {@link CWishlist_GetWishlist_Response_WishlistItem.verify|verify} messages.
     * @function encode
     * @memberof CWishlist_GetWishlist_Response_WishlistItem
     * @static
     * @param {ICWishlist_GetWishlist_Response_WishlistItem} message CWishlist_GetWishlist_Response_WishlistItem message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlist_Response_WishlistItem.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.appid != null && Object.hasOwnProperty.call(message, "appid"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.appid);
        if (message.priority != null && Object.hasOwnProperty.call(message, "priority"))
            writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.priority);
        if (message.dateAdded != null && Object.hasOwnProperty.call(message, "dateAdded"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.dateAdded);
        return writer;
    };

    /**
     * Encodes the specified CWishlist_GetWishlist_Response_WishlistItem message, length delimited. Does not implicitly {@link CWishlist_GetWishlist_Response_WishlistItem.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlist_GetWishlist_Response_WishlistItem
     * @static
     * @param {ICWishlist_GetWishlist_Response_WishlistItem} message CWishlist_GetWishlist_Response_WishlistItem message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlist_Response_WishlistItem.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlist_GetWishlist_Response_WishlistItem message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlist_GetWishlist_Response_WishlistItem
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlist_GetWishlist_Response_WishlistItem} CWishlist_GetWishlist_Response_WishlistItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlist_Response_WishlistItem.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlist_GetWishlist_Response_WishlistItem();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.appid = reader.uint32();
                    break;
                }
            case 2: {
                    message.priority = reader.uint32();
                    break;
                }
            case 3: {
                    message.dateAdded = reader.uint32();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlist_GetWishlist_Response_WishlistItem message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlist_GetWishlist_Response_WishlistItem
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlist_GetWishlist_Response_WishlistItem} CWishlist_GetWishlist_Response_WishlistItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlist_Response_WishlistItem.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlist_GetWishlist_Response_WishlistItem message.
     * @function verify
     * @memberof CWishlist_GetWishlist_Response_WishlistItem
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlist_GetWishlist_Response_WishlistItem.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.appid != null && message.hasOwnProperty("appid"))
            if (!$util.isInteger(message.appid))
                return "appid: integer expected";
        if (message.priority != null && message.hasOwnProperty("priority"))
            if (!$util.isInteger(message.priority))
                return "priority: integer expected";
        if (message.dateAdded != null && message.hasOwnProperty("dateAdded"))
            if (!$util.isInteger(message.dateAdded))
                return "dateAdded: integer expected";
        return null;
    };

    /**
     * Creates a CWishlist_GetWishlist_Response_WishlistItem message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlist_GetWishlist_Response_WishlistItem
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlist_GetWishlist_Response_WishlistItem} CWishlist_GetWishlist_Response_WishlistItem
     */
    CWishlist_GetWishlist_Response_WishlistItem.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlist_GetWishlist_Response_WishlistItem)
            return object;
        let message = new $root.CWishlist_GetWishlist_Response_WishlistItem();
        if (object.appid != null)
            message.appid = object.appid >>> 0;
        if (object.priority != null)
            message.priority = object.priority >>> 0;
        if (object.dateAdded != null)
            message.dateAdded = object.dateAdded >>> 0;
        return message;
    };

    /**
     * Creates a plain object from a CWishlist_GetWishlist_Response_WishlistItem message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlist_GetWishlist_Response_WishlistItem
     * @static
     * @param {CWishlist_GetWishlist_Response_WishlistItem} message CWishlist_GetWishlist_Response_WishlistItem
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlist_GetWishlist_Response_WishlistItem.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.appid = 0;
            object.priority = 0;
            object.dateAdded = 0;
        }
        if (message.appid != null && message.hasOwnProperty("appid"))
            object.appid = message.appid;
        if (message.priority != null && message.hasOwnProperty("priority"))
            object.priority = message.priority;
        if (message.dateAdded != null && message.hasOwnProperty("dateAdded"))
            object.dateAdded = message.dateAdded;
        return object;
    };

    /**
     * Converts this CWishlist_GetWishlist_Response_WishlistItem to JSON.
     * @function toJSON
     * @memberof CWishlist_GetWishlist_Response_WishlistItem
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlist_GetWishlist_Response_WishlistItem.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlist_GetWishlist_Response_WishlistItem
     * @function getTypeUrl
     * @memberof CWishlist_GetWishlist_Response_WishlistItem
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlist_GetWishlist_Response_WishlistItem.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlist_GetWishlist_Response_WishlistItem";
    };

    return CWishlist_GetWishlist_Response_WishlistItem;
})();

export const CWishlist_GetWishlistItemCount_Request = $root.CWishlist_GetWishlistItemCount_Request = (() => {

    /**
     * Properties of a CWishlist_GetWishlistItemCount_Request.
     * @exports ICWishlist_GetWishlistItemCount_Request
     * @interface ICWishlist_GetWishlistItemCount_Request
     * @property {number|Long|null} [steamid] CWishlist_GetWishlistItemCount_Request steamid
     */

    /**
     * Constructs a new CWishlist_GetWishlistItemCount_Request.
     * @exports CWishlist_GetWishlistItemCount_Request
     * @classdesc Represents a CWishlist_GetWishlistItemCount_Request.
     * @implements ICWishlist_GetWishlistItemCount_Request
     * @constructor
     * @param {ICWishlist_GetWishlistItemCount_Request=} [properties] Properties to set
     */
    function CWishlist_GetWishlistItemCount_Request(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlist_GetWishlistItemCount_Request steamid.
     * @member {number|Long} steamid
     * @memberof CWishlist_GetWishlistItemCount_Request
     * @instance
     */
    CWishlist_GetWishlistItemCount_Request.prototype.steamid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new CWishlist_GetWishlistItemCount_Request instance using the specified properties.
     * @function create
     * @memberof CWishlist_GetWishlistItemCount_Request
     * @static
     * @param {ICWishlist_GetWishlistItemCount_Request=} [properties] Properties to set
     * @returns {CWishlist_GetWishlistItemCount_Request} CWishlist_GetWishlistItemCount_Request instance
     */
    CWishlist_GetWishlistItemCount_Request.create = function create(properties) {
        return new CWishlist_GetWishlistItemCount_Request(properties);
    };

    /**
     * Encodes the specified CWishlist_GetWishlistItemCount_Request message. Does not implicitly {@link CWishlist_GetWishlistItemCount_Request.verify|verify} messages.
     * @function encode
     * @memberof CWishlist_GetWishlistItemCount_Request
     * @static
     * @param {ICWishlist_GetWishlistItemCount_Request} message CWishlist_GetWishlistItemCount_Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistItemCount_Request.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.steamid != null && Object.hasOwnProperty.call(message, "steamid"))
            writer.uint32(/* id 1, wireType 1 =*/9).fixed64(message.steamid);
        return writer;
    };

    /**
     * Encodes the specified CWishlist_GetWishlistItemCount_Request message, length delimited. Does not implicitly {@link CWishlist_GetWishlistItemCount_Request.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlist_GetWishlistItemCount_Request
     * @static
     * @param {ICWishlist_GetWishlistItemCount_Request} message CWishlist_GetWishlistItemCount_Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistItemCount_Request.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlist_GetWishlistItemCount_Request message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlist_GetWishlistItemCount_Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlist_GetWishlistItemCount_Request} CWishlist_GetWishlistItemCount_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistItemCount_Request.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlist_GetWishlistItemCount_Request();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.steamid = reader.fixed64();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlist_GetWishlistItemCount_Request message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlist_GetWishlistItemCount_Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlist_GetWishlistItemCount_Request} CWishlist_GetWishlistItemCount_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistItemCount_Request.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlist_GetWishlistItemCount_Request message.
     * @function verify
     * @memberof CWishlist_GetWishlistItemCount_Request
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlist_GetWishlistItemCount_Request.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.steamid != null && message.hasOwnProperty("steamid"))
            if (!$util.isInteger(message.steamid) && !(message.steamid && $util.isInteger(message.steamid.low) && $util.isInteger(message.steamid.high)))
                return "steamid: integer|Long expected";
        return null;
    };

    /**
     * Creates a CWishlist_GetWishlistItemCount_Request message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlist_GetWishlistItemCount_Request
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlist_GetWishlistItemCount_Request} CWishlist_GetWishlistItemCount_Request
     */
    CWishlist_GetWishlistItemCount_Request.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlist_GetWishlistItemCount_Request)
            return object;
        let message = new $root.CWishlist_GetWishlistItemCount_Request();
        if (object.steamid != null)
            if ($util.Long)
                (message.steamid = $util.Long.fromValue(object.steamid)).unsigned = false;
            else if (typeof object.steamid === "string")
                message.steamid = parseInt(object.steamid, 10);
            else if (typeof object.steamid === "number")
                message.steamid = object.steamid;
            else if (typeof object.steamid === "object")
                message.steamid = new $util.LongBits(object.steamid.low >>> 0, object.steamid.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a CWishlist_GetWishlistItemCount_Request message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlist_GetWishlistItemCount_Request
     * @static
     * @param {CWishlist_GetWishlistItemCount_Request} message CWishlist_GetWishlistItemCount_Request
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlist_GetWishlistItemCount_Request.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults)
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.steamid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.steamid = options.longs === String ? "0" : 0;
        if (message.steamid != null && message.hasOwnProperty("steamid"))
            if (typeof message.steamid === "number")
                object.steamid = options.longs === String ? String(message.steamid) : message.steamid;
            else
                object.steamid = options.longs === String ? $util.Long.prototype.toString.call(message.steamid) : options.longs === Number ? new $util.LongBits(message.steamid.low >>> 0, message.steamid.high >>> 0).toNumber() : message.steamid;
        return object;
    };

    /**
     * Converts this CWishlist_GetWishlistItemCount_Request to JSON.
     * @function toJSON
     * @memberof CWishlist_GetWishlistItemCount_Request
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlist_GetWishlistItemCount_Request.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlist_GetWishlistItemCount_Request
     * @function getTypeUrl
     * @memberof CWishlist_GetWishlistItemCount_Request
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlist_GetWishlistItemCount_Request.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlist_GetWishlistItemCount_Request";
    };

    return CWishlist_GetWishlistItemCount_Request;
})();

export const CWishlist_GetWishlistItemCount_Response = $root.CWishlist_GetWishlistItemCount_Response = (() => {

    /**
     * Properties of a CWishlist_GetWishlistItemCount_Response.
     * @exports ICWishlist_GetWishlistItemCount_Response
     * @interface ICWishlist_GetWishlistItemCount_Response
     * @property {number|null} [count] CWishlist_GetWishlistItemCount_Response count
     */

    /**
     * Constructs a new CWishlist_GetWishlistItemCount_Response.
     * @exports CWishlist_GetWishlistItemCount_Response
     * @classdesc Represents a CWishlist_GetWishlistItemCount_Response.
     * @implements ICWishlist_GetWishlistItemCount_Response
     * @constructor
     * @param {ICWishlist_GetWishlistItemCount_Response=} [properties] Properties to set
     */
    function CWishlist_GetWishlistItemCount_Response(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlist_GetWishlistItemCount_Response count.
     * @member {number} count
     * @memberof CWishlist_GetWishlistItemCount_Response
     * @instance
     */
    CWishlist_GetWishlistItemCount_Response.prototype.count = 0;

    /**
     * Creates a new CWishlist_GetWishlistItemCount_Response instance using the specified properties.
     * @function create
     * @memberof CWishlist_GetWishlistItemCount_Response
     * @static
     * @param {ICWishlist_GetWishlistItemCount_Response=} [properties] Properties to set
     * @returns {CWishlist_GetWishlistItemCount_Response} CWishlist_GetWishlistItemCount_Response instance
     */
    CWishlist_GetWishlistItemCount_Response.create = function create(properties) {
        return new CWishlist_GetWishlistItemCount_Response(properties);
    };

    /**
     * Encodes the specified CWishlist_GetWishlistItemCount_Response message. Does not implicitly {@link CWishlist_GetWishlistItemCount_Response.verify|verify} messages.
     * @function encode
     * @memberof CWishlist_GetWishlistItemCount_Response
     * @static
     * @param {ICWishlist_GetWishlistItemCount_Response} message CWishlist_GetWishlistItemCount_Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistItemCount_Response.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.count != null && Object.hasOwnProperty.call(message, "count"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.count);
        return writer;
    };

    /**
     * Encodes the specified CWishlist_GetWishlistItemCount_Response message, length delimited. Does not implicitly {@link CWishlist_GetWishlistItemCount_Response.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlist_GetWishlistItemCount_Response
     * @static
     * @param {ICWishlist_GetWishlistItemCount_Response} message CWishlist_GetWishlistItemCount_Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistItemCount_Response.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlist_GetWishlistItemCount_Response message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlist_GetWishlistItemCount_Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlist_GetWishlistItemCount_Response} CWishlist_GetWishlistItemCount_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistItemCount_Response.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlist_GetWishlistItemCount_Response();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.count = reader.uint32();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlist_GetWishlistItemCount_Response message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlist_GetWishlistItemCount_Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlist_GetWishlistItemCount_Response} CWishlist_GetWishlistItemCount_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistItemCount_Response.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlist_GetWishlistItemCount_Response message.
     * @function verify
     * @memberof CWishlist_GetWishlistItemCount_Response
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlist_GetWishlistItemCount_Response.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.count != null && message.hasOwnProperty("count"))
            if (!$util.isInteger(message.count))
                return "count: integer expected";
        return null;
    };

    /**
     * Creates a CWishlist_GetWishlistItemCount_Response message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlist_GetWishlistItemCount_Response
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlist_GetWishlistItemCount_Response} CWishlist_GetWishlistItemCount_Response
     */
    CWishlist_GetWishlistItemCount_Response.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlist_GetWishlistItemCount_Response)
            return object;
        let message = new $root.CWishlist_GetWishlistItemCount_Response();
        if (object.count != null)
            message.count = object.count >>> 0;
        return message;
    };

    /**
     * Creates a plain object from a CWishlist_GetWishlistItemCount_Response message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlist_GetWishlistItemCount_Response
     * @static
     * @param {CWishlist_GetWishlistItemCount_Response} message CWishlist_GetWishlistItemCount_Response
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlist_GetWishlistItemCount_Response.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults)
            object.count = 0;
        if (message.count != null && message.hasOwnProperty("count"))
            object.count = message.count;
        return object;
    };

    /**
     * Converts this CWishlist_GetWishlistItemCount_Response to JSON.
     * @function toJSON
     * @memberof CWishlist_GetWishlistItemCount_Response
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlist_GetWishlistItemCount_Response.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlist_GetWishlistItemCount_Response
     * @function getTypeUrl
     * @memberof CWishlist_GetWishlistItemCount_Response
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlist_GetWishlistItemCount_Response.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlist_GetWishlistItemCount_Response";
    };

    return CWishlist_GetWishlistItemCount_Response;
})();

export const CWishlist_GetWishlistItemsOnSale_Request = $root.CWishlist_GetWishlistItemsOnSale_Request = (() => {

    /**
     * Properties of a CWishlist_GetWishlistItemsOnSale_Request.
     * @exports ICWishlist_GetWishlistItemsOnSale_Request
     * @interface ICWishlist_GetWishlistItemsOnSale_Request
     * @property {IStoreBrowseContext|null} [context] CWishlist_GetWishlistItemsOnSale_Request context
     * @property {IStoreBrowseItemDataRequest|null} [dataRequest] CWishlist_GetWishlistItemsOnSale_Request dataRequest
     */

    /**
     * Constructs a new CWishlist_GetWishlistItemsOnSale_Request.
     * @exports CWishlist_GetWishlistItemsOnSale_Request
     * @classdesc Represents a CWishlist_GetWishlistItemsOnSale_Request.
     * @implements ICWishlist_GetWishlistItemsOnSale_Request
     * @constructor
     * @param {ICWishlist_GetWishlistItemsOnSale_Request=} [properties] Properties to set
     */
    function CWishlist_GetWishlistItemsOnSale_Request(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlist_GetWishlistItemsOnSale_Request context.
     * @member {IStoreBrowseContext|null|undefined} context
     * @memberof CWishlist_GetWishlistItemsOnSale_Request
     * @instance
     */
    CWishlist_GetWishlistItemsOnSale_Request.prototype.context = null;

    /**
     * CWishlist_GetWishlistItemsOnSale_Request dataRequest.
     * @member {IStoreBrowseItemDataRequest|null|undefined} dataRequest
     * @memberof CWishlist_GetWishlistItemsOnSale_Request
     * @instance
     */
    CWishlist_GetWishlistItemsOnSale_Request.prototype.dataRequest = null;

    /**
     * Creates a new CWishlist_GetWishlistItemsOnSale_Request instance using the specified properties.
     * @function create
     * @memberof CWishlist_GetWishlistItemsOnSale_Request
     * @static
     * @param {ICWishlist_GetWishlistItemsOnSale_Request=} [properties] Properties to set
     * @returns {CWishlist_GetWishlistItemsOnSale_Request} CWishlist_GetWishlistItemsOnSale_Request instance
     */
    CWishlist_GetWishlistItemsOnSale_Request.create = function create(properties) {
        return new CWishlist_GetWishlistItemsOnSale_Request(properties);
    };

    /**
     * Encodes the specified CWishlist_GetWishlistItemsOnSale_Request message. Does not implicitly {@link CWishlist_GetWishlistItemsOnSale_Request.verify|verify} messages.
     * @function encode
     * @memberof CWishlist_GetWishlistItemsOnSale_Request
     * @static
     * @param {ICWishlist_GetWishlistItemsOnSale_Request} message CWishlist_GetWishlistItemsOnSale_Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistItemsOnSale_Request.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.context != null && Object.hasOwnProperty.call(message, "context"))
            $root.StoreBrowseContext.encode(message.context, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.dataRequest != null && Object.hasOwnProperty.call(message, "dataRequest"))
            $root.StoreBrowseItemDataRequest.encode(message.dataRequest, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified CWishlist_GetWishlistItemsOnSale_Request message, length delimited. Does not implicitly {@link CWishlist_GetWishlistItemsOnSale_Request.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlist_GetWishlistItemsOnSale_Request
     * @static
     * @param {ICWishlist_GetWishlistItemsOnSale_Request} message CWishlist_GetWishlistItemsOnSale_Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistItemsOnSale_Request.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlist_GetWishlistItemsOnSale_Request message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlist_GetWishlistItemsOnSale_Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlist_GetWishlistItemsOnSale_Request} CWishlist_GetWishlistItemsOnSale_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistItemsOnSale_Request.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlist_GetWishlistItemsOnSale_Request();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.context = $root.StoreBrowseContext.decode(reader, reader.uint32());
                    break;
                }
            case 2: {
                    message.dataRequest = $root.StoreBrowseItemDataRequest.decode(reader, reader.uint32());
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlist_GetWishlistItemsOnSale_Request message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlist_GetWishlistItemsOnSale_Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlist_GetWishlistItemsOnSale_Request} CWishlist_GetWishlistItemsOnSale_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistItemsOnSale_Request.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlist_GetWishlistItemsOnSale_Request message.
     * @function verify
     * @memberof CWishlist_GetWishlistItemsOnSale_Request
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlist_GetWishlistItemsOnSale_Request.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.context != null && message.hasOwnProperty("context")) {
            let error = $root.StoreBrowseContext.verify(message.context);
            if (error)
                return "context." + error;
        }
        if (message.dataRequest != null && message.hasOwnProperty("dataRequest")) {
            let error = $root.StoreBrowseItemDataRequest.verify(message.dataRequest);
            if (error)
                return "dataRequest." + error;
        }
        return null;
    };

    /**
     * Creates a CWishlist_GetWishlistItemsOnSale_Request message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlist_GetWishlistItemsOnSale_Request
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlist_GetWishlistItemsOnSale_Request} CWishlist_GetWishlistItemsOnSale_Request
     */
    CWishlist_GetWishlistItemsOnSale_Request.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlist_GetWishlistItemsOnSale_Request)
            return object;
        let message = new $root.CWishlist_GetWishlistItemsOnSale_Request();
        if (object.context != null) {
            if (typeof object.context !== "object")
                throw TypeError(".CWishlist_GetWishlistItemsOnSale_Request.context: object expected");
            message.context = $root.StoreBrowseContext.fromObject(object.context);
        }
        if (object.dataRequest != null) {
            if (typeof object.dataRequest !== "object")
                throw TypeError(".CWishlist_GetWishlistItemsOnSale_Request.dataRequest: object expected");
            message.dataRequest = $root.StoreBrowseItemDataRequest.fromObject(object.dataRequest);
        }
        return message;
    };

    /**
     * Creates a plain object from a CWishlist_GetWishlistItemsOnSale_Request message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlist_GetWishlistItemsOnSale_Request
     * @static
     * @param {CWishlist_GetWishlistItemsOnSale_Request} message CWishlist_GetWishlistItemsOnSale_Request
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlist_GetWishlistItemsOnSale_Request.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.context = null;
            object.dataRequest = null;
        }
        if (message.context != null && message.hasOwnProperty("context"))
            object.context = $root.StoreBrowseContext.toObject(message.context, options);
        if (message.dataRequest != null && message.hasOwnProperty("dataRequest"))
            object.dataRequest = $root.StoreBrowseItemDataRequest.toObject(message.dataRequest, options);
        return object;
    };

    /**
     * Converts this CWishlist_GetWishlistItemsOnSale_Request to JSON.
     * @function toJSON
     * @memberof CWishlist_GetWishlistItemsOnSale_Request
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlist_GetWishlistItemsOnSale_Request.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlist_GetWishlistItemsOnSale_Request
     * @function getTypeUrl
     * @memberof CWishlist_GetWishlistItemsOnSale_Request
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlist_GetWishlistItemsOnSale_Request.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlist_GetWishlistItemsOnSale_Request";
    };

    return CWishlist_GetWishlistItemsOnSale_Request;
})();

export const CWishlist_GetWishlistItemsOnSale_Response = $root.CWishlist_GetWishlistItemsOnSale_Response = (() => {

    /**
     * Properties of a CWishlist_GetWishlistItemsOnSale_Response.
     * @exports ICWishlist_GetWishlistItemsOnSale_Response
     * @interface ICWishlist_GetWishlistItemsOnSale_Response
     * @property {Array.<ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem>|null} [items] CWishlist_GetWishlistItemsOnSale_Response items
     */

    /**
     * Constructs a new CWishlist_GetWishlistItemsOnSale_Response.
     * @exports CWishlist_GetWishlistItemsOnSale_Response
     * @classdesc Represents a CWishlist_GetWishlistItemsOnSale_Response.
     * @implements ICWishlist_GetWishlistItemsOnSale_Response
     * @constructor
     * @param {ICWishlist_GetWishlistItemsOnSale_Response=} [properties] Properties to set
     */
    function CWishlist_GetWishlistItemsOnSale_Response(properties) {
        this.items = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlist_GetWishlistItemsOnSale_Response items.
     * @member {Array.<ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem>} items
     * @memberof CWishlist_GetWishlistItemsOnSale_Response
     * @instance
     */
    CWishlist_GetWishlistItemsOnSale_Response.prototype.items = $util.emptyArray;

    /**
     * Creates a new CWishlist_GetWishlistItemsOnSale_Response instance using the specified properties.
     * @function create
     * @memberof CWishlist_GetWishlistItemsOnSale_Response
     * @static
     * @param {ICWishlist_GetWishlistItemsOnSale_Response=} [properties] Properties to set
     * @returns {CWishlist_GetWishlistItemsOnSale_Response} CWishlist_GetWishlistItemsOnSale_Response instance
     */
    CWishlist_GetWishlistItemsOnSale_Response.create = function create(properties) {
        return new CWishlist_GetWishlistItemsOnSale_Response(properties);
    };

    /**
     * Encodes the specified CWishlist_GetWishlistItemsOnSale_Response message. Does not implicitly {@link CWishlist_GetWishlistItemsOnSale_Response.verify|verify} messages.
     * @function encode
     * @memberof CWishlist_GetWishlistItemsOnSale_Response
     * @static
     * @param {ICWishlist_GetWishlistItemsOnSale_Response} message CWishlist_GetWishlistItemsOnSale_Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistItemsOnSale_Response.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.items != null && message.items.length)
            for (let i = 0; i < message.items.length; ++i)
                $root.CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.encode(message.items[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified CWishlist_GetWishlistItemsOnSale_Response message, length delimited. Does not implicitly {@link CWishlist_GetWishlistItemsOnSale_Response.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlist_GetWishlistItemsOnSale_Response
     * @static
     * @param {ICWishlist_GetWishlistItemsOnSale_Response} message CWishlist_GetWishlistItemsOnSale_Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistItemsOnSale_Response.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlist_GetWishlistItemsOnSale_Response message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlist_GetWishlistItemsOnSale_Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlist_GetWishlistItemsOnSale_Response} CWishlist_GetWishlistItemsOnSale_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistItemsOnSale_Response.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlist_GetWishlistItemsOnSale_Response();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    if (!(message.items && message.items.length))
                        message.items = [];
                    message.items.push($root.CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.decode(reader, reader.uint32()));
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlist_GetWishlistItemsOnSale_Response message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlist_GetWishlistItemsOnSale_Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlist_GetWishlistItemsOnSale_Response} CWishlist_GetWishlistItemsOnSale_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistItemsOnSale_Response.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlist_GetWishlistItemsOnSale_Response message.
     * @function verify
     * @memberof CWishlist_GetWishlistItemsOnSale_Response
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlist_GetWishlistItemsOnSale_Response.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.items != null && message.hasOwnProperty("items")) {
            if (!Array.isArray(message.items))
                return "items: array expected";
            for (let i = 0; i < message.items.length; ++i) {
                let error = $root.CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.verify(message.items[i]);
                if (error)
                    return "items." + error;
            }
        }
        return null;
    };

    /**
     * Creates a CWishlist_GetWishlistItemsOnSale_Response message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlist_GetWishlistItemsOnSale_Response
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlist_GetWishlistItemsOnSale_Response} CWishlist_GetWishlistItemsOnSale_Response
     */
    CWishlist_GetWishlistItemsOnSale_Response.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlist_GetWishlistItemsOnSale_Response)
            return object;
        let message = new $root.CWishlist_GetWishlistItemsOnSale_Response();
        if (object.items) {
            if (!Array.isArray(object.items))
                throw TypeError(".CWishlist_GetWishlistItemsOnSale_Response.items: array expected");
            message.items = [];
            for (let i = 0; i < object.items.length; ++i) {
                if (typeof object.items[i] !== "object")
                    throw TypeError(".CWishlist_GetWishlistItemsOnSale_Response.items: object expected");
                message.items[i] = $root.CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.fromObject(object.items[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a CWishlist_GetWishlistItemsOnSale_Response message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlist_GetWishlistItemsOnSale_Response
     * @static
     * @param {CWishlist_GetWishlistItemsOnSale_Response} message CWishlist_GetWishlistItemsOnSale_Response
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlist_GetWishlistItemsOnSale_Response.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.arrays || options.defaults)
            object.items = [];
        if (message.items && message.items.length) {
            object.items = [];
            for (let j = 0; j < message.items.length; ++j)
                object.items[j] = $root.CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.toObject(message.items[j], options);
        }
        return object;
    };

    /**
     * Converts this CWishlist_GetWishlistItemsOnSale_Response to JSON.
     * @function toJSON
     * @memberof CWishlist_GetWishlistItemsOnSale_Response
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlist_GetWishlistItemsOnSale_Response.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlist_GetWishlistItemsOnSale_Response
     * @function getTypeUrl
     * @memberof CWishlist_GetWishlistItemsOnSale_Response
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlist_GetWishlistItemsOnSale_Response.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlist_GetWishlistItemsOnSale_Response";
    };

    return CWishlist_GetWishlistItemsOnSale_Response;
})();

export const CWishlist_GetWishlistItemsOnSale_Response_WishlistItem = $root.CWishlist_GetWishlistItemsOnSale_Response_WishlistItem = (() => {

    /**
     * Properties of a CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.
     * @exports ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @interface ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @property {number|null} [appid] CWishlist_GetWishlistItemsOnSale_Response_WishlistItem appid
     * @property {IStoreItem|null} [storeItem] CWishlist_GetWishlistItemsOnSale_Response_WishlistItem storeItem
     */

    /**
     * Constructs a new CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.
     * @exports CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @classdesc Represents a CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.
     * @implements ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @constructor
     * @param {ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem=} [properties] Properties to set
     */
    function CWishlist_GetWishlistItemsOnSale_Response_WishlistItem(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlist_GetWishlistItemsOnSale_Response_WishlistItem appid.
     * @member {number} appid
     * @memberof CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @instance
     */
    CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.prototype.appid = 0;

    /**
     * CWishlist_GetWishlistItemsOnSale_Response_WishlistItem storeItem.
     * @member {IStoreItem|null|undefined} storeItem
     * @memberof CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @instance
     */
    CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.prototype.storeItem = null;

    /**
     * Creates a new CWishlist_GetWishlistItemsOnSale_Response_WishlistItem instance using the specified properties.
     * @function create
     * @memberof CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @static
     * @param {ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem=} [properties] Properties to set
     * @returns {CWishlist_GetWishlistItemsOnSale_Response_WishlistItem} CWishlist_GetWishlistItemsOnSale_Response_WishlistItem instance
     */
    CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.create = function create(properties) {
        return new CWishlist_GetWishlistItemsOnSale_Response_WishlistItem(properties);
    };

    /**
     * Encodes the specified CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message. Does not implicitly {@link CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.verify|verify} messages.
     * @function encode
     * @memberof CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @static
     * @param {ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem} message CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.appid != null && Object.hasOwnProperty.call(message, "appid"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.appid);
        if (message.storeItem != null && Object.hasOwnProperty.call(message, "storeItem"))
            $root.StoreItem.encode(message.storeItem, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message, length delimited. Does not implicitly {@link CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @static
     * @param {ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem} message CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlist_GetWishlistItemsOnSale_Response_WishlistItem} CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlist_GetWishlistItemsOnSale_Response_WishlistItem();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.appid = reader.uint32();
                    break;
                }
            case 2: {
                    message.storeItem = $root.StoreItem.decode(reader, reader.uint32());
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlist_GetWishlistItemsOnSale_Response_WishlistItem} CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message.
     * @function verify
     * @memberof CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.appid != null && message.hasOwnProperty("appid"))
            if (!$util.isInteger(message.appid))
                return "appid: integer expected";
        if (message.storeItem != null && message.hasOwnProperty("storeItem")) {
            let error = $root.StoreItem.verify(message.storeItem);
            if (error)
                return "storeItem." + error;
        }
        return null;
    };

    /**
     * Creates a CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlist_GetWishlistItemsOnSale_Response_WishlistItem} CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     */
    CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlist_GetWishlistItemsOnSale_Response_WishlistItem)
            return object;
        let message = new $root.CWishlist_GetWishlistItemsOnSale_Response_WishlistItem();
        if (object.appid != null)
            message.appid = object.appid >>> 0;
        if (object.storeItem != null) {
            if (typeof object.storeItem !== "object")
                throw TypeError(".CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.storeItem: object expected");
            message.storeItem = $root.StoreItem.fromObject(object.storeItem);
        }
        return message;
    };

    /**
     * Creates a plain object from a CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @static
     * @param {CWishlist_GetWishlistItemsOnSale_Response_WishlistItem} message CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.appid = 0;
            object.storeItem = null;
        }
        if (message.appid != null && message.hasOwnProperty("appid"))
            object.appid = message.appid;
        if (message.storeItem != null && message.hasOwnProperty("storeItem"))
            object.storeItem = $root.StoreItem.toObject(message.storeItem, options);
        return object;
    };

    /**
     * Converts this CWishlist_GetWishlistItemsOnSale_Response_WishlistItem to JSON.
     * @function toJSON
     * @memberof CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @function getTypeUrl
     * @memberof CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlist_GetWishlistItemsOnSale_Response_WishlistItem";
    };

    return CWishlist_GetWishlistItemsOnSale_Response_WishlistItem;
})();

export const CWishlist_GetWishlistSortedFiltered_Request = $root.CWishlist_GetWishlistSortedFiltered_Request = (() => {

    /**
     * Properties of a CWishlist_GetWishlistSortedFiltered_Request.
     * @exports ICWishlist_GetWishlistSortedFiltered_Request
     * @interface ICWishlist_GetWishlistSortedFiltered_Request
     * @property {number|Long|null} [steamid] CWishlist_GetWishlistSortedFiltered_Request steamid
     * @property {IStoreBrowseContext|null} [context] CWishlist_GetWishlistSortedFiltered_Request context
     * @property {IStoreBrowseItemDataRequest|null} [dataRequest] CWishlist_GetWishlistSortedFiltered_Request dataRequest
     * @property {number|null} [sortOrder] CWishlist_GetWishlistSortedFiltered_Request sortOrder
     * @property {ICWishlistFilters|null} [filters] CWishlist_GetWishlistSortedFiltered_Request filters
     * @property {number|null} [startIndex] CWishlist_GetWishlistSortedFiltered_Request startIndex
     * @property {number|null} [pageSize] CWishlist_GetWishlistSortedFiltered_Request pageSize
     */

    /**
     * Constructs a new CWishlist_GetWishlistSortedFiltered_Request.
     * @exports CWishlist_GetWishlistSortedFiltered_Request
     * @classdesc Represents a CWishlist_GetWishlistSortedFiltered_Request.
     * @implements ICWishlist_GetWishlistSortedFiltered_Request
     * @constructor
     * @param {ICWishlist_GetWishlistSortedFiltered_Request=} [properties] Properties to set
     */
    function CWishlist_GetWishlistSortedFiltered_Request(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlist_GetWishlistSortedFiltered_Request steamid.
     * @member {number|Long} steamid
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @instance
     */
    CWishlist_GetWishlistSortedFiltered_Request.prototype.steamid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * CWishlist_GetWishlistSortedFiltered_Request context.
     * @member {IStoreBrowseContext|null|undefined} context
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @instance
     */
    CWishlist_GetWishlistSortedFiltered_Request.prototype.context = null;

    /**
     * CWishlist_GetWishlistSortedFiltered_Request dataRequest.
     * @member {IStoreBrowseItemDataRequest|null|undefined} dataRequest
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @instance
     */
    CWishlist_GetWishlistSortedFiltered_Request.prototype.dataRequest = null;

    /**
     * CWishlist_GetWishlistSortedFiltered_Request sortOrder.
     * @member {number} sortOrder
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @instance
     */
    CWishlist_GetWishlistSortedFiltered_Request.prototype.sortOrder = 0;

    /**
     * CWishlist_GetWishlistSortedFiltered_Request filters.
     * @member {ICWishlistFilters|null|undefined} filters
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @instance
     */
    CWishlist_GetWishlistSortedFiltered_Request.prototype.filters = null;

    /**
     * CWishlist_GetWishlistSortedFiltered_Request startIndex.
     * @member {number} startIndex
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @instance
     */
    CWishlist_GetWishlistSortedFiltered_Request.prototype.startIndex = 0;

    /**
     * CWishlist_GetWishlistSortedFiltered_Request pageSize.
     * @member {number} pageSize
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @instance
     */
    CWishlist_GetWishlistSortedFiltered_Request.prototype.pageSize = 100;

    /**
     * Creates a new CWishlist_GetWishlistSortedFiltered_Request instance using the specified properties.
     * @function create
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @static
     * @param {ICWishlist_GetWishlistSortedFiltered_Request=} [properties] Properties to set
     * @returns {CWishlist_GetWishlistSortedFiltered_Request} CWishlist_GetWishlistSortedFiltered_Request instance
     */
    CWishlist_GetWishlistSortedFiltered_Request.create = function create(properties) {
        return new CWishlist_GetWishlistSortedFiltered_Request(properties);
    };

    /**
     * Encodes the specified CWishlist_GetWishlistSortedFiltered_Request message. Does not implicitly {@link CWishlist_GetWishlistSortedFiltered_Request.verify|verify} messages.
     * @function encode
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @static
     * @param {ICWishlist_GetWishlistSortedFiltered_Request} message CWishlist_GetWishlistSortedFiltered_Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistSortedFiltered_Request.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.steamid != null && Object.hasOwnProperty.call(message, "steamid"))
            writer.uint32(/* id 1, wireType 1 =*/9).fixed64(message.steamid);
        if (message.context != null && Object.hasOwnProperty.call(message, "context"))
            $root.StoreBrowseContext.encode(message.context, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        if (message.dataRequest != null && Object.hasOwnProperty.call(message, "dataRequest"))
            $root.StoreBrowseItemDataRequest.encode(message.dataRequest, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
        if (message.sortOrder != null && Object.hasOwnProperty.call(message, "sortOrder"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.sortOrder);
        if (message.filters != null && Object.hasOwnProperty.call(message, "filters"))
            $root.CWishlistFilters.encode(message.filters, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
        if (message.startIndex != null && Object.hasOwnProperty.call(message, "startIndex"))
            writer.uint32(/* id 6, wireType 0 =*/48).int32(message.startIndex);
        if (message.pageSize != null && Object.hasOwnProperty.call(message, "pageSize"))
            writer.uint32(/* id 7, wireType 0 =*/56).int32(message.pageSize);
        return writer;
    };

    /**
     * Encodes the specified CWishlist_GetWishlistSortedFiltered_Request message, length delimited. Does not implicitly {@link CWishlist_GetWishlistSortedFiltered_Request.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @static
     * @param {ICWishlist_GetWishlistSortedFiltered_Request} message CWishlist_GetWishlistSortedFiltered_Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistSortedFiltered_Request.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlist_GetWishlistSortedFiltered_Request message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlist_GetWishlistSortedFiltered_Request} CWishlist_GetWishlistSortedFiltered_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistSortedFiltered_Request.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlist_GetWishlistSortedFiltered_Request();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.steamid = reader.fixed64();
                    break;
                }
            case 2: {
                    message.context = $root.StoreBrowseContext.decode(reader, reader.uint32());
                    break;
                }
            case 3: {
                    message.dataRequest = $root.StoreBrowseItemDataRequest.decode(reader, reader.uint32());
                    break;
                }
            case 4: {
                    message.sortOrder = reader.int32();
                    break;
                }
            case 5: {
                    message.filters = $root.CWishlistFilters.decode(reader, reader.uint32());
                    break;
                }
            case 6: {
                    message.startIndex = reader.int32();
                    break;
                }
            case 7: {
                    message.pageSize = reader.int32();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlist_GetWishlistSortedFiltered_Request message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlist_GetWishlistSortedFiltered_Request} CWishlist_GetWishlistSortedFiltered_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistSortedFiltered_Request.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlist_GetWishlistSortedFiltered_Request message.
     * @function verify
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlist_GetWishlistSortedFiltered_Request.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.steamid != null && message.hasOwnProperty("steamid"))
            if (!$util.isInteger(message.steamid) && !(message.steamid && $util.isInteger(message.steamid.low) && $util.isInteger(message.steamid.high)))
                return "steamid: integer|Long expected";
        if (message.context != null && message.hasOwnProperty("context")) {
            let error = $root.StoreBrowseContext.verify(message.context);
            if (error)
                return "context." + error;
        }
        if (message.dataRequest != null && message.hasOwnProperty("dataRequest")) {
            let error = $root.StoreBrowseItemDataRequest.verify(message.dataRequest);
            if (error)
                return "dataRequest." + error;
        }
        if (message.sortOrder != null && message.hasOwnProperty("sortOrder"))
            if (!$util.isInteger(message.sortOrder))
                return "sortOrder: integer expected";
        if (message.filters != null && message.hasOwnProperty("filters")) {
            let error = $root.CWishlistFilters.verify(message.filters);
            if (error)
                return "filters." + error;
        }
        if (message.startIndex != null && message.hasOwnProperty("startIndex"))
            if (!$util.isInteger(message.startIndex))
                return "startIndex: integer expected";
        if (message.pageSize != null && message.hasOwnProperty("pageSize"))
            if (!$util.isInteger(message.pageSize))
                return "pageSize: integer expected";
        return null;
    };

    /**
     * Creates a CWishlist_GetWishlistSortedFiltered_Request message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlist_GetWishlistSortedFiltered_Request} CWishlist_GetWishlistSortedFiltered_Request
     */
    CWishlist_GetWishlistSortedFiltered_Request.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlist_GetWishlistSortedFiltered_Request)
            return object;
        let message = new $root.CWishlist_GetWishlistSortedFiltered_Request();
        if (object.steamid != null)
            if ($util.Long)
                (message.steamid = $util.Long.fromValue(object.steamid)).unsigned = false;
            else if (typeof object.steamid === "string")
                message.steamid = parseInt(object.steamid, 10);
            else if (typeof object.steamid === "number")
                message.steamid = object.steamid;
            else if (typeof object.steamid === "object")
                message.steamid = new $util.LongBits(object.steamid.low >>> 0, object.steamid.high >>> 0).toNumber();
        if (object.context != null) {
            if (typeof object.context !== "object")
                throw TypeError(".CWishlist_GetWishlistSortedFiltered_Request.context: object expected");
            message.context = $root.StoreBrowseContext.fromObject(object.context);
        }
        if (object.dataRequest != null) {
            if (typeof object.dataRequest !== "object")
                throw TypeError(".CWishlist_GetWishlistSortedFiltered_Request.dataRequest: object expected");
            message.dataRequest = $root.StoreBrowseItemDataRequest.fromObject(object.dataRequest);
        }
        if (object.sortOrder != null)
            message.sortOrder = object.sortOrder | 0;
        if (object.filters != null) {
            if (typeof object.filters !== "object")
                throw TypeError(".CWishlist_GetWishlistSortedFiltered_Request.filters: object expected");
            message.filters = $root.CWishlistFilters.fromObject(object.filters);
        }
        if (object.startIndex != null)
            message.startIndex = object.startIndex | 0;
        if (object.pageSize != null)
            message.pageSize = object.pageSize | 0;
        return message;
    };

    /**
     * Creates a plain object from a CWishlist_GetWishlistSortedFiltered_Request message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @static
     * @param {CWishlist_GetWishlistSortedFiltered_Request} message CWishlist_GetWishlistSortedFiltered_Request
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlist_GetWishlistSortedFiltered_Request.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.steamid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.steamid = options.longs === String ? "0" : 0;
            object.context = null;
            object.dataRequest = null;
            object.sortOrder = 0;
            object.filters = null;
            object.startIndex = 0;
            object.pageSize = 100;
        }
        if (message.steamid != null && message.hasOwnProperty("steamid"))
            if (typeof message.steamid === "number")
                object.steamid = options.longs === String ? String(message.steamid) : message.steamid;
            else
                object.steamid = options.longs === String ? $util.Long.prototype.toString.call(message.steamid) : options.longs === Number ? new $util.LongBits(message.steamid.low >>> 0, message.steamid.high >>> 0).toNumber() : message.steamid;
        if (message.context != null && message.hasOwnProperty("context"))
            object.context = $root.StoreBrowseContext.toObject(message.context, options);
        if (message.dataRequest != null && message.hasOwnProperty("dataRequest"))
            object.dataRequest = $root.StoreBrowseItemDataRequest.toObject(message.dataRequest, options);
        if (message.sortOrder != null && message.hasOwnProperty("sortOrder"))
            object.sortOrder = message.sortOrder;
        if (message.filters != null && message.hasOwnProperty("filters"))
            object.filters = $root.CWishlistFilters.toObject(message.filters, options);
        if (message.startIndex != null && message.hasOwnProperty("startIndex"))
            object.startIndex = message.startIndex;
        if (message.pageSize != null && message.hasOwnProperty("pageSize"))
            object.pageSize = message.pageSize;
        return object;
    };

    /**
     * Converts this CWishlist_GetWishlistSortedFiltered_Request to JSON.
     * @function toJSON
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlist_GetWishlistSortedFiltered_Request.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlist_GetWishlistSortedFiltered_Request
     * @function getTypeUrl
     * @memberof CWishlist_GetWishlistSortedFiltered_Request
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlist_GetWishlistSortedFiltered_Request.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlist_GetWishlistSortedFiltered_Request";
    };

    return CWishlist_GetWishlistSortedFiltered_Request;
})();

export const CWishlist_GetWishlistSortedFiltered_Response = $root.CWishlist_GetWishlistSortedFiltered_Response = (() => {

    /**
     * Properties of a CWishlist_GetWishlistSortedFiltered_Response.
     * @exports ICWishlist_GetWishlistSortedFiltered_Response
     * @interface ICWishlist_GetWishlistSortedFiltered_Response
     * @property {Array.<ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem>|null} [items] CWishlist_GetWishlistSortedFiltered_Response items
     */

    /**
     * Constructs a new CWishlist_GetWishlistSortedFiltered_Response.
     * @exports CWishlist_GetWishlistSortedFiltered_Response
     * @classdesc Represents a CWishlist_GetWishlistSortedFiltered_Response.
     * @implements ICWishlist_GetWishlistSortedFiltered_Response
     * @constructor
     * @param {ICWishlist_GetWishlistSortedFiltered_Response=} [properties] Properties to set
     */
    function CWishlist_GetWishlistSortedFiltered_Response(properties) {
        this.items = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlist_GetWishlistSortedFiltered_Response items.
     * @member {Array.<ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem>} items
     * @memberof CWishlist_GetWishlistSortedFiltered_Response
     * @instance
     */
    CWishlist_GetWishlistSortedFiltered_Response.prototype.items = $util.emptyArray;

    /**
     * Creates a new CWishlist_GetWishlistSortedFiltered_Response instance using the specified properties.
     * @function create
     * @memberof CWishlist_GetWishlistSortedFiltered_Response
     * @static
     * @param {ICWishlist_GetWishlistSortedFiltered_Response=} [properties] Properties to set
     * @returns {CWishlist_GetWishlistSortedFiltered_Response} CWishlist_GetWishlistSortedFiltered_Response instance
     */
    CWishlist_GetWishlistSortedFiltered_Response.create = function create(properties) {
        return new CWishlist_GetWishlistSortedFiltered_Response(properties);
    };

    /**
     * Encodes the specified CWishlist_GetWishlistSortedFiltered_Response message. Does not implicitly {@link CWishlist_GetWishlistSortedFiltered_Response.verify|verify} messages.
     * @function encode
     * @memberof CWishlist_GetWishlistSortedFiltered_Response
     * @static
     * @param {ICWishlist_GetWishlistSortedFiltered_Response} message CWishlist_GetWishlistSortedFiltered_Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistSortedFiltered_Response.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.items != null && message.items.length)
            for (let i = 0; i < message.items.length; ++i)
                $root.CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.encode(message.items[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified CWishlist_GetWishlistSortedFiltered_Response message, length delimited. Does not implicitly {@link CWishlist_GetWishlistSortedFiltered_Response.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlist_GetWishlistSortedFiltered_Response
     * @static
     * @param {ICWishlist_GetWishlistSortedFiltered_Response} message CWishlist_GetWishlistSortedFiltered_Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistSortedFiltered_Response.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlist_GetWishlistSortedFiltered_Response message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlist_GetWishlistSortedFiltered_Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlist_GetWishlistSortedFiltered_Response} CWishlist_GetWishlistSortedFiltered_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistSortedFiltered_Response.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlist_GetWishlistSortedFiltered_Response();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    if (!(message.items && message.items.length))
                        message.items = [];
                    message.items.push($root.CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.decode(reader, reader.uint32()));
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlist_GetWishlistSortedFiltered_Response message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlist_GetWishlistSortedFiltered_Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlist_GetWishlistSortedFiltered_Response} CWishlist_GetWishlistSortedFiltered_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistSortedFiltered_Response.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlist_GetWishlistSortedFiltered_Response message.
     * @function verify
     * @memberof CWishlist_GetWishlistSortedFiltered_Response
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlist_GetWishlistSortedFiltered_Response.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.items != null && message.hasOwnProperty("items")) {
            if (!Array.isArray(message.items))
                return "items: array expected";
            for (let i = 0; i < message.items.length; ++i) {
                let error = $root.CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.verify(message.items[i]);
                if (error)
                    return "items." + error;
            }
        }
        return null;
    };

    /**
     * Creates a CWishlist_GetWishlistSortedFiltered_Response message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlist_GetWishlistSortedFiltered_Response
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlist_GetWishlistSortedFiltered_Response} CWishlist_GetWishlistSortedFiltered_Response
     */
    CWishlist_GetWishlistSortedFiltered_Response.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlist_GetWishlistSortedFiltered_Response)
            return object;
        let message = new $root.CWishlist_GetWishlistSortedFiltered_Response();
        if (object.items) {
            if (!Array.isArray(object.items))
                throw TypeError(".CWishlist_GetWishlistSortedFiltered_Response.items: array expected");
            message.items = [];
            for (let i = 0; i < object.items.length; ++i) {
                if (typeof object.items[i] !== "object")
                    throw TypeError(".CWishlist_GetWishlistSortedFiltered_Response.items: object expected");
                message.items[i] = $root.CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.fromObject(object.items[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a CWishlist_GetWishlistSortedFiltered_Response message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlist_GetWishlistSortedFiltered_Response
     * @static
     * @param {CWishlist_GetWishlistSortedFiltered_Response} message CWishlist_GetWishlistSortedFiltered_Response
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlist_GetWishlistSortedFiltered_Response.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.arrays || options.defaults)
            object.items = [];
        if (message.items && message.items.length) {
            object.items = [];
            for (let j = 0; j < message.items.length; ++j)
                object.items[j] = $root.CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.toObject(message.items[j], options);
        }
        return object;
    };

    /**
     * Converts this CWishlist_GetWishlistSortedFiltered_Response to JSON.
     * @function toJSON
     * @memberof CWishlist_GetWishlistSortedFiltered_Response
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlist_GetWishlistSortedFiltered_Response.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlist_GetWishlistSortedFiltered_Response
     * @function getTypeUrl
     * @memberof CWishlist_GetWishlistSortedFiltered_Response
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlist_GetWishlistSortedFiltered_Response.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlist_GetWishlistSortedFiltered_Response";
    };

    return CWishlist_GetWishlistSortedFiltered_Response;
})();

export const CWishlist_GetWishlistSortedFiltered_Response_WishlistItem = $root.CWishlist_GetWishlistSortedFiltered_Response_WishlistItem = (() => {

    /**
     * Properties of a CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.
     * @exports ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @interface ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @property {number|null} [appid] CWishlist_GetWishlistSortedFiltered_Response_WishlistItem appid
     * @property {number|null} [priority] CWishlist_GetWishlistSortedFiltered_Response_WishlistItem priority
     * @property {number|null} [dateAdded] CWishlist_GetWishlistSortedFiltered_Response_WishlistItem dateAdded
     * @property {IStoreItem|null} [storeItem] CWishlist_GetWishlistSortedFiltered_Response_WishlistItem storeItem
     */

    /**
     * Constructs a new CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.
     * @exports CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @classdesc Represents a CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.
     * @implements ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @constructor
     * @param {ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem=} [properties] Properties to set
     */
    function CWishlist_GetWishlistSortedFiltered_Response_WishlistItem(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlist_GetWishlistSortedFiltered_Response_WishlistItem appid.
     * @member {number} appid
     * @memberof CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @instance
     */
    CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.prototype.appid = 0;

    /**
     * CWishlist_GetWishlistSortedFiltered_Response_WishlistItem priority.
     * @member {number} priority
     * @memberof CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @instance
     */
    CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.prototype.priority = 0;

    /**
     * CWishlist_GetWishlistSortedFiltered_Response_WishlistItem dateAdded.
     * @member {number} dateAdded
     * @memberof CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @instance
     */
    CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.prototype.dateAdded = 0;

    /**
     * CWishlist_GetWishlistSortedFiltered_Response_WishlistItem storeItem.
     * @member {IStoreItem|null|undefined} storeItem
     * @memberof CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @instance
     */
    CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.prototype.storeItem = null;

    /**
     * Creates a new CWishlist_GetWishlistSortedFiltered_Response_WishlistItem instance using the specified properties.
     * @function create
     * @memberof CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @static
     * @param {ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem=} [properties] Properties to set
     * @returns {CWishlist_GetWishlistSortedFiltered_Response_WishlistItem} CWishlist_GetWishlistSortedFiltered_Response_WishlistItem instance
     */
    CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.create = function create(properties) {
        return new CWishlist_GetWishlistSortedFiltered_Response_WishlistItem(properties);
    };

    /**
     * Encodes the specified CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message. Does not implicitly {@link CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.verify|verify} messages.
     * @function encode
     * @memberof CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @static
     * @param {ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem} message CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.appid != null && Object.hasOwnProperty.call(message, "appid"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.appid);
        if (message.priority != null && Object.hasOwnProperty.call(message, "priority"))
            writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.priority);
        if (message.dateAdded != null && Object.hasOwnProperty.call(message, "dateAdded"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.dateAdded);
        if (message.storeItem != null && Object.hasOwnProperty.call(message, "storeItem"))
            $root.StoreItem.encode(message.storeItem, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message, length delimited. Does not implicitly {@link CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @static
     * @param {ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem} message CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlist_GetWishlistSortedFiltered_Response_WishlistItem} CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlist_GetWishlistSortedFiltered_Response_WishlistItem();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.appid = reader.uint32();
                    break;
                }
            case 2: {
                    message.priority = reader.uint32();
                    break;
                }
            case 3: {
                    message.dateAdded = reader.uint32();
                    break;
                }
            case 4: {
                    message.storeItem = $root.StoreItem.decode(reader, reader.uint32());
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlist_GetWishlistSortedFiltered_Response_WishlistItem} CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message.
     * @function verify
     * @memberof CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.appid != null && message.hasOwnProperty("appid"))
            if (!$util.isInteger(message.appid))
                return "appid: integer expected";
        if (message.priority != null && message.hasOwnProperty("priority"))
            if (!$util.isInteger(message.priority))
                return "priority: integer expected";
        if (message.dateAdded != null && message.hasOwnProperty("dateAdded"))
            if (!$util.isInteger(message.dateAdded))
                return "dateAdded: integer expected";
        if (message.storeItem != null && message.hasOwnProperty("storeItem")) {
            let error = $root.StoreItem.verify(message.storeItem);
            if (error)
                return "storeItem." + error;
        }
        return null;
    };

    /**
     * Creates a CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlist_GetWishlistSortedFiltered_Response_WishlistItem} CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     */
    CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlist_GetWishlistSortedFiltered_Response_WishlistItem)
            return object;
        let message = new $root.CWishlist_GetWishlistSortedFiltered_Response_WishlistItem();
        if (object.appid != null)
            message.appid = object.appid >>> 0;
        if (object.priority != null)
            message.priority = object.priority >>> 0;
        if (object.dateAdded != null)
            message.dateAdded = object.dateAdded >>> 0;
        if (object.storeItem != null) {
            if (typeof object.storeItem !== "object")
                throw TypeError(".CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.storeItem: object expected");
            message.storeItem = $root.StoreItem.fromObject(object.storeItem);
        }
        return message;
    };

    /**
     * Creates a plain object from a CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @static
     * @param {CWishlist_GetWishlistSortedFiltered_Response_WishlistItem} message CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.appid = 0;
            object.priority = 0;
            object.dateAdded = 0;
            object.storeItem = null;
        }
        if (message.appid != null && message.hasOwnProperty("appid"))
            object.appid = message.appid;
        if (message.priority != null && message.hasOwnProperty("priority"))
            object.priority = message.priority;
        if (message.dateAdded != null && message.hasOwnProperty("dateAdded"))
            object.dateAdded = message.dateAdded;
        if (message.storeItem != null && message.hasOwnProperty("storeItem"))
            object.storeItem = $root.StoreItem.toObject(message.storeItem, options);
        return object;
    };

    /**
     * Converts this CWishlist_GetWishlistSortedFiltered_Response_WishlistItem to JSON.
     * @function toJSON
     * @memberof CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @function getTypeUrl
     * @memberof CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlist_GetWishlistSortedFiltered_Response_WishlistItem";
    };

    return CWishlist_GetWishlistSortedFiltered_Response_WishlistItem;
})();

export const CWishlist_RemoveFromWishlist_Request = $root.CWishlist_RemoveFromWishlist_Request = (() => {

    /**
     * Properties of a CWishlist_RemoveFromWishlist_Request.
     * @exports ICWishlist_RemoveFromWishlist_Request
     * @interface ICWishlist_RemoveFromWishlist_Request
     * @property {number|null} [appid] CWishlist_RemoveFromWishlist_Request appid
     */

    /**
     * Constructs a new CWishlist_RemoveFromWishlist_Request.
     * @exports CWishlist_RemoveFromWishlist_Request
     * @classdesc Represents a CWishlist_RemoveFromWishlist_Request.
     * @implements ICWishlist_RemoveFromWishlist_Request
     * @constructor
     * @param {ICWishlist_RemoveFromWishlist_Request=} [properties] Properties to set
     */
    function CWishlist_RemoveFromWishlist_Request(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlist_RemoveFromWishlist_Request appid.
     * @member {number} appid
     * @memberof CWishlist_RemoveFromWishlist_Request
     * @instance
     */
    CWishlist_RemoveFromWishlist_Request.prototype.appid = 0;

    /**
     * Creates a new CWishlist_RemoveFromWishlist_Request instance using the specified properties.
     * @function create
     * @memberof CWishlist_RemoveFromWishlist_Request
     * @static
     * @param {ICWishlist_RemoveFromWishlist_Request=} [properties] Properties to set
     * @returns {CWishlist_RemoveFromWishlist_Request} CWishlist_RemoveFromWishlist_Request instance
     */
    CWishlist_RemoveFromWishlist_Request.create = function create(properties) {
        return new CWishlist_RemoveFromWishlist_Request(properties);
    };

    /**
     * Encodes the specified CWishlist_RemoveFromWishlist_Request message. Does not implicitly {@link CWishlist_RemoveFromWishlist_Request.verify|verify} messages.
     * @function encode
     * @memberof CWishlist_RemoveFromWishlist_Request
     * @static
     * @param {ICWishlist_RemoveFromWishlist_Request} message CWishlist_RemoveFromWishlist_Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_RemoveFromWishlist_Request.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.appid != null && Object.hasOwnProperty.call(message, "appid"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.appid);
        return writer;
    };

    /**
     * Encodes the specified CWishlist_RemoveFromWishlist_Request message, length delimited. Does not implicitly {@link CWishlist_RemoveFromWishlist_Request.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlist_RemoveFromWishlist_Request
     * @static
     * @param {ICWishlist_RemoveFromWishlist_Request} message CWishlist_RemoveFromWishlist_Request message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_RemoveFromWishlist_Request.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlist_RemoveFromWishlist_Request message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlist_RemoveFromWishlist_Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlist_RemoveFromWishlist_Request} CWishlist_RemoveFromWishlist_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_RemoveFromWishlist_Request.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlist_RemoveFromWishlist_Request();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.appid = reader.uint32();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlist_RemoveFromWishlist_Request message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlist_RemoveFromWishlist_Request
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlist_RemoveFromWishlist_Request} CWishlist_RemoveFromWishlist_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_RemoveFromWishlist_Request.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlist_RemoveFromWishlist_Request message.
     * @function verify
     * @memberof CWishlist_RemoveFromWishlist_Request
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlist_RemoveFromWishlist_Request.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.appid != null && message.hasOwnProperty("appid"))
            if (!$util.isInteger(message.appid))
                return "appid: integer expected";
        return null;
    };

    /**
     * Creates a CWishlist_RemoveFromWishlist_Request message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlist_RemoveFromWishlist_Request
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlist_RemoveFromWishlist_Request} CWishlist_RemoveFromWishlist_Request
     */
    CWishlist_RemoveFromWishlist_Request.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlist_RemoveFromWishlist_Request)
            return object;
        let message = new $root.CWishlist_RemoveFromWishlist_Request();
        if (object.appid != null)
            message.appid = object.appid >>> 0;
        return message;
    };

    /**
     * Creates a plain object from a CWishlist_RemoveFromWishlist_Request message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlist_RemoveFromWishlist_Request
     * @static
     * @param {CWishlist_RemoveFromWishlist_Request} message CWishlist_RemoveFromWishlist_Request
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlist_RemoveFromWishlist_Request.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults)
            object.appid = 0;
        if (message.appid != null && message.hasOwnProperty("appid"))
            object.appid = message.appid;
        return object;
    };

    /**
     * Converts this CWishlist_RemoveFromWishlist_Request to JSON.
     * @function toJSON
     * @memberof CWishlist_RemoveFromWishlist_Request
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlist_RemoveFromWishlist_Request.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlist_RemoveFromWishlist_Request
     * @function getTypeUrl
     * @memberof CWishlist_RemoveFromWishlist_Request
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlist_RemoveFromWishlist_Request.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlist_RemoveFromWishlist_Request";
    };

    return CWishlist_RemoveFromWishlist_Request;
})();

export const CWishlist_RemoveFromWishlist_Response = $root.CWishlist_RemoveFromWishlist_Response = (() => {

    /**
     * Properties of a CWishlist_RemoveFromWishlist_Response.
     * @exports ICWishlist_RemoveFromWishlist_Response
     * @interface ICWishlist_RemoveFromWishlist_Response
     * @property {number|null} [wishlistCount] CWishlist_RemoveFromWishlist_Response wishlistCount
     */

    /**
     * Constructs a new CWishlist_RemoveFromWishlist_Response.
     * @exports CWishlist_RemoveFromWishlist_Response
     * @classdesc Represents a CWishlist_RemoveFromWishlist_Response.
     * @implements ICWishlist_RemoveFromWishlist_Response
     * @constructor
     * @param {ICWishlist_RemoveFromWishlist_Response=} [properties] Properties to set
     */
    function CWishlist_RemoveFromWishlist_Response(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlist_RemoveFromWishlist_Response wishlistCount.
     * @member {number} wishlistCount
     * @memberof CWishlist_RemoveFromWishlist_Response
     * @instance
     */
    CWishlist_RemoveFromWishlist_Response.prototype.wishlistCount = 0;

    /**
     * Creates a new CWishlist_RemoveFromWishlist_Response instance using the specified properties.
     * @function create
     * @memberof CWishlist_RemoveFromWishlist_Response
     * @static
     * @param {ICWishlist_RemoveFromWishlist_Response=} [properties] Properties to set
     * @returns {CWishlist_RemoveFromWishlist_Response} CWishlist_RemoveFromWishlist_Response instance
     */
    CWishlist_RemoveFromWishlist_Response.create = function create(properties) {
        return new CWishlist_RemoveFromWishlist_Response(properties);
    };

    /**
     * Encodes the specified CWishlist_RemoveFromWishlist_Response message. Does not implicitly {@link CWishlist_RemoveFromWishlist_Response.verify|verify} messages.
     * @function encode
     * @memberof CWishlist_RemoveFromWishlist_Response
     * @static
     * @param {ICWishlist_RemoveFromWishlist_Response} message CWishlist_RemoveFromWishlist_Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_RemoveFromWishlist_Response.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.wishlistCount != null && Object.hasOwnProperty.call(message, "wishlistCount"))
            writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.wishlistCount);
        return writer;
    };

    /**
     * Encodes the specified CWishlist_RemoveFromWishlist_Response message, length delimited. Does not implicitly {@link CWishlist_RemoveFromWishlist_Response.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlist_RemoveFromWishlist_Response
     * @static
     * @param {ICWishlist_RemoveFromWishlist_Response} message CWishlist_RemoveFromWishlist_Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlist_RemoveFromWishlist_Response.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlist_RemoveFromWishlist_Response message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlist_RemoveFromWishlist_Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlist_RemoveFromWishlist_Response} CWishlist_RemoveFromWishlist_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_RemoveFromWishlist_Response.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlist_RemoveFromWishlist_Response();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.wishlistCount = reader.uint32();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlist_RemoveFromWishlist_Response message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlist_RemoveFromWishlist_Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlist_RemoveFromWishlist_Response} CWishlist_RemoveFromWishlist_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlist_RemoveFromWishlist_Response.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlist_RemoveFromWishlist_Response message.
     * @function verify
     * @memberof CWishlist_RemoveFromWishlist_Response
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlist_RemoveFromWishlist_Response.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.wishlistCount != null && message.hasOwnProperty("wishlistCount"))
            if (!$util.isInteger(message.wishlistCount))
                return "wishlistCount: integer expected";
        return null;
    };

    /**
     * Creates a CWishlist_RemoveFromWishlist_Response message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlist_RemoveFromWishlist_Response
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlist_RemoveFromWishlist_Response} CWishlist_RemoveFromWishlist_Response
     */
    CWishlist_RemoveFromWishlist_Response.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlist_RemoveFromWishlist_Response)
            return object;
        let message = new $root.CWishlist_RemoveFromWishlist_Response();
        if (object.wishlistCount != null)
            message.wishlistCount = object.wishlistCount >>> 0;
        return message;
    };

    /**
     * Creates a plain object from a CWishlist_RemoveFromWishlist_Response message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlist_RemoveFromWishlist_Response
     * @static
     * @param {CWishlist_RemoveFromWishlist_Response} message CWishlist_RemoveFromWishlist_Response
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlist_RemoveFromWishlist_Response.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults)
            object.wishlistCount = 0;
        if (message.wishlistCount != null && message.hasOwnProperty("wishlistCount"))
            object.wishlistCount = message.wishlistCount;
        return object;
    };

    /**
     * Converts this CWishlist_RemoveFromWishlist_Response to JSON.
     * @function toJSON
     * @memberof CWishlist_RemoveFromWishlist_Response
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlist_RemoveFromWishlist_Response.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlist_RemoveFromWishlist_Response
     * @function getTypeUrl
     * @memberof CWishlist_RemoveFromWishlist_Response
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlist_RemoveFromWishlist_Response.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlist_RemoveFromWishlist_Response";
    };

    return CWishlist_RemoveFromWishlist_Response;
})();

export const CWishlistFilters = $root.CWishlistFilters = (() => {

    /**
     * Properties of a CWishlistFilters.
     * @exports ICWishlistFilters
     * @interface ICWishlistFilters
     * @property {boolean|null} [macosOnly] CWishlistFilters macosOnly
     * @property {boolean|null} [steamosLinuxOnly] CWishlistFilters steamosLinuxOnly
     * @property {boolean|null} [onlyGames] CWishlistFilters onlyGames
     * @property {boolean|null} [onlySoftware] CWishlistFilters onlySoftware
     * @property {boolean|null} [onlyDlc] CWishlistFilters onlyDlc
     * @property {boolean|null} [onlyFree] CWishlistFilters onlyFree
     * @property {number|Long|null} [maxPriceInCents] CWishlistFilters maxPriceInCents
     * @property {number|null} [minDiscountPercent] CWishlistFilters minDiscountPercent
     * @property {ICWishlistFilters_ExcludeTypeFilters|null} [excludeTypes] CWishlistFilters excludeTypes
     * @property {ICWishlistFilters_SteamDeckFilters|null} [steamDeckFilters] CWishlistFilters steamDeckFilters
     */

    /**
     * Constructs a new CWishlistFilters.
     * @exports CWishlistFilters
     * @classdesc Represents a CWishlistFilters.
     * @implements ICWishlistFilters
     * @constructor
     * @param {ICWishlistFilters=} [properties] Properties to set
     */
    function CWishlistFilters(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlistFilters macosOnly.
     * @member {boolean} macosOnly
     * @memberof CWishlistFilters
     * @instance
     */
    CWishlistFilters.prototype.macosOnly = false;

    /**
     * CWishlistFilters steamosLinuxOnly.
     * @member {boolean} steamosLinuxOnly
     * @memberof CWishlistFilters
     * @instance
     */
    CWishlistFilters.prototype.steamosLinuxOnly = false;

    /**
     * CWishlistFilters onlyGames.
     * @member {boolean} onlyGames
     * @memberof CWishlistFilters
     * @instance
     */
    CWishlistFilters.prototype.onlyGames = false;

    /**
     * CWishlistFilters onlySoftware.
     * @member {boolean} onlySoftware
     * @memberof CWishlistFilters
     * @instance
     */
    CWishlistFilters.prototype.onlySoftware = false;

    /**
     * CWishlistFilters onlyDlc.
     * @member {boolean} onlyDlc
     * @memberof CWishlistFilters
     * @instance
     */
    CWishlistFilters.prototype.onlyDlc = false;

    /**
     * CWishlistFilters onlyFree.
     * @member {boolean} onlyFree
     * @memberof CWishlistFilters
     * @instance
     */
    CWishlistFilters.prototype.onlyFree = false;

    /**
     * CWishlistFilters maxPriceInCents.
     * @member {number|Long} maxPriceInCents
     * @memberof CWishlistFilters
     * @instance
     */
    CWishlistFilters.prototype.maxPriceInCents = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * CWishlistFilters minDiscountPercent.
     * @member {number} minDiscountPercent
     * @memberof CWishlistFilters
     * @instance
     */
    CWishlistFilters.prototype.minDiscountPercent = 0;

    /**
     * CWishlistFilters excludeTypes.
     * @member {ICWishlistFilters_ExcludeTypeFilters|null|undefined} excludeTypes
     * @memberof CWishlistFilters
     * @instance
     */
    CWishlistFilters.prototype.excludeTypes = null;

    /**
     * CWishlistFilters steamDeckFilters.
     * @member {ICWishlistFilters_SteamDeckFilters|null|undefined} steamDeckFilters
     * @memberof CWishlistFilters
     * @instance
     */
    CWishlistFilters.prototype.steamDeckFilters = null;

    /**
     * Creates a new CWishlistFilters instance using the specified properties.
     * @function create
     * @memberof CWishlistFilters
     * @static
     * @param {ICWishlistFilters=} [properties] Properties to set
     * @returns {CWishlistFilters} CWishlistFilters instance
     */
    CWishlistFilters.create = function create(properties) {
        return new CWishlistFilters(properties);
    };

    /**
     * Encodes the specified CWishlistFilters message. Does not implicitly {@link CWishlistFilters.verify|verify} messages.
     * @function encode
     * @memberof CWishlistFilters
     * @static
     * @param {ICWishlistFilters} message CWishlistFilters message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlistFilters.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.macosOnly != null && Object.hasOwnProperty.call(message, "macosOnly"))
            writer.uint32(/* id 1, wireType 0 =*/8).bool(message.macosOnly);
        if (message.steamosLinuxOnly != null && Object.hasOwnProperty.call(message, "steamosLinuxOnly"))
            writer.uint32(/* id 2, wireType 0 =*/16).bool(message.steamosLinuxOnly);
        if (message.onlyGames != null && Object.hasOwnProperty.call(message, "onlyGames"))
            writer.uint32(/* id 10, wireType 0 =*/80).bool(message.onlyGames);
        if (message.onlySoftware != null && Object.hasOwnProperty.call(message, "onlySoftware"))
            writer.uint32(/* id 11, wireType 0 =*/88).bool(message.onlySoftware);
        if (message.onlyDlc != null && Object.hasOwnProperty.call(message, "onlyDlc"))
            writer.uint32(/* id 12, wireType 0 =*/96).bool(message.onlyDlc);
        if (message.onlyFree != null && Object.hasOwnProperty.call(message, "onlyFree"))
            writer.uint32(/* id 13, wireType 0 =*/104).bool(message.onlyFree);
        if (message.maxPriceInCents != null && Object.hasOwnProperty.call(message, "maxPriceInCents"))
            writer.uint32(/* id 20, wireType 0 =*/160).int64(message.maxPriceInCents);
        if (message.minDiscountPercent != null && Object.hasOwnProperty.call(message, "minDiscountPercent"))
            writer.uint32(/* id 21, wireType 0 =*/168).int32(message.minDiscountPercent);
        if (message.excludeTypes != null && Object.hasOwnProperty.call(message, "excludeTypes"))
            $root.CWishlistFilters_ExcludeTypeFilters.encode(message.excludeTypes, writer.uint32(/* id 22, wireType 2 =*/178).fork()).ldelim();
        if (message.steamDeckFilters != null && Object.hasOwnProperty.call(message, "steamDeckFilters"))
            $root.CWishlistFilters_SteamDeckFilters.encode(message.steamDeckFilters, writer.uint32(/* id 23, wireType 2 =*/186).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified CWishlistFilters message, length delimited. Does not implicitly {@link CWishlistFilters.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlistFilters
     * @static
     * @param {ICWishlistFilters} message CWishlistFilters message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlistFilters.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlistFilters message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlistFilters
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlistFilters} CWishlistFilters
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlistFilters.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlistFilters();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.macosOnly = reader.bool();
                    break;
                }
            case 2: {
                    message.steamosLinuxOnly = reader.bool();
                    break;
                }
            case 10: {
                    message.onlyGames = reader.bool();
                    break;
                }
            case 11: {
                    message.onlySoftware = reader.bool();
                    break;
                }
            case 12: {
                    message.onlyDlc = reader.bool();
                    break;
                }
            case 13: {
                    message.onlyFree = reader.bool();
                    break;
                }
            case 20: {
                    message.maxPriceInCents = reader.int64();
                    break;
                }
            case 21: {
                    message.minDiscountPercent = reader.int32();
                    break;
                }
            case 22: {
                    message.excludeTypes = $root.CWishlistFilters_ExcludeTypeFilters.decode(reader, reader.uint32());
                    break;
                }
            case 23: {
                    message.steamDeckFilters = $root.CWishlistFilters_SteamDeckFilters.decode(reader, reader.uint32());
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlistFilters message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlistFilters
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlistFilters} CWishlistFilters
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlistFilters.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlistFilters message.
     * @function verify
     * @memberof CWishlistFilters
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlistFilters.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.macosOnly != null && message.hasOwnProperty("macosOnly"))
            if (typeof message.macosOnly !== "boolean")
                return "macosOnly: boolean expected";
        if (message.steamosLinuxOnly != null && message.hasOwnProperty("steamosLinuxOnly"))
            if (typeof message.steamosLinuxOnly !== "boolean")
                return "steamosLinuxOnly: boolean expected";
        if (message.onlyGames != null && message.hasOwnProperty("onlyGames"))
            if (typeof message.onlyGames !== "boolean")
                return "onlyGames: boolean expected";
        if (message.onlySoftware != null && message.hasOwnProperty("onlySoftware"))
            if (typeof message.onlySoftware !== "boolean")
                return "onlySoftware: boolean expected";
        if (message.onlyDlc != null && message.hasOwnProperty("onlyDlc"))
            if (typeof message.onlyDlc !== "boolean")
                return "onlyDlc: boolean expected";
        if (message.onlyFree != null && message.hasOwnProperty("onlyFree"))
            if (typeof message.onlyFree !== "boolean")
                return "onlyFree: boolean expected";
        if (message.maxPriceInCents != null && message.hasOwnProperty("maxPriceInCents"))
            if (!$util.isInteger(message.maxPriceInCents) && !(message.maxPriceInCents && $util.isInteger(message.maxPriceInCents.low) && $util.isInteger(message.maxPriceInCents.high)))
                return "maxPriceInCents: integer|Long expected";
        if (message.minDiscountPercent != null && message.hasOwnProperty("minDiscountPercent"))
            if (!$util.isInteger(message.minDiscountPercent))
                return "minDiscountPercent: integer expected";
        if (message.excludeTypes != null && message.hasOwnProperty("excludeTypes")) {
            let error = $root.CWishlistFilters_ExcludeTypeFilters.verify(message.excludeTypes);
            if (error)
                return "excludeTypes." + error;
        }
        if (message.steamDeckFilters != null && message.hasOwnProperty("steamDeckFilters")) {
            let error = $root.CWishlistFilters_SteamDeckFilters.verify(message.steamDeckFilters);
            if (error)
                return "steamDeckFilters." + error;
        }
        return null;
    };

    /**
     * Creates a CWishlistFilters message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlistFilters
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlistFilters} CWishlistFilters
     */
    CWishlistFilters.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlistFilters)
            return object;
        let message = new $root.CWishlistFilters();
        if (object.macosOnly != null)
            message.macosOnly = Boolean(object.macosOnly);
        if (object.steamosLinuxOnly != null)
            message.steamosLinuxOnly = Boolean(object.steamosLinuxOnly);
        if (object.onlyGames != null)
            message.onlyGames = Boolean(object.onlyGames);
        if (object.onlySoftware != null)
            message.onlySoftware = Boolean(object.onlySoftware);
        if (object.onlyDlc != null)
            message.onlyDlc = Boolean(object.onlyDlc);
        if (object.onlyFree != null)
            message.onlyFree = Boolean(object.onlyFree);
        if (object.maxPriceInCents != null)
            if ($util.Long)
                (message.maxPriceInCents = $util.Long.fromValue(object.maxPriceInCents)).unsigned = false;
            else if (typeof object.maxPriceInCents === "string")
                message.maxPriceInCents = parseInt(object.maxPriceInCents, 10);
            else if (typeof object.maxPriceInCents === "number")
                message.maxPriceInCents = object.maxPriceInCents;
            else if (typeof object.maxPriceInCents === "object")
                message.maxPriceInCents = new $util.LongBits(object.maxPriceInCents.low >>> 0, object.maxPriceInCents.high >>> 0).toNumber();
        if (object.minDiscountPercent != null)
            message.minDiscountPercent = object.minDiscountPercent | 0;
        if (object.excludeTypes != null) {
            if (typeof object.excludeTypes !== "object")
                throw TypeError(".CWishlistFilters.excludeTypes: object expected");
            message.excludeTypes = $root.CWishlistFilters_ExcludeTypeFilters.fromObject(object.excludeTypes);
        }
        if (object.steamDeckFilters != null) {
            if (typeof object.steamDeckFilters !== "object")
                throw TypeError(".CWishlistFilters.steamDeckFilters: object expected");
            message.steamDeckFilters = $root.CWishlistFilters_SteamDeckFilters.fromObject(object.steamDeckFilters);
        }
        return message;
    };

    /**
     * Creates a plain object from a CWishlistFilters message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlistFilters
     * @static
     * @param {CWishlistFilters} message CWishlistFilters
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlistFilters.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.macosOnly = false;
            object.steamosLinuxOnly = false;
            object.onlyGames = false;
            object.onlySoftware = false;
            object.onlyDlc = false;
            object.onlyFree = false;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.maxPriceInCents = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.maxPriceInCents = options.longs === String ? "0" : 0;
            object.minDiscountPercent = 0;
            object.excludeTypes = null;
            object.steamDeckFilters = null;
        }
        if (message.macosOnly != null && message.hasOwnProperty("macosOnly"))
            object.macosOnly = message.macosOnly;
        if (message.steamosLinuxOnly != null && message.hasOwnProperty("steamosLinuxOnly"))
            object.steamosLinuxOnly = message.steamosLinuxOnly;
        if (message.onlyGames != null && message.hasOwnProperty("onlyGames"))
            object.onlyGames = message.onlyGames;
        if (message.onlySoftware != null && message.hasOwnProperty("onlySoftware"))
            object.onlySoftware = message.onlySoftware;
        if (message.onlyDlc != null && message.hasOwnProperty("onlyDlc"))
            object.onlyDlc = message.onlyDlc;
        if (message.onlyFree != null && message.hasOwnProperty("onlyFree"))
            object.onlyFree = message.onlyFree;
        if (message.maxPriceInCents != null && message.hasOwnProperty("maxPriceInCents"))
            if (typeof message.maxPriceInCents === "number")
                object.maxPriceInCents = options.longs === String ? String(message.maxPriceInCents) : message.maxPriceInCents;
            else
                object.maxPriceInCents = options.longs === String ? $util.Long.prototype.toString.call(message.maxPriceInCents) : options.longs === Number ? new $util.LongBits(message.maxPriceInCents.low >>> 0, message.maxPriceInCents.high >>> 0).toNumber() : message.maxPriceInCents;
        if (message.minDiscountPercent != null && message.hasOwnProperty("minDiscountPercent"))
            object.minDiscountPercent = message.minDiscountPercent;
        if (message.excludeTypes != null && message.hasOwnProperty("excludeTypes"))
            object.excludeTypes = $root.CWishlistFilters_ExcludeTypeFilters.toObject(message.excludeTypes, options);
        if (message.steamDeckFilters != null && message.hasOwnProperty("steamDeckFilters"))
            object.steamDeckFilters = $root.CWishlistFilters_SteamDeckFilters.toObject(message.steamDeckFilters, options);
        return object;
    };

    /**
     * Converts this CWishlistFilters to JSON.
     * @function toJSON
     * @memberof CWishlistFilters
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlistFilters.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlistFilters
     * @function getTypeUrl
     * @memberof CWishlistFilters
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlistFilters.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlistFilters";
    };

    return CWishlistFilters;
})();

export const CWishlistFilters_ExcludeTypeFilters = $root.CWishlistFilters_ExcludeTypeFilters = (() => {

    /**
     * Properties of a CWishlistFilters_ExcludeTypeFilters.
     * @exports ICWishlistFilters_ExcludeTypeFilters
     * @interface ICWishlistFilters_ExcludeTypeFilters
     * @property {boolean|null} [excludeEarlyAccess] CWishlistFilters_ExcludeTypeFilters excludeEarlyAccess
     * @property {boolean|null} [excludeComingSoon] CWishlistFilters_ExcludeTypeFilters excludeComingSoon
     * @property {boolean|null} [excludeVrOnly] CWishlistFilters_ExcludeTypeFilters excludeVrOnly
     */

    /**
     * Constructs a new CWishlistFilters_ExcludeTypeFilters.
     * @exports CWishlistFilters_ExcludeTypeFilters
     * @classdesc Represents a CWishlistFilters_ExcludeTypeFilters.
     * @implements ICWishlistFilters_ExcludeTypeFilters
     * @constructor
     * @param {ICWishlistFilters_ExcludeTypeFilters=} [properties] Properties to set
     */
    function CWishlistFilters_ExcludeTypeFilters(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlistFilters_ExcludeTypeFilters excludeEarlyAccess.
     * @member {boolean} excludeEarlyAccess
     * @memberof CWishlistFilters_ExcludeTypeFilters
     * @instance
     */
    CWishlistFilters_ExcludeTypeFilters.prototype.excludeEarlyAccess = false;

    /**
     * CWishlistFilters_ExcludeTypeFilters excludeComingSoon.
     * @member {boolean} excludeComingSoon
     * @memberof CWishlistFilters_ExcludeTypeFilters
     * @instance
     */
    CWishlistFilters_ExcludeTypeFilters.prototype.excludeComingSoon = false;

    /**
     * CWishlistFilters_ExcludeTypeFilters excludeVrOnly.
     * @member {boolean} excludeVrOnly
     * @memberof CWishlistFilters_ExcludeTypeFilters
     * @instance
     */
    CWishlistFilters_ExcludeTypeFilters.prototype.excludeVrOnly = false;

    /**
     * Creates a new CWishlistFilters_ExcludeTypeFilters instance using the specified properties.
     * @function create
     * @memberof CWishlistFilters_ExcludeTypeFilters
     * @static
     * @param {ICWishlistFilters_ExcludeTypeFilters=} [properties] Properties to set
     * @returns {CWishlistFilters_ExcludeTypeFilters} CWishlistFilters_ExcludeTypeFilters instance
     */
    CWishlistFilters_ExcludeTypeFilters.create = function create(properties) {
        return new CWishlistFilters_ExcludeTypeFilters(properties);
    };

    /**
     * Encodes the specified CWishlistFilters_ExcludeTypeFilters message. Does not implicitly {@link CWishlistFilters_ExcludeTypeFilters.verify|verify} messages.
     * @function encode
     * @memberof CWishlistFilters_ExcludeTypeFilters
     * @static
     * @param {ICWishlistFilters_ExcludeTypeFilters} message CWishlistFilters_ExcludeTypeFilters message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlistFilters_ExcludeTypeFilters.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.excludeEarlyAccess != null && Object.hasOwnProperty.call(message, "excludeEarlyAccess"))
            writer.uint32(/* id 1, wireType 0 =*/8).bool(message.excludeEarlyAccess);
        if (message.excludeComingSoon != null && Object.hasOwnProperty.call(message, "excludeComingSoon"))
            writer.uint32(/* id 2, wireType 0 =*/16).bool(message.excludeComingSoon);
        if (message.excludeVrOnly != null && Object.hasOwnProperty.call(message, "excludeVrOnly"))
            writer.uint32(/* id 3, wireType 0 =*/24).bool(message.excludeVrOnly);
        return writer;
    };

    /**
     * Encodes the specified CWishlistFilters_ExcludeTypeFilters message, length delimited. Does not implicitly {@link CWishlistFilters_ExcludeTypeFilters.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlistFilters_ExcludeTypeFilters
     * @static
     * @param {ICWishlistFilters_ExcludeTypeFilters} message CWishlistFilters_ExcludeTypeFilters message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlistFilters_ExcludeTypeFilters.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlistFilters_ExcludeTypeFilters message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlistFilters_ExcludeTypeFilters
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlistFilters_ExcludeTypeFilters} CWishlistFilters_ExcludeTypeFilters
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlistFilters_ExcludeTypeFilters.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlistFilters_ExcludeTypeFilters();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.excludeEarlyAccess = reader.bool();
                    break;
                }
            case 2: {
                    message.excludeComingSoon = reader.bool();
                    break;
                }
            case 3: {
                    message.excludeVrOnly = reader.bool();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlistFilters_ExcludeTypeFilters message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlistFilters_ExcludeTypeFilters
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlistFilters_ExcludeTypeFilters} CWishlistFilters_ExcludeTypeFilters
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlistFilters_ExcludeTypeFilters.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlistFilters_ExcludeTypeFilters message.
     * @function verify
     * @memberof CWishlistFilters_ExcludeTypeFilters
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlistFilters_ExcludeTypeFilters.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.excludeEarlyAccess != null && message.hasOwnProperty("excludeEarlyAccess"))
            if (typeof message.excludeEarlyAccess !== "boolean")
                return "excludeEarlyAccess: boolean expected";
        if (message.excludeComingSoon != null && message.hasOwnProperty("excludeComingSoon"))
            if (typeof message.excludeComingSoon !== "boolean")
                return "excludeComingSoon: boolean expected";
        if (message.excludeVrOnly != null && message.hasOwnProperty("excludeVrOnly"))
            if (typeof message.excludeVrOnly !== "boolean")
                return "excludeVrOnly: boolean expected";
        return null;
    };

    /**
     * Creates a CWishlistFilters_ExcludeTypeFilters message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlistFilters_ExcludeTypeFilters
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlistFilters_ExcludeTypeFilters} CWishlistFilters_ExcludeTypeFilters
     */
    CWishlistFilters_ExcludeTypeFilters.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlistFilters_ExcludeTypeFilters)
            return object;
        let message = new $root.CWishlistFilters_ExcludeTypeFilters();
        if (object.excludeEarlyAccess != null)
            message.excludeEarlyAccess = Boolean(object.excludeEarlyAccess);
        if (object.excludeComingSoon != null)
            message.excludeComingSoon = Boolean(object.excludeComingSoon);
        if (object.excludeVrOnly != null)
            message.excludeVrOnly = Boolean(object.excludeVrOnly);
        return message;
    };

    /**
     * Creates a plain object from a CWishlistFilters_ExcludeTypeFilters message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlistFilters_ExcludeTypeFilters
     * @static
     * @param {CWishlistFilters_ExcludeTypeFilters} message CWishlistFilters_ExcludeTypeFilters
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlistFilters_ExcludeTypeFilters.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.excludeEarlyAccess = false;
            object.excludeComingSoon = false;
            object.excludeVrOnly = false;
        }
        if (message.excludeEarlyAccess != null && message.hasOwnProperty("excludeEarlyAccess"))
            object.excludeEarlyAccess = message.excludeEarlyAccess;
        if (message.excludeComingSoon != null && message.hasOwnProperty("excludeComingSoon"))
            object.excludeComingSoon = message.excludeComingSoon;
        if (message.excludeVrOnly != null && message.hasOwnProperty("excludeVrOnly"))
            object.excludeVrOnly = message.excludeVrOnly;
        return object;
    };

    /**
     * Converts this CWishlistFilters_ExcludeTypeFilters to JSON.
     * @function toJSON
     * @memberof CWishlistFilters_ExcludeTypeFilters
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlistFilters_ExcludeTypeFilters.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlistFilters_ExcludeTypeFilters
     * @function getTypeUrl
     * @memberof CWishlistFilters_ExcludeTypeFilters
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlistFilters_ExcludeTypeFilters.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlistFilters_ExcludeTypeFilters";
    };

    return CWishlistFilters_ExcludeTypeFilters;
})();

export const CWishlistFilters_SteamDeckFilters = $root.CWishlistFilters_SteamDeckFilters = (() => {

    /**
     * Properties of a CWishlistFilters_SteamDeckFilters.
     * @exports ICWishlistFilters_SteamDeckFilters
     * @interface ICWishlistFilters_SteamDeckFilters
     * @property {boolean|null} [includeVerified] CWishlistFilters_SteamDeckFilters includeVerified
     * @property {boolean|null} [includePlayable] CWishlistFilters_SteamDeckFilters includePlayable
     */

    /**
     * Constructs a new CWishlistFilters_SteamDeckFilters.
     * @exports CWishlistFilters_SteamDeckFilters
     * @classdesc Represents a CWishlistFilters_SteamDeckFilters.
     * @implements ICWishlistFilters_SteamDeckFilters
     * @constructor
     * @param {ICWishlistFilters_SteamDeckFilters=} [properties] Properties to set
     */
    function CWishlistFilters_SteamDeckFilters(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CWishlistFilters_SteamDeckFilters includeVerified.
     * @member {boolean} includeVerified
     * @memberof CWishlistFilters_SteamDeckFilters
     * @instance
     */
    CWishlistFilters_SteamDeckFilters.prototype.includeVerified = false;

    /**
     * CWishlistFilters_SteamDeckFilters includePlayable.
     * @member {boolean} includePlayable
     * @memberof CWishlistFilters_SteamDeckFilters
     * @instance
     */
    CWishlistFilters_SteamDeckFilters.prototype.includePlayable = false;

    /**
     * Creates a new CWishlistFilters_SteamDeckFilters instance using the specified properties.
     * @function create
     * @memberof CWishlistFilters_SteamDeckFilters
     * @static
     * @param {ICWishlistFilters_SteamDeckFilters=} [properties] Properties to set
     * @returns {CWishlistFilters_SteamDeckFilters} CWishlistFilters_SteamDeckFilters instance
     */
    CWishlistFilters_SteamDeckFilters.create = function create(properties) {
        return new CWishlistFilters_SteamDeckFilters(properties);
    };

    /**
     * Encodes the specified CWishlistFilters_SteamDeckFilters message. Does not implicitly {@link CWishlistFilters_SteamDeckFilters.verify|verify} messages.
     * @function encode
     * @memberof CWishlistFilters_SteamDeckFilters
     * @static
     * @param {ICWishlistFilters_SteamDeckFilters} message CWishlistFilters_SteamDeckFilters message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlistFilters_SteamDeckFilters.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.includeVerified != null && Object.hasOwnProperty.call(message, "includeVerified"))
            writer.uint32(/* id 1, wireType 0 =*/8).bool(message.includeVerified);
        if (message.includePlayable != null && Object.hasOwnProperty.call(message, "includePlayable"))
            writer.uint32(/* id 2, wireType 0 =*/16).bool(message.includePlayable);
        return writer;
    };

    /**
     * Encodes the specified CWishlistFilters_SteamDeckFilters message, length delimited. Does not implicitly {@link CWishlistFilters_SteamDeckFilters.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CWishlistFilters_SteamDeckFilters
     * @static
     * @param {ICWishlistFilters_SteamDeckFilters} message CWishlistFilters_SteamDeckFilters message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CWishlistFilters_SteamDeckFilters.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CWishlistFilters_SteamDeckFilters message from the specified reader or buffer.
     * @function decode
     * @memberof CWishlistFilters_SteamDeckFilters
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CWishlistFilters_SteamDeckFilters} CWishlistFilters_SteamDeckFilters
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlistFilters_SteamDeckFilters.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CWishlistFilters_SteamDeckFilters();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.includeVerified = reader.bool();
                    break;
                }
            case 2: {
                    message.includePlayable = reader.bool();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CWishlistFilters_SteamDeckFilters message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CWishlistFilters_SteamDeckFilters
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CWishlistFilters_SteamDeckFilters} CWishlistFilters_SteamDeckFilters
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CWishlistFilters_SteamDeckFilters.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CWishlistFilters_SteamDeckFilters message.
     * @function verify
     * @memberof CWishlistFilters_SteamDeckFilters
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CWishlistFilters_SteamDeckFilters.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.includeVerified != null && message.hasOwnProperty("includeVerified"))
            if (typeof message.includeVerified !== "boolean")
                return "includeVerified: boolean expected";
        if (message.includePlayable != null && message.hasOwnProperty("includePlayable"))
            if (typeof message.includePlayable !== "boolean")
                return "includePlayable: boolean expected";
        return null;
    };

    /**
     * Creates a CWishlistFilters_SteamDeckFilters message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CWishlistFilters_SteamDeckFilters
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CWishlistFilters_SteamDeckFilters} CWishlistFilters_SteamDeckFilters
     */
    CWishlistFilters_SteamDeckFilters.fromObject = function fromObject(object) {
        if (object instanceof $root.CWishlistFilters_SteamDeckFilters)
            return object;
        let message = new $root.CWishlistFilters_SteamDeckFilters();
        if (object.includeVerified != null)
            message.includeVerified = Boolean(object.includeVerified);
        if (object.includePlayable != null)
            message.includePlayable = Boolean(object.includePlayable);
        return message;
    };

    /**
     * Creates a plain object from a CWishlistFilters_SteamDeckFilters message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CWishlistFilters_SteamDeckFilters
     * @static
     * @param {CWishlistFilters_SteamDeckFilters} message CWishlistFilters_SteamDeckFilters
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CWishlistFilters_SteamDeckFilters.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.includeVerified = false;
            object.includePlayable = false;
        }
        if (message.includeVerified != null && message.hasOwnProperty("includeVerified"))
            object.includeVerified = message.includeVerified;
        if (message.includePlayable != null && message.hasOwnProperty("includePlayable"))
            object.includePlayable = message.includePlayable;
        return object;
    };

    /**
     * Converts this CWishlistFilters_SteamDeckFilters to JSON.
     * @function toJSON
     * @memberof CWishlistFilters_SteamDeckFilters
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CWishlistFilters_SteamDeckFilters.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CWishlistFilters_SteamDeckFilters
     * @function getTypeUrl
     * @memberof CWishlistFilters_SteamDeckFilters
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CWishlistFilters_SteamDeckFilters.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CWishlistFilters_SteamDeckFilters";
    };

    return CWishlistFilters_SteamDeckFilters;
})();

export const Wishlist = $root.Wishlist = (() => {

    /**
     * Constructs a new Wishlist service.
     * @exports Wishlist
     * @classdesc Represents a Wishlist
     * @extends $protobuf.rpc.Service
     * @constructor
     * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
     * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
     * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
     */
    function Wishlist(rpcImpl, requestDelimited, responseDelimited) {
        $protobuf.rpc.Service.call(this, rpcImpl, requestDelimited, responseDelimited);
    }

    (Wishlist.prototype = Object.create($protobuf.rpc.Service.prototype)).constructor = Wishlist;

    /**
     * Creates new Wishlist service using the specified rpc implementation.
     * @function create
     * @memberof Wishlist
     * @static
     * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
     * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
     * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
     * @returns {Wishlist} RPC service. Useful where requests and/or responses are streamed.
     */
    Wishlist.create = function create(rpcImpl, requestDelimited, responseDelimited) {
        return new this(rpcImpl, requestDelimited, responseDelimited);
    };

    /**
     * Callback as used by {@link Wishlist#addToWishlist}.
     * @memberof Wishlist
     * @typedef AddToWishlistCallback
     * @type {function}
     * @param {Error|null} error Error, if any
     * @param {CWishlist_AddToWishlist_Response} [response] CWishlist_AddToWishlist_Response
     */

    /**
     * Calls AddToWishlist.
     * @function addToWishlist
     * @memberof Wishlist
     * @instance
     * @param {ICWishlist_AddToWishlist_Request} request CWishlist_AddToWishlist_Request message or plain object
     * @param {Wishlist.AddToWishlistCallback} callback Node-style callback called with the error, if any, and CWishlist_AddToWishlist_Response
     * @returns {undefined}
     * @variation 1
     */
    Object.defineProperty(Wishlist.prototype.addToWishlist = function addToWishlist(request, callback) {
        return this.rpcCall(addToWishlist, $root.CWishlist_AddToWishlist_Request, $root.CWishlist_AddToWishlist_Response, request, callback);
    }, "name", { value: "AddToWishlist" });

    /**
     * Calls AddToWishlist.
     * @function addToWishlist
     * @memberof Wishlist
     * @instance
     * @param {ICWishlist_AddToWishlist_Request} request CWishlist_AddToWishlist_Request message or plain object
     * @returns {Promise<CWishlist_AddToWishlist_Response>} Promise
     * @variation 2
     */

    /**
     * Callback as used by {@link Wishlist#getWishlist}.
     * @memberof Wishlist
     * @typedef GetWishlistCallback
     * @type {function}
     * @param {Error|null} error Error, if any
     * @param {CWishlist_GetWishlist_Response} [response] CWishlist_GetWishlist_Response
     */

    /**
     * Calls GetWishlist.
     * @function getWishlist
     * @memberof Wishlist
     * @instance
     * @param {ICWishlist_GetWishlist_Request} request CWishlist_GetWishlist_Request message or plain object
     * @param {Wishlist.GetWishlistCallback} callback Node-style callback called with the error, if any, and CWishlist_GetWishlist_Response
     * @returns {undefined}
     * @variation 1
     */
    Object.defineProperty(Wishlist.prototype.getWishlist = function getWishlist(request, callback) {
        return this.rpcCall(getWishlist, $root.CWishlist_GetWishlist_Request, $root.CWishlist_GetWishlist_Response, request, callback);
    }, "name", { value: "GetWishlist" });

    /**
     * Calls GetWishlist.
     * @function getWishlist
     * @memberof Wishlist
     * @instance
     * @param {ICWishlist_GetWishlist_Request} request CWishlist_GetWishlist_Request message or plain object
     * @returns {Promise<CWishlist_GetWishlist_Response>} Promise
     * @variation 2
     */

    /**
     * Callback as used by {@link Wishlist#getWishlistItemCount}.
     * @memberof Wishlist
     * @typedef GetWishlistItemCountCallback
     * @type {function}
     * @param {Error|null} error Error, if any
     * @param {CWishlist_GetWishlistItemCount_Response} [response] CWishlist_GetWishlistItemCount_Response
     */

    /**
     * Calls GetWishlistItemCount.
     * @function getWishlistItemCount
     * @memberof Wishlist
     * @instance
     * @param {ICWishlist_GetWishlistItemCount_Request} request CWishlist_GetWishlistItemCount_Request message or plain object
     * @param {Wishlist.GetWishlistItemCountCallback} callback Node-style callback called with the error, if any, and CWishlist_GetWishlistItemCount_Response
     * @returns {undefined}
     * @variation 1
     */
    Object.defineProperty(Wishlist.prototype.getWishlistItemCount = function getWishlistItemCount(request, callback) {
        return this.rpcCall(getWishlistItemCount, $root.CWishlist_GetWishlistItemCount_Request, $root.CWishlist_GetWishlistItemCount_Response, request, callback);
    }, "name", { value: "GetWishlistItemCount" });

    /**
     * Calls GetWishlistItemCount.
     * @function getWishlistItemCount
     * @memberof Wishlist
     * @instance
     * @param {ICWishlist_GetWishlistItemCount_Request} request CWishlist_GetWishlistItemCount_Request message or plain object
     * @returns {Promise<CWishlist_GetWishlistItemCount_Response>} Promise
     * @variation 2
     */

    /**
     * Callback as used by {@link Wishlist#getWishlistItemsOnSale}.
     * @memberof Wishlist
     * @typedef GetWishlistItemsOnSaleCallback
     * @type {function}
     * @param {Error|null} error Error, if any
     * @param {CWishlist_GetWishlistItemsOnSale_Response} [response] CWishlist_GetWishlistItemsOnSale_Response
     */

    /**
     * Calls GetWishlistItemsOnSale.
     * @function getWishlistItemsOnSale
     * @memberof Wishlist
     * @instance
     * @param {ICWishlist_GetWishlistItemsOnSale_Request} request CWishlist_GetWishlistItemsOnSale_Request message or plain object
     * @param {Wishlist.GetWishlistItemsOnSaleCallback} callback Node-style callback called with the error, if any, and CWishlist_GetWishlistItemsOnSale_Response
     * @returns {undefined}
     * @variation 1
     */
    Object.defineProperty(Wishlist.prototype.getWishlistItemsOnSale = function getWishlistItemsOnSale(request, callback) {
        return this.rpcCall(getWishlistItemsOnSale, $root.CWishlist_GetWishlistItemsOnSale_Request, $root.CWishlist_GetWishlistItemsOnSale_Response, request, callback);
    }, "name", { value: "GetWishlistItemsOnSale" });

    /**
     * Calls GetWishlistItemsOnSale.
     * @function getWishlistItemsOnSale
     * @memberof Wishlist
     * @instance
     * @param {ICWishlist_GetWishlistItemsOnSale_Request} request CWishlist_GetWishlistItemsOnSale_Request message or plain object
     * @returns {Promise<CWishlist_GetWishlistItemsOnSale_Response>} Promise
     * @variation 2
     */

    /**
     * Callback as used by {@link Wishlist#getWishlistSortedFiltered}.
     * @memberof Wishlist
     * @typedef GetWishlistSortedFilteredCallback
     * @type {function}
     * @param {Error|null} error Error, if any
     * @param {CWishlist_GetWishlistSortedFiltered_Response} [response] CWishlist_GetWishlistSortedFiltered_Response
     */

    /**
     * Calls GetWishlistSortedFiltered.
     * @function getWishlistSortedFiltered
     * @memberof Wishlist
     * @instance
     * @param {ICWishlist_GetWishlistSortedFiltered_Request} request CWishlist_GetWishlistSortedFiltered_Request message or plain object
     * @param {Wishlist.GetWishlistSortedFilteredCallback} callback Node-style callback called with the error, if any, and CWishlist_GetWishlistSortedFiltered_Response
     * @returns {undefined}
     * @variation 1
     */
    Object.defineProperty(Wishlist.prototype.getWishlistSortedFiltered = function getWishlistSortedFiltered(request, callback) {
        return this.rpcCall(getWishlistSortedFiltered, $root.CWishlist_GetWishlistSortedFiltered_Request, $root.CWishlist_GetWishlistSortedFiltered_Response, request, callback);
    }, "name", { value: "GetWishlistSortedFiltered" });

    /**
     * Calls GetWishlistSortedFiltered.
     * @function getWishlistSortedFiltered
     * @memberof Wishlist
     * @instance
     * @param {ICWishlist_GetWishlistSortedFiltered_Request} request CWishlist_GetWishlistSortedFiltered_Request message or plain object
     * @returns {Promise<CWishlist_GetWishlistSortedFiltered_Response>} Promise
     * @variation 2
     */

    /**
     * Callback as used by {@link Wishlist#removeFromWishlist}.
     * @memberof Wishlist
     * @typedef RemoveFromWishlistCallback
     * @type {function}
     * @param {Error|null} error Error, if any
     * @param {CWishlist_RemoveFromWishlist_Response} [response] CWishlist_RemoveFromWishlist_Response
     */

    /**
     * Calls RemoveFromWishlist.
     * @function removeFromWishlist
     * @memberof Wishlist
     * @instance
     * @param {ICWishlist_RemoveFromWishlist_Request} request CWishlist_RemoveFromWishlist_Request message or plain object
     * @param {Wishlist.RemoveFromWishlistCallback} callback Node-style callback called with the error, if any, and CWishlist_RemoveFromWishlist_Response
     * @returns {undefined}
     * @variation 1
     */
    Object.defineProperty(Wishlist.prototype.removeFromWishlist = function removeFromWishlist(request, callback) {
        return this.rpcCall(removeFromWishlist, $root.CWishlist_RemoveFromWishlist_Request, $root.CWishlist_RemoveFromWishlist_Response, request, callback);
    }, "name", { value: "RemoveFromWishlist" });

    /**
     * Calls RemoveFromWishlist.
     * @function removeFromWishlist
     * @memberof Wishlist
     * @instance
     * @param {ICWishlist_RemoveFromWishlist_Request} request CWishlist_RemoveFromWishlist_Request message or plain object
     * @returns {Promise<CWishlist_RemoveFromWishlist_Response>} Promise
     * @variation 2
     */

    return Wishlist;
})();

export const CUserInterface_NavData = $root.CUserInterface_NavData = (() => {

    /**
     * Properties of a CUserInterface_NavData.
     * @exports ICUserInterface_NavData
     * @interface ICUserInterface_NavData
     * @property {string|null} [domain] CUserInterface_NavData domain
     * @property {string|null} [controller] CUserInterface_NavData controller
     * @property {string|null} [method] CUserInterface_NavData method
     * @property {string|null} [submethod] CUserInterface_NavData submethod
     * @property {string|null} [feature] CUserInterface_NavData feature
     * @property {number|null} [depth] CUserInterface_NavData depth
     * @property {string|null} [countrycode] CUserInterface_NavData countrycode
     * @property {number|Long|null} [webkey] CUserInterface_NavData webkey
     * @property {boolean|null} [isClient] CUserInterface_NavData isClient
     * @property {IUserInterface_CuratorData|null} [curatorData] CUserInterface_NavData curatorData
     * @property {boolean|null} [isLikelyBot] CUserInterface_NavData isLikelyBot
     * @property {boolean|null} [isUtm] CUserInterface_NavData isUtm
     */

    /**
     * Constructs a new CUserInterface_NavData.
     * @exports CUserInterface_NavData
     * @classdesc Represents a CUserInterface_NavData.
     * @implements ICUserInterface_NavData
     * @constructor
     * @param {ICUserInterface_NavData=} [properties] Properties to set
     */
    function CUserInterface_NavData(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CUserInterface_NavData domain.
     * @member {string} domain
     * @memberof CUserInterface_NavData
     * @instance
     */
    CUserInterface_NavData.prototype.domain = "";

    /**
     * CUserInterface_NavData controller.
     * @member {string} controller
     * @memberof CUserInterface_NavData
     * @instance
     */
    CUserInterface_NavData.prototype.controller = "";

    /**
     * CUserInterface_NavData method.
     * @member {string} method
     * @memberof CUserInterface_NavData
     * @instance
     */
    CUserInterface_NavData.prototype.method = "";

    /**
     * CUserInterface_NavData submethod.
     * @member {string} submethod
     * @memberof CUserInterface_NavData
     * @instance
     */
    CUserInterface_NavData.prototype.submethod = "";

    /**
     * CUserInterface_NavData feature.
     * @member {string} feature
     * @memberof CUserInterface_NavData
     * @instance
     */
    CUserInterface_NavData.prototype.feature = "";

    /**
     * CUserInterface_NavData depth.
     * @member {number} depth
     * @memberof CUserInterface_NavData
     * @instance
     */
    CUserInterface_NavData.prototype.depth = 0;

    /**
     * CUserInterface_NavData countrycode.
     * @member {string} countrycode
     * @memberof CUserInterface_NavData
     * @instance
     */
    CUserInterface_NavData.prototype.countrycode = "";

    /**
     * CUserInterface_NavData webkey.
     * @member {number|Long} webkey
     * @memberof CUserInterface_NavData
     * @instance
     */
    CUserInterface_NavData.prototype.webkey = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    /**
     * CUserInterface_NavData isClient.
     * @member {boolean} isClient
     * @memberof CUserInterface_NavData
     * @instance
     */
    CUserInterface_NavData.prototype.isClient = false;

    /**
     * CUserInterface_NavData curatorData.
     * @member {IUserInterface_CuratorData|null|undefined} curatorData
     * @memberof CUserInterface_NavData
     * @instance
     */
    CUserInterface_NavData.prototype.curatorData = null;

    /**
     * CUserInterface_NavData isLikelyBot.
     * @member {boolean} isLikelyBot
     * @memberof CUserInterface_NavData
     * @instance
     */
    CUserInterface_NavData.prototype.isLikelyBot = false;

    /**
     * CUserInterface_NavData isUtm.
     * @member {boolean} isUtm
     * @memberof CUserInterface_NavData
     * @instance
     */
    CUserInterface_NavData.prototype.isUtm = false;

    /**
     * Creates a new CUserInterface_NavData instance using the specified properties.
     * @function create
     * @memberof CUserInterface_NavData
     * @static
     * @param {ICUserInterface_NavData=} [properties] Properties to set
     * @returns {CUserInterface_NavData} CUserInterface_NavData instance
     */
    CUserInterface_NavData.create = function create(properties) {
        return new CUserInterface_NavData(properties);
    };

    /**
     * Encodes the specified CUserInterface_NavData message. Does not implicitly {@link CUserInterface_NavData.verify|verify} messages.
     * @function encode
     * @memberof CUserInterface_NavData
     * @static
     * @param {ICUserInterface_NavData} message CUserInterface_NavData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CUserInterface_NavData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.domain != null && Object.hasOwnProperty.call(message, "domain"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.domain);
        if (message.controller != null && Object.hasOwnProperty.call(message, "controller"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.controller);
        if (message.method != null && Object.hasOwnProperty.call(message, "method"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.method);
        if (message.submethod != null && Object.hasOwnProperty.call(message, "submethod"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.submethod);
        if (message.feature != null && Object.hasOwnProperty.call(message, "feature"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.feature);
        if (message.depth != null && Object.hasOwnProperty.call(message, "depth"))
            writer.uint32(/* id 6, wireType 0 =*/48).uint32(message.depth);
        if (message.countrycode != null && Object.hasOwnProperty.call(message, "countrycode"))
            writer.uint32(/* id 7, wireType 2 =*/58).string(message.countrycode);
        if (message.webkey != null && Object.hasOwnProperty.call(message, "webkey"))
            writer.uint32(/* id 8, wireType 0 =*/64).uint64(message.webkey);
        if (message.isClient != null && Object.hasOwnProperty.call(message, "isClient"))
            writer.uint32(/* id 9, wireType 0 =*/72).bool(message.isClient);
        if (message.curatorData != null && Object.hasOwnProperty.call(message, "curatorData"))
            $rootCUserInterface_CuratorData.encode(message.curatorData, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
        if (message.isLikelyBot != null && Object.hasOwnProperty.call(message, "isLikelyBot"))
            writer.uint32(/* id 11, wireType 0 =*/88).bool(message.isLikelyBot);
        if (message.isUtm != null && Object.hasOwnProperty.call(message, "isUtm"))
            writer.uint32(/* id 12, wireType 0 =*/96).bool(message.isUtm);
        return writer;
    };

    /**
     * Encodes the specified CUserInterface_NavData message, length delimited. Does not implicitly {@link CUserInterface_NavData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CUserInterface_NavData
     * @static
     * @param {ICUserInterface_NavData} message CUserInterface_NavData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CUserInterface_NavData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CUserInterface_NavData message from the specified reader or buffer.
     * @function decode
     * @memberof CUserInterface_NavData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CUserInterface_NavData} CUserInterface_NavData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CUserInterface_NavData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CUserInterface_NavData();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.domain = reader.string();
                    break;
                }
            case 2: {
                    message.controller = reader.string();
                    break;
                }
            case 3: {
                    message.method = reader.string();
                    break;
                }
            case 4: {
                    message.submethod = reader.string();
                    break;
                }
            case 5: {
                    message.feature = reader.string();
                    break;
                }
            case 6: {
                    message.depth = reader.uint32();
                    break;
                }
            case 7: {
                    message.countrycode = reader.string();
                    break;
                }
            case 8: {
                    message.webkey = reader.uint64();
                    break;
                }
            case 9: {
                    message.isClient = reader.bool();
                    break;
                }
            case 10: {
                    message.curatorData = $rootCUserInterface_CuratorData.decode(reader, reader.uint32());
                    break;
                }
            case 11: {
                    message.isLikelyBot = reader.bool();
                    break;
                }
            case 12: {
                    message.isUtm = reader.bool();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CUserInterface_NavData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CUserInterface_NavData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CUserInterface_NavData} CUserInterface_NavData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CUserInterface_NavData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CUserInterface_NavData message.
     * @function verify
     * @memberof CUserInterface_NavData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CUserInterface_NavData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.domain != null && message.hasOwnProperty("domain"))
            if (!$util.isString(message.domain))
                return "domain: string expected";
        if (message.controller != null && message.hasOwnProperty("controller"))
            if (!$util.isString(message.controller))
                return "controller: string expected";
        if (message.method != null && message.hasOwnProperty("method"))
            if (!$util.isString(message.method))
                return "method: string expected";
        if (message.submethod != null && message.hasOwnProperty("submethod"))
            if (!$util.isString(message.submethod))
                return "submethod: string expected";
        if (message.feature != null && message.hasOwnProperty("feature"))
            if (!$util.isString(message.feature))
                return "feature: string expected";
        if (message.depth != null && message.hasOwnProperty("depth"))
            if (!$util.isInteger(message.depth))
                return "depth: integer expected";
        if (message.countrycode != null && message.hasOwnProperty("countrycode"))
            if (!$util.isString(message.countrycode))
                return "countrycode: string expected";
        if (message.webkey != null && message.hasOwnProperty("webkey"))
            if (!$util.isInteger(message.webkey) && !(message.webkey && $util.isInteger(message.webkey.low) && $util.isInteger(message.webkey.high)))
                return "webkey: integer|Long expected";
        if (message.isClient != null && message.hasOwnProperty("isClient"))
            if (typeof message.isClient !== "boolean")
                return "isClient: boolean expected";
        if (message.curatorData != null && message.hasOwnProperty("curatorData")) {
            let error = $rootCUserInterface_CuratorData.verify(message.curatorData);
            if (error)
                return "curatorData." + error;
        }
        if (message.isLikelyBot != null && message.hasOwnProperty("isLikelyBot"))
            if (typeof message.isLikelyBot !== "boolean")
                return "isLikelyBot: boolean expected";
        if (message.isUtm != null && message.hasOwnProperty("isUtm"))
            if (typeof message.isUtm !== "boolean")
                return "isUtm: boolean expected";
        return null;
    };

    /**
     * Creates a CUserInterface_NavData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CUserInterface_NavData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CUserInterface_NavData} CUserInterface_NavData
     */
    CUserInterface_NavData.fromObject = function fromObject(object) {
        if (object instanceof $root.CUserInterface_NavData)
            return object;
        let message = new $root.CUserInterface_NavData();
        if (object.domain != null)
            message.domain = String(object.domain);
        if (object.controller != null)
            message.controller = String(object.controller);
        if (object.method != null)
            message.method = String(object.method);
        if (object.submethod != null)
            message.submethod = String(object.submethod);
        if (object.feature != null)
            message.feature = String(object.feature);
        if (object.depth != null)
            message.depth = object.depth >>> 0;
        if (object.countrycode != null)
            message.countrycode = String(object.countrycode);
        if (object.webkey != null)
            if ($util.Long)
                (message.webkey = $util.Long.fromValue(object.webkey)).unsigned = true;
            else if (typeof object.webkey === "string")
                message.webkey = parseInt(object.webkey, 10);
            else if (typeof object.webkey === "number")
                message.webkey = object.webkey;
            else if (typeof object.webkey === "object")
                message.webkey = new $util.LongBits(object.webkey.low >>> 0, object.webkey.high >>> 0).toNumber(true);
        if (object.isClient != null)
            message.isClient = Boolean(object.isClient);
        if (object.curatorData != null) {
            if (typeof object.curatorData !== "object")
                throw TypeError(".CUserInterface_NavData.curatorData: object expected");
            message.curatorData = $rootCUserInterface_CuratorData.fromObject(object.curatorData);
        }
        if (object.isLikelyBot != null)
            message.isLikelyBot = Boolean(object.isLikelyBot);
        if (object.isUtm != null)
            message.isUtm = Boolean(object.isUtm);
        return message;
    };

    /**
     * Creates a plain object from a CUserInterface_NavData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CUserInterface_NavData
     * @static
     * @param {CUserInterface_NavData} message CUserInterface_NavData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CUserInterface_NavData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.domain = "";
            object.controller = "";
            object.method = "";
            object.submethod = "";
            object.feature = "";
            object.depth = 0;
            object.countrycode = "";
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.webkey = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.webkey = options.longs === String ? "0" : 0;
            object.isClient = false;
            object.curatorData = null;
            object.isLikelyBot = false;
            object.isUtm = false;
        }
        if (message.domain != null && message.hasOwnProperty("domain"))
            object.domain = message.domain;
        if (message.controller != null && message.hasOwnProperty("controller"))
            object.controller = message.controller;
        if (message.method != null && message.hasOwnProperty("method"))
            object.method = message.method;
        if (message.submethod != null && message.hasOwnProperty("submethod"))
            object.submethod = message.submethod;
        if (message.feature != null && message.hasOwnProperty("feature"))
            object.feature = message.feature;
        if (message.depth != null && message.hasOwnProperty("depth"))
            object.depth = message.depth;
        if (message.countrycode != null && message.hasOwnProperty("countrycode"))
            object.countrycode = message.countrycode;
        if (message.webkey != null && message.hasOwnProperty("webkey"))
            if (typeof message.webkey === "number")
                object.webkey = options.longs === String ? String(message.webkey) : message.webkey;
            else
                object.webkey = options.longs === String ? $util.Long.prototype.toString.call(message.webkey) : options.longs === Number ? new $util.LongBits(message.webkey.low >>> 0, message.webkey.high >>> 0).toNumber(true) : message.webkey;
        if (message.isClient != null && message.hasOwnProperty("isClient"))
            object.isClient = message.isClient;
        if (message.curatorData != null && message.hasOwnProperty("curatorData"))
            object.curatorData = $rootCUserInterface_CuratorData.toObject(message.curatorData, options);
        if (message.isLikelyBot != null && message.hasOwnProperty("isLikelyBot"))
            object.isLikelyBot = message.isLikelyBot;
        if (message.isUtm != null && message.hasOwnProperty("isUtm"))
            object.isUtm = message.isUtm;
        return object;
    };

    /**
     * Converts this CUserInterface_NavData to JSON.
     * @function toJSON
     * @memberof CUserInterface_NavData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CUserInterface_NavData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CUserInterface_NavData
     * @function getTypeUrl
     * @memberof CUserInterface_NavData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CUserInterface_NavData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CUserInterface_NavData";
    };

    return CUserInterface_NavData;
})();

export const StoreBrowseContext = $root.StoreBrowseContext = (() => {

    /**
     * Properties of a StoreBrowseContext.
     * @exports IStoreBrowseContext
     * @interface IStoreBrowseContext
     * @property {string|null} [language] StoreBrowseContext language
     * @property {number|null} [elanguage] StoreBrowseContext elanguage
     * @property {string|null} [countryCode] StoreBrowseContext countryCode
     * @property {number|null} [steamRealm] StoreBrowseContext steamRealm
     */

    /**
     * Constructs a new StoreBrowseContext.
     * @exports StoreBrowseContext
     * @classdesc Represents a StoreBrowseContext.
     * @implements IStoreBrowseContext
     * @constructor
     * @param {IStoreBrowseContext=} [properties] Properties to set
     */
    function StoreBrowseContext(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * StoreBrowseContext language.
     * @member {string} language
     * @memberof StoreBrowseContext
     * @instance
     */
    StoreBrowseContext.prototype.language = "";

    /**
     * StoreBrowseContext elanguage.
     * @member {number} elanguage
     * @memberof StoreBrowseContext
     * @instance
     */
    StoreBrowseContext.prototype.elanguage = 0;

    /**
     * StoreBrowseContext countryCode.
     * @member {string} countryCode
     * @memberof StoreBrowseContext
     * @instance
     */
    StoreBrowseContext.prototype.countryCode = "";

    /**
     * StoreBrowseContext steamRealm.
     * @member {number} steamRealm
     * @memberof StoreBrowseContext
     * @instance
     */
    StoreBrowseContext.prototype.steamRealm = 0;

    /**
     * Creates a new StoreBrowseContext instance using the specified properties.
     * @function create
     * @memberof StoreBrowseContext
     * @static
     * @param {IStoreBrowseContext=} [properties] Properties to set
     * @returns {StoreBrowseContext} StoreBrowseContext instance
     */
    StoreBrowseContext.create = function create(properties) {
        return new StoreBrowseContext(properties);
    };

    /**
     * Encodes the specified StoreBrowseContext message. Does not implicitly {@link StoreBrowseContext.verify|verify} messages.
     * @function encode
     * @memberof StoreBrowseContext
     * @static
     * @param {IStoreBrowseContext} message StoreBrowseContext message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    StoreBrowseContext.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.language != null && Object.hasOwnProperty.call(message, "language"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.language);
        if (message.elanguage != null && Object.hasOwnProperty.call(message, "elanguage"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.elanguage);
        if (message.countryCode != null && Object.hasOwnProperty.call(message, "countryCode"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.countryCode);
        if (message.steamRealm != null && Object.hasOwnProperty.call(message, "steamRealm"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.steamRealm);
        return writer;
    };

    /**
     * Encodes the specified StoreBrowseContext message, length delimited. Does not implicitly {@link StoreBrowseContext.verify|verify} messages.
     * @function encodeDelimited
     * @memberof StoreBrowseContext
     * @static
     * @param {IStoreBrowseContext} message StoreBrowseContext message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    StoreBrowseContext.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a StoreBrowseContext message from the specified reader or buffer.
     * @function decode
     * @memberof StoreBrowseContext
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {StoreBrowseContext} StoreBrowseContext
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    StoreBrowseContext.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.StoreBrowseContext();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.language = reader.string();
                    break;
                }
            case 2: {
                    message.elanguage = reader.int32();
                    break;
                }
            case 3: {
                    message.countryCode = reader.string();
                    break;
                }
            case 4: {
                    message.steamRealm = reader.int32();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a StoreBrowseContext message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof StoreBrowseContext
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {StoreBrowseContext} StoreBrowseContext
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    StoreBrowseContext.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a StoreBrowseContext message.
     * @function verify
     * @memberof StoreBrowseContext
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    StoreBrowseContext.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.language != null && message.hasOwnProperty("language"))
            if (!$util.isString(message.language))
                return "language: string expected";
        if (message.elanguage != null && message.hasOwnProperty("elanguage"))
            if (!$util.isInteger(message.elanguage))
                return "elanguage: integer expected";
        if (message.countryCode != null && message.hasOwnProperty("countryCode"))
            if (!$util.isString(message.countryCode))
                return "countryCode: string expected";
        if (message.steamRealm != null && message.hasOwnProperty("steamRealm"))
            if (!$util.isInteger(message.steamRealm))
                return "steamRealm: integer expected";
        return null;
    };

    /**
     * Creates a StoreBrowseContext message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof StoreBrowseContext
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {StoreBrowseContext} StoreBrowseContext
     */
    StoreBrowseContext.fromObject = function fromObject(object) {
        if (object instanceof $root.StoreBrowseContext)
            return object;
        let message = new $root.StoreBrowseContext();
        if (object.language != null)
            message.language = String(object.language);
        if (object.elanguage != null)
            message.elanguage = object.elanguage | 0;
        if (object.countryCode != null)
            message.countryCode = String(object.countryCode);
        if (object.steamRealm != null)
            message.steamRealm = object.steamRealm | 0;
        return message;
    };

    /**
     * Creates a plain object from a StoreBrowseContext message. Also converts values to other types if specified.
     * @function toObject
     * @memberof StoreBrowseContext
     * @static
     * @param {StoreBrowseContext} message StoreBrowseContext
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    StoreBrowseContext.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.language = "";
            object.elanguage = 0;
            object.countryCode = "";
            object.steamRealm = 0;
        }
        if (message.language != null && message.hasOwnProperty("language"))
            object.language = message.language;
        if (message.elanguage != null && message.hasOwnProperty("elanguage"))
            object.elanguage = message.elanguage;
        if (message.countryCode != null && message.hasOwnProperty("countryCode"))
            object.countryCode = message.countryCode;
        if (message.steamRealm != null && message.hasOwnProperty("steamRealm"))
            object.steamRealm = message.steamRealm;
        return object;
    };

    /**
     * Converts this StoreBrowseContext to JSON.
     * @function toJSON
     * @memberof StoreBrowseContext
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    StoreBrowseContext.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for StoreBrowseContext
     * @function getTypeUrl
     * @memberof StoreBrowseContext
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    StoreBrowseContext.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/StoreBrowseContext";
    };

    return StoreBrowseContext;
})();

export const StoreBrowseItemDataRequest = $root.StoreBrowseItemDataRequest = (() => {

    /**
     * Properties of a StoreBrowseItemDataRequest.
     * @exports IStoreBrowseItemDataRequest
     * @interface IStoreBrowseItemDataRequest
     * @property {boolean|null} [includeAssets] StoreBrowseItemDataRequest includeAssets
     * @property {boolean|null} [includeRelease] StoreBrowseItemDataRequest includeRelease
     * @property {boolean|null} [includePlatforms] StoreBrowseItemDataRequest includePlatforms
     * @property {boolean|null} [includeAllPurchaseOptions] StoreBrowseItemDataRequest includeAllPurchaseOptions
     * @property {boolean|null} [includeScreenshots] StoreBrowseItemDataRequest includeScreenshots
     * @property {boolean|null} [includeTrailers] StoreBrowseItemDataRequest includeTrailers
     * @property {boolean|null} [includeRatings] StoreBrowseItemDataRequest includeRatings
     * @property {number|null} [includeTagCount] StoreBrowseItemDataRequest includeTagCount
     * @property {boolean|null} [includeReviews] StoreBrowseItemDataRequest includeReviews
     * @property {boolean|null} [includeBasicInfo] StoreBrowseItemDataRequest includeBasicInfo
     * @property {boolean|null} [includeSupportedLanguages] StoreBrowseItemDataRequest includeSupportedLanguages
     * @property {boolean|null} [includeFullDescription] StoreBrowseItemDataRequest includeFullDescription
     * @property {boolean|null} [includeIncludedItems] StoreBrowseItemDataRequest includeIncludedItems
     * @property {IStoreBrowseItemDataRequest|null} [includedItemDataRequest] StoreBrowseItemDataRequest includedItemDataRequest
     * @property {boolean|null} [includeAssetsWithoutOverrides] StoreBrowseItemDataRequest includeAssetsWithoutOverrides
     * @property {boolean|null} [applyUserFilters] StoreBrowseItemDataRequest applyUserFilters
     * @property {boolean|null} [includeLinks] StoreBrowseItemDataRequest includeLinks
     */

    /**
     * Constructs a new StoreBrowseItemDataRequest.
     * @exports StoreBrowseItemDataRequest
     * @classdesc Represents a StoreBrowseItemDataRequest.
     * @implements IStoreBrowseItemDataRequest
     * @constructor
     * @param {IStoreBrowseItemDataRequest=} [properties] Properties to set
     */
    function StoreBrowseItemDataRequest(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * StoreBrowseItemDataRequest includeAssets.
     * @member {boolean} includeAssets
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includeAssets = false;

    /**
     * StoreBrowseItemDataRequest includeRelease.
     * @member {boolean} includeRelease
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includeRelease = false;

    /**
     * StoreBrowseItemDataRequest includePlatforms.
     * @member {boolean} includePlatforms
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includePlatforms = false;

    /**
     * StoreBrowseItemDataRequest includeAllPurchaseOptions.
     * @member {boolean} includeAllPurchaseOptions
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includeAllPurchaseOptions = false;

    /**
     * StoreBrowseItemDataRequest includeScreenshots.
     * @member {boolean} includeScreenshots
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includeScreenshots = false;

    /**
     * StoreBrowseItemDataRequest includeTrailers.
     * @member {boolean} includeTrailers
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includeTrailers = false;

    /**
     * StoreBrowseItemDataRequest includeRatings.
     * @member {boolean} includeRatings
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includeRatings = false;

    /**
     * StoreBrowseItemDataRequest includeTagCount.
     * @member {number} includeTagCount
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includeTagCount = 0;

    /**
     * StoreBrowseItemDataRequest includeReviews.
     * @member {boolean} includeReviews
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includeReviews = false;

    /**
     * StoreBrowseItemDataRequest includeBasicInfo.
     * @member {boolean} includeBasicInfo
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includeBasicInfo = false;

    /**
     * StoreBrowseItemDataRequest includeSupportedLanguages.
     * @member {boolean} includeSupportedLanguages
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includeSupportedLanguages = false;

    /**
     * StoreBrowseItemDataRequest includeFullDescription.
     * @member {boolean} includeFullDescription
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includeFullDescription = false;

    /**
     * StoreBrowseItemDataRequest includeIncludedItems.
     * @member {boolean} includeIncludedItems
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includeIncludedItems = false;

    /**
     * StoreBrowseItemDataRequest includedItemDataRequest.
     * @member {IStoreBrowseItemDataRequest|null|undefined} includedItemDataRequest
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includedItemDataRequest = null;

    /**
     * StoreBrowseItemDataRequest includeAssetsWithoutOverrides.
     * @member {boolean} includeAssetsWithoutOverrides
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includeAssetsWithoutOverrides = false;

    /**
     * StoreBrowseItemDataRequest applyUserFilters.
     * @member {boolean} applyUserFilters
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.applyUserFilters = false;

    /**
     * StoreBrowseItemDataRequest includeLinks.
     * @member {boolean} includeLinks
     * @memberof StoreBrowseItemDataRequest
     * @instance
     */
    StoreBrowseItemDataRequest.prototype.includeLinks = false;

    /**
     * Creates a new StoreBrowseItemDataRequest instance using the specified properties.
     * @function create
     * @memberof StoreBrowseItemDataRequest
     * @static
     * @param {IStoreBrowseItemDataRequest=} [properties] Properties to set
     * @returns {StoreBrowseItemDataRequest} StoreBrowseItemDataRequest instance
     */
    StoreBrowseItemDataRequest.create = function create(properties) {
        return new StoreBrowseItemDataRequest(properties);
    };

    /**
     * Encodes the specified StoreBrowseItemDataRequest message. Does not implicitly {@link StoreBrowseItemDataRequest.verify|verify} messages.
     * @function encode
     * @memberof StoreBrowseItemDataRequest
     * @static
     * @param {IStoreBrowseItemDataRequest} message StoreBrowseItemDataRequest message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    StoreBrowseItemDataRequest.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.includeAssets != null && Object.hasOwnProperty.call(message, "includeAssets"))
            writer.uint32(/* id 1, wireType 0 =*/8).bool(message.includeAssets);
        if (message.includeRelease != null && Object.hasOwnProperty.call(message, "includeRelease"))
            writer.uint32(/* id 2, wireType 0 =*/16).bool(message.includeRelease);
        if (message.includePlatforms != null && Object.hasOwnProperty.call(message, "includePlatforms"))
            writer.uint32(/* id 3, wireType 0 =*/24).bool(message.includePlatforms);
        if (message.includeAllPurchaseOptions != null && Object.hasOwnProperty.call(message, "includeAllPurchaseOptions"))
            writer.uint32(/* id 4, wireType 0 =*/32).bool(message.includeAllPurchaseOptions);
        if (message.includeScreenshots != null && Object.hasOwnProperty.call(message, "includeScreenshots"))
            writer.uint32(/* id 5, wireType 0 =*/40).bool(message.includeScreenshots);
        if (message.includeTrailers != null && Object.hasOwnProperty.call(message, "includeTrailers"))
            writer.uint32(/* id 6, wireType 0 =*/48).bool(message.includeTrailers);
        if (message.includeRatings != null && Object.hasOwnProperty.call(message, "includeRatings"))
            writer.uint32(/* id 7, wireType 0 =*/56).bool(message.includeRatings);
        if (message.includeTagCount != null && Object.hasOwnProperty.call(message, "includeTagCount"))
            writer.uint32(/* id 8, wireType 0 =*/64).int32(message.includeTagCount);
        if (message.includeReviews != null && Object.hasOwnProperty.call(message, "includeReviews"))
            writer.uint32(/* id 9, wireType 0 =*/72).bool(message.includeReviews);
        if (message.includeBasicInfo != null && Object.hasOwnProperty.call(message, "includeBasicInfo"))
            writer.uint32(/* id 10, wireType 0 =*/80).bool(message.includeBasicInfo);
        if (message.includeSupportedLanguages != null && Object.hasOwnProperty.call(message, "includeSupportedLanguages"))
            writer.uint32(/* id 11, wireType 0 =*/88).bool(message.includeSupportedLanguages);
        if (message.includeFullDescription != null && Object.hasOwnProperty.call(message, "includeFullDescription"))
            writer.uint32(/* id 12, wireType 0 =*/96).bool(message.includeFullDescription);
        if (message.includeIncludedItems != null && Object.hasOwnProperty.call(message, "includeIncludedItems"))
            writer.uint32(/* id 13, wireType 0 =*/104).bool(message.includeIncludedItems);
        if (message.includedItemDataRequest != null && Object.hasOwnProperty.call(message, "includedItemDataRequest"))
            $root.StoreBrowseItemDataRequest.encode(message.includedItemDataRequest, writer.uint32(/* id 14, wireType 2 =*/114).fork()).ldelim();
        if (message.includeAssetsWithoutOverrides != null && Object.hasOwnProperty.call(message, "includeAssetsWithoutOverrides"))
            writer.uint32(/* id 15, wireType 0 =*/120).bool(message.includeAssetsWithoutOverrides);
        if (message.applyUserFilters != null && Object.hasOwnProperty.call(message, "applyUserFilters"))
            writer.uint32(/* id 16, wireType 0 =*/128).bool(message.applyUserFilters);
        if (message.includeLinks != null && Object.hasOwnProperty.call(message, "includeLinks"))
            writer.uint32(/* id 17, wireType 0 =*/136).bool(message.includeLinks);
        return writer;
    };

    /**
     * Encodes the specified StoreBrowseItemDataRequest message, length delimited. Does not implicitly {@link StoreBrowseItemDataRequest.verify|verify} messages.
     * @function encodeDelimited
     * @memberof StoreBrowseItemDataRequest
     * @static
     * @param {IStoreBrowseItemDataRequest} message StoreBrowseItemDataRequest message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    StoreBrowseItemDataRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a StoreBrowseItemDataRequest message from the specified reader or buffer.
     * @function decode
     * @memberof StoreBrowseItemDataRequest
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {StoreBrowseItemDataRequest} StoreBrowseItemDataRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    StoreBrowseItemDataRequest.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.StoreBrowseItemDataRequest();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.includeAssets = reader.bool();
                    break;
                }
            case 2: {
                    message.includeRelease = reader.bool();
                    break;
                }
            case 3: {
                    message.includePlatforms = reader.bool();
                    break;
                }
            case 4: {
                    message.includeAllPurchaseOptions = reader.bool();
                    break;
                }
            case 5: {
                    message.includeScreenshots = reader.bool();
                    break;
                }
            case 6: {
                    message.includeTrailers = reader.bool();
                    break;
                }
            case 7: {
                    message.includeRatings = reader.bool();
                    break;
                }
            case 8: {
                    message.includeTagCount = reader.int32();
                    break;
                }
            case 9: {
                    message.includeReviews = reader.bool();
                    break;
                }
            case 10: {
                    message.includeBasicInfo = reader.bool();
                    break;
                }
            case 11: {
                    message.includeSupportedLanguages = reader.bool();
                    break;
                }
            case 12: {
                    message.includeFullDescription = reader.bool();
                    break;
                }
            case 13: {
                    message.includeIncludedItems = reader.bool();
                    break;
                }
            case 14: {
                    message.includedItemDataRequest = $root.StoreBrowseItemDataRequest.decode(reader, reader.uint32());
                    break;
                }
            case 15: {
                    message.includeAssetsWithoutOverrides = reader.bool();
                    break;
                }
            case 16: {
                    message.applyUserFilters = reader.bool();
                    break;
                }
            case 17: {
                    message.includeLinks = reader.bool();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a StoreBrowseItemDataRequest message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof StoreBrowseItemDataRequest
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {StoreBrowseItemDataRequest} StoreBrowseItemDataRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    StoreBrowseItemDataRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a StoreBrowseItemDataRequest message.
     * @function verify
     * @memberof StoreBrowseItemDataRequest
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    StoreBrowseItemDataRequest.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.includeAssets != null && message.hasOwnProperty("includeAssets"))
            if (typeof message.includeAssets !== "boolean")
                return "includeAssets: boolean expected";
        if (message.includeRelease != null && message.hasOwnProperty("includeRelease"))
            if (typeof message.includeRelease !== "boolean")
                return "includeRelease: boolean expected";
        if (message.includePlatforms != null && message.hasOwnProperty("includePlatforms"))
            if (typeof message.includePlatforms !== "boolean")
                return "includePlatforms: boolean expected";
        if (message.includeAllPurchaseOptions != null && message.hasOwnProperty("includeAllPurchaseOptions"))
            if (typeof message.includeAllPurchaseOptions !== "boolean")
                return "includeAllPurchaseOptions: boolean expected";
        if (message.includeScreenshots != null && message.hasOwnProperty("includeScreenshots"))
            if (typeof message.includeScreenshots !== "boolean")
                return "includeScreenshots: boolean expected";
        if (message.includeTrailers != null && message.hasOwnProperty("includeTrailers"))
            if (typeof message.includeTrailers !== "boolean")
                return "includeTrailers: boolean expected";
        if (message.includeRatings != null && message.hasOwnProperty("includeRatings"))
            if (typeof message.includeRatings !== "boolean")
                return "includeRatings: boolean expected";
        if (message.includeTagCount != null && message.hasOwnProperty("includeTagCount"))
            if (!$util.isInteger(message.includeTagCount))
                return "includeTagCount: integer expected";
        if (message.includeReviews != null && message.hasOwnProperty("includeReviews"))
            if (typeof message.includeReviews !== "boolean")
                return "includeReviews: boolean expected";
        if (message.includeBasicInfo != null && message.hasOwnProperty("includeBasicInfo"))
            if (typeof message.includeBasicInfo !== "boolean")
                return "includeBasicInfo: boolean expected";
        if (message.includeSupportedLanguages != null && message.hasOwnProperty("includeSupportedLanguages"))
            if (typeof message.includeSupportedLanguages !== "boolean")
                return "includeSupportedLanguages: boolean expected";
        if (message.includeFullDescription != null && message.hasOwnProperty("includeFullDescription"))
            if (typeof message.includeFullDescription !== "boolean")
                return "includeFullDescription: boolean expected";
        if (message.includeIncludedItems != null && message.hasOwnProperty("includeIncludedItems"))
            if (typeof message.includeIncludedItems !== "boolean")
                return "includeIncludedItems: boolean expected";
        if (message.includedItemDataRequest != null && message.hasOwnProperty("includedItemDataRequest")) {
            let error = $root.StoreBrowseItemDataRequest.verify(message.includedItemDataRequest);
            if (error)
                return "includedItemDataRequest." + error;
        }
        if (message.includeAssetsWithoutOverrides != null && message.hasOwnProperty("includeAssetsWithoutOverrides"))
            if (typeof message.includeAssetsWithoutOverrides !== "boolean")
                return "includeAssetsWithoutOverrides: boolean expected";
        if (message.applyUserFilters != null && message.hasOwnProperty("applyUserFilters"))
            if (typeof message.applyUserFilters !== "boolean")
                return "applyUserFilters: boolean expected";
        if (message.includeLinks != null && message.hasOwnProperty("includeLinks"))
            if (typeof message.includeLinks !== "boolean")
                return "includeLinks: boolean expected";
        return null;
    };

    /**
     * Creates a StoreBrowseItemDataRequest message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof StoreBrowseItemDataRequest
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {StoreBrowseItemDataRequest} StoreBrowseItemDataRequest
     */
    StoreBrowseItemDataRequest.fromObject = function fromObject(object) {
        if (object instanceof $root.StoreBrowseItemDataRequest)
            return object;
        let message = new $root.StoreBrowseItemDataRequest();
        if (object.includeAssets != null)
            message.includeAssets = Boolean(object.includeAssets);
        if (object.includeRelease != null)
            message.includeRelease = Boolean(object.includeRelease);
        if (object.includePlatforms != null)
            message.includePlatforms = Boolean(object.includePlatforms);
        if (object.includeAllPurchaseOptions != null)
            message.includeAllPurchaseOptions = Boolean(object.includeAllPurchaseOptions);
        if (object.includeScreenshots != null)
            message.includeScreenshots = Boolean(object.includeScreenshots);
        if (object.includeTrailers != null)
            message.includeTrailers = Boolean(object.includeTrailers);
        if (object.includeRatings != null)
            message.includeRatings = Boolean(object.includeRatings);
        if (object.includeTagCount != null)
            message.includeTagCount = object.includeTagCount | 0;
        if (object.includeReviews != null)
            message.includeReviews = Boolean(object.includeReviews);
        if (object.includeBasicInfo != null)
            message.includeBasicInfo = Boolean(object.includeBasicInfo);
        if (object.includeSupportedLanguages != null)
            message.includeSupportedLanguages = Boolean(object.includeSupportedLanguages);
        if (object.includeFullDescription != null)
            message.includeFullDescription = Boolean(object.includeFullDescription);
        if (object.includeIncludedItems != null)
            message.includeIncludedItems = Boolean(object.includeIncludedItems);
        if (object.includedItemDataRequest != null) {
            if (typeof object.includedItemDataRequest !== "object")
                throw TypeError(".StoreBrowseItemDataRequest.includedItemDataRequest: object expected");
            message.includedItemDataRequest = $root.StoreBrowseItemDataRequest.fromObject(object.includedItemDataRequest);
        }
        if (object.includeAssetsWithoutOverrides != null)
            message.includeAssetsWithoutOverrides = Boolean(object.includeAssetsWithoutOverrides);
        if (object.applyUserFilters != null)
            message.applyUserFilters = Boolean(object.applyUserFilters);
        if (object.includeLinks != null)
            message.includeLinks = Boolean(object.includeLinks);
        return message;
    };

    /**
     * Creates a plain object from a StoreBrowseItemDataRequest message. Also converts values to other types if specified.
     * @function toObject
     * @memberof StoreBrowseItemDataRequest
     * @static
     * @param {StoreBrowseItemDataRequest} message StoreBrowseItemDataRequest
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    StoreBrowseItemDataRequest.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.includeAssets = false;
            object.includeRelease = false;
            object.includePlatforms = false;
            object.includeAllPurchaseOptions = false;
            object.includeScreenshots = false;
            object.includeTrailers = false;
            object.includeRatings = false;
            object.includeTagCount = 0;
            object.includeReviews = false;
            object.includeBasicInfo = false;
            object.includeSupportedLanguages = false;
            object.includeFullDescription = false;
            object.includeIncludedItems = false;
            object.includedItemDataRequest = null;
            object.includeAssetsWithoutOverrides = false;
            object.applyUserFilters = false;
            object.includeLinks = false;
        }
        if (message.includeAssets != null && message.hasOwnProperty("includeAssets"))
            object.includeAssets = message.includeAssets;
        if (message.includeRelease != null && message.hasOwnProperty("includeRelease"))
            object.includeRelease = message.includeRelease;
        if (message.includePlatforms != null && message.hasOwnProperty("includePlatforms"))
            object.includePlatforms = message.includePlatforms;
        if (message.includeAllPurchaseOptions != null && message.hasOwnProperty("includeAllPurchaseOptions"))
            object.includeAllPurchaseOptions = message.includeAllPurchaseOptions;
        if (message.includeScreenshots != null && message.hasOwnProperty("includeScreenshots"))
            object.includeScreenshots = message.includeScreenshots;
        if (message.includeTrailers != null && message.hasOwnProperty("includeTrailers"))
            object.includeTrailers = message.includeTrailers;
        if (message.includeRatings != null && message.hasOwnProperty("includeRatings"))
            object.includeRatings = message.includeRatings;
        if (message.includeTagCount != null && message.hasOwnProperty("includeTagCount"))
            object.includeTagCount = message.includeTagCount;
        if (message.includeReviews != null && message.hasOwnProperty("includeReviews"))
            object.includeReviews = message.includeReviews;
        if (message.includeBasicInfo != null && message.hasOwnProperty("includeBasicInfo"))
            object.includeBasicInfo = message.includeBasicInfo;
        if (message.includeSupportedLanguages != null && message.hasOwnProperty("includeSupportedLanguages"))
            object.includeSupportedLanguages = message.includeSupportedLanguages;
        if (message.includeFullDescription != null && message.hasOwnProperty("includeFullDescription"))
            object.includeFullDescription = message.includeFullDescription;
        if (message.includeIncludedItems != null && message.hasOwnProperty("includeIncludedItems"))
            object.includeIncludedItems = message.includeIncludedItems;
        if (message.includedItemDataRequest != null && message.hasOwnProperty("includedItemDataRequest"))
            object.includedItemDataRequest = $root.StoreBrowseItemDataRequest.toObject(message.includedItemDataRequest, options);
        if (message.includeAssetsWithoutOverrides != null && message.hasOwnProperty("includeAssetsWithoutOverrides"))
            object.includeAssetsWithoutOverrides = message.includeAssetsWithoutOverrides;
        if (message.applyUserFilters != null && message.hasOwnProperty("applyUserFilters"))
            object.applyUserFilters = message.applyUserFilters;
        if (message.includeLinks != null && message.hasOwnProperty("includeLinks"))
            object.includeLinks = message.includeLinks;
        return object;
    };

    /**
     * Converts this StoreBrowseItemDataRequest to JSON.
     * @function toJSON
     * @memberof StoreBrowseItemDataRequest
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    StoreBrowseItemDataRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for StoreBrowseItemDataRequest
     * @function getTypeUrl
     * @memberof StoreBrowseItemDataRequest
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    StoreBrowseItemDataRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/StoreBrowseItemDataRequest";
    };

    return StoreBrowseItemDataRequest;
})();

export const StoreItem = $root.StoreItem = (() => {

    /**
     * Properties of a StoreItem.
     * @exports IStoreItem
     * @interface IStoreItem
     * @property {number|null} [itemType] StoreItem itemType
     * @property {number|null} [id] StoreItem id
     * @property {number|null} [success] StoreItem success
     * @property {boolean|null} [visible] StoreItem visible
     * @property {boolean|null} [unvailableForCountryRestriction] StoreItem unvailableForCountryRestriction
     * @property {string|null} [name] StoreItem name
     * @property {string|null} [storeUrlPath] StoreItem storeUrlPath
     * @property {number|null} [appid] StoreItem appid
     * @property {number|null} [type] StoreItem type
     * @property {Array.<number>|null} [includedTypes] StoreItem includedTypes
     * @property {Array.<number>|null} [includedAppids] StoreItem includedAppids
     * @property {boolean|null} [isFree] StoreItem isFree
     * @property {boolean|null} [isEarlyAccess] StoreItem isEarlyAccess
     * @property {ItoreItem_RelatedItems|null} [relatedItems] StoreItem relatedItems
     * @property {ItoreItem_IncludedItems|null} [includedItems] StoreItem includedItems
     * @property {Array.<number>|null} [contentDescriptorids] StoreItem contentDescriptorids
     * @property {Array.<number>|null} [tagids] StoreItem tagids
     * @property {ItoreItem_Categories|null} [categories] StoreItem categories
     * @property {ItoreItem_Reviews|null} [reviews] StoreItem reviews
     * @property {ItoreItem_BasicInfo|null} [basicInfo] StoreItem basicInfo
     * @property {Array.<ItoreItem_Tag>|null} [tags] StoreItem tags
     * @property {ItoreItem_Assets|null} [assets] StoreItem assets
     * @property {ItoreItem_ReleaseInfo|null} [release] StoreItem release
     * @property {ItoreItem_Platforms|null} [platforms] StoreItem platforms
     * @property {ItoreGameRating|null} [gameRating] StoreItem gameRating
     * @property {boolean|null} [isComingSoon] StoreItem isComingSoon
     * @property {ItoreItem_PurchaseOption|null} [bestPurchaseOption] StoreItem bestPurchaseOption
     * @property {Array.<ItoreItem_PurchaseOption>|null} [purchaseOptions] StoreItem purchaseOptions
     * @property {Array.<ItoreItem_PurchaseOption>|null} [accessories] StoreItem accessories
     * @property {ItoreItem_PurchaseOption|null} [selfPurchaseOption] StoreItem selfPurchaseOption
     * @property {ItoreItem_Screenshots|null} [screenshots] StoreItem screenshots
     * @property {ItoreItem_Trailers|null} [trailers] StoreItem trailers
     * @property {Array.<ItoreItem_SupportedLanguage>|null} [supportedLanguages] StoreItem supportedLanguages
     * @property {string|null} [storeUrlPathOverride] StoreItem storeUrlPathOverride
     * @property {ItoreItem_FreeWeekend|null} [freeWeekend] StoreItem freeWeekend
     * @property {boolean|null} [unlisted] StoreItem unlisted
     * @property {number|null} [gameCount] StoreItem gameCount
     * @property {string|null} [internalName] StoreItem internalName
     * @property {string|null} [fullDescription] StoreItem fullDescription
     * @property {boolean|null} [isFreeTemporarily] StoreItem isFreeTemporarily
     * @property {ItoreItem_Assets|null} [assetsWithoutOverrides] StoreItem assetsWithoutOverrides
     * @property {ItoreBrowseFilterFailure|null} [userFilterFailure] StoreItem userFilterFailure
     * @property {Array.<ItoreItem_Link>|null} [links] StoreItem links
     */

    /**
     * Constructs a new StoreItem.
     * @exports StoreItem
     * @classdesc Represents a StoreItem.
     * @implements IStoreItem
     * @constructor
     * @param {IStoreItem=} [properties] Properties to set
     */
    function StoreItem(properties) {
        this.includedTypes = [];
        this.includedAppids = [];
        this.contentDescriptorids = [];
        this.tagids = [];
        this.tags = [];
        this.purchaseOptions = [];
        this.accessories = [];
        this.supportedLanguages = [];
        this.links = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * StoreItem itemType.
     * @member {number} itemType
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.itemType = 0;

    /**
     * StoreItem id.
     * @member {number} id
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.id = 0;

    /**
     * StoreItem success.
     * @member {number} success
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.success = 0;

    /**
     * StoreItem visible.
     * @member {boolean} visible
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.visible = false;

    /**
     * StoreItem unvailableForCountryRestriction.
     * @member {boolean} unvailableForCountryRestriction
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.unvailableForCountryRestriction = false;

    /**
     * StoreItem name.
     * @member {string} name
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.name = "";

    /**
     * StoreItem storeUrlPath.
     * @member {string} storeUrlPath
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.storeUrlPath = "";

    /**
     * StoreItem appid.
     * @member {number} appid
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.appid = 0;

    /**
     * StoreItem type.
     * @member {number} type
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.type = 0;

    /**
     * StoreItem includedTypes.
     * @member {Array.<number>} includedTypes
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.includedTypes = $util.emptyArray;

    /**
     * StoreItem includedAppids.
     * @member {Array.<number>} includedAppids
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.includedAppids = $util.emptyArray;

    /**
     * StoreItem isFree.
     * @member {boolean} isFree
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.isFree = false;

    /**
     * StoreItem isEarlyAccess.
     * @member {boolean} isEarlyAccess
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.isEarlyAccess = false;

    /**
     * StoreItem relatedItems.
     * @member {ItoreItem_RelatedItems|null|undefined} relatedItems
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.relatedItems = null;

    /**
     * StoreItem includedItems.
     * @member {ItoreItem_IncludedItems|null|undefined} includedItems
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.includedItems = null;

    /**
     * StoreItem contentDescriptorids.
     * @member {Array.<number>} contentDescriptorids
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.contentDescriptorids = $util.emptyArray;

    /**
     * StoreItem tagids.
     * @member {Array.<number>} tagids
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.tagids = $util.emptyArray;

    /**
     * StoreItem categories.
     * @member {ItoreItem_Categories|null|undefined} categories
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.categories = null;

    /**
     * StoreItem reviews.
     * @member {ItoreItem_Reviews|null|undefined} reviews
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.reviews = null;

    /**
     * StoreItem basicInfo.
     * @member {ItoreItem_BasicInfo|null|undefined} basicInfo
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.basicInfo = null;

    /**
     * StoreItem tags.
     * @member {Array.<ItoreItem_Tag>} tags
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.tags = $util.emptyArray;

    /**
     * StoreItem assets.
     * @member {ItoreItem_Assets|null|undefined} assets
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.assets = null;

    /**
     * StoreItem release.
     * @member {ItoreItem_ReleaseInfo|null|undefined} release
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.release = null;

    /**
     * StoreItem platforms.
     * @member {ItoreItem_Platforms|null|undefined} platforms
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.platforms = null;

    /**
     * StoreItem gameRating.
     * @member {ItoreGameRating|null|undefined} gameRating
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.gameRating = null;

    /**
     * StoreItem isComingSoon.
     * @member {boolean} isComingSoon
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.isComingSoon = false;

    /**
     * StoreItem bestPurchaseOption.
     * @member {ItoreItem_PurchaseOption|null|undefined} bestPurchaseOption
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.bestPurchaseOption = null;

    /**
     * StoreItem purchaseOptions.
     * @member {Array.<ItoreItem_PurchaseOption>} purchaseOptions
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.purchaseOptions = $util.emptyArray;

    /**
     * StoreItem accessories.
     * @member {Array.<ItoreItem_PurchaseOption>} accessories
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.accessories = $util.emptyArray;

    /**
     * StoreItem selfPurchaseOption.
     * @member {ItoreItem_PurchaseOption|null|undefined} selfPurchaseOption
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.selfPurchaseOption = null;

    /**
     * StoreItem screenshots.
     * @member {ItoreItem_Screenshots|null|undefined} screenshots
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.screenshots = null;

    /**
     * StoreItem trailers.
     * @member {ItoreItem_Trailers|null|undefined} trailers
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.trailers = null;

    /**
     * StoreItem supportedLanguages.
     * @member {Array.<ItoreItem_SupportedLanguage>} supportedLanguages
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.supportedLanguages = $util.emptyArray;

    /**
     * StoreItem storeUrlPathOverride.
     * @member {string} storeUrlPathOverride
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.storeUrlPathOverride = "";

    /**
     * StoreItem freeWeekend.
     * @member {ItoreItem_FreeWeekend|null|undefined} freeWeekend
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.freeWeekend = null;

    /**
     * StoreItem unlisted.
     * @member {boolean} unlisted
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.unlisted = false;

    /**
     * StoreItem gameCount.
     * @member {number} gameCount
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.gameCount = 0;

    /**
     * StoreItem internalName.
     * @member {string} internalName
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.internalName = "";

    /**
     * StoreItem fullDescription.
     * @member {string} fullDescription
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.fullDescription = "";

    /**
     * StoreItem isFreeTemporarily.
     * @member {boolean} isFreeTemporarily
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.isFreeTemporarily = false;

    /**
     * StoreItem assetsWithoutOverrides.
     * @member {ItoreItem_Assets|null|undefined} assetsWithoutOverrides
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.assetsWithoutOverrides = null;

    /**
     * StoreItem userFilterFailure.
     * @member {ItoreBrowseFilterFailure|null|undefined} userFilterFailure
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.userFilterFailure = null;

    /**
     * StoreItem links.
     * @member {Array.<ItoreItem_Link>} links
     * @memberof StoreItem
     * @instance
     */
    StoreItem.prototype.links = $util.emptyArray;

    /**
     * Creates a new StoreItem instance using the specified properties.
     * @function create
     * @memberof StoreItem
     * @static
     * @param {IStoreItem=} [properties] Properties to set
     * @returns {StoreItem} StoreItem instance
     */
    StoreItem.create = function create(properties) {
        return new StoreItem(properties);
    };

    /**
     * Encodes the specified StoreItem message. Does not implicitly {@link StoreItem.verify|verify} messages.
     * @function encode
     * @memberof StoreItem
     * @static
     * @param {IStoreItem} message StoreItem message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    StoreItem.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.itemType != null && Object.hasOwnProperty.call(message, "itemType"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.itemType);
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.id);
        if (message.success != null && Object.hasOwnProperty.call(message, "success"))
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.success);
        if (message.visible != null && Object.hasOwnProperty.call(message, "visible"))
            writer.uint32(/* id 4, wireType 0 =*/32).bool(message.visible);
        if (message.unvailableForCountryRestriction != null && Object.hasOwnProperty.call(message, "unvailableForCountryRestriction"))
            writer.uint32(/* id 5, wireType 0 =*/40).bool(message.unvailableForCountryRestriction);
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 6, wireType 2 =*/50).string(message.name);
        if (message.storeUrlPath != null && Object.hasOwnProperty.call(message, "storeUrlPath"))
            writer.uint32(/* id 7, wireType 2 =*/58).string(message.storeUrlPath);
        if (message.appid != null && Object.hasOwnProperty.call(message, "appid"))
            writer.uint32(/* id 9, wireType 0 =*/72).uint32(message.appid);
        if (message.type != null && Object.hasOwnProperty.call(message, "type"))
            writer.uint32(/* id 10, wireType 0 =*/80).int32(message.type);
        if (message.includedTypes != null && message.includedTypes.length)
            for (let i = 0; i < message.includedTypes.length; ++i)
                writer.uint32(/* id 11, wireType 0 =*/88).int32(message.includedTypes[i]);
        if (message.includedAppids != null && message.includedAppids.length)
            for (let i = 0; i < message.includedAppids.length; ++i)
                writer.uint32(/* id 12, wireType 0 =*/96).uint32(message.includedAppids[i]);
        if (message.isFree != null && Object.hasOwnProperty.call(message, "isFree"))
            writer.uint32(/* id 13, wireType 0 =*/104).bool(message.isFree);
        if (message.isEarlyAccess != null && Object.hasOwnProperty.call(message, "isEarlyAccess"))
            writer.uint32(/* id 14, wireType 0 =*/112).bool(message.isEarlyAccess);
        if (message.relatedItems != null && Object.hasOwnProperty.call(message, "relatedItems"))
            $rootStoreItem_RelatedItems.encode(message.relatedItems, writer.uint32(/* id 15, wireType 2 =*/122).fork()).ldelim();
        if (message.includedItems != null && Object.hasOwnProperty.call(message, "includedItems"))
            $rootStoreItem_IncludedItems.encode(message.includedItems, writer.uint32(/* id 16, wireType 2 =*/130).fork()).ldelim();
        if (message.contentDescriptorids != null && message.contentDescriptorids.length)
            for (let i = 0; i < message.contentDescriptorids.length; ++i)
                writer.uint32(/* id 20, wireType 0 =*/160).int32(message.contentDescriptorids[i]);
        if (message.tagids != null && message.tagids.length)
            for (let i = 0; i < message.tagids.length; ++i)
                writer.uint32(/* id 21, wireType 0 =*/168).uint32(message.tagids[i]);
        if (message.categories != null && Object.hasOwnProperty.call(message, "categories"))
            $rootStoreItem_Categories.encode(message.categories, writer.uint32(/* id 22, wireType 2 =*/178).fork()).ldelim();
        if (message.reviews != null && Object.hasOwnProperty.call(message, "reviews"))
            $rootStoreItem_Reviews.encode(message.reviews, writer.uint32(/* id 23, wireType 2 =*/186).fork()).ldelim();
        if (message.basicInfo != null && Object.hasOwnProperty.call(message, "basicInfo"))
            $rootStoreItem_BasicInfo.encode(message.basicInfo, writer.uint32(/* id 24, wireType 2 =*/194).fork()).ldelim();
        if (message.tags != null && message.tags.length)
            for (let i = 0; i < message.tags.length; ++i)
                $rootStoreItem_Tag.encode(message.tags[i], writer.uint32(/* id 25, wireType 2 =*/202).fork()).ldelim();
        if (message.assets != null && Object.hasOwnProperty.call(message, "assets"))
            $rootStoreItem_Assets.encode(message.assets, writer.uint32(/* id 30, wireType 2 =*/242).fork()).ldelim();
        if (message.release != null && Object.hasOwnProperty.call(message, "release"))
            $rootStoreItem_ReleaseInfo.encode(message.release, writer.uint32(/* id 31, wireType 2 =*/250).fork()).ldelim();
        if (message.platforms != null && Object.hasOwnProperty.call(message, "platforms"))
            $rootStoreItem_Platforms.encode(message.platforms, writer.uint32(/* id 32, wireType 2 =*/258).fork()).ldelim();
        if (message.gameRating != null && Object.hasOwnProperty.call(message, "gameRating"))
            $rootStoreGameRating.encode(message.gameRating, writer.uint32(/* id 33, wireType 2 =*/266).fork()).ldelim();
        if (message.isComingSoon != null && Object.hasOwnProperty.call(message, "isComingSoon"))
            writer.uint32(/* id 34, wireType 0 =*/272).bool(message.isComingSoon);
        if (message.bestPurchaseOption != null && Object.hasOwnProperty.call(message, "bestPurchaseOption"))
            $rootStoreItem_PurchaseOption.encode(message.bestPurchaseOption, writer.uint32(/* id 40, wireType 2 =*/322).fork()).ldelim();
        if (message.purchaseOptions != null && message.purchaseOptions.length)
            for (let i = 0; i < message.purchaseOptions.length; ++i)
                $rootStoreItem_PurchaseOption.encode(message.purchaseOptions[i], writer.uint32(/* id 41, wireType 2 =*/330).fork()).ldelim();
        if (message.accessories != null && message.accessories.length)
            for (let i = 0; i < message.accessories.length; ++i)
                $rootStoreItem_PurchaseOption.encode(message.accessories[i], writer.uint32(/* id 42, wireType 2 =*/338).fork()).ldelim();
        if (message.selfPurchaseOption != null && Object.hasOwnProperty.call(message, "selfPurchaseOption"))
            $rootStoreItem_PurchaseOption.encode(message.selfPurchaseOption, writer.uint32(/* id 43, wireType 2 =*/346).fork()).ldelim();
        if (message.screenshots != null && Object.hasOwnProperty.call(message, "screenshots"))
            $rootStoreItem_Screenshots.encode(message.screenshots, writer.uint32(/* id 50, wireType 2 =*/402).fork()).ldelim();
        if (message.trailers != null && Object.hasOwnProperty.call(message, "trailers"))
            $rootStoreItem_Trailers.encode(message.trailers, writer.uint32(/* id 51, wireType 2 =*/410).fork()).ldelim();
        if (message.supportedLanguages != null && message.supportedLanguages.length)
            for (let i = 0; i < message.supportedLanguages.length; ++i)
                $rootStoreItem_SupportedLanguage.encode(message.supportedLanguages[i], writer.uint32(/* id 52, wireType 2 =*/418).fork()).ldelim();
        if (message.storeUrlPathOverride != null && Object.hasOwnProperty.call(message, "storeUrlPathOverride"))
            writer.uint32(/* id 53, wireType 2 =*/426).string(message.storeUrlPathOverride);
        if (message.freeWeekend != null && Object.hasOwnProperty.call(message, "freeWeekend"))
            $rootStoreItem_FreeWeekend.encode(message.freeWeekend, writer.uint32(/* id 54, wireType 2 =*/434).fork()).ldelim();
        if (message.unlisted != null && Object.hasOwnProperty.call(message, "unlisted"))
            writer.uint32(/* id 55, wireType 0 =*/440).bool(message.unlisted);
        if (message.gameCount != null && Object.hasOwnProperty.call(message, "gameCount"))
            writer.uint32(/* id 56, wireType 0 =*/448).uint32(message.gameCount);
        if (message.internalName != null && Object.hasOwnProperty.call(message, "internalName"))
            writer.uint32(/* id 57, wireType 2 =*/458).string(message.internalName);
        if (message.fullDescription != null && Object.hasOwnProperty.call(message, "fullDescription"))
            writer.uint32(/* id 58, wireType 2 =*/466).string(message.fullDescription);
        if (message.isFreeTemporarily != null && Object.hasOwnProperty.call(message, "isFreeTemporarily"))
            writer.uint32(/* id 59, wireType 0 =*/472).bool(message.isFreeTemporarily);
        if (message.assetsWithoutOverrides != null && Object.hasOwnProperty.call(message, "assetsWithoutOverrides"))
            $rootStoreItem_Assets.encode(message.assetsWithoutOverrides, writer.uint32(/* id 60, wireType 2 =*/482).fork()).ldelim();
        if (message.userFilterFailure != null && Object.hasOwnProperty.call(message, "userFilterFailure"))
            $rootStoreBrowseFilterFailure.encode(message.userFilterFailure, writer.uint32(/* id 70, wireType 2 =*/562).fork()).ldelim();
        if (message.links != null && message.links.length)
            for (let i = 0; i < message.links.length; ++i)
                $rootStoreItem_Link.encode(message.links[i], writer.uint32(/* id 71, wireType 2 =*/570).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified StoreItem message, length delimited. Does not implicitly {@link StoreItem.verify|verify} messages.
     * @function encodeDelimited
     * @memberof StoreItem
     * @static
     * @param {IStoreItem} message StoreItem message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    StoreItem.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a StoreItem message from the specified reader or buffer.
     * @function decode
     * @memberof StoreItem
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {StoreItem} StoreItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    StoreItem.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.StoreItem();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.itemType = reader.int32();
                    break;
                }
            case 2: {
                    message.id = reader.uint32();
                    break;
                }
            case 3: {
                    message.success = reader.uint32();
                    break;
                }
            case 4: {
                    message.visible = reader.bool();
                    break;
                }
            case 5: {
                    message.unvailableForCountryRestriction = reader.bool();
                    break;
                }
            case 6: {
                    message.name = reader.string();
                    break;
                }
            case 7: {
                    message.storeUrlPath = reader.string();
                    break;
                }
            case 9: {
                    message.appid = reader.uint32();
                    break;
                }
            case 10: {
                    message.type = reader.int32();
                    break;
                }
            case 11: {
                    if (!(message.includedTypes && message.includedTypes.length))
                        message.includedTypes = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.includedTypes.push(reader.int32());
                    } else
                        message.includedTypes.push(reader.int32());
                    break;
                }
            case 12: {
                    if (!(message.includedAppids && message.includedAppids.length))
                        message.includedAppids = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.includedAppids.push(reader.uint32());
                    } else
                        message.includedAppids.push(reader.uint32());
                    break;
                }
            case 13: {
                    message.isFree = reader.bool();
                    break;
                }
            case 14: {
                    message.isEarlyAccess = reader.bool();
                    break;
                }
            case 15: {
                    message.relatedItems = $rootStoreItem_RelatedItems.decode(reader, reader.uint32());
                    break;
                }
            case 16: {
                    message.includedItems = $rootStoreItem_IncludedItems.decode(reader, reader.uint32());
                    break;
                }
            case 20: {
                    if (!(message.contentDescriptorids && message.contentDescriptorids.length))
                        message.contentDescriptorids = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.contentDescriptorids.push(reader.int32());
                    } else
                        message.contentDescriptorids.push(reader.int32());
                    break;
                }
            case 21: {
                    if (!(message.tagids && message.tagids.length))
                        message.tagids = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.tagids.push(reader.uint32());
                    } else
                        message.tagids.push(reader.uint32());
                    break;
                }
            case 22: {
                    message.categories = $rootStoreItem_Categories.decode(reader, reader.uint32());
                    break;
                }
            case 23: {
                    message.reviews = $rootStoreItem_Reviews.decode(reader, reader.uint32());
                    break;
                }
            case 24: {
                    message.basicInfo = $rootStoreItem_BasicInfo.decode(reader, reader.uint32());
                    break;
                }
            case 25: {
                    if (!(message.tags && message.tags.length))
                        message.tags = [];
                    message.tags.push($rootStoreItem_Tag.decode(reader, reader.uint32()));
                    break;
                }
            case 30: {
                    message.assets = $rootStoreItem_Assets.decode(reader, reader.uint32());
                    break;
                }
            case 31: {
                    message.release = $rootStoreItem_ReleaseInfo.decode(reader, reader.uint32());
                    break;
                }
            case 32: {
                    message.platforms = $rootStoreItem_Platforms.decode(reader, reader.uint32());
                    break;
                }
            case 33: {
                    message.gameRating = $rootStoreGameRating.decode(reader, reader.uint32());
                    break;
                }
            case 34: {
                    message.isComingSoon = reader.bool();
                    break;
                }
            case 40: {
                    message.bestPurchaseOption = $rootStoreItem_PurchaseOption.decode(reader, reader.uint32());
                    break;
                }
            case 41: {
                    if (!(message.purchaseOptions && message.purchaseOptions.length))
                        message.purchaseOptions = [];
                    message.purchaseOptions.push($rootStoreItem_PurchaseOption.decode(reader, reader.uint32()));
                    break;
                }
            case 42: {
                    if (!(message.accessories && message.accessories.length))
                        message.accessories = [];
                    message.accessories.push($rootStoreItem_PurchaseOption.decode(reader, reader.uint32()));
                    break;
                }
            case 43: {
                    message.selfPurchaseOption = $rootStoreItem_PurchaseOption.decode(reader, reader.uint32());
                    break;
                }
            case 50: {
                    message.screenshots = $rootStoreItem_Screenshots.decode(reader, reader.uint32());
                    break;
                }
            case 51: {
                    message.trailers = $rootStoreItem_Trailers.decode(reader, reader.uint32());
                    break;
                }
            case 52: {
                    if (!(message.supportedLanguages && message.supportedLanguages.length))
                        message.supportedLanguages = [];
                    message.supportedLanguages.push($rootStoreItem_SupportedLanguage.decode(reader, reader.uint32()));
                    break;
                }
            case 53: {
                    message.storeUrlPathOverride = reader.string();
                    break;
                }
            case 54: {
                    message.freeWeekend = $rootStoreItem_FreeWeekend.decode(reader, reader.uint32());
                    break;
                }
            case 55: {
                    message.unlisted = reader.bool();
                    break;
                }
            case 56: {
                    message.gameCount = reader.uint32();
                    break;
                }
            case 57: {
                    message.internalName = reader.string();
                    break;
                }
            case 58: {
                    message.fullDescription = reader.string();
                    break;
                }
            case 59: {
                    message.isFreeTemporarily = reader.bool();
                    break;
                }
            case 60: {
                    message.assetsWithoutOverrides = $rootStoreItem_Assets.decode(reader, reader.uint32());
                    break;
                }
            case 70: {
                    message.userFilterFailure = $rootStoreBrowseFilterFailure.decode(reader, reader.uint32());
                    break;
                }
            case 71: {
                    if (!(message.links && message.links.length))
                        message.links = [];
                    message.links.push($rootStoreItem_Link.decode(reader, reader.uint32()));
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a StoreItem message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof StoreItem
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {StoreItem} StoreItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    StoreItem.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a StoreItem message.
     * @function verify
     * @memberof StoreItem
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    StoreItem.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.itemType != null && message.hasOwnProperty("itemType"))
            if (!$util.isInteger(message.itemType))
                return "itemType: integer expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id))
                return "id: integer expected";
        if (message.success != null && message.hasOwnProperty("success"))
            if (!$util.isInteger(message.success))
                return "success: integer expected";
        if (message.visible != null && message.hasOwnProperty("visible"))
            if (typeof message.visible !== "boolean")
                return "visible: boolean expected";
        if (message.unvailableForCountryRestriction != null && message.hasOwnProperty("unvailableForCountryRestriction"))
            if (typeof message.unvailableForCountryRestriction !== "boolean")
                return "unvailableForCountryRestriction: boolean expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        if (message.storeUrlPath != null && message.hasOwnProperty("storeUrlPath"))
            if (!$util.isString(message.storeUrlPath))
                return "storeUrlPath: string expected";
        if (message.appid != null && message.hasOwnProperty("appid"))
            if (!$util.isInteger(message.appid))
                return "appid: integer expected";
        if (message.type != null && message.hasOwnProperty("type"))
            if (!$util.isInteger(message.type))
                return "type: integer expected";
        if (message.includedTypes != null && message.hasOwnProperty("includedTypes")) {
            if (!Array.isArray(message.includedTypes))
                return "includedTypes: array expected";
            for (let i = 0; i < message.includedTypes.length; ++i)
                if (!$util.isInteger(message.includedTypes[i]))
                    return "includedTypes: integer[] expected";
        }
        if (message.includedAppids != null && message.hasOwnProperty("includedAppids")) {
            if (!Array.isArray(message.includedAppids))
                return "includedAppids: array expected";
            for (let i = 0; i < message.includedAppids.length; ++i)
                if (!$util.isInteger(message.includedAppids[i]))
                    return "includedAppids: integer[] expected";
        }
        if (message.isFree != null && message.hasOwnProperty("isFree"))
            if (typeof message.isFree !== "boolean")
                return "isFree: boolean expected";
        if (message.isEarlyAccess != null && message.hasOwnProperty("isEarlyAccess"))
            if (typeof message.isEarlyAccess !== "boolean")
                return "isEarlyAccess: boolean expected";
        if (message.relatedItems != null && message.hasOwnProperty("relatedItems")) {
            let error = $rootStoreItem_RelatedItems.verify(message.relatedItems);
            if (error)
                return "relatedItems." + error;
        }
        if (message.includedItems != null && message.hasOwnProperty("includedItems")) {
            let error = $rootStoreItem_IncludedItems.verify(message.includedItems);
            if (error)
                return "includedItems." + error;
        }
        if (message.contentDescriptorids != null && message.hasOwnProperty("contentDescriptorids")) {
            if (!Array.isArray(message.contentDescriptorids))
                return "contentDescriptorids: array expected";
            for (let i = 0; i < message.contentDescriptorids.length; ++i)
                if (!$util.isInteger(message.contentDescriptorids[i]))
                    return "contentDescriptorids: integer[] expected";
        }
        if (message.tagids != null && message.hasOwnProperty("tagids")) {
            if (!Array.isArray(message.tagids))
                return "tagids: array expected";
            for (let i = 0; i < message.tagids.length; ++i)
                if (!$util.isInteger(message.tagids[i]))
                    return "tagids: integer[] expected";
        }
        if (message.categories != null && message.hasOwnProperty("categories")) {
            let error = $rootStoreItem_Categories.verify(message.categories);
            if (error)
                return "categories." + error;
        }
        if (message.reviews != null && message.hasOwnProperty("reviews")) {
            let error = $rootStoreItem_Reviews.verify(message.reviews);
            if (error)
                return "reviews." + error;
        }
        if (message.basicInfo != null && message.hasOwnProperty("basicInfo")) {
            let error = $rootStoreItem_BasicInfo.verify(message.basicInfo);
            if (error)
                return "basicInfo." + error;
        }
        if (message.tags != null && message.hasOwnProperty("tags")) {
            if (!Array.isArray(message.tags))
                return "tags: array expected";
            for (let i = 0; i < message.tags.length; ++i) {
                let error = $rootStoreItem_Tag.verify(message.tags[i]);
                if (error)
                    return "tags." + error;
            }
        }
        if (message.assets != null && message.hasOwnProperty("assets")) {
            let error = $rootStoreItem_Assets.verify(message.assets);
            if (error)
                return "assets." + error;
        }
        if (message.release != null && message.hasOwnProperty("release")) {
            let error = $rootStoreItem_ReleaseInfo.verify(message.release);
            if (error)
                return "release." + error;
        }
        if (message.platforms != null && message.hasOwnProperty("platforms")) {
            let error = $rootStoreItem_Platforms.verify(message.platforms);
            if (error)
                return "platforms." + error;
        }
        if (message.gameRating != null && message.hasOwnProperty("gameRating")) {
            let error = $rootStoreGameRating.verify(message.gameRating);
            if (error)
                return "gameRating." + error;
        }
        if (message.isComingSoon != null && message.hasOwnProperty("isComingSoon"))
            if (typeof message.isComingSoon !== "boolean")
                return "isComingSoon: boolean expected";
        if (message.bestPurchaseOption != null && message.hasOwnProperty("bestPurchaseOption")) {
            let error = $rootStoreItem_PurchaseOption.verify(message.bestPurchaseOption);
            if (error)
                return "bestPurchaseOption." + error;
        }
        if (message.purchaseOptions != null && message.hasOwnProperty("purchaseOptions")) {
            if (!Array.isArray(message.purchaseOptions))
                return "purchaseOptions: array expected";
            for (let i = 0; i < message.purchaseOptions.length; ++i) {
                let error = $rootStoreItem_PurchaseOption.verify(message.purchaseOptions[i]);
                if (error)
                    return "purchaseOptions." + error;
            }
        }
        if (message.accessories != null && message.hasOwnProperty("accessories")) {
            if (!Array.isArray(message.accessories))
                return "accessories: array expected";
            for (let i = 0; i < message.accessories.length; ++i) {
                let error = $rootStoreItem_PurchaseOption.verify(message.accessories[i]);
                if (error)
                    return "accessories." + error;
            }
        }
        if (message.selfPurchaseOption != null && message.hasOwnProperty("selfPurchaseOption")) {
            let error = $rootStoreItem_PurchaseOption.verify(message.selfPurchaseOption);
            if (error)
                return "selfPurchaseOption." + error;
        }
        if (message.screenshots != null && message.hasOwnProperty("screenshots")) {
            let error = $rootStoreItem_Screenshots.verify(message.screenshots);
            if (error)
                return "screenshots." + error;
        }
        if (message.trailers != null && message.hasOwnProperty("trailers")) {
            let error = $rootStoreItem_Trailers.verify(message.trailers);
            if (error)
                return "trailers." + error;
        }
        if (message.supportedLanguages != null && message.hasOwnProperty("supportedLanguages")) {
            if (!Array.isArray(message.supportedLanguages))
                return "supportedLanguages: array expected";
            for (let i = 0; i < message.supportedLanguages.length; ++i) {
                let error = $rootStoreItem_SupportedLanguage.verify(message.supportedLanguages[i]);
                if (error)
                    return "supportedLanguages." + error;
            }
        }
        if (message.storeUrlPathOverride != null && message.hasOwnProperty("storeUrlPathOverride"))
            if (!$util.isString(message.storeUrlPathOverride))
                return "storeUrlPathOverride: string expected";
        if (message.freeWeekend != null && message.hasOwnProperty("freeWeekend")) {
            let error = $rootStoreItem_FreeWeekend.verify(message.freeWeekend);
            if (error)
                return "freeWeekend." + error;
        }
        if (message.unlisted != null && message.hasOwnProperty("unlisted"))
            if (typeof message.unlisted !== "boolean")
                return "unlisted: boolean expected";
        if (message.gameCount != null && message.hasOwnProperty("gameCount"))
            if (!$util.isInteger(message.gameCount))
                return "gameCount: integer expected";
        if (message.internalName != null && message.hasOwnProperty("internalName"))
            if (!$util.isString(message.internalName))
                return "internalName: string expected";
        if (message.fullDescription != null && message.hasOwnProperty("fullDescription"))
            if (!$util.isString(message.fullDescription))
                return "fullDescription: string expected";
        if (message.isFreeTemporarily != null && message.hasOwnProperty("isFreeTemporarily"))
            if (typeof message.isFreeTemporarily !== "boolean")
                return "isFreeTemporarily: boolean expected";
        if (message.assetsWithoutOverrides != null && message.hasOwnProperty("assetsWithoutOverrides")) {
            let error = $rootStoreItem_Assets.verify(message.assetsWithoutOverrides);
            if (error)
                return "assetsWithoutOverrides." + error;
        }
        if (message.userFilterFailure != null && message.hasOwnProperty("userFilterFailure")) {
            let error = $rootStoreBrowseFilterFailure.verify(message.userFilterFailure);
            if (error)
                return "userFilterFailure." + error;
        }
        if (message.links != null && message.hasOwnProperty("links")) {
            if (!Array.isArray(message.links))
                return "links: array expected";
            for (let i = 0; i < message.links.length; ++i) {
                let error = $rootStoreItem_Link.verify(message.links[i]);
                if (error)
                    return "links." + error;
            }
        }
        return null;
    };

    /**
     * Creates a StoreItem message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof StoreItem
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {StoreItem} StoreItem
     */
    StoreItem.fromObject = function fromObject(object) {
        if (object instanceof $root.StoreItem)
            return object;
        let message = new $root.StoreItem();
        if (object.itemType != null)
            message.itemType = object.itemType | 0;
        if (object.id != null)
            message.id = object.id >>> 0;
        if (object.success != null)
            message.success = object.success >>> 0;
        if (object.visible != null)
            message.visible = Boolean(object.visible);
        if (object.unvailableForCountryRestriction != null)
            message.unvailableForCountryRestriction = Boolean(object.unvailableForCountryRestriction);
        if (object.name != null)
            message.name = String(object.name);
        if (object.storeUrlPath != null)
            message.storeUrlPath = String(object.storeUrlPath);
        if (object.appid != null)
            message.appid = object.appid >>> 0;
        if (object.type != null)
            message.type = object.type | 0;
        if (object.includedTypes) {
            if (!Array.isArray(object.includedTypes))
                throw TypeError(".StoreItem.includedTypes: array expected");
            message.includedTypes = [];
            for (let i = 0; i < object.includedTypes.length; ++i)
                message.includedTypes[i] = object.includedTypes[i] | 0;
        }
        if (object.includedAppids) {
            if (!Array.isArray(object.includedAppids))
                throw TypeError(".StoreItem.includedAppids: array expected");
            message.includedAppids = [];
            for (let i = 0; i < object.includedAppids.length; ++i)
                message.includedAppids[i] = object.includedAppids[i] >>> 0;
        }
        if (object.isFree != null)
            message.isFree = Boolean(object.isFree);
        if (object.isEarlyAccess != null)
            message.isEarlyAccess = Boolean(object.isEarlyAccess);
        if (object.relatedItems != null) {
            if (typeof object.relatedItems !== "object")
                throw TypeError(".StoreItem.relatedItems: object expected");
            message.relatedItems = $rootStoreItem_RelatedItems.fromObject(object.relatedItems);
        }
        if (object.includedItems != null) {
            if (typeof object.includedItems !== "object")
                throw TypeError(".StoreItem.includedItems: object expected");
            message.includedItems = $rootStoreItem_IncludedItems.fromObject(object.includedItems);
        }
        if (object.contentDescriptorids) {
            if (!Array.isArray(object.contentDescriptorids))
                throw TypeError(".StoreItem.contentDescriptorids: array expected");
            message.contentDescriptorids = [];
            for (let i = 0; i < object.contentDescriptorids.length; ++i)
                message.contentDescriptorids[i] = object.contentDescriptorids[i] | 0;
        }
        if (object.tagids) {
            if (!Array.isArray(object.tagids))
                throw TypeError(".StoreItem.tagids: array expected");
            message.tagids = [];
            for (let i = 0; i < object.tagids.length; ++i)
                message.tagids[i] = object.tagids[i] >>> 0;
        }
        if (object.categories != null) {
            if (typeof object.categories !== "object")
                throw TypeError(".StoreItem.categories: object expected");
            message.categories = $rootStoreItem_Categories.fromObject(object.categories);
        }
        if (object.reviews != null) {
            if (typeof object.reviews !== "object")
                throw TypeError(".StoreItem.reviews: object expected");
            message.reviews = $rootStoreItem_Reviews.fromObject(object.reviews);
        }
        if (object.basicInfo != null) {
            if (typeof object.basicInfo !== "object")
                throw TypeError(".StoreItem.basicInfo: object expected");
            message.basicInfo = $rootStoreItem_BasicInfo.fromObject(object.basicInfo);
        }
        if (object.tags) {
            if (!Array.isArray(object.tags))
                throw TypeError(".StoreItem.tags: array expected");
            message.tags = [];
            for (let i = 0; i < object.tags.length; ++i) {
                if (typeof object.tags[i] !== "object")
                    throw TypeError(".StoreItem.tags: object expected");
                message.tags[i] = $rootStoreItem_Tag.fromObject(object.tags[i]);
            }
        }
        if (object.assets != null) {
            if (typeof object.assets !== "object")
                throw TypeError(".StoreItem.assets: object expected");
            message.assets = $rootStoreItem_Assets.fromObject(object.assets);
        }
        if (object.release != null) {
            if (typeof object.release !== "object")
                throw TypeError(".StoreItem.release: object expected");
            message.release = $rootStoreItem_ReleaseInfo.fromObject(object.release);
        }
        if (object.platforms != null) {
            if (typeof object.platforms !== "object")
                throw TypeError(".StoreItem.platforms: object expected");
            message.platforms = $rootStoreItem_Platforms.fromObject(object.platforms);
        }
        if (object.gameRating != null) {
            if (typeof object.gameRating !== "object")
                throw TypeError(".StoreItem.gameRating: object expected");
            message.gameRating = $rootStoreGameRating.fromObject(object.gameRating);
        }
        if (object.isComingSoon != null)
            message.isComingSoon = Boolean(object.isComingSoon);
        if (object.bestPurchaseOption != null) {
            if (typeof object.bestPurchaseOption !== "object")
                throw TypeError(".StoreItem.bestPurchaseOption: object expected");
            message.bestPurchaseOption = $rootStoreItem_PurchaseOption.fromObject(object.bestPurchaseOption);
        }
        if (object.purchaseOptions) {
            if (!Array.isArray(object.purchaseOptions))
                throw TypeError(".StoreItem.purchaseOptions: array expected");
            message.purchaseOptions = [];
            for (let i = 0; i < object.purchaseOptions.length; ++i) {
                if (typeof object.purchaseOptions[i] !== "object")
                    throw TypeError(".StoreItem.purchaseOptions: object expected");
                message.purchaseOptions[i] = $rootStoreItem_PurchaseOption.fromObject(object.purchaseOptions[i]);
            }
        }
        if (object.accessories) {
            if (!Array.isArray(object.accessories))
                throw TypeError(".StoreItem.accessories: array expected");
            message.accessories = [];
            for (let i = 0; i < object.accessories.length; ++i) {
                if (typeof object.accessories[i] !== "object")
                    throw TypeError(".StoreItem.accessories: object expected");
                message.accessories[i] = $rootStoreItem_PurchaseOption.fromObject(object.accessories[i]);
            }
        }
        if (object.selfPurchaseOption != null) {
            if (typeof object.selfPurchaseOption !== "object")
                throw TypeError(".StoreItem.selfPurchaseOption: object expected");
            message.selfPurchaseOption = $rootStoreItem_PurchaseOption.fromObject(object.selfPurchaseOption);
        }
        if (object.screenshots != null) {
            if (typeof object.screenshots !== "object")
                throw TypeError(".StoreItem.screenshots: object expected");
            message.screenshots = $rootStoreItem_Screenshots.fromObject(object.screenshots);
        }
        if (object.trailers != null) {
            if (typeof object.trailers !== "object")
                throw TypeError(".StoreItem.trailers: object expected");
            message.trailers = $rootStoreItem_Trailers.fromObject(object.trailers);
        }
        if (object.supportedLanguages) {
            if (!Array.isArray(object.supportedLanguages))
                throw TypeError(".StoreItem.supportedLanguages: array expected");
            message.supportedLanguages = [];
            for (let i = 0; i < object.supportedLanguages.length; ++i) {
                if (typeof object.supportedLanguages[i] !== "object")
                    throw TypeError(".StoreItem.supportedLanguages: object expected");
                message.supportedLanguages[i] = $rootStoreItem_SupportedLanguage.fromObject(object.supportedLanguages[i]);
            }
        }
        if (object.storeUrlPathOverride != null)
            message.storeUrlPathOverride = String(object.storeUrlPathOverride);
        if (object.freeWeekend != null) {
            if (typeof object.freeWeekend !== "object")
                throw TypeError(".StoreItem.freeWeekend: object expected");
            message.freeWeekend = $rootStoreItem_FreeWeekend.fromObject(object.freeWeekend);
        }
        if (object.unlisted != null)
            message.unlisted = Boolean(object.unlisted);
        if (object.gameCount != null)
            message.gameCount = object.gameCount >>> 0;
        if (object.internalName != null)
            message.internalName = String(object.internalName);
        if (object.fullDescription != null)
            message.fullDescription = String(object.fullDescription);
        if (object.isFreeTemporarily != null)
            message.isFreeTemporarily = Boolean(object.isFreeTemporarily);
        if (object.assetsWithoutOverrides != null) {
            if (typeof object.assetsWithoutOverrides !== "object")
                throw TypeError(".StoreItem.assetsWithoutOverrides: object expected");
            message.assetsWithoutOverrides = $rootStoreItem_Assets.fromObject(object.assetsWithoutOverrides);
        }
        if (object.userFilterFailure != null) {
            if (typeof object.userFilterFailure !== "object")
                throw TypeError(".StoreItem.userFilterFailure: object expected");
            message.userFilterFailure = $rootStoreBrowseFilterFailure.fromObject(object.userFilterFailure);
        }
        if (object.links) {
            if (!Array.isArray(object.links))
                throw TypeError(".StoreItem.links: array expected");
            message.links = [];
            for (let i = 0; i < object.links.length; ++i) {
                if (typeof object.links[i] !== "object")
                    throw TypeError(".StoreItem.links: object expected");
                message.links[i] = $rootStoreItem_Link.fromObject(object.links[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a StoreItem message. Also converts values to other types if specified.
     * @function toObject
     * @memberof StoreItem
     * @static
     * @param {StoreItem} message StoreItem
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    StoreItem.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.arrays || options.defaults) {
            object.includedTypes = [];
            object.includedAppids = [];
            object.contentDescriptorids = [];
            object.tagids = [];
            object.tags = [];
            object.purchaseOptions = [];
            object.accessories = [];
            object.supportedLanguages = [];
            object.links = [];
        }
        if (options.defaults) {
            object.itemType = 0;
            object.id = 0;
            object.success = 0;
            object.visible = false;
            object.unvailableForCountryRestriction = false;
            object.name = "";
            object.storeUrlPath = "";
            object.appid = 0;
            object.type = 0;
            object.isFree = false;
            object.isEarlyAccess = false;
            object.relatedItems = null;
            object.includedItems = null;
            object.categories = null;
            object.reviews = null;
            object.basicInfo = null;
            object.assets = null;
            object.release = null;
            object.platforms = null;
            object.gameRating = null;
            object.isComingSoon = false;
            object.bestPurchaseOption = null;
            object.selfPurchaseOption = null;
            object.screenshots = null;
            object.trailers = null;
            object.storeUrlPathOverride = "";
            object.freeWeekend = null;
            object.unlisted = false;
            object.gameCount = 0;
            object.internalName = "";
            object.fullDescription = "";
            object.isFreeTemporarily = false;
            object.assetsWithoutOverrides = null;
            object.userFilterFailure = null;
        }
        if (message.itemType != null && message.hasOwnProperty("itemType"))
            object.itemType = message.itemType;
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        if (message.success != null && message.hasOwnProperty("success"))
            object.success = message.success;
        if (message.visible != null && message.hasOwnProperty("visible"))
            object.visible = message.visible;
        if (message.unvailableForCountryRestriction != null && message.hasOwnProperty("unvailableForCountryRestriction"))
            object.unvailableForCountryRestriction = message.unvailableForCountryRestriction;
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.storeUrlPath != null && message.hasOwnProperty("storeUrlPath"))
            object.storeUrlPath = message.storeUrlPath;
        if (message.appid != null && message.hasOwnProperty("appid"))
            object.appid = message.appid;
        if (message.type != null && message.hasOwnProperty("type"))
            object.type = message.type;
        if (message.includedTypes && message.includedTypes.length) {
            object.includedTypes = [];
            for (let j = 0; j < message.includedTypes.length; ++j)
                object.includedTypes[j] = message.includedTypes[j];
        }
        if (message.includedAppids && message.includedAppids.length) {
            object.includedAppids = [];
            for (let j = 0; j < message.includedAppids.length; ++j)
                object.includedAppids[j] = message.includedAppids[j];
        }
        if (message.isFree != null && message.hasOwnProperty("isFree"))
            object.isFree = message.isFree;
        if (message.isEarlyAccess != null && message.hasOwnProperty("isEarlyAccess"))
            object.isEarlyAccess = message.isEarlyAccess;
        if (message.relatedItems != null && message.hasOwnProperty("relatedItems"))
            object.relatedItems = $rootStoreItem_RelatedItems.toObject(message.relatedItems, options);
        if (message.includedItems != null && message.hasOwnProperty("includedItems"))
            object.includedItems = $rootStoreItem_IncludedItems.toObject(message.includedItems, options);
        if (message.contentDescriptorids && message.contentDescriptorids.length) {
            object.contentDescriptorids = [];
            for (let j = 0; j < message.contentDescriptorids.length; ++j)
                object.contentDescriptorids[j] = message.contentDescriptorids[j];
        }
        if (message.tagids && message.tagids.length) {
            object.tagids = [];
            for (let j = 0; j < message.tagids.length; ++j)
                object.tagids[j] = message.tagids[j];
        }
        if (message.categories != null && message.hasOwnProperty("categories"))
            object.categories = $rootStoreItem_Categories.toObject(message.categories, options);
        if (message.reviews != null && message.hasOwnProperty("reviews"))
            object.reviews = $rootStoreItem_Reviews.toObject(message.reviews, options);
        if (message.basicInfo != null && message.hasOwnProperty("basicInfo"))
            object.basicInfo = $rootStoreItem_BasicInfo.toObject(message.basicInfo, options);
        if (message.tags && message.tags.length) {
            object.tags = [];
            for (let j = 0; j < message.tags.length; ++j)
                object.tags[j] = $rootStoreItem_Tag.toObject(message.tags[j], options);
        }
        if (message.assets != null && message.hasOwnProperty("assets"))
            object.assets = $rootStoreItem_Assets.toObject(message.assets, options);
        if (message.release != null && message.hasOwnProperty("release"))
            object.release = $rootStoreItem_ReleaseInfo.toObject(message.release, options);
        if (message.platforms != null && message.hasOwnProperty("platforms"))
            object.platforms = $rootStoreItem_Platforms.toObject(message.platforms, options);
        if (message.gameRating != null && message.hasOwnProperty("gameRating"))
            object.gameRating = $rootStoreGameRating.toObject(message.gameRating, options);
        if (message.isComingSoon != null && message.hasOwnProperty("isComingSoon"))
            object.isComingSoon = message.isComingSoon;
        if (message.bestPurchaseOption != null && message.hasOwnProperty("bestPurchaseOption"))
            object.bestPurchaseOption = $rootStoreItem_PurchaseOption.toObject(message.bestPurchaseOption, options);
        if (message.purchaseOptions && message.purchaseOptions.length) {
            object.purchaseOptions = [];
            for (let j = 0; j < message.purchaseOptions.length; ++j)
                object.purchaseOptions[j] = $rootStoreItem_PurchaseOption.toObject(message.purchaseOptions[j], options);
        }
        if (message.accessories && message.accessories.length) {
            object.accessories = [];
            for (let j = 0; j < message.accessories.length; ++j)
                object.accessories[j] = $rootStoreItem_PurchaseOption.toObject(message.accessories[j], options);
        }
        if (message.selfPurchaseOption != null && message.hasOwnProperty("selfPurchaseOption"))
            object.selfPurchaseOption = $rootStoreItem_PurchaseOption.toObject(message.selfPurchaseOption, options);
        if (message.screenshots != null && message.hasOwnProperty("screenshots"))
            object.screenshots = $rootStoreItem_Screenshots.toObject(message.screenshots, options);
        if (message.trailers != null && message.hasOwnProperty("trailers"))
            object.trailers = $rootStoreItem_Trailers.toObject(message.trailers, options);
        if (message.supportedLanguages && message.supportedLanguages.length) {
            object.supportedLanguages = [];
            for (let j = 0; j < message.supportedLanguages.length; ++j)
                object.supportedLanguages[j] = $rootStoreItem_SupportedLanguage.toObject(message.supportedLanguages[j], options);
        }
        if (message.storeUrlPathOverride != null && message.hasOwnProperty("storeUrlPathOverride"))
            object.storeUrlPathOverride = message.storeUrlPathOverride;
        if (message.freeWeekend != null && message.hasOwnProperty("freeWeekend"))
            object.freeWeekend = $rootStoreItem_FreeWeekend.toObject(message.freeWeekend, options);
        if (message.unlisted != null && message.hasOwnProperty("unlisted"))
            object.unlisted = message.unlisted;
        if (message.gameCount != null && message.hasOwnProperty("gameCount"))
            object.gameCount = message.gameCount;
        if (message.internalName != null && message.hasOwnProperty("internalName"))
            object.internalName = message.internalName;
        if (message.fullDescription != null && message.hasOwnProperty("fullDescription"))
            object.fullDescription = message.fullDescription;
        if (message.isFreeTemporarily != null && message.hasOwnProperty("isFreeTemporarily"))
            object.isFreeTemporarily = message.isFreeTemporarily;
        if (message.assetsWithoutOverrides != null && message.hasOwnProperty("assetsWithoutOverrides"))
            object.assetsWithoutOverrides = $rootStoreItem_Assets.toObject(message.assetsWithoutOverrides, options);
        if (message.userFilterFailure != null && message.hasOwnProperty("userFilterFailure"))
            object.userFilterFailure = $rootStoreBrowseFilterFailure.toObject(message.userFilterFailure, options);
        if (message.links && message.links.length) {
            object.links = [];
            for (let j = 0; j < message.links.length; ++j)
                object.links[j] = $rootStoreItem_Link.toObject(message.links[j], options);
        }
        return object;
    };

    /**
     * Converts this StoreItem to JSON.
     * @function toJSON
     * @memberof StoreItem
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    StoreItem.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for StoreItem
     * @function getTypeUrl
     * @memberof StoreItem
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    StoreItem.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/StoreItem";
    };

    return StoreItem;
})();

export { $root as default };
