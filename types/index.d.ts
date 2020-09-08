import { Configuration } from './configuration';

/**
 * The result of an export.
 */
interface PhotoEditorResult {
    /** The edited image. */
    image: string;
    /** An indicator whether the input image was modified at all. */
    hasChanges: boolean;
    /**
     * All modifications applied to the input image if
     * `export.serialization.enabled` of the `Configuration` was set to `true`.
     */
    serialization?: string | object;
}

declare class PESDK {
    /**
     * Present a photo editor.
     * @note EXIF meta data is only preserved in the edited image if and only if
     * the source image is loaded from a local `file://` resource.
     *
     * @param {function} success - The callback returns a {PhotoEditorResult} or
     *     `null` if the editor is dismissed without exporting the edited image.
     * @param {function} failure - The callback function that will be called when
     *     an error occurs.
     * @param {string} image The source of the image to be edited.
     * @param {Configuration} configuration The configuration used to initialize the
     *     editor.
     * @param {object} serialization The serialization used to initialize the
     *     editor. This
     * restores a previous state of the editor by re-applying all modifications to
     * the loaded image.
     */
    static openEditor(
        success: (args: PhotoEditorResult) => void,
        failure: (error: any) => void,
        image: { uri: string },
        configuration?: Configuration,
        serialization?: object): void

    /**
    * Unlock PhotoEditor SDK with a license.
    *
    * The license should have an extension like this:
    * for iOS: "xxx.ios", example: pesdk_license.ios
    * for Android: "xxx.android", example: pesdk_license.android
    * then pass just the name without the extension to the `unlockWithLicense` function.
    * @example `PESDK.unlockWithLicense('www/assets/pesdk_license')`
    *
    * @param {string} license The path of license used to unlock the SDK.
    */
    static unlockWithLicense(license: string): void

    /**
    * Get the correct path to each platform
    * It can be used to load local resources
    *
    * @param {string} path The path of the local resource.
    * @returns {string} assets path to deal with it inside PhotoEditor SDK
    */
    static loadResource(
        image: string): { uri: string }
}

export { PESDK, PhotoEditorResult }
export * from './configuration';