#import <CoreLocation/CoreLocation.h>

#import "MapLocationDelegator.h"

// TODO Move most of this code to GlobalLocationManager.m, have this just subscribe and delegate.

/*
 Mapbox map views (MGLMapView) each use their own MGLLocationManager. From the documentation:
 
 A location manager is responsible for notifying the map view about location-related events,
 such as a change in the user’s location. This protocol is similar to the Core Location
 framework’s `CLLocationManager` class, but your implementation does not need to be based
 on `CLLocationManager`.
 
 Each MGLLocationManager has a `delegate` that is set to an object that implements
 MGLLocationManagerDelegate and receives location updates. This is normally an MGLMapView.

 If you don't provide a .locationManager for an MGLMapView, it will automatically create a new
 MGLCLLocationManager (MGLLocationManager_Private.h). This class extends MGLLocationManager and
 provides a default wrapper for a CLLocationManager. It creates the core location manager and
 sets its delegate to itself, and then passes the locations onto its own delegate. We basically
 implement this concept here, except that the messages all come from the same global
 CLLocationManager.

 Mapbox expects its own unique locationManager and will try to shut down the provided
 locationManager when it sees that `showsUserLocation` is false or when the map is dormant
 (app goes to background or rendering is paused).

 The downside of multiple location managers active in the app is that it makes it hard to track
 down which component is causing GPS to run in the background and can also result in the JavaScript
 and the map having a different opinion on where the user is located. Having a single common
 Location Manager with multiple delegates that receive updates via notification helps to reduce
 uncertainty.
 */

@interface CLHeadingSim : NSObject

- (id)initWithHeading:(double)heading accuracy:(double)accuracy;

@property (readonly) CLLocationDirection magneticHeading;
@property (readonly) CLLocationDirection trueHeading;
@property (readonly) CLLocationDirection headingAccuracy;
// @property (readonly) Date timestamp;

@end

@implementation CLHeadingSim

- (id)initWithHeading:(double)heading
             accuracy:(double)accuracy
{
  self = [super init];
  
  if (self) {
    _trueHeading = heading;
    _magneticHeading = heading;
    _headingAccuracy = accuracy;
  }
  
  return self;
}

@end

@interface MapLocationDelegator()<CLLocationManagerDelegate>

@property (nonatomic) CLLocationManager *locationManager;

@end

@implementation MapLocationDelegator

//BOOL _gotInitialLocation = NO;
int _initialPoints = 1000; // TEMP

NSString * const LocUpdateLocations = @"LocUpdateLocations";
NSString * const LocUpdateHeading = @"LocUpdateHeading";
NSString * const LocFailWithError = @"LocFailWithError";
NSString * const LocDidChangeAuthorization = @"LocDidChangeAuthorization";
NSString * const LocEnterGeofence = @"LocEnterGeofence";

static MapLocationDelegator *_sharedManager = nil;
static BOOL _startAllowed = NO;
static int _desiredAccuracy = 1;

+ (void)createGlobalLocationManager
{
  _sharedManager = [[self alloc] init];
}

+ (instancetype)sharedManager
{
  //static MapLocationDelegator *sharedManager = nil;
  //static dispatch_once_t onceToken;
  //dispatch_once(&onceToken, ^{
  //  sharedManager = [[self alloc] init];
  //});
  //return sharedManager;
  
  return _sharedManager;
}

+ (void)getPermissionAndStart
{
  _startAllowed = true;
  MapLocationDelegator *locationManager = [MapLocationDelegator sharedManager];
  [locationManager start];
}

+ (void)setAccuracy:(int)accuracy
{
  /*
  // TODO: figure out whether to use kCLLocationAccuracyBestForNavigation or
  // kCLLocationAccuracyBest and in which accuracy level. The former is more accurate but uses more power.
  MapLocationDelegator *delegator = [MapLocationDelegator sharedManager];
  CLLocationManager *locationManager = delegator.locationManager;
  if (accuracy == 1) {
    // [locationManager stopUpdatingHeading];
    locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation;
    locationManager.activityType = CLActivityTypeOtherNavigation;
    NSLog(@"switching location accuracy from %f", locationManager.distanceFilter);
    // locationManager.distanceFilter = 10;
    locationManager.distanceFilter = kCLDistanceFilterNone;
    NSLog(@"switched location accuracy to %f", locationManager.distanceFilter);
  } else {
    // TODO: distinguish between CLActivityTypeAutomotiveNavigation and
    // CLActivityTypeOtherNavigation "used to track movements for other
    // types of vehicular navigation that are not automobile related"
    // Automotive navigation may cause snapping to road and pausing if
    // there's no movement at all. Non-auto navigation can pause when
    // there's only minor movement (walking in a stopped boat or train)
    // https://stackoverflow.com/questions/32965705
    locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation;
    locationManager.activityType = CLActivityTypeOtherNavigation;
    NSLog(@"switching location accuracy from %f", locationManager.distanceFilter);
    locationManager.distanceFilter = kCLDistanceFilterNone;
    NSLog(@"switched location accuracy to %f", locationManager.distanceFilter);
    // [locationManager startUpdatingHeading];
  }
  _desiredAccuracy = accuracy;
  */
}

- (instancetype)init
{
    if (self = [super init]) {
      _locationManager = [[CLLocationManager alloc] init];
      // warning: need to reset location updates after changing this later?
      // https://stackoverflow.com/a/64300657/1137679
      _locationManager.allowsBackgroundLocationUpdates = NO;

      // "When this property is set to true, the location manager pauses
      // updates (and powers down the appropriate hardware) at times when
      // the location data is unlikely to change. For example, if the user
      // stops for food while using a navigation app, the location manager
      // might pause updates for a period of time. You can help the
      // determination of when to pause location updates by assigning a
      // value to the activityType property.
      // After a pause occurs, it is your responsibility to restart
      // location services again when you determine that they are needed.
      // Core Location calls the locationManagerDidPauseLocationUpdates(_:)
      // method of your location manager's delegate to let you know that
      // a pause has occurred. In that method, you might configure a local
      // notification whose trigger is of type UNLocationNotificationTrigger
      // and is set to notify when the user exits the current region. The
      // message for the local notification should prompt the user to launch
      // your app again so that it can resume updates."
      // This appears to only affect background usage. The reason it doesn't
      // auto-resume is because iOS doesn't know if they're still doing your
      // activity. See https://stackoverflow.com/a/17655389/1137679
      _locationManager.pausesLocationUpdatesAutomatically = YES;

      _locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation;
      _locationManager.activityType = CLActivityTypeOtherNavigation;
      _locationManager.delegate = self;

      // observe app activity
      //
      [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didEnterBackground:) name:UIApplicationDidEnterBackgroundNotification object:nil];
      [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didBecomeActive:) name:UIApplicationDidBecomeActiveNotification object:nil];
    }
    return self;
}

@synthesize delegate;

- (void)start
{
  // don't start before requested (can be called from the authorization change notice)
  if (!_startAllowed)
    return;

  BOOL wantsAlways = NO;
  BOOL wantsWhenInUse = NO;
  /* if ([[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationAlwaysUsageDescription"] &&
      [_locationManager respondsToSelector:@selector(requestAlwaysAuthorization)]) {
    wantsAlways = YES;
  } else if ([[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationWhenInUseUsageDescription"] &&
             [_locationManager respondsToSelector:@selector(requestWhenInUseAuthorization)]) {
    wantsWhenInUse = YES;
  } */ wantsWhenInUse = YES; // TEMP? Or do we request Always only at the time we need it?

  // Request location access permission
  if (wantsAlways) {
    [self.locationManager requestAlwaysAuthorization];

    // On iOS 9+ we also need to enable background updates
    //NSArray *backgroundModes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIBackgroundModes"];
    //if (backgroundModes && [backgroundModes containsObject:@"location"]) {
    //  if ([_locationManager respondsToSelector:@selector(setAllowsBackgroundLocationUpdates:)]) {
    //    [_locationManager setAllowsBackgroundLocationUpdates:YES];
    //  }
    //}
  } else if (wantsWhenInUse) {
    [self.locationManager requestWhenInUseAuthorization];
  }

  [self.locationManager startUpdatingLocation];
  //[_locationManager startMonitoringSignificantLocationChanges];
  // if (_desiredAccuracy > 1) {
  [self.locationManager startUpdatingHeading];
  // } else {
  //   _initialPoints = 45;
  // }
}

- (void)stop {
  [self.locationManager stopMonitoringSignificantLocationChanges];
  [self.locationManager stopUpdatingHeading];
  [self.locationManager stopUpdatingLocation];
}

- (void)addGeofence:(double)lat
              atLng:(double)lng
         withRadius:(double)radius
           withName:(NSString*)name
{
  // Compare against max radius?
  // CLLocationDistance maxDistance = [_locationManager maximumRegionMonitoringDistance];

  CLLocationCoordinate2D center = CLLocationCoordinate2DMake(lat, lng);
  if ([CLLocationManager isMonitoringAvailableForClass:CLCircularRegion.class]) {

      CLCircularRegion *region = [[CLCircularRegion alloc] initWithCenter:center
                                                                   radius:radius
                                                               identifier:name];
      region.notifyOnExit = false;
      region.notifyOnEntry = true;

      /** TODO:
       specify a larger region around where you want to monitor, and when the device
       wakes up in that region, start background location updates (GPS) and use
       CLCircularRegion's -containsCoordinate: to trigger when the device is within
       10m manually. This method is officially sanctioned by Apple (see WWDC 2013
       Session 307).
       https://stackoverflow.com/a/23931552/1137679
       */

      //NSLog(@"regions monitored = %lu", (unsigned long)_locationManager.monitoredRegions.count);

      [self.locationManager startMonitoringForRegion:region];
  }
}

- (void)clearAllGeofences
{
  NSSet* regions = self.locationManager.monitoredRegions;
  for(CLRegion* region in regions) {
    [self.locationManager stopMonitoringForRegion:region];
  }
}

- (void)pause
{
  [self stop];
}
- (void)resume
{
  [self start];
}
- (void)simulate:(double)lat
           atLng:(double)lng
     withHeading:(double)heading
       withSpeed:(double)speed
{
  // This uses the default values shown at https://developer.apple.com/documentation/corelocation/cllocation/1423660-init
  CLLocation *location = [[CLLocation alloc] initWithCoordinate:CLLocationCoordinate2DMake(lat, lng)
                                                       altitude:0
                                             horizontalAccuracy:0
                                               verticalAccuracy:-1
                                                         course:heading
                                                          speed:speed
                                                      timestamp:[NSDate date]];

  id objects[] = { location };
  NSArray<CLLocation*> *locations = [NSArray arrayWithObjects:objects
                                                        count:1];

  if ([self.delegate respondsToSelector:@selector(locationManager:didUpdateLocations:)]) {
    [self.delegate locationManager:self didUpdateLocations:locations];
  }
  
  NSDictionary *userInfo = [NSDictionary dictionaryWithObject:locations forKey:@"locations"];
  [[NSNotificationCenter defaultCenter] postNotificationName:
                        LocUpdateLocations object:self userInfo:userInfo];
  
  CLHeading *hdng = (CLHeading *)[[CLHeadingSim alloc] initWithHeading:heading accuracy:0];
  if ([self.delegate respondsToSelector:@selector(locationManager:didUpdateHeading:)]) {
      [self.delegate locationManager:self didUpdateHeading:hdng];
  }

  userInfo = [NSDictionary dictionaryWithObject:hdng forKey:@"heading"];
  [[NSNotificationCenter defaultCenter] postNotificationName:
                      LocUpdateHeading object:self userInfo:userInfo];
}

- (void)setHeadingOrientation:(CLDeviceOrientation)headingOrientation
{
    //self.locationManager.headingOrientation = headingOrientation;
}

- (CLDeviceOrientation)headingOrientation
{
    return self.locationManager.headingOrientation;
}

- (void)setDesiredAccuracy:(CLLocationAccuracy)desiredAccuracy {
    //self.locationManager.desiredAccuracy = desiredAccuracy;
}

- (CLLocationAccuracy)desiredAccuracy {
  return self.locationManager.desiredAccuracy;
}

/**
 Sets the minimum update distance in meters.
 @param distanceFilter The distance filter in meters.
 */
- (void)setDistanceFilter:(CLLocationDistance)distanceFilter {
  //self.locationManager.distanceFilter = distanceFilter;
}

- (CLLocationDistance)distanceFilter {
  return self.locationManager.distanceFilter;
}

- (CLAuthorizationStatus)authorizationStatus {
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 140000
    if (@available(iOS 14.0, *)) {
        return self.locationManager.authorizationStatus;
    } else {
        return kCLAuthorizationStatusNotDetermined;
    }
#else
    return [CLLocationManager authorizationStatus];
#endif
}

- (void)setActivityType:(CLActivityType)activityType {
  //self.locationManager.activityType = activityType;
}

- (CLActivityType)activityType {
  return self.locationManager.activityType;
}
/*
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 140000
- (CLAccuracyAuthorization)accuracyAuthorization {
  if (@available(iOS 14.0, *)) {
      return self.locationManager.accuracyAuthorization;
  } else {
      return CLAccuracyAuthorizationFullAccuracy;
  }
}

- (void)requestTemporaryFullAccuracyAuthorizationWithPurposeKey:(NSString *)purposeKey {
  if (@available(iOS 14.0, *)) {
    //[self.locationManager requestTemporaryFullAccuracyAuthorizationWithPurposeKey:purposeKey];
  }
}
#endif
*/
- (void)dismissHeadingCalibrationDisplay {
  //[self.locationManager dismissHeadingCalibrationDisplay];
}

- (void)requestAlwaysAuthorization {
  //[self.locationManager requestAlwaysAuthorization];
}

- (void)requestWhenInUseAuthorization {
  //[self.locationManager requestWhenInUseAuthorization];
}

- (void)startUpdatingHeading {
  //[self.locationManager startUpdatingHeading];
}

- (void)startUpdatingLocation {
  //[self.locationManager startUpdatingLocation];
}

- (void)stopUpdatingHeading {
  //[self.locationManager stopUpdatingHeading];
}

- (void)stopUpdatingLocation {
  // Don't allow the delgated service (e.g. Mapbox) to turn location off globally.
  //[self.locationManager stopUpdatingLocation];
}

- (void)dealloc
{
  [self.locationManager stopMonitoringSignificantLocationChanges];
  [self.locationManager stopUpdatingHeading];
  [self.locationManager stopUpdatingLocation];
  self.locationManager.delegate = nil;
  self.delegate = nil;
}

#pragma mark - Application lifecycle

- (void)didEnterBackground:(NSNotification *)notification
{
    [self stop];
}

- (void)didBecomeActive:(NSNotification *)notification
{
    [self start];
}

#pragma mark - CLLocationManagerDelegate

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations {
  // NSLog(@"Got location update.");

  // Hypothetically it may be the case now or in future iOS versions that the distance
  // filter for updates could prevent us from getting a first point when the app is open.
  // Don't set it until a point comes in. TODO: properly handle the case where navi is
  // running or someone is trying to change the filter before the initial point.
  //if (!_gotInitialLocation) {
  //  _gotInitialLocation = YES;
  //  manager.distanceFilter = 5;
  //}
  // if (_initialPoints > 0) {
  //   --_initialPoints;
  
  //   if (_initialPoints == 0 && _desiredAccuracy <= 1) {
  //     //[manager stopUpdatingLocation];
  //     // "Significant changes" mode is very inaccurate.
  //     //[manager startMonitoringSignificantLocationChanges];
  //     NSLog(@"switching location accuracy from %f", manager.distanceFilter);
  //     manager.distanceFilter = 10;
  //     NSLog(@"switched location accuracy to %f", manager.distanceFilter);
  //   }
  // }
  
  if ([self.delegate respondsToSelector:@selector(locationManager:didUpdateLocations:)]) {
      [self.delegate locationManager:self didUpdateLocations:locations];
  }
  
  NSDictionary *userInfo = [NSDictionary dictionaryWithObject:locations forKey:@"locations"];
  [[NSNotificationCenter defaultCenter] postNotificationName:
                        LocUpdateLocations object:self userInfo:userInfo];
}

- (void)locationManager:(CLLocationManager *)manager didUpdateHeading:(CLHeading *)newHeading {
    if ([self.delegate respondsToSelector:@selector(locationManager:didUpdateHeading:)]) {
        [self.delegate locationManager:self didUpdateHeading:newHeading];
    }
  
  NSDictionary *userInfo = [NSDictionary dictionaryWithObject:newHeading forKey:@"heading"];
  [[NSNotificationCenter defaultCenter] postNotificationName:
                        LocUpdateHeading object:self userInfo:userInfo];
}

- (BOOL)locationManagerShouldDisplayHeadingCalibration:(CLLocationManager *)manager {
    if ([self.delegate respondsToSelector:@selector(locationManagerShouldDisplayHeadingCalibration:)]) {
        return [self.delegate locationManagerShouldDisplayHeadingCalibration:self];
    }
    
    return NO;
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error {
    if ([self.delegate respondsToSelector:@selector(locationManager:didFailWithError:)]) {
        [self.delegate locationManager:self didFailWithError:error];
    }
}
// TODO once we update the Mapbox libs
/*#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 140000
- (void)locationManagerDidChangeAuthorization:(CLLocationManager *)manager {
    [self.delegate locationManagerDidChangeAuthorization:self];
}
#endif*/

-(void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status
{
    switch (status) {
        case kCLAuthorizationStatusNotDetermined:
        case kCLAuthorizationStatusRestricted:
        case kCLAuthorizationStatusDenied:
        {
            // do some error handling
        }
            break;
        default:{
            [self start];
        }
            break;
    }
}

-(void)locationManager:(CLLocationManager *)manager didEnterRegion:(CLRegion *)region {
    NSLog(@"didEnterRegion = %@", region.identifier);
    [manager stopMonitoringForRegion:region];
    NSDictionary *userInfo = [NSDictionary dictionaryWithObject:region.identifier forKey:@"name"];
    [[NSNotificationCenter defaultCenter] postNotificationName:
                        LocEnterGeofence object:self userInfo:userInfo];
}

@end
