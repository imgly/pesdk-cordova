package com.photoeditorsdk.cordova

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.io.File
import ly.img.android.IMGLY
import ly.img.android.PESDK
import ly.img.android.pesdk.PhotoEditorSettingsList
import ly.img.android.pesdk.backend.model.EditorSDKResult
import ly.img.android.pesdk.backend.model.state.LoadSettings
import ly.img.android.pesdk.backend.model.state.manager.SettingsList
import ly.img.android.pesdk.backend.encoder.Encoder
import ly.img.android.pesdk.kotlin_extension.continueWithExceptions
import ly.img.android.pesdk.ui.activity.EditorBuilder
import ly.img.android.pesdk.utils.MainThreadRunnable
import ly.img.android.pesdk.utils.SequenceRunnable
import ly.img.android.pesdk.utils.UriHelper
import ly.img.android.sdk.config.*
import ly.img.android.serializer._3.IMGLYFileReader
import ly.img.android.serializer._3.IMGLYFileWriter
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.util.UUID

/** PESDKPlugin */
class PESDKPlugin : CordovaPlugin() {

    companion object {
        // This number must be unique. It is public to allow client code to change it if the same value is used elsewhere.
        var EDITOR_RESULT_ID = 29064
    }

    /** The callback used for the plugin. */
    private var callback: CallbackContext? = null

    /** The currently used configuration. */
    private var currentConfig: Configuration? = null

    override fun onStart() {
        IMGLY.initSDK(this.cordova.activity)
        IMGLY.authorize()
    }

    @Throws(JSONException::class)
    override fun execute(action: String, data: JSONArray, callbackContext: CallbackContext): Boolean {
        return if (action == "present") { // Extract image path
            val options = data.getJSONObject(0)
            val filepath = options.optString("path", "")
            val configuration = options.optString("configuration", "{}")
            val serialization = options.optString("serialization", null)

            val gson = Gson()
            val config: Map<String, Any> = gson.fromJson(configuration, object : TypeToken<Map<String, Any>>() {}.type)

            present(filepath, config, serialization, callbackContext)
            true
        } else if (action == "unlockWithLicense") {
            val license = data[0].toString()
            unlockWithLicense(license)
            true
        } else {
            false
        }
    }

    /**
     * Unlocks the SDK with a stringified license.
     *
     * @param license The license as a *String*.
     */
    fun unlockWithLicense(license: String) {
        val jsonString = this.cordova.activity.assets.open(license).bufferedReader().use {
            it.readText()
        }

        PESDK.initSDKWithLicenseData(jsonString)
        IMGLY.authorize()
    }

    /**
     * Configures and presents the editor.
     *
     * @param filepath The image source as *String* which should be loaded into the editor.
     * @param config The *Configuration* to configure the editor with as if any.
     * @param serialization The serialization to load into the editor if any.
     * @param callbackContext The *CallbackContext* used to communicate with the plugin.
     */
    private fun present(
        filepath: String?,
        config: Map<String, Any>,
        serialization: String?,
        callbackContext: CallbackContext
    ) {
        callback = callbackContext
        IMGLY.authorize()
        val configuration = ConfigLoader.readFrom(config)
        val settingsList = PhotoEditorSettingsList(configuration.export?.serialization?.enabled == true)
        configuration.applyOn(settingsList)
        currentConfig = configuration

        settingsList.configure<LoadSettings> { loadSettings ->
            filepath?.also {
                if (it.startsWith("data:")) {
                    loadSettings.source = UriHelper.createFromBase64String(it.substringAfter("base64,"))
                } else {
                    val potentialFile = continueWithExceptions { File(it) }
                    if (potentialFile?.exists() == true) {
                        loadSettings.source = Uri.fromFile(potentialFile)
                    } else {
                        loadSettings.source = ConfigLoader.parseUri(it)
                    }
                }
            }
        }

        readSerialisation(settingsList, serialization, filepath == null)
        startEditor(settingsList)
    }

    /**
     * Starts the editor.
     * @param settingsList The *PhotoEditorSettingsList* used to configure the editor.
     */
    private fun startEditor(settingsList: PhotoEditorSettingsList) {
        val currentActivity = cordova.activity ?: throw RuntimeException("Can't start the Editor because there is no current activity")
        cordova.setActivityResultCallback(this)
        MainThreadRunnable {
            EditorBuilder(currentActivity)
                .setSettingsList(settingsList)
                .startActivityForResult(currentActivity, EDITOR_RESULT_ID, arrayOfNulls(0))
            settingsList.release()
        }()
    }

    /**
     * Called when the editor has succeeded exporting the image.
     * @param intent The *Intent?*.
     */
    private fun success(intent: Intent?) {
        val data = try {
            intent?.let { EditorSDKResult(it) }
        } catch (e: EditorSDKResult.NotAnImglyResultException) {
            null
        } ?: return // If data is null the result is not from us.

        SequenceRunnable("Export Done") {
            val sourcePath = data.sourceUri
            val resultPath = data.resultUri

            val serializationConfig = currentConfig?.export?.serialization

            val serialization: Any? = if (serializationConfig?.enabled == true) {
                val settingsList = data.settingsList
                skipIfNotExists {
                    settingsList.let { settingsList ->
                        if (serializationConfig.embedSourceImage == true) {
                            Log.i("ImgLySdk", "EmbedSourceImage is currently not supported by the Android SDK")
                        }
                        when (serializationConfig.exportType) {
                            SerializationExportType.FILE_URL -> {
                                val uri = serializationConfig.filename?.let { 
                                    Uri.parse("$it.json")
                                } ?: Uri.fromFile(File.createTempFile("serialization-" + UUID.randomUUID().toString(), ".json"))
                                Encoder.createOutputStream(uri).use { outputStream -> 
                                    IMGLYFileWriter(settingsList).writeJson(outputStream)
                                }
                                uri.toString()
                            }
                            SerializationExportType.OBJECT -> {
                                IMGLYFileWriter(settingsList).writeJsonAsString()
                            }
                        }
                    }
                } ?: run {
                    Log.i("ImgLySdk", "You need to include 'backend:serializer' Module, to use serialisation!")
                    null
                }
                settingsList.release()
            } else {
                null
            }
            val result = createResult(resultPath, sourcePath?.path != resultPath?.path, serialization)
            callback?.success(result)

        }()
    }

    /**
     * Reads the serialization to restore a previous state in the editor.
     * @param settingsList The *SettingsList*.
     * @param serialization The serialization which holds the previous state.
     */
    private fun readSerialisation(settingsList: SettingsList, serialization: String?, readImage: Boolean) {
        if (serialization != null) {
            skipIfNotExists {
                IMGLYFileReader(settingsList).also {
                    it.readJson(serialization, readImage)
                }
            }
        }
    }

    /**
     * Converts the editor result into a readable *JSONObject*.
     * @param image The output source of the image.
     * @param hasChanges Whether any export operations have been applied to the image.
     * @param serialization The serialization which stores the current state.
     * @return The converted *JSONObject*.
     */
    private fun createResult(image: Uri?, hasChanges: Boolean, serialization: Any?): JSONObject {
        val result = JSONObject()
        result.put("image", image)
        result.put("hasChanges", hasChanges)
        result.put("serialization", serialization)
        return result
    }

    override fun onRestoreStateForActivityResult(state: Bundle?, callbackContext: CallbackContext) {
        this.callback = callbackContext
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent) {
        if (requestCode == EDITOR_RESULT_ID) {
            when (resultCode) {
                Activity.RESULT_OK -> success(data)
                Activity.RESULT_CANCELED -> {
                    val nullValue: String? = null
                    callback?.success(nullValue) // return null
                }
                else -> callback?.error("Media error (code $resultCode)")
            }
        }
    }
}
