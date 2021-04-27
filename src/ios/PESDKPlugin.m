#import "PESDKPlugin.h"
#import <Photos/Photos.h>
#import <objc/message.h>
@import PhotoEditorSDK;

@interface NSDictionary (CDV_IMGLY_Category)

- (nullable id)pesdk_getValueForKeyPath:(nonnull NSString *)keyPath
                          default:(nullable id)defaultValue;
+ (nullable id)pesdk_getValue:(nullable NSDictionary *)dictionary
        valueForKeyPath:(nonnull NSString *)keyPath
                default:(nullable id)defaultValue;

@end

@interface PESDKPlugin () <PESDKPhotoEditViewControllerDelegate>
@property(strong) CDVInvokedUrlCommand *lastCommand;
@end

@implementation PESDKPlugin

#pragma mark - Cordova

/**
 Sends a result back to Cordova.

 @param result
 */
- (void)finishCommandWithResult:(CDVPluginResult *)result {
  if (self.lastCommand != nil) {
    [self.commandDelegate sendPluginResult:result
                                callbackId:self.lastCommand.callbackId];
    self.lastCommand = nil;
  }
}

#pragma mark - Public API

static IMGLYConfigurationBlock _configureWithBuilder = nil;

+ (IMGLYConfigurationBlock)configureWithBuilder {
  return _configureWithBuilder;
}

+ (void)setConfigureWithBuilder:(IMGLYConfigurationBlock)configurationBlock {
  _configureWithBuilder = configurationBlock;
}

static CDV_PESDKWillPresentBlock _willPresentPhotoEditViewController = nil;

+ (CDV_PESDKWillPresentBlock)willPresentPhotoEditViewController {
  return _willPresentPhotoEditViewController;
}

+ (void)setWillPresentPhotoEditViewController:
    (CDV_PESDKWillPresentBlock)willPresentBlock {
  _willPresentPhotoEditViewController = willPresentBlock;
}

const struct CDV_IMGLY_Constants CDV_IMGLY = {
    .kErrorUnableToUnlock = @"E_UNABLE_TO_UNLOCK",
    .kErrorUnableToLoad = @"E_UNABLE_TO_LOAD",
    .kErrorUnableToExport = @"E_UNABLE_TO_EXPORT",

    .kExportTypeFileURL = @"file-url",
    .kExportTypeDataURL = @"data-url",
    .kExportTypeObject = @"object"};

- (void)present:(CDVInvokedUrlCommand *)command {

  if (self.lastCommand == nil) {
    self.lastCommand = command;

    // Parse arguments and extract filepath
    NSDictionary *options = command.arguments[0];
    NSString *filepath = options[@"path"];
    NSDictionary *tempWithConfiguration = options[@"configuration"];
    NSDictionary *state = options[@"serialization"];

    // Add the app folder path to the beginning of the image path
    NSURL *appFolderUrl = [[NSBundle mainBundle] resourceURL];
    filepath = [filepath
        stringByReplacingOccurrencesOfString:@"imgly_asset:///"
                                  withString:appFolderUrl.absoluteString];

    // Convert the pathes form `imgly_asset:///` to a valid pathes
    NSDictionary *withConfiguration;
    NSError *jsonConversionError;
    NSString *jsonString;
    // Convert NSDictionary to JSON string
    if (tempWithConfiguration != nil) {
      NSData *jsonTestData =
          [NSJSONSerialization dataWithJSONObject:tempWithConfiguration
                                          options:NSJSONWritingPrettyPrinted
                                            error:&jsonConversionError];
      if (jsonConversionError != nil) {
        NSString *message = [NSString
            stringWithFormat:@"Error while decoding configuration: %@",
                             jsonConversionError];
        CDVPluginResult *result =
            [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                              messageAsString:message];
        [self closeControllerWithResult:result];
      } else {
        // here comes the magic, convert the temp schema to a valid iOS URL and
        // also fix `\\/` in the pathes
        jsonString = [[NSString alloc] initWithData:jsonTestData
                                           encoding:NSUTF8StringEncoding];
        jsonString = [jsonString stringByReplacingOccurrencesOfString:@"\\/"
                                                           withString:@"/"];
        jsonString = [jsonString
            stringByReplacingOccurrencesOfString:@"imgly_asset:///"
                                      withString:appFolderUrl.absoluteString];
      }
      // convert back the configuration from json to dictionary
      NSData *jsonData = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
      NSError *err;
      withConfiguration = (NSDictionary *)[NSJSONSerialization
          JSONObjectWithData:jsonData
                     options:NSJSONReadingMutableContainers
                       error:&err];
      if (err != nil) {
        NSString *message = [NSString
            stringWithFormat:@"Error while decoding configuration: %@", err];
        CDVPluginResult *result =
            [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                              messageAsString:message];
        [self closeControllerWithResult:result];
      }
    }

    __block NSError *error = nil;

    IMGLYMediaEditViewControllerBlock createMediaEditViewController =
        ^PESDKMediaEditViewController *_Nullable(
            PESDKConfiguration *_Nonnull configuration,
            NSData *_Nullable serializationData) {

      NSURL *url = [NSURL URLWithString:filepath];
      NSData *imageData = [[NSData alloc] initWithContentsOfURL:url];
      PESDKPhoto *photoAsset = [[PESDKPhoto alloc] initWithData:imageData];

      PESDKPhotoEditModel *photoEditModel = [[PESDKPhotoEditModel alloc] init];

      if (serializationData != nil) {
        PESDKDeserializationResult *deserializationResult = nil;
        if (photoAsset != nil) {
          deserializationResult = [PESDKDeserializer
              deserializeWithData:serializationData
                  imageDimensions:photoAsset.size
                     assetCatalog:configuration.assetCatalog];
        } else {
          deserializationResult = [PESDKDeserializer
              deserializeWithData:serializationData
                     assetCatalog:configuration.assetCatalog];
          if (deserializationResult.photo == nil) {
            return nil;
          }
          photoAsset = [PESDKPhoto
              photoFromPhotoRepresentation:deserializationResult.photo];
        }
        photoEditModel = deserializationResult.model ?: photoEditModel;
      }

      PESDKPhotoEditViewController *photoEditViewController =
          [[PESDKPhotoEditViewController alloc]
              initWithPhotoAsset:photoAsset
                   configuration:configuration
                  photoEditModel:photoEditModel];
      photoEditViewController.modalPresentationStyle =
          UIModalPresentationFullScreen;
      photoEditViewController.delegate = self;
      CDV_PESDKWillPresentBlock willPresentPhotoEditViewController =
          PESDKPlugin.willPresentPhotoEditViewController;
      if (willPresentPhotoEditViewController != nil) {
        willPresentPhotoEditViewController(photoEditViewController);
      }
      return photoEditViewController;
    };

    NSData *serializationData = nil;
    if (state != nil) {
      serializationData = [NSJSONSerialization dataWithJSONObject:state
                                                          options:kNilOptions
                                                            error:&error];
      if (error != nil) {
        NSString *message =
            [NSString stringWithFormat:@"Invalid serialization: %@", error];
        CDVPluginResult *result =
            [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                              messageAsString:message];
        [self closeControllerWithResult:result];
        return;
      }
    }
    PESDKAssetCatalog *assetCatalog = PESDKAssetCatalog.defaultItems;
    PESDKConfiguration *configuration = [[PESDKConfiguration alloc]
        initWithBuilder:^(PESDKConfigurationBuilder *_Nonnull builder) {
          builder.assetCatalog = assetCatalog;
          [builder configureFromDictionary:withConfiguration error:&error];
        }];

    if (error != nil) {
      NSString *message = [NSString
          stringWithFormat:@"Error while decoding configuration: %@", error];
      CDVPluginResult *result =
          [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                            messageAsString:message];
      [self closeControllerWithResult:result];
      return;
    }

    IMGLYUTIBlock getUTI =
        ^CFStringRef _Nonnull(PESDKConfiguration *_Nonnull configuration) {
      return configuration.photoEditViewControllerOptions
          .outputImageFileFormatUTI;
    };

    // Set default values if necessary
    id valueExportType = [NSDictionary pesdk_getValue:withConfiguration
                                valueForKeyPath:@"export.type"
                                        default:CDV_IMGLY.kExportTypeFileURL];
    id valueExportFile = [NSDictionary
               pesdk_getValue:withConfiguration
        valueForKeyPath:@"export.filename"
                default:[NSString stringWithFormat:@"imgly-export/%@",
                                                   [[NSUUID UUID] UUIDString]]];
    id valueSerializationEnabled =
        [NSDictionary pesdk_getValue:withConfiguration
               valueForKeyPath:@"export.serialization.enabled"
                       default:@(NO)];
    id valueSerializationType =
        [NSDictionary pesdk_getValue:withConfiguration
               valueForKeyPath:@"export.serialization.exportType"
                       default:CDV_IMGLY.kExportTypeFileURL];
    id valueSerializationFile =
        [NSDictionary pesdk_getValue:withConfiguration
               valueForKeyPath:@"export.serialization.filename"
                       default:valueExportFile];
    id valueSerializationEmbedImage =
        [NSDictionary pesdk_getValue:withConfiguration
               valueForKeyPath:@"export.serialization.embedSourceImage"
                       default:@(NO)];

    NSString *exportType = valueExportType;
    NSURL *exportFile =
        [CDVConvert CDV_IMGLY_ExportFileURL:valueExportFile
                            withExpectedUTI:getUTI(configuration)];
    BOOL serializationEnabled = [valueSerializationEnabled boolValue];
    NSString *serializationType = valueSerializationType;
    NSURL *serializationFile =
        [CDVConvert CDV_IMGLY_ExportFileURL:valueSerializationFile
                            withExpectedUTI:kUTTypeJSON];
    BOOL serializationEmbedImage = [valueSerializationEmbedImage boolValue];

    // Make sure that the export settings are valid
    if ((exportType == nil) ||
        (exportFile == nil &&
         [exportType isEqualToString:CDV_IMGLY.kExportTypeFileURL]) ||
        (serializationFile == nil &&
         [serializationType isEqualToString:CDV_IMGLY.kExportTypeFileURL])) {
      CDVPluginResult *result =
          [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                            messageAsString:@"Invalid export configuration"];
      [self closeControllerWithResult:result];
      return;
    }

    // Update configuration
    NSMutableDictionary *updatedDictionary =
        [NSMutableDictionary dictionaryWithDictionary:withConfiguration];
    [updatedDictionary setValue:exportFile.absoluteString
                     forKeyPath:@"export.filename"];
    configuration = [[PESDKConfiguration alloc]
        initWithBuilder:^(PESDKConfigurationBuilder *_Nonnull builder) {
          builder.assetCatalog = assetCatalog;
          [builder configureFromDictionary:updatedDictionary error:&error];
          IMGLYConfigurationBlock configureWithBuilder =
              PESDKPlugin.configureWithBuilder;
          if (configureWithBuilder != nil) {
            configureWithBuilder(builder);
          }
        }];
    if (error != nil) {
      NSString *message = [NSString
          stringWithFormat:@"Error while preparing export file: %@", error];
      CDVPluginResult *result =
          [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                            messageAsString:message];
      [self closeControllerWithResult:result];
      return;
    }

    PESDKMediaEditViewController *mediaEditViewController =
        createMediaEditViewController(configuration, serializationData);
    if (mediaEditViewController == nil) {
      return;
    }

    self.exportType = exportType;
    self.exportFile = exportFile;
    self.serializationEnabled = serializationEnabled;
    self.serializationType = serializationType;
    self.serializationFile = serializationFile;
    self.serializationEmbedImage = serializationEmbedImage;
    self.mediaEditViewController = mediaEditViewController;

    [self.viewController presentViewController:self.mediaEditViewController
                                      animated:YES
                                    completion:nil];
  }
}

- (void)unlockWithLicense:(nonnull CDVInvokedUrlCommand *)json {

  NSURL *appFolderUrl = [[NSBundle mainBundle] resourceURL];
  NSString *tempLicensePath = json.arguments[0];
  NSString *validPath = [tempLicensePath
      stringByReplacingOccurrencesOfString:@"imgly_asset:///"
                                withString:appFolderUrl.absoluteString];
  NSURL *url = [NSURL URLWithString:validPath];
  NSError *error = nil;
  [PESDK unlockWithLicenseFromURL:url error:&error];
  [self handleLicenseError:error];
}

- (void)handleLicenseError:(nullable NSError *)error {
  self.licenseError = nil;
  if (error != nil) {
    if ([error.domain isEqualToString:@"ImglyKit.IMGLY.Error"]) {
      switch (error.code) {
      case 3:
        NSLog(@"%@: %@", NSStringFromClass(self.class),
              error.localizedDescription);
        break;
      default:
        self.licenseError = error;
        NSLog(@"%@: %@", NSStringFromClass(self.class),
              error.localizedDescription);
        break;
      }
    } else {
      self.licenseError = error;
      NSLog(@"Error while unlocking with license: %@", error);
    }
  }
}

/**
 Closes all PESDK view controllers and sends a result
 back to Cordova.

 @param result The result to be sent.
 */
- (void)closeControllerWithResult:(CDVPluginResult *)result {
  [self.viewController
      dismissViewControllerAnimated:YES
                         completion:^{
                           [self finishCommandWithResult:result];
                         }];
}

- (void)dismiss:(nullable PESDKMediaEditViewController *)mediaEditViewController
       animated:(BOOL)animated
     completion:(nullable IMGLYCompletionBlock)completion {
  if (mediaEditViewController != self.mediaEditViewController) {
    NSLog(@"Unregistered %@", NSStringFromClass(mediaEditViewController.class));
  }

  self.exportType = nil;
  self.exportFile = nil;
  self.serializationEnabled = NO;
  self.serializationType = nil;
  self.serializationFile = nil;
  self.serializationEmbedImage = NO;
  self.mediaEditViewController = nil;

  [mediaEditViewController.presentingViewController
      dismissViewControllerAnimated:animated
                         completion:completion];
}

#pragma mark - PESDKPhotoEditViewControllerDelegate

// The PhotoEditViewController did save an image.
- (void)photoEditViewController:
            (PESDKPhotoEditViewController *)photoEditViewController
                   didSaveImage:(UIImage *)uiImage
                    imageAsData:(NSData *)imageData {
  PESDKPhotoEditViewControllerOptions *photoEditViewControllerOptions =
      photoEditViewController.configuration.photoEditViewControllerOptions;

  if (imageData.length == 0) {
    // Export image without any changes to target format if possible.
    switch (photoEditViewControllerOptions.outputImageFileFormat) {
    case PESDKImageFileFormatPng:
      imageData = UIImagePNGRepresentation(uiImage);
      break;
    case PESDKImageFileFormatJpeg:
      imageData = UIImageJPEGRepresentation(
          uiImage, photoEditViewControllerOptions.compressionQuality);
      break;
    default:
      break;
    }
  }

  NSError *error = nil;
  NSString *image = nil;
  id serialization = nil;

  if (imageData.length != 0) {

    if ([self.exportType isEqualToString:CDV_IMGLY.kExportTypeFileURL]) {
      if ([imageData CDV_IMGLY_writeToURL:self.exportFile
              andCreateDirectoryIfNecessary:YES
                                      error:&error]) {
        image = self.exportFile.absoluteString;
      }
    } else if ([self.exportType isEqualToString:CDV_IMGLY.kExportTypeDataURL]) {
      NSString *mediaType = CFBridgingRelease(UTTypeCopyPreferredTagWithClass(
          photoEditViewControllerOptions.outputImageFileFormatUTI,
          kUTTagClassMIMEType));
      image = [NSString
          stringWithFormat:@"data:%@;base64,%@", mediaType,
                           [imageData base64EncodedStringWithOptions:0]];
    }
  }

  if (self.serializationEnabled) {
    NSData *serializationData = [photoEditViewController
        serializedSettingsWithImageData:self.serializationEmbedImage];
    if ([self.serializationType isEqualToString:CDV_IMGLY.kExportTypeFileURL]) {
      if ([serializationData CDV_IMGLY_writeToURL:self.serializationFile
                    andCreateDirectoryIfNecessary:YES
                                            error:&error]) {
        serialization = self.serializationFile.absoluteString;
      }
    } else if ([self.serializationType
                   isEqualToString:CDV_IMGLY.kExportTypeObject]) {
      serialization = [NSJSONSerialization JSONObjectWithData:serializationData
                                                      options:kNilOptions
                                                        error:&error];
    }
  }

  [self dismiss:photoEditViewController
        animated:YES
      completion:^{
        if (error == nil) {
          CDVPluginResult *resultAsync;
          NSDictionary *payload = [NSDictionary
              dictionaryWithObjectsAndKeys:(image != nil) ? image
                                                          : [NSNull null],
                                           @"image",
                                           @(photoEditViewController
                                                 .hasChanges),
                                           @"hasChanges",
                                           (serialization != nil)
                                               ? serialization
                                               : [NSNull null],
                                           @"serialization", nil];
          resultAsync = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                      messageAsDictionary:payload];

          [self closeControllerWithResult:resultAsync];
        } else {
          NSString *message = [NSString
              stringWithFormat:@"Unable to export image or serialization: %@",
                               error];
          CDVPluginResult *result =
              [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                messageAsString:message];
          [self closeControllerWithResult:result];
        }
      }];
}

// The PhotoEditViewController was cancelled.
- (void)photoEditViewControllerDidCancel:
    (PESDKPhotoEditViewController *)photoEditViewController {
  CDVPluginResult *result =
      [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
  [self closeControllerWithResult:result];
}

// The PhotoEditViewController could not create an image.
- (void)photoEditViewControllerDidFailToGeneratePhoto:
    (PESDKPhotoEditViewController *)photoEditViewController {
  CDVPluginResult *result =
      [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                        messageAsString:@"Unable to generate image."];
  [self closeControllerWithResult:result];
}
@end

@implementation NSDictionary (CDV_IMGLY_Category)

//// start extract value from path
- (nullable id)pesdk_getValueForKeyPath:(nonnull NSString *)keyPath
                          default:(nullable id)defaultValue {

  id value = [self valueForKeyPath:keyPath];
  if (value == nil || value == [NSNull null]) {
    return defaultValue;
  } else {
    return value;
  }
}

+ (nullable id)pesdk_getValue:(nullable NSDictionary *)dictionary
        valueForKeyPath:(nonnull NSString *)keyPath
                default:(nullable id)defaultValue {
  if (dictionary == nil) {
    return defaultValue;
  }
  return [dictionary pesdk_getValueForKeyPath:keyPath
                                default:defaultValue];
}
//// end extract value from path
@end

@implementation CDVConvert

+ (nullable CDV_IMGLY_ExportURL *)CDV_IMGLY_ExportURL:(nullable id)json {
  // This code is identical to the implementation of
  // `+ (NSURL *)NSURL:(id)json`
  // except that it creates a path to a temporary file instead of assuming a
  // resource path as last resort.

  NSString *path = json;
  if (!path) {
    return nil;
  }

  @try { // NSURL has a history of crashing with bad input, so let's be safe

    NSURL *URL = [NSURL URLWithString:path];
    if (URL.scheme) { // Was a well-formed absolute URL
      return URL;
    }

    // Check if it has a scheme
    if ([path rangeOfString:@":"].location != NSNotFound) {
      NSMutableCharacterSet *urlAllowedCharacterSet =
          [NSMutableCharacterSet new];
      [urlAllowedCharacterSet
          formUnionWithCharacterSet:[NSCharacterSet
                                        URLUserAllowedCharacterSet]];
      [urlAllowedCharacterSet
          formUnionWithCharacterSet:[NSCharacterSet
                                        URLPasswordAllowedCharacterSet]];
      [urlAllowedCharacterSet
          formUnionWithCharacterSet:[NSCharacterSet
                                        URLHostAllowedCharacterSet]];
      [urlAllowedCharacterSet
          formUnionWithCharacterSet:[NSCharacterSet
                                        URLPathAllowedCharacterSet]];
      [urlAllowedCharacterSet
          formUnionWithCharacterSet:[NSCharacterSet
                                        URLQueryAllowedCharacterSet]];
      [urlAllowedCharacterSet
          formUnionWithCharacterSet:[NSCharacterSet
                                        URLFragmentAllowedCharacterSet]];
      path = [path stringByAddingPercentEncodingWithAllowedCharacters:
                       urlAllowedCharacterSet];
      URL = [NSURL URLWithString:path];
      if (URL) {
        return URL;
      }
    }

    // Assume that it's a local path
    path = path.stringByRemovingPercentEncoding;
    if ([path hasPrefix:@"~"]) {
      // Path is inside user directory
      path = path.stringByExpandingTildeInPath;
    } else if (!path.absolutePath) {
      // Create a path to a temporary file
      path = [NSTemporaryDirectory() stringByAppendingPathComponent:path];
    }
    if (!(URL = [NSURL fileURLWithPath:path isDirectory:NO])) {
      NSLog(json, @"a valid URL");
    }
    return URL;
  } @catch (__unused NSException *e) {
    NSLog(json, @"a valid URL");
    return nil;
  }
}

+ (nullable CDV_IMGLY_ExportFileURL *)
    CDV_IMGLY_ExportFileURL:(nullable id)json
            withExpectedUTI:(nonnull CFStringRef)expectedUTI {
  // This code is similar to the implementation of
  // `+ (RCTFileURL *)RCTFileURL:(id)json`.

  NSURL *fileURL = [self CDV_IMGLY_ExportURL:json];
  if (!fileURL.fileURL) {
    NSLog(@"URI must be a local file, '%@' isn't.", fileURL);
    return nil;
  }

  // Append correct file extension if necessary
  NSString *fileUTI = CFBridgingRelease(UTTypeCreatePreferredIdentifierForTag(
      kUTTagClassFilenameExtension,
      (__bridge CFStringRef)(fileURL.pathExtension.lowercaseString), nil));
  if (fileUTI == nil ||
      !UTTypeEqual((__bridge CFStringRef)(fileUTI), expectedUTI)) {
    NSString *extension = CFBridgingRelease(UTTypeCopyPreferredTagWithClass(
        expectedUTI, kUTTagClassFilenameExtension));
    if (extension != nil) {
      fileURL = [fileURL URLByAppendingPathExtension:extension];
    }
  }

  BOOL isDirectory = false;
  if ([[NSFileManager defaultManager] fileExistsAtPath:fileURL.path
                                           isDirectory:&isDirectory]) {
    if (isDirectory) {
      NSLog(@"File '%@' must not be a directory.", fileURL);
    } else {
      NSLog(@"File '%@' will be overwritten on export.", fileURL);
    }
  }
  return fileURL;
}

@end

@implementation NSData (CDV_IMGLY_Category)

- (BOOL)CDV_IMGLY_writeToURL:(nonnull NSURL *)fileURL
    andCreateDirectoryIfNecessary:(BOOL)createDirectory
                            error:(NSError *_Nullable *_Nullable)error {
  if (createDirectory) {
    if (![[NSFileManager defaultManager]
                   createDirectoryAtURL:fileURL.URLByDeletingLastPathComponent
            withIntermediateDirectories:YES
                             attributes:nil
                                  error:error]) {
      return NO;
    }
  }
  return [self writeToURL:fileURL options:NSDataWritingAtomic error:error];
}

@end
