import * as $protobuf from "protobufjs";
import Long = require("long");
/** Properties of a CWishlist_AddToWishlist_Request. */
export interface ICWishlist_AddToWishlist_Request {

    /** CWishlist_AddToWishlist_Request appid */
    appid?: (number|null);

    /** CWishlist_AddToWishlist_Request navdata */
    navdata?: (ICUserInterface_NavData|null);
}

/** Represents a CWishlist_AddToWishlist_Request. */
export class CWishlist_AddToWishlist_Request implements ICWishlist_AddToWishlist_Request {

    /**
     * Constructs a new CWishlist_AddToWishlist_Request.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlist_AddToWishlist_Request);

    /** CWishlist_AddToWishlist_Request appid. */
    public appid: number;

    /** CWishlist_AddToWishlist_Request navdata. */
    public navdata?: (ICUserInterface_NavData|null);

    /**
     * Creates a new CWishlist_AddToWishlist_Request instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlist_AddToWishlist_Request instance
     */
    public static create(properties?: ICWishlist_AddToWishlist_Request): CWishlist_AddToWishlist_Request;

    /**
     * Encodes the specified CWishlist_AddToWishlist_Request message. Does not implicitly {@link CWishlist_AddToWishlist_Request.verify|verify} messages.
     * @param message CWishlist_AddToWishlist_Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlist_AddToWishlist_Request, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlist_AddToWishlist_Request message, length delimited. Does not implicitly {@link CWishlist_AddToWishlist_Request.verify|verify} messages.
     * @param message CWishlist_AddToWishlist_Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlist_AddToWishlist_Request, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlist_AddToWishlist_Request message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlist_AddToWishlist_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlist_AddToWishlist_Request;

    /**
     * Decodes a CWishlist_AddToWishlist_Request message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlist_AddToWishlist_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlist_AddToWishlist_Request;

    /**
     * Verifies a CWishlist_AddToWishlist_Request message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlist_AddToWishlist_Request message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlist_AddToWishlist_Request
     */
    public static fromObject(object: { [k: string]: any }): CWishlist_AddToWishlist_Request;

    /**
     * Creates a plain object from a CWishlist_AddToWishlist_Request message. Also converts values to other types if specified.
     * @param message CWishlist_AddToWishlist_Request
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlist_AddToWishlist_Request, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlist_AddToWishlist_Request to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlist_AddToWishlist_Request
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlist_AddToWishlist_Response. */
export interface ICWishlist_AddToWishlist_Response {

    /** CWishlist_AddToWishlist_Response wishlistCount */
    wishlistCount?: (number|null);
}

/** Represents a CWishlist_AddToWishlist_Response. */
export class CWishlist_AddToWishlist_Response implements ICWishlist_AddToWishlist_Response {

    /**
     * Constructs a new CWishlist_AddToWishlist_Response.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlist_AddToWishlist_Response);

    /** CWishlist_AddToWishlist_Response wishlistCount. */
    public wishlistCount: number;

    /**
     * Creates a new CWishlist_AddToWishlist_Response instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlist_AddToWishlist_Response instance
     */
    public static create(properties?: ICWishlist_AddToWishlist_Response): CWishlist_AddToWishlist_Response;

    /**
     * Encodes the specified CWishlist_AddToWishlist_Response message. Does not implicitly {@link CWishlist_AddToWishlist_Response.verify|verify} messages.
     * @param message CWishlist_AddToWishlist_Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlist_AddToWishlist_Response, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlist_AddToWishlist_Response message, length delimited. Does not implicitly {@link CWishlist_AddToWishlist_Response.verify|verify} messages.
     * @param message CWishlist_AddToWishlist_Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlist_AddToWishlist_Response, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlist_AddToWishlist_Response message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlist_AddToWishlist_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlist_AddToWishlist_Response;

    /**
     * Decodes a CWishlist_AddToWishlist_Response message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlist_AddToWishlist_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlist_AddToWishlist_Response;

    /**
     * Verifies a CWishlist_AddToWishlist_Response message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlist_AddToWishlist_Response message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlist_AddToWishlist_Response
     */
    public static fromObject(object: { [k: string]: any }): CWishlist_AddToWishlist_Response;

    /**
     * Creates a plain object from a CWishlist_AddToWishlist_Response message. Also converts values to other types if specified.
     * @param message CWishlist_AddToWishlist_Response
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlist_AddToWishlist_Response, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlist_AddToWishlist_Response to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlist_AddToWishlist_Response
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlist_GetWishlist_Request. */
export interface ICWishlist_GetWishlist_Request {

    /** CWishlist_GetWishlist_Request steamid */
    steamid?: (number|Long|null);
}

/** Represents a CWishlist_GetWishlist_Request. */
export class CWishlist_GetWishlist_Request implements ICWishlist_GetWishlist_Request {

    /**
     * Constructs a new CWishlist_GetWishlist_Request.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlist_GetWishlist_Request);

    /** CWishlist_GetWishlist_Request steamid. */
    public steamid: (number|Long);

    /**
     * Creates a new CWishlist_GetWishlist_Request instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlist_GetWishlist_Request instance
     */
    public static create(properties?: ICWishlist_GetWishlist_Request): CWishlist_GetWishlist_Request;

    /**
     * Encodes the specified CWishlist_GetWishlist_Request message. Does not implicitly {@link CWishlist_GetWishlist_Request.verify|verify} messages.
     * @param message CWishlist_GetWishlist_Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlist_GetWishlist_Request, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlist_GetWishlist_Request message, length delimited. Does not implicitly {@link CWishlist_GetWishlist_Request.verify|verify} messages.
     * @param message CWishlist_GetWishlist_Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlist_GetWishlist_Request, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlist_GetWishlist_Request message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlist_GetWishlist_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlist_GetWishlist_Request;

    /**
     * Decodes a CWishlist_GetWishlist_Request message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlist_GetWishlist_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlist_GetWishlist_Request;

    /**
     * Verifies a CWishlist_GetWishlist_Request message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlist_GetWishlist_Request message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlist_GetWishlist_Request
     */
    public static fromObject(object: { [k: string]: any }): CWishlist_GetWishlist_Request;

    /**
     * Creates a plain object from a CWishlist_GetWishlist_Request message. Also converts values to other types if specified.
     * @param message CWishlist_GetWishlist_Request
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlist_GetWishlist_Request, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlist_GetWishlist_Request to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlist_GetWishlist_Request
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlist_GetWishlist_Response. */
export interface ICWishlist_GetWishlist_Response {

    /** CWishlist_GetWishlist_Response items */
    items?: (ICWishlist_GetWishlist_Response_WishlistItem[]|null);
}

/** Represents a CWishlist_GetWishlist_Response. */
export class CWishlist_GetWishlist_Response implements ICWishlist_GetWishlist_Response {

    /**
     * Constructs a new CWishlist_GetWishlist_Response.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlist_GetWishlist_Response);

    /** CWishlist_GetWishlist_Response items. */
    public items: ICWishlist_GetWishlist_Response_WishlistItem[];

    /**
     * Creates a new CWishlist_GetWishlist_Response instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlist_GetWishlist_Response instance
     */
    public static create(properties?: ICWishlist_GetWishlist_Response): CWishlist_GetWishlist_Response;

    /**
     * Encodes the specified CWishlist_GetWishlist_Response message. Does not implicitly {@link CWishlist_GetWishlist_Response.verify|verify} messages.
     * @param message CWishlist_GetWishlist_Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlist_GetWishlist_Response, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlist_GetWishlist_Response message, length delimited. Does not implicitly {@link CWishlist_GetWishlist_Response.verify|verify} messages.
     * @param message CWishlist_GetWishlist_Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlist_GetWishlist_Response, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlist_GetWishlist_Response message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlist_GetWishlist_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlist_GetWishlist_Response;

    /**
     * Decodes a CWishlist_GetWishlist_Response message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlist_GetWishlist_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlist_GetWishlist_Response;

    /**
     * Verifies a CWishlist_GetWishlist_Response message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlist_GetWishlist_Response message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlist_GetWishlist_Response
     */
    public static fromObject(object: { [k: string]: any }): CWishlist_GetWishlist_Response;

    /**
     * Creates a plain object from a CWishlist_GetWishlist_Response message. Also converts values to other types if specified.
     * @param message CWishlist_GetWishlist_Response
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlist_GetWishlist_Response, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlist_GetWishlist_Response to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlist_GetWishlist_Response
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlist_GetWishlist_Response_WishlistItem. */
export interface ICWishlist_GetWishlist_Response_WishlistItem {

    /** CWishlist_GetWishlist_Response_WishlistItem appid */
    appid?: (number|null);

    /** CWishlist_GetWishlist_Response_WishlistItem priority */
    priority?: (number|null);

    /** CWishlist_GetWishlist_Response_WishlistItem dateAdded */
    dateAdded?: (number|null);
}

/** Represents a CWishlist_GetWishlist_Response_WishlistItem. */
export class CWishlist_GetWishlist_Response_WishlistItem implements ICWishlist_GetWishlist_Response_WishlistItem {

    /**
     * Constructs a new CWishlist_GetWishlist_Response_WishlistItem.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlist_GetWishlist_Response_WishlistItem);

    /** CWishlist_GetWishlist_Response_WishlistItem appid. */
    public appid: number;

    /** CWishlist_GetWishlist_Response_WishlistItem priority. */
    public priority: number;

    /** CWishlist_GetWishlist_Response_WishlistItem dateAdded. */
    public dateAdded: number;

    /**
     * Creates a new CWishlist_GetWishlist_Response_WishlistItem instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlist_GetWishlist_Response_WishlistItem instance
     */
    public static create(properties?: ICWishlist_GetWishlist_Response_WishlistItem): CWishlist_GetWishlist_Response_WishlistItem;

    /**
     * Encodes the specified CWishlist_GetWishlist_Response_WishlistItem message. Does not implicitly {@link CWishlist_GetWishlist_Response_WishlistItem.verify|verify} messages.
     * @param message CWishlist_GetWishlist_Response_WishlistItem message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlist_GetWishlist_Response_WishlistItem, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlist_GetWishlist_Response_WishlistItem message, length delimited. Does not implicitly {@link CWishlist_GetWishlist_Response_WishlistItem.verify|verify} messages.
     * @param message CWishlist_GetWishlist_Response_WishlistItem message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlist_GetWishlist_Response_WishlistItem, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlist_GetWishlist_Response_WishlistItem message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlist_GetWishlist_Response_WishlistItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlist_GetWishlist_Response_WishlistItem;

    /**
     * Decodes a CWishlist_GetWishlist_Response_WishlistItem message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlist_GetWishlist_Response_WishlistItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlist_GetWishlist_Response_WishlistItem;

    /**
     * Verifies a CWishlist_GetWishlist_Response_WishlistItem message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlist_GetWishlist_Response_WishlistItem message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlist_GetWishlist_Response_WishlistItem
     */
    public static fromObject(object: { [k: string]: any }): CWishlist_GetWishlist_Response_WishlistItem;

    /**
     * Creates a plain object from a CWishlist_GetWishlist_Response_WishlistItem message. Also converts values to other types if specified.
     * @param message CWishlist_GetWishlist_Response_WishlistItem
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlist_GetWishlist_Response_WishlistItem, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlist_GetWishlist_Response_WishlistItem to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlist_GetWishlist_Response_WishlistItem
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlist_GetWishlistItemCount_Request. */
export interface ICWishlist_GetWishlistItemCount_Request {

    /** CWishlist_GetWishlistItemCount_Request steamid */
    steamid?: (number|Long|null);
}

/** Represents a CWishlist_GetWishlistItemCount_Request. */
export class CWishlist_GetWishlistItemCount_Request implements ICWishlist_GetWishlistItemCount_Request {

    /**
     * Constructs a new CWishlist_GetWishlistItemCount_Request.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlist_GetWishlistItemCount_Request);

    /** CWishlist_GetWishlistItemCount_Request steamid. */
    public steamid: (number|Long);

    /**
     * Creates a new CWishlist_GetWishlistItemCount_Request instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlist_GetWishlistItemCount_Request instance
     */
    public static create(properties?: ICWishlist_GetWishlistItemCount_Request): CWishlist_GetWishlistItemCount_Request;

    /**
     * Encodes the specified CWishlist_GetWishlistItemCount_Request message. Does not implicitly {@link CWishlist_GetWishlistItemCount_Request.verify|verify} messages.
     * @param message CWishlist_GetWishlistItemCount_Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlist_GetWishlistItemCount_Request, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlist_GetWishlistItemCount_Request message, length delimited. Does not implicitly {@link CWishlist_GetWishlistItemCount_Request.verify|verify} messages.
     * @param message CWishlist_GetWishlistItemCount_Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlist_GetWishlistItemCount_Request, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlist_GetWishlistItemCount_Request message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlist_GetWishlistItemCount_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlist_GetWishlistItemCount_Request;

    /**
     * Decodes a CWishlist_GetWishlistItemCount_Request message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlist_GetWishlistItemCount_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlist_GetWishlistItemCount_Request;

    /**
     * Verifies a CWishlist_GetWishlistItemCount_Request message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlist_GetWishlistItemCount_Request message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlist_GetWishlistItemCount_Request
     */
    public static fromObject(object: { [k: string]: any }): CWishlist_GetWishlistItemCount_Request;

    /**
     * Creates a plain object from a CWishlist_GetWishlistItemCount_Request message. Also converts values to other types if specified.
     * @param message CWishlist_GetWishlistItemCount_Request
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlist_GetWishlistItemCount_Request, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlist_GetWishlistItemCount_Request to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlist_GetWishlistItemCount_Request
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlist_GetWishlistItemCount_Response. */
export interface ICWishlist_GetWishlistItemCount_Response {

    /** CWishlist_GetWishlistItemCount_Response count */
    count?: (number|null);
}

/** Represents a CWishlist_GetWishlistItemCount_Response. */
export class CWishlist_GetWishlistItemCount_Response implements ICWishlist_GetWishlistItemCount_Response {

    /**
     * Constructs a new CWishlist_GetWishlistItemCount_Response.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlist_GetWishlistItemCount_Response);

    /** CWishlist_GetWishlistItemCount_Response count. */
    public count: number;

    /**
     * Creates a new CWishlist_GetWishlistItemCount_Response instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlist_GetWishlistItemCount_Response instance
     */
    public static create(properties?: ICWishlist_GetWishlistItemCount_Response): CWishlist_GetWishlistItemCount_Response;

    /**
     * Encodes the specified CWishlist_GetWishlistItemCount_Response message. Does not implicitly {@link CWishlist_GetWishlistItemCount_Response.verify|verify} messages.
     * @param message CWishlist_GetWishlistItemCount_Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlist_GetWishlistItemCount_Response, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlist_GetWishlistItemCount_Response message, length delimited. Does not implicitly {@link CWishlist_GetWishlistItemCount_Response.verify|verify} messages.
     * @param message CWishlist_GetWishlistItemCount_Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlist_GetWishlistItemCount_Response, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlist_GetWishlistItemCount_Response message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlist_GetWishlistItemCount_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlist_GetWishlistItemCount_Response;

    /**
     * Decodes a CWishlist_GetWishlistItemCount_Response message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlist_GetWishlistItemCount_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlist_GetWishlistItemCount_Response;

    /**
     * Verifies a CWishlist_GetWishlistItemCount_Response message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlist_GetWishlistItemCount_Response message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlist_GetWishlistItemCount_Response
     */
    public static fromObject(object: { [k: string]: any }): CWishlist_GetWishlistItemCount_Response;

    /**
     * Creates a plain object from a CWishlist_GetWishlistItemCount_Response message. Also converts values to other types if specified.
     * @param message CWishlist_GetWishlistItemCount_Response
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlist_GetWishlistItemCount_Response, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlist_GetWishlistItemCount_Response to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlist_GetWishlistItemCount_Response
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlist_GetWishlistItemsOnSale_Request. */
export interface ICWishlist_GetWishlistItemsOnSale_Request {

    /** CWishlist_GetWishlistItemsOnSale_Request context */
    context?: (IStoreBrowseContext|null);

    /** CWishlist_GetWishlistItemsOnSale_Request dataRequest */
    dataRequest?: (IStoreBrowseItemDataRequest|null);
}

/** Represents a CWishlist_GetWishlistItemsOnSale_Request. */
export class CWishlist_GetWishlistItemsOnSale_Request implements ICWishlist_GetWishlistItemsOnSale_Request {

    /**
     * Constructs a new CWishlist_GetWishlistItemsOnSale_Request.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlist_GetWishlistItemsOnSale_Request);

    /** CWishlist_GetWishlistItemsOnSale_Request context. */
    public context?: (IStoreBrowseContext|null);

    /** CWishlist_GetWishlistItemsOnSale_Request dataRequest. */
    public dataRequest?: (IStoreBrowseItemDataRequest|null);

    /**
     * Creates a new CWishlist_GetWishlistItemsOnSale_Request instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlist_GetWishlistItemsOnSale_Request instance
     */
    public static create(properties?: ICWishlist_GetWishlistItemsOnSale_Request): CWishlist_GetWishlistItemsOnSale_Request;

    /**
     * Encodes the specified CWishlist_GetWishlistItemsOnSale_Request message. Does not implicitly {@link CWishlist_GetWishlistItemsOnSale_Request.verify|verify} messages.
     * @param message CWishlist_GetWishlistItemsOnSale_Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlist_GetWishlistItemsOnSale_Request, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlist_GetWishlistItemsOnSale_Request message, length delimited. Does not implicitly {@link CWishlist_GetWishlistItemsOnSale_Request.verify|verify} messages.
     * @param message CWishlist_GetWishlistItemsOnSale_Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlist_GetWishlistItemsOnSale_Request, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlist_GetWishlistItemsOnSale_Request message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlist_GetWishlistItemsOnSale_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlist_GetWishlistItemsOnSale_Request;

    /**
     * Decodes a CWishlist_GetWishlistItemsOnSale_Request message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlist_GetWishlistItemsOnSale_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlist_GetWishlistItemsOnSale_Request;

    /**
     * Verifies a CWishlist_GetWishlistItemsOnSale_Request message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlist_GetWishlistItemsOnSale_Request message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlist_GetWishlistItemsOnSale_Request
     */
    public static fromObject(object: { [k: string]: any }): CWishlist_GetWishlistItemsOnSale_Request;

    /**
     * Creates a plain object from a CWishlist_GetWishlistItemsOnSale_Request message. Also converts values to other types if specified.
     * @param message CWishlist_GetWishlistItemsOnSale_Request
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlist_GetWishlistItemsOnSale_Request, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlist_GetWishlistItemsOnSale_Request to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlist_GetWishlistItemsOnSale_Request
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlist_GetWishlistItemsOnSale_Response. */
export interface ICWishlist_GetWishlistItemsOnSale_Response {

    /** CWishlist_GetWishlistItemsOnSale_Response items */
    items?: (ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem[]|null);
}

/** Represents a CWishlist_GetWishlistItemsOnSale_Response. */
export class CWishlist_GetWishlistItemsOnSale_Response implements ICWishlist_GetWishlistItemsOnSale_Response {

    /**
     * Constructs a new CWishlist_GetWishlistItemsOnSale_Response.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlist_GetWishlistItemsOnSale_Response);

    /** CWishlist_GetWishlistItemsOnSale_Response items. */
    public items: ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem[];

    /**
     * Creates a new CWishlist_GetWishlistItemsOnSale_Response instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlist_GetWishlistItemsOnSale_Response instance
     */
    public static create(properties?: ICWishlist_GetWishlistItemsOnSale_Response): CWishlist_GetWishlistItemsOnSale_Response;

    /**
     * Encodes the specified CWishlist_GetWishlistItemsOnSale_Response message. Does not implicitly {@link CWishlist_GetWishlistItemsOnSale_Response.verify|verify} messages.
     * @param message CWishlist_GetWishlistItemsOnSale_Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlist_GetWishlistItemsOnSale_Response, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlist_GetWishlistItemsOnSale_Response message, length delimited. Does not implicitly {@link CWishlist_GetWishlistItemsOnSale_Response.verify|verify} messages.
     * @param message CWishlist_GetWishlistItemsOnSale_Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlist_GetWishlistItemsOnSale_Response, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlist_GetWishlistItemsOnSale_Response message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlist_GetWishlistItemsOnSale_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlist_GetWishlistItemsOnSale_Response;

    /**
     * Decodes a CWishlist_GetWishlistItemsOnSale_Response message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlist_GetWishlistItemsOnSale_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlist_GetWishlistItemsOnSale_Response;

    /**
     * Verifies a CWishlist_GetWishlistItemsOnSale_Response message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlist_GetWishlistItemsOnSale_Response message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlist_GetWishlistItemsOnSale_Response
     */
    public static fromObject(object: { [k: string]: any }): CWishlist_GetWishlistItemsOnSale_Response;

    /**
     * Creates a plain object from a CWishlist_GetWishlistItemsOnSale_Response message. Also converts values to other types if specified.
     * @param message CWishlist_GetWishlistItemsOnSale_Response
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlist_GetWishlistItemsOnSale_Response, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlist_GetWishlistItemsOnSale_Response to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlist_GetWishlistItemsOnSale_Response
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlist_GetWishlistItemsOnSale_Response_WishlistItem. */
export interface ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem {

    /** CWishlist_GetWishlistItemsOnSale_Response_WishlistItem appid */
    appid?: (number|null);

    /** CWishlist_GetWishlistItemsOnSale_Response_WishlistItem storeItem */
    storeItem?: (IStoreItem|null);
}

/** Represents a CWishlist_GetWishlistItemsOnSale_Response_WishlistItem. */
export class CWishlist_GetWishlistItemsOnSale_Response_WishlistItem implements ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem {

    /**
     * Constructs a new CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem);

    /** CWishlist_GetWishlistItemsOnSale_Response_WishlistItem appid. */
    public appid: number;

    /** CWishlist_GetWishlistItemsOnSale_Response_WishlistItem storeItem. */
    public storeItem?: (IStoreItem|null);

    /**
     * Creates a new CWishlist_GetWishlistItemsOnSale_Response_WishlistItem instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlist_GetWishlistItemsOnSale_Response_WishlistItem instance
     */
    public static create(properties?: ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem): CWishlist_GetWishlistItemsOnSale_Response_WishlistItem;

    /**
     * Encodes the specified CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message. Does not implicitly {@link CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.verify|verify} messages.
     * @param message CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message, length delimited. Does not implicitly {@link CWishlist_GetWishlistItemsOnSale_Response_WishlistItem.verify|verify} messages.
     * @param message CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlist_GetWishlistItemsOnSale_Response_WishlistItem, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlist_GetWishlistItemsOnSale_Response_WishlistItem;

    /**
     * Decodes a CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlist_GetWishlistItemsOnSale_Response_WishlistItem;

    /**
     * Verifies a CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     */
    public static fromObject(object: { [k: string]: any }): CWishlist_GetWishlistItemsOnSale_Response_WishlistItem;

    /**
     * Creates a plain object from a CWishlist_GetWishlistItemsOnSale_Response_WishlistItem message. Also converts values to other types if specified.
     * @param message CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlist_GetWishlistItemsOnSale_Response_WishlistItem, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlist_GetWishlistItemsOnSale_Response_WishlistItem to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlist_GetWishlistItemsOnSale_Response_WishlistItem
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlist_GetWishlistSortedFiltered_Request. */
export interface ICWishlist_GetWishlistSortedFiltered_Request {

    /** CWishlist_GetWishlistSortedFiltered_Request steamid */
    steamid?: (number|Long|null);

    /** CWishlist_GetWishlistSortedFiltered_Request context */
    context?: (IStoreBrowseContext|null);

    /** CWishlist_GetWishlistSortedFiltered_Request dataRequest */
    dataRequest?: (IStoreBrowseItemDataRequest|null);

    /** CWishlist_GetWishlistSortedFiltered_Request sortOrder */
    sortOrder?: (number|null);

    /** CWishlist_GetWishlistSortedFiltered_Request filters */
    filters?: (ICWishlistFilters|null);

    /** CWishlist_GetWishlistSortedFiltered_Request startIndex */
    startIndex?: (number|null);

    /** CWishlist_GetWishlistSortedFiltered_Request pageSize */
    pageSize?: (number|null);
}

/** Represents a CWishlist_GetWishlistSortedFiltered_Request. */
export class CWishlist_GetWishlistSortedFiltered_Request implements ICWishlist_GetWishlistSortedFiltered_Request {

    /**
     * Constructs a new CWishlist_GetWishlistSortedFiltered_Request.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlist_GetWishlistSortedFiltered_Request);

    /** CWishlist_GetWishlistSortedFiltered_Request steamid. */
    public steamid: (number|Long);

    /** CWishlist_GetWishlistSortedFiltered_Request context. */
    public context?: (IStoreBrowseContext|null);

    /** CWishlist_GetWishlistSortedFiltered_Request dataRequest. */
    public dataRequest?: (IStoreBrowseItemDataRequest|null);

    /** CWishlist_GetWishlistSortedFiltered_Request sortOrder. */
    public sortOrder: number;

    /** CWishlist_GetWishlistSortedFiltered_Request filters. */
    public filters?: (ICWishlistFilters|null);

    /** CWishlist_GetWishlistSortedFiltered_Request startIndex. */
    public startIndex: number;

    /** CWishlist_GetWishlistSortedFiltered_Request pageSize. */
    public pageSize: number;

    /**
     * Creates a new CWishlist_GetWishlistSortedFiltered_Request instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlist_GetWishlistSortedFiltered_Request instance
     */
    public static create(properties?: ICWishlist_GetWishlistSortedFiltered_Request): CWishlist_GetWishlistSortedFiltered_Request;

    /**
     * Encodes the specified CWishlist_GetWishlistSortedFiltered_Request message. Does not implicitly {@link CWishlist_GetWishlistSortedFiltered_Request.verify|verify} messages.
     * @param message CWishlist_GetWishlistSortedFiltered_Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlist_GetWishlistSortedFiltered_Request, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlist_GetWishlistSortedFiltered_Request message, length delimited. Does not implicitly {@link CWishlist_GetWishlistSortedFiltered_Request.verify|verify} messages.
     * @param message CWishlist_GetWishlistSortedFiltered_Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlist_GetWishlistSortedFiltered_Request, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlist_GetWishlistSortedFiltered_Request message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlist_GetWishlistSortedFiltered_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlist_GetWishlistSortedFiltered_Request;

    /**
     * Decodes a CWishlist_GetWishlistSortedFiltered_Request message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlist_GetWishlistSortedFiltered_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlist_GetWishlistSortedFiltered_Request;

    /**
     * Verifies a CWishlist_GetWishlistSortedFiltered_Request message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlist_GetWishlistSortedFiltered_Request message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlist_GetWishlistSortedFiltered_Request
     */
    public static fromObject(object: { [k: string]: any }): CWishlist_GetWishlistSortedFiltered_Request;

    /**
     * Creates a plain object from a CWishlist_GetWishlistSortedFiltered_Request message. Also converts values to other types if specified.
     * @param message CWishlist_GetWishlistSortedFiltered_Request
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlist_GetWishlistSortedFiltered_Request, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlist_GetWishlistSortedFiltered_Request to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlist_GetWishlistSortedFiltered_Request
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlist_GetWishlistSortedFiltered_Response. */
export interface ICWishlist_GetWishlistSortedFiltered_Response {

    /** CWishlist_GetWishlistSortedFiltered_Response items */
    items?: (ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem[]|null);
}

/** Represents a CWishlist_GetWishlistSortedFiltered_Response. */
export class CWishlist_GetWishlistSortedFiltered_Response implements ICWishlist_GetWishlistSortedFiltered_Response {

    /**
     * Constructs a new CWishlist_GetWishlistSortedFiltered_Response.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlist_GetWishlistSortedFiltered_Response);

    /** CWishlist_GetWishlistSortedFiltered_Response items. */
    public items: ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem[];

    /**
     * Creates a new CWishlist_GetWishlistSortedFiltered_Response instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlist_GetWishlistSortedFiltered_Response instance
     */
    public static create(properties?: ICWishlist_GetWishlistSortedFiltered_Response): CWishlist_GetWishlistSortedFiltered_Response;

    /**
     * Encodes the specified CWishlist_GetWishlistSortedFiltered_Response message. Does not implicitly {@link CWishlist_GetWishlistSortedFiltered_Response.verify|verify} messages.
     * @param message CWishlist_GetWishlistSortedFiltered_Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlist_GetWishlistSortedFiltered_Response, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlist_GetWishlistSortedFiltered_Response message, length delimited. Does not implicitly {@link CWishlist_GetWishlistSortedFiltered_Response.verify|verify} messages.
     * @param message CWishlist_GetWishlistSortedFiltered_Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlist_GetWishlistSortedFiltered_Response, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlist_GetWishlistSortedFiltered_Response message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlist_GetWishlistSortedFiltered_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlist_GetWishlistSortedFiltered_Response;

    /**
     * Decodes a CWishlist_GetWishlistSortedFiltered_Response message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlist_GetWishlistSortedFiltered_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlist_GetWishlistSortedFiltered_Response;

    /**
     * Verifies a CWishlist_GetWishlistSortedFiltered_Response message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlist_GetWishlistSortedFiltered_Response message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlist_GetWishlistSortedFiltered_Response
     */
    public static fromObject(object: { [k: string]: any }): CWishlist_GetWishlistSortedFiltered_Response;

    /**
     * Creates a plain object from a CWishlist_GetWishlistSortedFiltered_Response message. Also converts values to other types if specified.
     * @param message CWishlist_GetWishlistSortedFiltered_Response
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlist_GetWishlistSortedFiltered_Response, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlist_GetWishlistSortedFiltered_Response to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlist_GetWishlistSortedFiltered_Response
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlist_GetWishlistSortedFiltered_Response_WishlistItem. */
export interface ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem {

    /** CWishlist_GetWishlistSortedFiltered_Response_WishlistItem appid */
    appid?: (number|null);

    /** CWishlist_GetWishlistSortedFiltered_Response_WishlistItem priority */
    priority?: (number|null);

    /** CWishlist_GetWishlistSortedFiltered_Response_WishlistItem dateAdded */
    dateAdded?: (number|null);

    /** CWishlist_GetWishlistSortedFiltered_Response_WishlistItem storeItem */
    storeItem?: (IStoreItem|null);
}

/** Represents a CWishlist_GetWishlistSortedFiltered_Response_WishlistItem. */
export class CWishlist_GetWishlistSortedFiltered_Response_WishlistItem implements ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem {

    /**
     * Constructs a new CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem);

    /** CWishlist_GetWishlistSortedFiltered_Response_WishlistItem appid. */
    public appid: number;

    /** CWishlist_GetWishlistSortedFiltered_Response_WishlistItem priority. */
    public priority: number;

    /** CWishlist_GetWishlistSortedFiltered_Response_WishlistItem dateAdded. */
    public dateAdded: number;

    /** CWishlist_GetWishlistSortedFiltered_Response_WishlistItem storeItem. */
    public storeItem?: (IStoreItem|null);

    /**
     * Creates a new CWishlist_GetWishlistSortedFiltered_Response_WishlistItem instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlist_GetWishlistSortedFiltered_Response_WishlistItem instance
     */
    public static create(properties?: ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem): CWishlist_GetWishlistSortedFiltered_Response_WishlistItem;

    /**
     * Encodes the specified CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message. Does not implicitly {@link CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.verify|verify} messages.
     * @param message CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message, length delimited. Does not implicitly {@link CWishlist_GetWishlistSortedFiltered_Response_WishlistItem.verify|verify} messages.
     * @param message CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlist_GetWishlistSortedFiltered_Response_WishlistItem, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlist_GetWishlistSortedFiltered_Response_WishlistItem;

    /**
     * Decodes a CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlist_GetWishlistSortedFiltered_Response_WishlistItem;

    /**
     * Verifies a CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     */
    public static fromObject(object: { [k: string]: any }): CWishlist_GetWishlistSortedFiltered_Response_WishlistItem;

    /**
     * Creates a plain object from a CWishlist_GetWishlistSortedFiltered_Response_WishlistItem message. Also converts values to other types if specified.
     * @param message CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlist_GetWishlistSortedFiltered_Response_WishlistItem, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlist_GetWishlistSortedFiltered_Response_WishlistItem to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlist_GetWishlistSortedFiltered_Response_WishlistItem
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlist_RemoveFromWishlist_Request. */
export interface ICWishlist_RemoveFromWishlist_Request {

    /** CWishlist_RemoveFromWishlist_Request appid */
    appid?: (number|null);
}

/** Represents a CWishlist_RemoveFromWishlist_Request. */
export class CWishlist_RemoveFromWishlist_Request implements ICWishlist_RemoveFromWishlist_Request {

    /**
     * Constructs a new CWishlist_RemoveFromWishlist_Request.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlist_RemoveFromWishlist_Request);

    /** CWishlist_RemoveFromWishlist_Request appid. */
    public appid: number;

    /**
     * Creates a new CWishlist_RemoveFromWishlist_Request instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlist_RemoveFromWishlist_Request instance
     */
    public static create(properties?: ICWishlist_RemoveFromWishlist_Request): CWishlist_RemoveFromWishlist_Request;

    /**
     * Encodes the specified CWishlist_RemoveFromWishlist_Request message. Does not implicitly {@link CWishlist_RemoveFromWishlist_Request.verify|verify} messages.
     * @param message CWishlist_RemoveFromWishlist_Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlist_RemoveFromWishlist_Request, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlist_RemoveFromWishlist_Request message, length delimited. Does not implicitly {@link CWishlist_RemoveFromWishlist_Request.verify|verify} messages.
     * @param message CWishlist_RemoveFromWishlist_Request message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlist_RemoveFromWishlist_Request, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlist_RemoveFromWishlist_Request message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlist_RemoveFromWishlist_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlist_RemoveFromWishlist_Request;

    /**
     * Decodes a CWishlist_RemoveFromWishlist_Request message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlist_RemoveFromWishlist_Request
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlist_RemoveFromWishlist_Request;

    /**
     * Verifies a CWishlist_RemoveFromWishlist_Request message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlist_RemoveFromWishlist_Request message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlist_RemoveFromWishlist_Request
     */
    public static fromObject(object: { [k: string]: any }): CWishlist_RemoveFromWishlist_Request;

    /**
     * Creates a plain object from a CWishlist_RemoveFromWishlist_Request message. Also converts values to other types if specified.
     * @param message CWishlist_RemoveFromWishlist_Request
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlist_RemoveFromWishlist_Request, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlist_RemoveFromWishlist_Request to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlist_RemoveFromWishlist_Request
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlist_RemoveFromWishlist_Response. */
export interface ICWishlist_RemoveFromWishlist_Response {

    /** CWishlist_RemoveFromWishlist_Response wishlistCount */
    wishlistCount?: (number|null);
}

/** Represents a CWishlist_RemoveFromWishlist_Response. */
export class CWishlist_RemoveFromWishlist_Response implements ICWishlist_RemoveFromWishlist_Response {

    /**
     * Constructs a new CWishlist_RemoveFromWishlist_Response.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlist_RemoveFromWishlist_Response);

    /** CWishlist_RemoveFromWishlist_Response wishlistCount. */
    public wishlistCount: number;

    /**
     * Creates a new CWishlist_RemoveFromWishlist_Response instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlist_RemoveFromWishlist_Response instance
     */
    public static create(properties?: ICWishlist_RemoveFromWishlist_Response): CWishlist_RemoveFromWishlist_Response;

    /**
     * Encodes the specified CWishlist_RemoveFromWishlist_Response message. Does not implicitly {@link CWishlist_RemoveFromWishlist_Response.verify|verify} messages.
     * @param message CWishlist_RemoveFromWishlist_Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlist_RemoveFromWishlist_Response, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlist_RemoveFromWishlist_Response message, length delimited. Does not implicitly {@link CWishlist_RemoveFromWishlist_Response.verify|verify} messages.
     * @param message CWishlist_RemoveFromWishlist_Response message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlist_RemoveFromWishlist_Response, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlist_RemoveFromWishlist_Response message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlist_RemoveFromWishlist_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlist_RemoveFromWishlist_Response;

    /**
     * Decodes a CWishlist_RemoveFromWishlist_Response message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlist_RemoveFromWishlist_Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlist_RemoveFromWishlist_Response;

    /**
     * Verifies a CWishlist_RemoveFromWishlist_Response message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlist_RemoveFromWishlist_Response message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlist_RemoveFromWishlist_Response
     */
    public static fromObject(object: { [k: string]: any }): CWishlist_RemoveFromWishlist_Response;

    /**
     * Creates a plain object from a CWishlist_RemoveFromWishlist_Response message. Also converts values to other types if specified.
     * @param message CWishlist_RemoveFromWishlist_Response
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlist_RemoveFromWishlist_Response, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlist_RemoveFromWishlist_Response to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlist_RemoveFromWishlist_Response
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlistFilters. */
export interface ICWishlistFilters {

    /** CWishlistFilters macosOnly */
    macosOnly?: (boolean|null);

    /** CWishlistFilters steamosLinuxOnly */
    steamosLinuxOnly?: (boolean|null);

    /** CWishlistFilters onlyGames */
    onlyGames?: (boolean|null);

    /** CWishlistFilters onlySoftware */
    onlySoftware?: (boolean|null);

    /** CWishlistFilters onlyDlc */
    onlyDlc?: (boolean|null);

    /** CWishlistFilters onlyFree */
    onlyFree?: (boolean|null);

    /** CWishlistFilters maxPriceInCents */
    maxPriceInCents?: (number|Long|null);

    /** CWishlistFilters minDiscountPercent */
    minDiscountPercent?: (number|null);

    /** CWishlistFilters excludeTypes */
    excludeTypes?: (ICWishlistFilters_ExcludeTypeFilters|null);

    /** CWishlistFilters steamDeckFilters */
    steamDeckFilters?: (ICWishlistFilters_SteamDeckFilters|null);
}

/** Represents a CWishlistFilters. */
export class CWishlistFilters implements ICWishlistFilters {

    /**
     * Constructs a new CWishlistFilters.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlistFilters);

    /** CWishlistFilters macosOnly. */
    public macosOnly: boolean;

    /** CWishlistFilters steamosLinuxOnly. */
    public steamosLinuxOnly: boolean;

    /** CWishlistFilters onlyGames. */
    public onlyGames: boolean;

    /** CWishlistFilters onlySoftware. */
    public onlySoftware: boolean;

    /** CWishlistFilters onlyDlc. */
    public onlyDlc: boolean;

    /** CWishlistFilters onlyFree. */
    public onlyFree: boolean;

    /** CWishlistFilters maxPriceInCents. */
    public maxPriceInCents: (number|Long);

    /** CWishlistFilters minDiscountPercent. */
    public minDiscountPercent: number;

    /** CWishlistFilters excludeTypes. */
    public excludeTypes?: (ICWishlistFilters_ExcludeTypeFilters|null);

    /** CWishlistFilters steamDeckFilters. */
    public steamDeckFilters?: (ICWishlistFilters_SteamDeckFilters|null);

    /**
     * Creates a new CWishlistFilters instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlistFilters instance
     */
    public static create(properties?: ICWishlistFilters): CWishlistFilters;

    /**
     * Encodes the specified CWishlistFilters message. Does not implicitly {@link CWishlistFilters.verify|verify} messages.
     * @param message CWishlistFilters message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlistFilters, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlistFilters message, length delimited. Does not implicitly {@link CWishlistFilters.verify|verify} messages.
     * @param message CWishlistFilters message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlistFilters, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlistFilters message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlistFilters
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlistFilters;

    /**
     * Decodes a CWishlistFilters message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlistFilters
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlistFilters;

    /**
     * Verifies a CWishlistFilters message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlistFilters message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlistFilters
     */
    public static fromObject(object: { [k: string]: any }): CWishlistFilters;

    /**
     * Creates a plain object from a CWishlistFilters message. Also converts values to other types if specified.
     * @param message CWishlistFilters
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlistFilters, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlistFilters to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlistFilters
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlistFilters_ExcludeTypeFilters. */
export interface ICWishlistFilters_ExcludeTypeFilters {

    /** CWishlistFilters_ExcludeTypeFilters excludeEarlyAccess */
    excludeEarlyAccess?: (boolean|null);

    /** CWishlistFilters_ExcludeTypeFilters excludeComingSoon */
    excludeComingSoon?: (boolean|null);

    /** CWishlistFilters_ExcludeTypeFilters excludeVrOnly */
    excludeVrOnly?: (boolean|null);
}

/** Represents a CWishlistFilters_ExcludeTypeFilters. */
export class CWishlistFilters_ExcludeTypeFilters implements ICWishlistFilters_ExcludeTypeFilters {

    /**
     * Constructs a new CWishlistFilters_ExcludeTypeFilters.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlistFilters_ExcludeTypeFilters);

    /** CWishlistFilters_ExcludeTypeFilters excludeEarlyAccess. */
    public excludeEarlyAccess: boolean;

    /** CWishlistFilters_ExcludeTypeFilters excludeComingSoon. */
    public excludeComingSoon: boolean;

    /** CWishlistFilters_ExcludeTypeFilters excludeVrOnly. */
    public excludeVrOnly: boolean;

    /**
     * Creates a new CWishlistFilters_ExcludeTypeFilters instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlistFilters_ExcludeTypeFilters instance
     */
    public static create(properties?: ICWishlistFilters_ExcludeTypeFilters): CWishlistFilters_ExcludeTypeFilters;

    /**
     * Encodes the specified CWishlistFilters_ExcludeTypeFilters message. Does not implicitly {@link CWishlistFilters_ExcludeTypeFilters.verify|verify} messages.
     * @param message CWishlistFilters_ExcludeTypeFilters message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlistFilters_ExcludeTypeFilters, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlistFilters_ExcludeTypeFilters message, length delimited. Does not implicitly {@link CWishlistFilters_ExcludeTypeFilters.verify|verify} messages.
     * @param message CWishlistFilters_ExcludeTypeFilters message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlistFilters_ExcludeTypeFilters, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlistFilters_ExcludeTypeFilters message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlistFilters_ExcludeTypeFilters
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlistFilters_ExcludeTypeFilters;

    /**
     * Decodes a CWishlistFilters_ExcludeTypeFilters message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlistFilters_ExcludeTypeFilters
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlistFilters_ExcludeTypeFilters;

    /**
     * Verifies a CWishlistFilters_ExcludeTypeFilters message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlistFilters_ExcludeTypeFilters message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlistFilters_ExcludeTypeFilters
     */
    public static fromObject(object: { [k: string]: any }): CWishlistFilters_ExcludeTypeFilters;

    /**
     * Creates a plain object from a CWishlistFilters_ExcludeTypeFilters message. Also converts values to other types if specified.
     * @param message CWishlistFilters_ExcludeTypeFilters
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlistFilters_ExcludeTypeFilters, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlistFilters_ExcludeTypeFilters to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlistFilters_ExcludeTypeFilters
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a CWishlistFilters_SteamDeckFilters. */
export interface ICWishlistFilters_SteamDeckFilters {

    /** CWishlistFilters_SteamDeckFilters includeVerified */
    includeVerified?: (boolean|null);

    /** CWishlistFilters_SteamDeckFilters includePlayable */
    includePlayable?: (boolean|null);
}

/** Represents a CWishlistFilters_SteamDeckFilters. */
export class CWishlistFilters_SteamDeckFilters implements ICWishlistFilters_SteamDeckFilters {

    /**
     * Constructs a new CWishlistFilters_SteamDeckFilters.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICWishlistFilters_SteamDeckFilters);

    /** CWishlistFilters_SteamDeckFilters includeVerified. */
    public includeVerified: boolean;

    /** CWishlistFilters_SteamDeckFilters includePlayable. */
    public includePlayable: boolean;

    /**
     * Creates a new CWishlistFilters_SteamDeckFilters instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CWishlistFilters_SteamDeckFilters instance
     */
    public static create(properties?: ICWishlistFilters_SteamDeckFilters): CWishlistFilters_SteamDeckFilters;

    /**
     * Encodes the specified CWishlistFilters_SteamDeckFilters message. Does not implicitly {@link CWishlistFilters_SteamDeckFilters.verify|verify} messages.
     * @param message CWishlistFilters_SteamDeckFilters message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICWishlistFilters_SteamDeckFilters, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CWishlistFilters_SteamDeckFilters message, length delimited. Does not implicitly {@link CWishlistFilters_SteamDeckFilters.verify|verify} messages.
     * @param message CWishlistFilters_SteamDeckFilters message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICWishlistFilters_SteamDeckFilters, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CWishlistFilters_SteamDeckFilters message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CWishlistFilters_SteamDeckFilters
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CWishlistFilters_SteamDeckFilters;

    /**
     * Decodes a CWishlistFilters_SteamDeckFilters message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CWishlistFilters_SteamDeckFilters
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CWishlistFilters_SteamDeckFilters;

    /**
     * Verifies a CWishlistFilters_SteamDeckFilters message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CWishlistFilters_SteamDeckFilters message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CWishlistFilters_SteamDeckFilters
     */
    public static fromObject(object: { [k: string]: any }): CWishlistFilters_SteamDeckFilters;

    /**
     * Creates a plain object from a CWishlistFilters_SteamDeckFilters message. Also converts values to other types if specified.
     * @param message CWishlistFilters_SteamDeckFilters
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CWishlistFilters_SteamDeckFilters, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CWishlistFilters_SteamDeckFilters to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CWishlistFilters_SteamDeckFilters
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Represents a Wishlist */
export class Wishlist extends $protobuf.rpc.Service {

    /**
     * Constructs a new Wishlist service.
     * @param rpcImpl RPC implementation
     * @param [requestDelimited=false] Whether requests are length-delimited
     * @param [responseDelimited=false] Whether responses are length-delimited
     */
    constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

    /**
     * Creates new Wishlist service using the specified rpc implementation.
     * @param rpcImpl RPC implementation
     * @param [requestDelimited=false] Whether requests are length-delimited
     * @param [responseDelimited=false] Whether responses are length-delimited
     * @returns RPC service. Useful where requests and/or responses are streamed.
     */
    public static create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): Wishlist;

    /**
     * Calls AddToWishlist.
     * @param request CWishlist_AddToWishlist_Request message or plain object
     * @param callback Node-style callback called with the error, if any, and CWishlist_AddToWishlist_Response
     */
    public addToWishlist(request: ICWishlist_AddToWishlist_Request, callback: Wishlist.AddToWishlistCallback): void;

    /**
     * Calls AddToWishlist.
     * @param request CWishlist_AddToWishlist_Request message or plain object
     * @returns Promise
     */
    public addToWishlist(request: ICWishlist_AddToWishlist_Request): Promise<CWishlist_AddToWishlist_Response>;

    /**
     * Calls GetWishlist.
     * @param request CWishlist_GetWishlist_Request message or plain object
     * @param callback Node-style callback called with the error, if any, and CWishlist_GetWishlist_Response
     */
    public getWishlist(request: ICWishlist_GetWishlist_Request, callback: Wishlist.GetWishlistCallback): void;

    /**
     * Calls GetWishlist.
     * @param request CWishlist_GetWishlist_Request message or plain object
     * @returns Promise
     */
    public getWishlist(request: ICWishlist_GetWishlist_Request): Promise<CWishlist_GetWishlist_Response>;

    /**
     * Calls GetWishlistItemCount.
     * @param request CWishlist_GetWishlistItemCount_Request message or plain object
     * @param callback Node-style callback called with the error, if any, and CWishlist_GetWishlistItemCount_Response
     */
    public getWishlistItemCount(request: ICWishlist_GetWishlistItemCount_Request, callback: Wishlist.GetWishlistItemCountCallback): void;

    /**
     * Calls GetWishlistItemCount.
     * @param request CWishlist_GetWishlistItemCount_Request message or plain object
     * @returns Promise
     */
    public getWishlistItemCount(request: ICWishlist_GetWishlistItemCount_Request): Promise<CWishlist_GetWishlistItemCount_Response>;

    /**
     * Calls GetWishlistItemsOnSale.
     * @param request CWishlist_GetWishlistItemsOnSale_Request message or plain object
     * @param callback Node-style callback called with the error, if any, and CWishlist_GetWishlistItemsOnSale_Response
     */
    public getWishlistItemsOnSale(request: ICWishlist_GetWishlistItemsOnSale_Request, callback: Wishlist.GetWishlistItemsOnSaleCallback): void;

    /**
     * Calls GetWishlistItemsOnSale.
     * @param request CWishlist_GetWishlistItemsOnSale_Request message or plain object
     * @returns Promise
     */
    public getWishlistItemsOnSale(request: ICWishlist_GetWishlistItemsOnSale_Request): Promise<CWishlist_GetWishlistItemsOnSale_Response>;

    /**
     * Calls GetWishlistSortedFiltered.
     * @param request CWishlist_GetWishlistSortedFiltered_Request message or plain object
     * @param callback Node-style callback called with the error, if any, and CWishlist_GetWishlistSortedFiltered_Response
     */
    public getWishlistSortedFiltered(request: ICWishlist_GetWishlistSortedFiltered_Request, callback: Wishlist.GetWishlistSortedFilteredCallback): void;

    /**
     * Calls GetWishlistSortedFiltered.
     * @param request CWishlist_GetWishlistSortedFiltered_Request message or plain object
     * @returns Promise
     */
    public getWishlistSortedFiltered(request: ICWishlist_GetWishlistSortedFiltered_Request): Promise<CWishlist_GetWishlistSortedFiltered_Response>;

    /**
     * Calls RemoveFromWishlist.
     * @param request CWishlist_RemoveFromWishlist_Request message or plain object
     * @param callback Node-style callback called with the error, if any, and CWishlist_RemoveFromWishlist_Response
     */
    public removeFromWishlist(request: ICWishlist_RemoveFromWishlist_Request, callback: Wishlist.RemoveFromWishlistCallback): void;

    /**
     * Calls RemoveFromWishlist.
     * @param request CWishlist_RemoveFromWishlist_Request message or plain object
     * @returns Promise
     */
    public removeFromWishlist(request: ICWishlist_RemoveFromWishlist_Request): Promise<CWishlist_RemoveFromWishlist_Response>;
}

export namespace Wishlist {

    /**
     * Callback as used by {@link Wishlist#addToWishlist}.
     * @param error Error, if any
     * @param [response] CWishlist_AddToWishlist_Response
     */
    type AddToWishlistCallback = (error: (Error|null), response?: CWishlist_AddToWishlist_Response) => void;

    /**
     * Callback as used by {@link Wishlist#getWishlist}.
     * @param error Error, if any
     * @param [response] CWishlist_GetWishlist_Response
     */
    type GetWishlistCallback = (error: (Error|null), response?: CWishlist_GetWishlist_Response) => void;

    /**
     * Callback as used by {@link Wishlist#getWishlistItemCount}.
     * @param error Error, if any
     * @param [response] CWishlist_GetWishlistItemCount_Response
     */
    type GetWishlistItemCountCallback = (error: (Error|null), response?: CWishlist_GetWishlistItemCount_Response) => void;

    /**
     * Callback as used by {@link Wishlist#getWishlistItemsOnSale}.
     * @param error Error, if any
     * @param [response] CWishlist_GetWishlistItemsOnSale_Response
     */
    type GetWishlistItemsOnSaleCallback = (error: (Error|null), response?: CWishlist_GetWishlistItemsOnSale_Response) => void;

    /**
     * Callback as used by {@link Wishlist#getWishlistSortedFiltered}.
     * @param error Error, if any
     * @param [response] CWishlist_GetWishlistSortedFiltered_Response
     */
    type GetWishlistSortedFilteredCallback = (error: (Error|null), response?: CWishlist_GetWishlistSortedFiltered_Response) => void;

    /**
     * Callback as used by {@link Wishlist#removeFromWishlist}.
     * @param error Error, if any
     * @param [response] CWishlist_RemoveFromWishlist_Response
     */
    type RemoveFromWishlistCallback = (error: (Error|null), response?: CWishlist_RemoveFromWishlist_Response) => void;
}

/** Properties of a CUserInterface_NavData. */
export interface ICUserInterface_NavData {

    /** CUserInterface_NavData domain */
    domain?: (string|null);

    /** CUserInterface_NavData controller */
    controller?: (string|null);

    /** CUserInterface_NavData method */
    method?: (string|null);

    /** CUserInterface_NavData submethod */
    submethod?: (string|null);

    /** CUserInterface_NavData feature */
    feature?: (string|null);

    /** CUserInterface_NavData depth */
    depth?: (number|null);

    /** CUserInterface_NavData countrycode */
    countrycode?: (string|null);

    /** CUserInterface_NavData webkey */
    webkey?: (number|Long|null);

    /** CUserInterface_NavData isClient */
    isClient?: (boolean|null);

    /** CUserInterface_NavData curatorData */
    curatorData?: (IUserInterface_CuratorData|null);

    /** CUserInterface_NavData isLikelyBot */
    isLikelyBot?: (boolean|null);

    /** CUserInterface_NavData isUtm */
    isUtm?: (boolean|null);
}

/** Represents a CUserInterface_NavData. */
export class CUserInterface_NavData implements ICUserInterface_NavData {

    /**
     * Constructs a new CUserInterface_NavData.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICUserInterface_NavData);

    /** CUserInterface_NavData domain. */
    public domain: string;

    /** CUserInterface_NavData controller. */
    public controller: string;

    /** CUserInterface_NavData method. */
    public method: string;

    /** CUserInterface_NavData submethod. */
    public submethod: string;

    /** CUserInterface_NavData feature. */
    public feature: string;

    /** CUserInterface_NavData depth. */
    public depth: number;

    /** CUserInterface_NavData countrycode. */
    public countrycode: string;

    /** CUserInterface_NavData webkey. */
    public webkey: (number|Long);

    /** CUserInterface_NavData isClient. */
    public isClient: boolean;

    /** CUserInterface_NavData curatorData. */
    public curatorData?: (IUserInterface_CuratorData|null);

    /** CUserInterface_NavData isLikelyBot. */
    public isLikelyBot: boolean;

    /** CUserInterface_NavData isUtm. */
    public isUtm: boolean;

    /**
     * Creates a new CUserInterface_NavData instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CUserInterface_NavData instance
     */
    public static create(properties?: ICUserInterface_NavData): CUserInterface_NavData;

    /**
     * Encodes the specified CUserInterface_NavData message. Does not implicitly {@link CUserInterface_NavData.verify|verify} messages.
     * @param message CUserInterface_NavData message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ICUserInterface_NavData, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified CUserInterface_NavData message, length delimited. Does not implicitly {@link CUserInterface_NavData.verify|verify} messages.
     * @param message CUserInterface_NavData message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ICUserInterface_NavData, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CUserInterface_NavData message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CUserInterface_NavData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CUserInterface_NavData;

    /**
     * Decodes a CUserInterface_NavData message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns CUserInterface_NavData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): CUserInterface_NavData;

    /**
     * Verifies a CUserInterface_NavData message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a CUserInterface_NavData message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CUserInterface_NavData
     */
    public static fromObject(object: { [k: string]: any }): CUserInterface_NavData;

    /**
     * Creates a plain object from a CUserInterface_NavData message. Also converts values to other types if specified.
     * @param message CUserInterface_NavData
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CUserInterface_NavData, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CUserInterface_NavData to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CUserInterface_NavData
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a StoreBrowseContext. */
export interface IStoreBrowseContext {

    /** StoreBrowseContext language */
    language?: (string|null);

    /** StoreBrowseContext elanguage */
    elanguage?: (number|null);

    /** StoreBrowseContext countryCode */
    countryCode?: (string|null);

    /** StoreBrowseContext steamRealm */
    steamRealm?: (number|null);
}

/** Represents a StoreBrowseContext. */
export class StoreBrowseContext implements IStoreBrowseContext {

    /**
     * Constructs a new StoreBrowseContext.
     * @param [properties] Properties to set
     */
    constructor(properties?: IStoreBrowseContext);

    /** StoreBrowseContext language. */
    public language: string;

    /** StoreBrowseContext elanguage. */
    public elanguage: number;

    /** StoreBrowseContext countryCode. */
    public countryCode: string;

    /** StoreBrowseContext steamRealm. */
    public steamRealm: number;

    /**
     * Creates a new StoreBrowseContext instance using the specified properties.
     * @param [properties] Properties to set
     * @returns StoreBrowseContext instance
     */
    public static create(properties?: IStoreBrowseContext): StoreBrowseContext;

    /**
     * Encodes the specified StoreBrowseContext message. Does not implicitly {@link StoreBrowseContext.verify|verify} messages.
     * @param message StoreBrowseContext message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IStoreBrowseContext, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified StoreBrowseContext message, length delimited. Does not implicitly {@link StoreBrowseContext.verify|verify} messages.
     * @param message StoreBrowseContext message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IStoreBrowseContext, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a StoreBrowseContext message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns StoreBrowseContext
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): StoreBrowseContext;

    /**
     * Decodes a StoreBrowseContext message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns StoreBrowseContext
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): StoreBrowseContext;

    /**
     * Verifies a StoreBrowseContext message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a StoreBrowseContext message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns StoreBrowseContext
     */
    public static fromObject(object: { [k: string]: any }): StoreBrowseContext;

    /**
     * Creates a plain object from a StoreBrowseContext message. Also converts values to other types if specified.
     * @param message StoreBrowseContext
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: StoreBrowseContext, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this StoreBrowseContext to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for StoreBrowseContext
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a StoreBrowseItemDataRequest. */
export interface IStoreBrowseItemDataRequest {

    /** StoreBrowseItemDataRequest includeAssets */
    includeAssets?: (boolean|null);

    /** StoreBrowseItemDataRequest includeRelease */
    includeRelease?: (boolean|null);

    /** StoreBrowseItemDataRequest includePlatforms */
    includePlatforms?: (boolean|null);

    /** StoreBrowseItemDataRequest includeAllPurchaseOptions */
    includeAllPurchaseOptions?: (boolean|null);

    /** StoreBrowseItemDataRequest includeScreenshots */
    includeScreenshots?: (boolean|null);

    /** StoreBrowseItemDataRequest includeTrailers */
    includeTrailers?: (boolean|null);

    /** StoreBrowseItemDataRequest includeRatings */
    includeRatings?: (boolean|null);

    /** StoreBrowseItemDataRequest includeTagCount */
    includeTagCount?: (number|null);

    /** StoreBrowseItemDataRequest includeReviews */
    includeReviews?: (boolean|null);

    /** StoreBrowseItemDataRequest includeBasicInfo */
    includeBasicInfo?: (boolean|null);

    /** StoreBrowseItemDataRequest includeSupportedLanguages */
    includeSupportedLanguages?: (boolean|null);

    /** StoreBrowseItemDataRequest includeFullDescription */
    includeFullDescription?: (boolean|null);

    /** StoreBrowseItemDataRequest includeIncludedItems */
    includeIncludedItems?: (boolean|null);

    /** StoreBrowseItemDataRequest includedItemDataRequest */
    includedItemDataRequest?: (IStoreBrowseItemDataRequest|null);

    /** StoreBrowseItemDataRequest includeAssetsWithoutOverrides */
    includeAssetsWithoutOverrides?: (boolean|null);

    /** StoreBrowseItemDataRequest applyUserFilters */
    applyUserFilters?: (boolean|null);

    /** StoreBrowseItemDataRequest includeLinks */
    includeLinks?: (boolean|null);
}

/** Represents a StoreBrowseItemDataRequest. */
export class StoreBrowseItemDataRequest implements IStoreBrowseItemDataRequest {

    /**
     * Constructs a new StoreBrowseItemDataRequest.
     * @param [properties] Properties to set
     */
    constructor(properties?: IStoreBrowseItemDataRequest);

    /** StoreBrowseItemDataRequest includeAssets. */
    public includeAssets: boolean;

    /** StoreBrowseItemDataRequest includeRelease. */
    public includeRelease: boolean;

    /** StoreBrowseItemDataRequest includePlatforms. */
    public includePlatforms: boolean;

    /** StoreBrowseItemDataRequest includeAllPurchaseOptions. */
    public includeAllPurchaseOptions: boolean;

    /** StoreBrowseItemDataRequest includeScreenshots. */
    public includeScreenshots: boolean;

    /** StoreBrowseItemDataRequest includeTrailers. */
    public includeTrailers: boolean;

    /** StoreBrowseItemDataRequest includeRatings. */
    public includeRatings: boolean;

    /** StoreBrowseItemDataRequest includeTagCount. */
    public includeTagCount: number;

    /** StoreBrowseItemDataRequest includeReviews. */
    public includeReviews: boolean;

    /** StoreBrowseItemDataRequest includeBasicInfo. */
    public includeBasicInfo: boolean;

    /** StoreBrowseItemDataRequest includeSupportedLanguages. */
    public includeSupportedLanguages: boolean;

    /** StoreBrowseItemDataRequest includeFullDescription. */
    public includeFullDescription: boolean;

    /** StoreBrowseItemDataRequest includeIncludedItems. */
    public includeIncludedItems: boolean;

    /** StoreBrowseItemDataRequest includedItemDataRequest. */
    public includedItemDataRequest?: (IStoreBrowseItemDataRequest|null);

    /** StoreBrowseItemDataRequest includeAssetsWithoutOverrides. */
    public includeAssetsWithoutOverrides: boolean;

    /** StoreBrowseItemDataRequest applyUserFilters. */
    public applyUserFilters: boolean;

    /** StoreBrowseItemDataRequest includeLinks. */
    public includeLinks: boolean;

    /**
     * Creates a new StoreBrowseItemDataRequest instance using the specified properties.
     * @param [properties] Properties to set
     * @returns StoreBrowseItemDataRequest instance
     */
    public static create(properties?: IStoreBrowseItemDataRequest): StoreBrowseItemDataRequest;

    /**
     * Encodes the specified StoreBrowseItemDataRequest message. Does not implicitly {@link StoreBrowseItemDataRequest.verify|verify} messages.
     * @param message StoreBrowseItemDataRequest message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IStoreBrowseItemDataRequest, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified StoreBrowseItemDataRequest message, length delimited. Does not implicitly {@link StoreBrowseItemDataRequest.verify|verify} messages.
     * @param message StoreBrowseItemDataRequest message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IStoreBrowseItemDataRequest, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a StoreBrowseItemDataRequest message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns StoreBrowseItemDataRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): StoreBrowseItemDataRequest;

    /**
     * Decodes a StoreBrowseItemDataRequest message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns StoreBrowseItemDataRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): StoreBrowseItemDataRequest;

    /**
     * Verifies a StoreBrowseItemDataRequest message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a StoreBrowseItemDataRequest message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns StoreBrowseItemDataRequest
     */
    public static fromObject(object: { [k: string]: any }): StoreBrowseItemDataRequest;

    /**
     * Creates a plain object from a StoreBrowseItemDataRequest message. Also converts values to other types if specified.
     * @param message StoreBrowseItemDataRequest
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: StoreBrowseItemDataRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this StoreBrowseItemDataRequest to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for StoreBrowseItemDataRequest
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a StoreItem. */
export interface IStoreItem {

    /** StoreItem itemType */
    itemType?: (number|null);

    /** StoreItem id */
    id?: (number|null);

    /** StoreItem success */
    success?: (number|null);

    /** StoreItem visible */
    visible?: (boolean|null);

    /** StoreItem unvailableForCountryRestriction */
    unvailableForCountryRestriction?: (boolean|null);

    /** StoreItem name */
    name?: (string|null);

    /** StoreItem storeUrlPath */
    storeUrlPath?: (string|null);

    /** StoreItem appid */
    appid?: (number|null);

    /** StoreItem type */
    type?: (number|null);

    /** StoreItem includedTypes */
    includedTypes?: (number[]|null);

    /** StoreItem includedAppids */
    includedAppids?: (number[]|null);

    /** StoreItem isFree */
    isFree?: (boolean|null);

    /** StoreItem isEarlyAccess */
    isEarlyAccess?: (boolean|null);

    /** StoreItem relatedItems */
    relatedItems?: (ItoreItem_RelatedItems|null);

    /** StoreItem includedItems */
    includedItems?: (ItoreItem_IncludedItems|null);

    /** StoreItem contentDescriptorids */
    contentDescriptorids?: (number[]|null);

    /** StoreItem tagids */
    tagids?: (number[]|null);

    /** StoreItem categories */
    categories?: (ItoreItem_Categories|null);

    /** StoreItem reviews */
    reviews?: (ItoreItem_Reviews|null);

    /** StoreItem basicInfo */
    basicInfo?: (ItoreItem_BasicInfo|null);

    /** StoreItem tags */
    tags?: (ItoreItem_Tag[]|null);

    /** StoreItem assets */
    assets?: (ItoreItem_Assets|null);

    /** StoreItem release */
    release?: (ItoreItem_ReleaseInfo|null);

    /** StoreItem platforms */
    platforms?: (ItoreItem_Platforms|null);

    /** StoreItem gameRating */
    gameRating?: (ItoreGameRating|null);

    /** StoreItem isComingSoon */
    isComingSoon?: (boolean|null);

    /** StoreItem bestPurchaseOption */
    bestPurchaseOption?: (ItoreItem_PurchaseOption|null);

    /** StoreItem purchaseOptions */
    purchaseOptions?: (ItoreItem_PurchaseOption[]|null);

    /** StoreItem accessories */
    accessories?: (ItoreItem_PurchaseOption[]|null);

    /** StoreItem selfPurchaseOption */
    selfPurchaseOption?: (ItoreItem_PurchaseOption|null);

    /** StoreItem screenshots */
    screenshots?: (ItoreItem_Screenshots|null);

    /** StoreItem trailers */
    trailers?: (ItoreItem_Trailers|null);

    /** StoreItem supportedLanguages */
    supportedLanguages?: (ItoreItem_SupportedLanguage[]|null);

    /** StoreItem storeUrlPathOverride */
    storeUrlPathOverride?: (string|null);

    /** StoreItem freeWeekend */
    freeWeekend?: (ItoreItem_FreeWeekend|null);

    /** StoreItem unlisted */
    unlisted?: (boolean|null);

    /** StoreItem gameCount */
    gameCount?: (number|null);

    /** StoreItem internalName */
    internalName?: (string|null);

    /** StoreItem fullDescription */
    fullDescription?: (string|null);

    /** StoreItem isFreeTemporarily */
    isFreeTemporarily?: (boolean|null);

    /** StoreItem assetsWithoutOverrides */
    assetsWithoutOverrides?: (ItoreItem_Assets|null);

    /** StoreItem userFilterFailure */
    userFilterFailure?: (ItoreBrowseFilterFailure|null);

    /** StoreItem links */
    links?: (ItoreItem_Link[]|null);
}

/** Represents a StoreItem. */
export class StoreItem implements IStoreItem {

    /**
     * Constructs a new StoreItem.
     * @param [properties] Properties to set
     */
    constructor(properties?: IStoreItem);

    /** StoreItem itemType. */
    public itemType: number;

    /** StoreItem id. */
    public id: number;

    /** StoreItem success. */
    public success: number;

    /** StoreItem visible. */
    public visible: boolean;

    /** StoreItem unvailableForCountryRestriction. */
    public unvailableForCountryRestriction: boolean;

    /** StoreItem name. */
    public name: string;

    /** StoreItem storeUrlPath. */
    public storeUrlPath: string;

    /** StoreItem appid. */
    public appid: number;

    /** StoreItem type. */
    public type: number;

    /** StoreItem includedTypes. */
    public includedTypes: number[];

    /** StoreItem includedAppids. */
    public includedAppids: number[];

    /** StoreItem isFree. */
    public isFree: boolean;

    /** StoreItem isEarlyAccess. */
    public isEarlyAccess: boolean;

    /** StoreItem relatedItems. */
    public relatedItems?: (ItoreItem_RelatedItems|null);

    /** StoreItem includedItems. */
    public includedItems?: (ItoreItem_IncludedItems|null);

    /** StoreItem contentDescriptorids. */
    public contentDescriptorids: number[];

    /** StoreItem tagids. */
    public tagids: number[];

    /** StoreItem categories. */
    public categories?: (ItoreItem_Categories|null);

    /** StoreItem reviews. */
    public reviews?: (ItoreItem_Reviews|null);

    /** StoreItem basicInfo. */
    public basicInfo?: (ItoreItem_BasicInfo|null);

    /** StoreItem tags. */
    public tags: ItoreItem_Tag[];

    /** StoreItem assets. */
    public assets?: (ItoreItem_Assets|null);

    /** StoreItem release. */
    public release?: (ItoreItem_ReleaseInfo|null);

    /** StoreItem platforms. */
    public platforms?: (ItoreItem_Platforms|null);

    /** StoreItem gameRating. */
    public gameRating?: (ItoreGameRating|null);

    /** StoreItem isComingSoon. */
    public isComingSoon: boolean;

    /** StoreItem bestPurchaseOption. */
    public bestPurchaseOption?: (ItoreItem_PurchaseOption|null);

    /** StoreItem purchaseOptions. */
    public purchaseOptions: ItoreItem_PurchaseOption[];

    /** StoreItem accessories. */
    public accessories: ItoreItem_PurchaseOption[];

    /** StoreItem selfPurchaseOption. */
    public selfPurchaseOption?: (ItoreItem_PurchaseOption|null);

    /** StoreItem screenshots. */
    public screenshots?: (ItoreItem_Screenshots|null);

    /** StoreItem trailers. */
    public trailers?: (ItoreItem_Trailers|null);

    /** StoreItem supportedLanguages. */
    public supportedLanguages: ItoreItem_SupportedLanguage[];

    /** StoreItem storeUrlPathOverride. */
    public storeUrlPathOverride: string;

    /** StoreItem freeWeekend. */
    public freeWeekend?: (ItoreItem_FreeWeekend|null);

    /** StoreItem unlisted. */
    public unlisted: boolean;

    /** StoreItem gameCount. */
    public gameCount: number;

    /** StoreItem internalName. */
    public internalName: string;

    /** StoreItem fullDescription. */
    public fullDescription: string;

    /** StoreItem isFreeTemporarily. */
    public isFreeTemporarily: boolean;

    /** StoreItem assetsWithoutOverrides. */
    public assetsWithoutOverrides?: (ItoreItem_Assets|null);

    /** StoreItem userFilterFailure. */
    public userFilterFailure?: (ItoreBrowseFilterFailure|null);

    /** StoreItem links. */
    public links: ItoreItem_Link[];

    /**
     * Creates a new StoreItem instance using the specified properties.
     * @param [properties] Properties to set
     * @returns StoreItem instance
     */
    public static create(properties?: IStoreItem): StoreItem;

    /**
     * Encodes the specified StoreItem message. Does not implicitly {@link StoreItem.verify|verify} messages.
     * @param message StoreItem message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IStoreItem, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified StoreItem message, length delimited. Does not implicitly {@link StoreItem.verify|verify} messages.
     * @param message StoreItem message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IStoreItem, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a StoreItem message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns StoreItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): StoreItem;

    /**
     * Decodes a StoreItem message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns StoreItem
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): StoreItem;

    /**
     * Verifies a StoreItem message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a StoreItem message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns StoreItem
     */
    public static fromObject(object: { [k: string]: any }): StoreItem;

    /**
     * Creates a plain object from a StoreItem message. Also converts values to other types if specified.
     * @param message StoreItem
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: StoreItem, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this StoreItem to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for StoreItem
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}
