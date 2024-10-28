#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#import "MapLocationDelegator.h"

@interface GeolocationModule : RCTEventEmitter <RCTBridgeModule>

@end

@implementation GeolocationModule
{
  bool hasListeners;
}

RCT_EXPORT_MODULE(Geolocation);

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"UpdateLocation", @"UpdateHeading", @"LocationError", @"GeofenceEvent"];
}

/**
whether or not to be initialized on the UI thread
*/
+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

// Watch for notifications from GlobalLocationManager.m.
extern NSString * const LocUpdateLocations;
extern NSString * const LocUpdateHeading;
extern NSString * const LocFailWithError;
extern NSString * const LocDidChangeAuthorization;
extern NSString * const LocEnterGeofence;

// Will be called when this module's first listener is added.
-(void)startObserving {
  hasListeners = YES;
  
  // Add as an observer for the GlobalLocationManager.
  //GlobalLocationManager *locationManager = [GlobalLocationManager sharedManager];
  MapLocationDelegator *locationManager = [MapLocationDelegator sharedManager];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(receiveLocationNotification:)
                                               name:nil
                                             object:locationManager];
}

// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving {
  // If you don't remove yourself as an observer after dealloc, the Notification Center
  // prior to iOS 9.0 will continue to try and send notification objects to the
  // deallocated object.
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  
  hasListeners = NO;
}

RCT_EXPORT_METHOD(start)
{
  [MapLocationDelegator getPermissionAndStart];
}

RCT_EXPORT_METHOD(setAccuracy:(int)accuracyLevel)
{
  [MapLocationDelegator setAccuracy:accuracyLevel];
}

RCT_EXPORT_METHOD(getOnce:resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{

}

RCT_EXPORT_METHOD(addGeofence:(double)lat
                         atLng:(double)lng
                         radiusMeters:(double)radius
                         withName:(NSString*)name)
{
  // TODO: switch to global location manager
  MapLocationDelegator *locationManager = [MapLocationDelegator sharedManager];
  [locationManager addGeofence:lat atLng:lng withRadius:radius withName:name];
}

RCT_EXPORT_METHOD(clearGeofences)
{
  // TODO: switch to global location manager
  MapLocationDelegator *locationManager = [MapLocationDelegator sharedManager];
  [locationManager clearAllGeofences];
}

RCT_EXPORT_METHOD(pause)
{
  // TODO: switch to global location manager
  MapLocationDelegator *locationManager = [MapLocationDelegator sharedManager];
  [locationManager pause];
}

RCT_EXPORT_METHOD(resume)
{
  // TODO: switch to global location manager
  MapLocationDelegator *locationManager = [MapLocationDelegator sharedManager];
  [locationManager resume];
}

RCT_EXPORT_METHOD(simulate:(double)lat
                         atLng:(double)lng
                         withHeading:(double)heading
                         withSpeed:(double)speed)
{
  // Sometimes throws the error "Modifications to the layout engine must not be performed from
  // a background thread after it has been accessed from the main thread." Run the call on the UI
  // thread.
  // This also makes the simulated navigation run much smoother.
  dispatch_async(dispatch_get_main_queue(), ^{
    // TODO: switch to global location manager
    MapLocationDelegator *locationManager = [MapLocationDelegator sharedManager];
    [locationManager simulate:lat atLng:lng withHeading:heading withSpeed:speed];
  });
}

- (void) receiveLocationNotification:(NSNotification *) notification {
  if (!hasListeners)
    return;   // prevent warning

  if ([[notification name] isEqualToString:LocUpdateLocations]) {
    NSDictionary *userInfo = notification.userInfo;
    NSArray<CLLocation *> *locations = [userInfo objectForKey:@"locations"];
    
    /**
     "This array always contains at least one object representing the current location. If updates
     were deferred or if multiple locations arrived before they could be delivered, the array may
     contain additional entries. The objects in the array are organized in the order in which they
     occurred. Therefore, the most recent location update is at the end of the array."
     */
    CLLocation *latest = locations.lastObject;
    [self sendEventWithName:@"UpdateLocation" body:@{
      @"lat": [NSNumber numberWithDouble:latest.coordinate.latitude],
      @"lng": [NSNumber numberWithDouble:latest.coordinate.longitude],
      @"speed": [NSNumber numberWithDouble:latest.speed],
      @"heading": [NSNumber numberWithDouble:latest.course], // 0 = north, 90 = east
      @"accuracy": [NSNumber numberWithDouble:latest.horizontalAccuracy]
    }];
  }
  else if ([[notification name] isEqualToString:LocUpdateHeading]) {
    // TODO should we actually send heading events to JS? There are a tremendous number when you move the phone
    /*CLHeading *heading = [notification.userInfo objectForKey:@"heading"];

    [self sendEventWithName:@"UpdateHeading" body:@{
      @"heading": heading
    }];*/
  }
  else if ([[notification name] isEqualToString:LocEnterGeofence]) {
    NSString *fenceName = notification.userInfo[@"name"];
    [self sendEventWithName:@"GeofenceEvent" body:@{@"name": fenceName, @"didEnter": @YES}];
  }
  else if ([[notification name] isEqualToString:LocFailWithError]) {
    NSDictionary *userInfo = notification.userInfo;
    NSError *error = [userInfo objectForKey:@"error"];
    [self sendEventWithName:@"LocationError" body:@{@"msg": error.localizedDescription}];
  }
//#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 140000
  //else if ([[notification name] isEqualToString:LocDidChangeAuthorization]) {
    //NSLog (@"The location authorization has changed");
  //}
//#endif
}

@end
