import webpack, {type Compiler, type WebpackPluginInstance} from "webpack";

/**
 * Cleanup empty js modules created after compiling .css
 * see: https://github.com/webpack/webpack/issues/11671
 */
export default class MiniCssExtractCleanupPlugin implements WebpackPluginInstance {
    public apply(compiler: Compiler): void {
        compiler.hooks.compilation.tap(this.constructor.name, (compilation) => {

            compilation.hooks.processAssets.tap({
                "name": `${this.constructor.name}_compilation`,
                "stage": webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_COUNT,
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
