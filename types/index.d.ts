import { Configuration } from './configuration';

/**
 * The result of an export.
 */
interface PhotoEditorResult {
    /** The edited image. */
    image: string;
    /** An indicator whether the input image was modified at all. */
    hasChanges: boolean;
    /** All modifications applied to the input image if `export.serialization.enabled` of the `Configuration` was set to `true`. */
    serialization?: string | object;
}

declare class PESDK {
    /**
     * Modally present a photo editor.
     *
     * @param {function} success - The callback returns a `PhotoEditorResult` or `null` if the editor
     * is dismissed without exporting the edited image.
     * @param {function} failure - The callback function that will be called when an error occurs.
     * @param {string} image The source of the image to be edited.
     * Can be a local or remote URI. Local URIs are recommended as the handling of remote URIs is not optimized.
     * Remote resources should be downloaded in advance and then passed to the editor as local resources.
     * Static local resources which reside, e.g., in the `www` folder of your app, should be resolved by
     * `PESDK.resolveStaticResource("www/path/to/your/image")` before they can be passed to the editor.
     * If this parameter is `null`, the `serialization` parameter must not be `null` and it must contain 
     * an embedded source image.
     * @param {object} configuration The configuration used to initialize the editor.
     * @param {object} serialization The serialization used to initialize the editor. This
     * restores a previous state of the editor by re-applying all modifications to the loaded
     * image.
     */
    static openEditor(
        success: (args: PhotoEditorResult | null) => void,
        failure: (error: any) => void,
        image?: string,
        configuration?: Configuration,
        serialization?: object): void

    /**
     * Unlock PhotoEditor SDK with a license.
     *
     * @param {string} license The path of the license used to unlock the SDK.
     * The license files should be located within the `www` folder and must have
     * the extension `.ios` for iOS and `.android` for Android. In this way the 
     * licenses get automatically resolved for each platform so that no file-
     * extension is needed in the path.
     * 
     * @example 
     * // Both licenses `pesdk_license.ios` and `pesdk_license.android` 
     * // located in `www/assets/` will be automatically resolved by:
     * PESDK.unlockWithLicense('www/assets/pesdk_license')
     */
    static unlockWithLicense(license: string): void

    /**
    * Resolves the path of a static local resource.
    *
    * @param {string} path The path of the static local resource.
    * @returns {string} The platform-specific path for a static local resource that can be accessed by the native PhotoEditor SDK plugin.
    */
    static resolveStaticResource(
        path: string): string

    /**
    * @deprecated Use `PESDK.resolveStaticResource` instead. 
    * Resolves the path of a static local resource.
    *
    * @param {string} path The path of the static local resource.
    * @returns {string} The platform-specific path for a static local resource that can be accessed by the native PhotoEditor SDK plugin.
    */
    static loadResource(
        path: string): string
}

export { PESDK, PhotoEditorResult }
export * from './configuration';
