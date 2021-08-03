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
import ly.img.android.pesdk.backend.model.constant.OutputMode
import ly.img.android.pesdk.backend.encoder.Encoder
import ly.img.android.pesdk.kotlin_extension.continueWithExceptions
import ly.img.android.pesdk.ui.activity.EditorBuilder
import ly.img.android.pesdk.ui.activity.ImgLyIntent
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

class PESDKPlugin : CordovaPlugin() {
    private var callback: CallbackContext? = null

    private var currentSettingsList: PhotoEditorSettingsList? = null
    private var currentConfig: Configuration? = null

    override fun onStart() {
        IMGLY.initSDK(this.cordova.getActivity())
        IMGLY.authorize()
    }

    @Throws(JSONException::class)
    override fun execute(action: String, data: JSONArray, callbackContext: CallbackContext): Boolean {
        return if (action == "present") { // Extract image path
            val options = data.getJSONObject(0)
            val filepath = options.optString("path", "")
            val configuration = options.optString("configuration", "{}")
            val serialization = options.optString("serialization", null)
            val activity: Activity = this.cordova.getActivity()

            val gson = Gson()
            var config: Map<String, Any> = gson.fromJson(configuration, object : TypeToken<Map<String, Any>>() {}.type)

            present(activity, filepath, config, serialization, callbackContext)
            true
        } else if (action == "unlockWithLicense") {
            val license = data[0].toString()
            unlockWithLicense(license)
            true
        } else {
            false
        }
    }

    fun unlockWithLicense(license: String) {
        val file_name = license
        var json_string: String = ""
        json_string = this.cordova.getActivity().assets.open(file_name).bufferedReader().use {
            it.readText()
        }

        PESDK.initSDKWithLicenseData(json_string)

        IMGLY.authorize()
    }

    private fun present(
        mainActivity: Activity?,
        filepath: String?,
        config: Map<String, Any>,
        serialization: String?,
        callbackContext: CallbackContext
    ) {
        callback = callbackContext
        IMGLY.authorize()
        val settingsList = PhotoEditorSettingsList()

        currentSettingsList = settingsList
        currentConfig = ConfigLoader.readFrom(config).also {
            it.applyOn(settingsList)
        }

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

        val currentActivity = mainActivity ?: throw RuntimeException("Can't start the Editor because there is no current activity")

        readSerialisation(settingsList, serialization, filepath == null)

        val self = this

        cordova.setActivityResultCallback(self)

        MainThreadRunnable {
            EditorBuilder(currentActivity)
              .setSettingsList(settingsList)
              .startActivityForResult(currentActivity, EDITOR_RESULT_ID)
        }()
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
            val settingsList = data.settingsList

            val serialization: Any? = if (serializationConfig?.enabled == true) {
                skipIfNotExists {
                    settingsList.let { settingsList ->
                        if (serializationConfig.embedSourceImage == true) {
                            Log.i("ImgLySdk", "EmbedSourceImage is currently not supported by the Android SDK")
                        }
                        when (serializationConfig.exportType) {
                            SerializationExportType.FILE_URL -> {
                                val uri = serializationConfig.filename?.let { 
                                    Uri.parse(it)
                                } ?: Uri.fromFile(File.createTempFile("serialization", ".json"))
                                Encoder.createOutputStream(uri).use { outputStream -> 
                                    IMGLYFileWriter(settingsList).writeJson(outputStream);
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
            } else {
                null
            }
            var result = createResult(resultPath, sourcePath?.path != resultPath?.path, serialization)
            callback?.success(result)

        }()
    }

    private fun readSerialisation(settingsList: SettingsList, serialization: String?, readImage: Boolean) {
        if (serialization != null) {
            skipIfNotExists {
                IMGLYFileReader(settingsList).also {
                    it.readJson(serialization, readImage)
                }
            }
        }
    }

    private fun createResult(image: Uri?, hasChanges: Boolean, serialization: Any?): JSONObject {
        val result = JSONObject()
        result.put("image", image)
        result.put("hasChanges", hasChanges)
        result.put("serialization", serialization)
        return result
    }

    companion object {
        // This number must be unique. It is public to allow client code to change it if the same value is used elsewhere.
        var EDITOR_RESULT_ID = 29064
    }
}
