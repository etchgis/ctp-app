#import <React/RCTBridgeModule.h>
@import Mapbox;

@interface MapboxModule : NSObject <RCTBridgeModule>

@end

@implementation MapboxModule

// export a JS-accessible module with the name "Mapbox" (it would be MapboxModule by default)
RCT_EXPORT_MODULE(Mapbox);

/**
 Whether or not to be initialized on the UI thread
 */
+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

RCT_EXPORT_METHOD(setAccessToken:(NSString *)accessToken resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    [MGLAccountManager setAccessToken:accessToken];
    resolve(accessToken);
}

RCT_EXPORT_METHOD(getAccessToken:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSString* accessToken = [MGLAccountManager accessToken];
    resolve(accessToken);
}

@end
