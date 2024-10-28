#import <React/RCTComponent.h>

@interface MBLMapView : MGLMapView

@property (nonatomic, copy) NSArray<NSNumber*> *reactCenterCoordinate;
@property (nonatomic) UIEdgeInsets reactMapPadding;              // [top, left, bottom, right] list of inset values
@property (nonatomic, assign) double reactZoomLevel;
@property (nonatomic, copy) NSString *reactStyleURL;

@property (nonatomic, copy) RCTBubblingEventBlock onMapStyleLoaded;
@property (nonatomic, copy) RCTBubblingEventBlock onNavigationReady;
@property (nonatomic, copy) RCTBubblingEventBlock onPress;
@property (nonatomic, copy) RCTBubblingEventBlock onPan;
@property (nonatomic, copy) RCTBubblingEventBlock onMapCenterChange;
@property (nonatomic, copy) RCTBubblingEventBlock onReverseGeocodeChange;
@property (nonatomic, copy) RCTBubblingEventBlock onNavigationProgress;
@property (nonatomic, copy) RCTBubblingEventBlock onNavigationMilestone;
@property (nonatomic, copy) RCTBubblingEventBlock onVisualInstruction;
@property (nonatomic, copy) RCTBubblingEventBlock onNavigationComplete;
@property (nonatomic, copy) RCTBubblingEventBlock onUserOffRoute;

@end
