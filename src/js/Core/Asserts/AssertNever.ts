
export default function assertNever(_value: never): never {
    throw new Error();
}
