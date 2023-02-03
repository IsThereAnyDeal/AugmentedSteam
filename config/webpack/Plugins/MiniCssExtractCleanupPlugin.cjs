
/**
 * Cleanup empty js modules created after compiling .css
 * see: https://github.com/webpack/webpack/issues/11671
 */
class MiniCssExtractCleanupPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap(this.constructor.name, (compilation) => {

            compilation.hooks.processAssets.tap({
                "name": `${this.constructor.name}_compilation`,
                "stage": compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_COUNT,
            }, (assets) => {
                Object.keys(assets)
                    .filter(asset => {
                        return /^css\/.+\.js(\.map)?/.test(asset);
                    })
                    .forEach(asset => {
                        compilation.deleteAsset(asset);
                    });
            });

        });
    }
}

module.exports = MiniCssExtractCleanupPlugin;
