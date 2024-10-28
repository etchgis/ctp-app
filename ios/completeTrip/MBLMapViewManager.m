#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(MBLMapViewManager, RCTViewManager)

RCT_REMAP_VIEW_PROPERTY(styleURL, reactStyleURL, NSString)
//RCT_REMAP_VIEW_PROPERTY(contentInset, reactContentInset, NSArray)
RCT_REMAP_VIEW_PROPERTY(center, reactCenterCoordinate, NSArray<NSNumber*>*)
RCT_REMAP_VIEW_PROPERTY(zoom, reactZoomLevel, double)

RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPan, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMapCenterChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onReverseGeocodeChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMapStyleLoaded, RCTBubblingEventBlock)
//RCT_EXPORT_VIEW_PROPERTY(onNavigationReady, RCTBubblingEventBlock)
//RCT_EXPORT_VIEW_PROPERTY(onNavigationComplete, RCTBubblingEventBlock)
//RCT_EXPORT_VIEW_PROPERTY(onNavigationProgress, RCTBubblingEventBlock)
//RCT_EXPORT_VIEW_PROPERTY(onNavigationMilestone, RCTBubblingEventBlock)
//RCT_EXPORT_VIEW_PROPERTY(onVisualInstruction, RCTBubblingEventBlock)
//RCT_EXPORT_VIEW_PROPERTY(onUserOffRoute, RCTBubblingEventBlock)

RCT_EXTERN_METHOD(jsIsReady:(nonnull NSNumber*)node)

RCT_EXTERN_METHOD(updateUserLocation:(nonnull NSNumber*)node
                  lat:(double)lat
                  lng:(double)lng)

RCT_EXTERN_METHOD(setUserFollowMode:(nonnull NSNumber*)node
                  mode:(NSString*)mode
                  altitudeMeters:(int)altitudeMeters
                  zoom:(float)zoom
                  pitch:(int)pitch
                  durationMS:(int)durationMS)

RCT_EXTERN_METHOD(togglePreciseUserLocation:(nonnull NSNumber*)node
                  turnOn:(BOOL)turnOn)

RCT_EXTERN_METHOD(setReverseGeocodeCoordinate:(nonnull NSNumber*)node
                  x:(double)x
                  y:(double)y)

RCT_EXTERN_METHOD(fitBounds:(nonnull NSNumber*)node
                  latNorth:(double)latNorth
                  lonEast:(double)lonEast
                  latSouth:(double)latSouth
                  lonWest:(double)lonWest
                  padLeft:(int)padLeft
                  padTop:(int)padTop
                  padRight:(int)padRight
                  padBottom:(int)padBottom
                  duration:(int)duration)
                  //resolve:(RCTPromiseResolveBlock)resolve
                  //reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setContentInset:(nonnull NSNumber *)node
                  top:(int)top
                  right:(int)right
                  bottom:(int)bottom
                  left:(int)left)

RCT_EXTERN_METHOD(addSymbolLayer:(nonnull NSNumber*)node
                  idName:(NSString*)idName
                  imageObject:(NSDictionary*)imageObject
                  size:(float)size)

RCT_EXTERN_METHOD(addIconSymbolLayer:(nonnull NSNumber*)node
                  idName:(NSString*)idName
                  iconName:(NSString*)iconName
                  iconSize:(nonnull NSNumber*)iconSize
                  iconOffsetX:(NSInteger)iconOffsetX
                  iconOffsetY:(NSInteger)iconOffsetY
                  text:(BOOL)text
                  textOffsetX:(float)textOffsetX
                  textOffsetY:(float)textOffsetY
                  collision:(BOOL)collision
                  relativeToMap:(BOOL)relativeToMap)

RCT_EXTERN_METHOD(addCircleLayer:(nonnull NSNumber*)node
                  idName:(NSString*)idName
                  minZoom:(float)minZoom)

RCT_EXTERN_METHOD(addLineLayer:(nonnull NSNumber*)node
                  idName:(NSString*)idName)

RCT_EXTERN_METHOD(updateLayer:(nonnull NSNumber*)node
                  layerId:(NSString*)layerId
                  geoJson:(NSString*)geoJson)

RCT_EXTERN_METHOD(showLayer:(nonnull NSNumber*)node
                  layerId:(NSString*)layerId)

RCT_EXTERN_METHOD(hideLayer:(nonnull NSNumber*)node
                  layerId:(NSString*)layerId)

RCT_EXTERN_METHOD(setCamera:(nonnull NSNumber*)node
                  config:(nonnull NSDictionary*)config)

RCT_EXTERN_METHOD(updateStyle:(nonnull NSNumber*)node
                  styleURI:(NSString*)styleURI)
/*
RCT_EXTERN_METHOD(addRoute:(nonnull NSNumber*)node
                  jsonString:(NSString*)jsonString)

RCT_EXTERN_METHOD(startNavigation:(nonnull NSNumber*)node
                  simulateRoute:(BOOL)simulateRoute)

RCT_EXTERN_METHOD(stopNavigation:(nonnull NSNumber*)node)

RCT_EXTERN_METHOD(updateRoute:(nonnull NSNumber*)node
                  jsonString:(NSString*)jsonString)

RCT_EXTERN_METHOD(setVoiceVolume:(nonnull NSNumber*)node
                  volume:(float)volume)
*/

@end
