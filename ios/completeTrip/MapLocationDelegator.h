@import Mapbox;

@interface MapLocationDelegator : NSObject<MGLLocationManager>

// TODO all of this needs to be in the global location manager
+ (void)createGlobalLocationManager;
+ (instancetype)sharedManager;
+ (void)getPermissionAndStart;
+ (void)setAccuracy:(int)accuracy;

- (void)addGeofence:(double)lat
              atLng:(double)lng
         withRadius:(double)radius
           withName:(NSString*)name;
- (void)clearAllGeofences;

- (void)pause;
- (void)resume;
- (void)simulate:(double)lat
           atLng:(double)lng
     withHeading:(double)heading
       withSpeed:(double)speed;

@end
