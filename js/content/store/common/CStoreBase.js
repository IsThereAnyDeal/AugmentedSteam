class CStoreBase extends ASContext {

    constructor(features) {

        features.push(
            FHighlightsTags,
            FAlternativeLinuxIcon,
        );

        super(features);
    }
}