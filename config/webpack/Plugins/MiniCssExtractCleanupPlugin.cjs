
/**
 * Cleanup empty js modules created after compiling .css
 * see: https://github.com/webpack/webpack/issues/11671
 */
class MiniCssExtractCleanupPlugin {
    apply(compiler) {
        compiler.hooks.emit.tapAsync("MiniCssExtractCleanupPlugin", (compilation, callback) => {
            Object.keys(compilation.assets)
                .filter(asset => {
                    return /^css\/.+\.js(\.map)?/.test(asset);
                })
                .forEach(asset => {
                    delete compilation.assets[asset];
                });

            callback();
        });
    }
}

module.exports = MiniCssExtractCleanupPlugin;
