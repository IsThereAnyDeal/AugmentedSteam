
export default class AppConfig {

    public constructor(
        public readonly language: string|null = null,
        public readonly countryCode: string|null = null,
        public readonly webApiToken: string|null = null
    ) {}
}
