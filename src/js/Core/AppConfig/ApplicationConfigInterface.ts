export default interface ApplicationConfig {
    get language(): string|null;
    get countryCode(): string|null;
    get webApiToken(): string|null;
}
