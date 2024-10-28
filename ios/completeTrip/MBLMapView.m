@import Mapbox;
#import "MBLMapView.h"

@implementation MBLMapView

- (void)setReactStyleURL:(NSString *)reactStyleURL
{
    _reactStyleURL = reactStyleURL;
    self.styleURL = [NSURL URLWithString:reactStyleURL];
}

- (void)setReactCenterCoordinate:(NSArray<NSNumber*>*)reactCenterCoordinate
{
    _reactCenterCoordinate = reactCenterCoordinate;

    CLLocationCoordinate2D coordinate = CLLocationCoordinate2DMake([reactCenterCoordinate[0] doubleValue], [reactCenterCoordinate[1] doubleValue]);
    //[self setCenterCoordinate:coordinate animated:_animated];

    MGLMapCamera *camera = [self.camera copy];
    //camera.pitch = 30;
    camera.centerCoordinate = coordinate;
    [self setCamera:camera withDuration:0 animationTimingFunction:nil edgePadding:_reactMapPadding completionHandler:nil];
}

- (void)setReactMapPadding:(UIEdgeInsets)reactMapPadding
{
    _reactMapPadding = reactMapPadding;
}

- (void)setReactZoomLevel:(double)reactZoomLevel
{
    _reactZoomLevel = reactZoomLevel;
    self.zoomLevel = _reactZoomLevel;
}

#pragma mark - methods

/*
- (void)_updateCameraIfNeeded:(BOOL)shouldUpdateCenterCoord
{
    if (shouldUpdateCenterCoord) {
        if (_reactCenterCoordinate != nil) {
            CLLocationCoordinate2D coordinate = CLLocationCoordinate2DMake([_reactCenterCoordinate[0] doubleValue], [_reactCenterCoordinate[1] doubleValue]);
            //[self setCenterCoordinate:coordinate animated:_animated];

            MGLMapCamera *camera = [self.camera copy];
            //camera.pitch = 30;
            camera.centerCoordinate = coordinate;
            [self setCamera:camera withDuration:0 animationTimingFunction:nil edgePadding:_reactMapPadding completionHandler:nil];
        } else {
            //MGLCoordinateBounds bounds = [RCTMGLUtils fromFeatureCollection:_reactVisibleCoordinateBounds];
            //[self setVisibleCoordinateBounds:bounds animated:_animated];
        }
    } else {
        MGLMapCamera *camera = [self.camera copy];
        camera.pitch = _pitch;
        camera.heading = _heading;
        [self setCamera:camera animated:_animated];
    }
}
*/

@end

