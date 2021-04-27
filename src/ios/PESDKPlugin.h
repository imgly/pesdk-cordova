#import <Cordova/CDV.h>
#import <MobileCoreServices/MobileCoreServices.h>

@import PhotoEditorSDK;
@import Foundation;

@interface PESDKPlugin : CDVPlugin

typedef void (^IMGLYConfigurationBlock)(
    PESDKConfigurationBuilder *_Nonnull builder);
typedef PESDKMediaEditViewController *_Nullable (
    ^IMGLYMediaEditViewControllerBlock)(
    PESDKConfiguration *_Nonnull configuration,
    NSData *_Nullable serializationData);
typedef CFStringRef _Nonnull (^IMGLYUTIBlock)(
    PESDKConfiguration *_Nonnull configuration);
typedef void (^IMGLYCompletionBlock)(void);

typedef void (^CDV_PESDKWillPresentBlock)(
    PESDKPhotoEditViewController *_Nonnull photoEditViewController);

@property(class, strong, atomic, nullable)
    CDV_PESDKWillPresentBlock willPresentPhotoEditViewController;

@property(class, strong, atomic, nullable)
    IMGLYConfigurationBlock configureWithBuilder;

@property(strong, atomic, nullable) NSError *licenseError;
@property(strong, atomic, nullable) NSString *exportType;
@property(strong, atomic, nullable) NSURL *exportFile;
@property(atomic) BOOL serializationEnabled;
@property(strong, atomic, nullable) NSString *serializationType;
@property(strong, atomic, nullable) NSURL *serializationFile;
@property(atomic) BOOL serializationEmbedImage;
@property(strong, atomic, nullable)
    PESDKMediaEditViewController *mediaEditViewController;

- (void)present:(CDVInvokedUrlCommand *_Nonnull)command;
- (void)unlockWithLicense:(nonnull id)json;

extern const struct CDV_IMGLY_Constants {
  NSString *_Nonnull const kErrorUnableToUnlock;
  NSString *_Nonnull const kErrorUnableToLoad;
  NSString *_Nonnull const kErrorUnableToExport;

  NSString *_Nonnull const kExportTypeFileURL;
  NSString *_Nonnull const kExportTypeDataURL;
  NSString *_Nonnull const kExportTypeObject;
} CDV_IMGLY;

@end

@interface CDVConvert : NSObject

typedef NSURL CDV_IMGLY_ExportURL;
typedef NSURL CDV_IMGLY_ExportFileURL;

+ (nullable CDV_IMGLY_ExportURL *)CDV_IMGLY_ExportURL:(nullable id)json;
+ (nullable CDV_IMGLY_ExportFileURL *)
    CDV_IMGLY_ExportFileURL:(nullable id)json
            withExpectedUTI:(nonnull CFStringRef)expectedUTI;

@end

@interface NSData (CDV_IMGLY_Category)

- (BOOL)CDV_IMGLY_writeToURL:(nonnull NSURL *)fileURL
    andCreateDirectoryIfNecessary:(BOOL)createDirectory
                            error:(NSError *_Nullable *_Nullable)error;

@end
