import Foundation

class MBLMapView : MGLMapView {

  @objc var onPress: RCTDirectEventBlock?
  @objc var onPan: RCTDirectEventBlock?
  @objc var onMapCenterChange: RCTDirectEventBlock?
  @objc var onReverseGeocodeChange: RCTDirectEventBlock?
  @objc var onMapStyleLoaded: RCTDirectEventBlock?
  // @objc var onNavigationReady: RCTDirectEventBlock?
  // @objc var onNavigationComplete: RCTDirectEventBlock?
  // @objc var onNavigationProgress: RCTDirectEventBlock?
  // @objc var onNavigationMilestone: RCTDirectEventBlock?
  // @objc var onVisualInstruction: RCTDirectEventBlock?
  // @objc var onUserOffRoute: RCTDirectEventBlock?

  override init(frame: CGRect) {
    reactZoomLevel = 0
    reactStyleURL = ""
    reactCenterCoordinate = [0, 0]
    reactMapPadding = UIEdgeInsets(top:0, left:0, bottom:0, right:0)
    super.init(frame: frame)
  }

  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  @objc var reactStyleURL : NSString {
    didSet {
      styleURL = URL(string: reactStyleURL as String)
    }
  }
  
  @objc var reactCenterCoordinate : Array<NSNumber> {
    didSet {
      updateMapCenter()
    }
  }
  
  func updateMapCenter() {
    let coordinate = CLLocationCoordinate2DMake(reactCenterCoordinate[0].doubleValue, reactCenterCoordinate[1].doubleValue)
    //[self setCenterCoordinate:coordinate animated:_animated];

    let camera = self.camera.copy() as! MGLMapCamera
    //camera.pitch = 30;
    camera.centerCoordinate = coordinate
    self.setCamera(camera, withDuration:0, animationTimingFunction:nil, edgePadding:self.reactMapPadding, completionHandler:nil)
  }

  var reactMapPadding : UIEdgeInsets
  
  @objc var reactZoomLevel : Double {
    didSet {
      self.zoomLevel = reactZoomLevel;
    }
  }

}
