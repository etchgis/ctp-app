import Mapbox;
//import MapboxNavigation;
//import MapboxCoreNavigation;
//import MapboxSpeech;
//import MapboxDirections;

@objc(MBLMapViewManager)
class MBLMapViewManager: RCTViewManager, MGLMapViewDelegate/*, NavigationViewControllerDelegate, NavigationServiceDelegate*/ {

  // prevents SDK from crashing and cluttering logs
  // since we don't have access to the frame right away
  static let RCT_MAPBOX_MIN_MAP_FRAME = CGRect(x: 0, y: 0, width: 64, height: 64)
  
  var _mapView: MBLMapView? // TEMP: separate out the navigation code into its own component and we won't need this reference.
  var userLocationSource: MGLShapeSource?
  //var route: Route?
  //var routeOptions: RouteOptions?
  //var navService: NavigationService?
  //var voiceController: RouteVoiceController?
  
  var mapLoaded = false
  
  override func view() -> UIView! {
    let mapView = MBLMapView(frame: MBLMapViewManager.RCT_MAPBOX_MIN_MAP_FRAME)

    mapView.locationManager = MapLocationDelegator.sharedManager() //[[MapLocationDelegator alloc] init]; // TODO TEMP
    //mapView.showsUserLocation = YES;
    //mapView.showsUserHeadingIndicator = YES;
    mapView.delegate = self

    mapView.isPitchEnabled = false
    mapView.isRotateEnabled = false
    mapView.minimumZoomLevel = 5
    mapView.decelerationRate = 0 

    // mapView.compassViewMargins = CGPoint(x:12, y:270)
    // mapView.compassView.compassVisibility = MGLOrnamentVisibility.visible
    //mapView.logoViewMargins = CGPointMake(15, 0);
    //mapView.attributionButtonMargins = CGPointMake(-10, 0);
    //mapView.attributionButtonPosition = MGLOrnamentPositionBottomLeft;

    // Add a single tap gesture recognizer. This gesture requires the built-in MGLMapView tap gestures (such as those for zoom and annotation selection) to fail.
    let singleTap = UITapGestureRecognizer(target: self, action: #selector(handleMapTap(sender:)))
    for recognizer in mapView.gestureRecognizers! where recognizer is UITapGestureRecognizer {
      singleTap.require(toFail: recognizer)
    }
    mapView.addGestureRecognizer(singleTap)
    
    for recognizer in mapView.gestureRecognizers! where recognizer is UIPanGestureRecognizer {
      recognizer.addTarget(self, action: #selector(handleMapPan(sender:)))
    }
    
    // TEMP: this is only needed for navigation events, which don't depend on map anyway.
    _mapView = mapView
    
    return mapView
  }

  override static func requiresMainQueueSetup() -> Bool {
      return true
  }

  @objc func jsIsReady(_ node: NSNumber) {
    DispatchQueue.main.async {
      let view = self.bridge.uiManager.view(forReactTag: node)
      let mapView = view as! MBLMapView
      if (self.mapLoaded) {
        mapView.onMapStyleLoaded?(nil);
      }
    }
  }

  @objc func updateUserLocation(_ node: NSNumber, lat: Double, lng: Double) {
    DispatchQueue.main.async {
      let ul = MGLPointAnnotation()
      ul.coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
      ul.title = "user-location"

      //_currentLocation = CLLocation(latitude: lat, longitude: lng)
      self.userLocationSource?.shape = ul

      //
      //        MGLShapeSource *source = (MGLShapeSource*)[reactMapView.style sourceWithIdentifier:@"id-user-location-source"];
      //        if (source != nil)
      //        {
      //            MGLPointFeature *point = [[MGLPointFeature alloc] init];
      //            point.title = @"user-location";
      //            point.coordinate = CLLocationCoordinate2DMake(lat,lng);
      //            NSData* data = [geoJson dataUsingEncoding:NSUTF8StringEncoding];
      //            MGLShape *shape = [MGLShape shapeWithData:data encoding:NSUTF8StringEncoding error:nil];
      //            [source setShape:shape];
      //        }
    }
  }

  @objc func setUserFollowMode(_ node: NSNumber,
                               mode: NSString?,
                               altitudeMeters: Int,
                               zoom: Float,
                               pitch: Int,
                               durationMS: Int) {

    DispatchQueue.main.async {
      let view = self.bridge.uiManager.view(forReactTag: node)

      let mapView = view as! MBLMapView

      if mode != nil {
        self.togglePreciseLocation(turnOn: true, mapView: mapView)
        
        let oldMode = mapView.userTrackingMode
        var newMode : MGLUserTrackingMode

        if mode == "course" {
          newMode = MGLUserTrackingMode.followWithCourse
        }
        else if mode == "heading" {
          newMode = MGLUserTrackingMode.followWithHeading
        }
        else {
          newMode = MGLUserTrackingMode.follow
        }
        
        // TODO: add a mode with the `targetCoordinate` parameter to track user AND destination
        
        // TODO: The animations below don't seem to work while in user follow mode.

        // TODO: We can't currently customize the tracking mode animation.
        // https://github.com/mapbox/mapbox-gl-native/issues/8609
        // We wait until the user location animation is done, and THEN animate the map where we want it.
        // This can possibly be done better.
        if newMode != oldMode {
          mapView.userTrackingMode = newMode

          // Have to wait for prior animation or they fight with each other (incomplete pitch)
          DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            let camera = mapView.camera
            if pitch != -1 {
              camera.pitch = CGFloat(pitch)
            }
            if altitudeMeters != 0 {
              camera.altitude = CLLocationDistance(altitudeMeters)
            }
            let durationSecs = TimeInterval(durationMS) / 1000
            mapView.setCamera(camera, withDuration: durationSecs,
                              animationTimingFunction: CAMediaTimingFunction(name: CAMediaTimingFunctionName.easeIn))
          }
        }
        else {
          let camera = mapView.camera
          if pitch != -1 {
            camera.pitch = CGFloat(pitch)
          }
          if altitudeMeters != 0 {
            camera.altitude = CLLocationDistance(altitudeMeters)
          }
          var durationSecs = TimeInterval(durationMS) / 1000
          durationSecs = 0.25 // TEMP
          // TODO: the animation doesn't work when in tracking mode, file a bug report?
          mapView.userTrackingMode = MGLUserTrackingMode.none
          mapView.setCamera(camera, withDuration: durationSecs,
                            animationTimingFunction: CAMediaTimingFunction(name: CAMediaTimingFunctionName.easeIn))
          DispatchQueue.main.asyncAfter(deadline: .now() + 0.25 + 0.01) {
            mapView.userTrackingMode = newMode // TEMP
          }
        }
      }
      else {
        self.stopFollowingUser(mapView: mapView, resetCamera: true)
      }
    }
  }

  @objc func togglePreciseUserLocation(_ node: NSNumber, turnOn: Bool) {
    DispatchQueue.main.async {
      let view = self.bridge.uiManager.view(forReactTag: node)
      let mapView = view as! MBLMapView
      self.togglePreciseLocation(turnOn: turnOn, mapView: mapView)
    }
  }

  @objc func setReverseGeocodeCoordinate(_ node: NSNumber, x: Double, y: Double) {
    DispatchQueue.main.async {
      let view = self.bridge.uiManager.view(forReactTag: node)
      let mapView = view as! MBLMapView
        
      let viewCoord = CGPoint(x:x, y:y);
      
      let geoPoint = mapView.convert(viewCoord, toCoordinateFrom:nil)
      
      let array = [geoPoint.latitude, geoPoint.longitude]
      let event: [String:Any] = [
        "type": "reversegeocodechange",
        "LatLng": array
      ]
      mapView.onReverseGeocodeChange?(event);
    }
  }

  // TODO: remove padding?
  @objc func fitBounds(_ node: NSNumber,
                       latNorth: Double,
                       lonEast: Double,
                       latSouth: Double,
                       lonWest: Double,
                       padLeft: Int,
                       padTop: Int,
                       padRight: Int,
                       padBottom: Int,
                       duration: Int) {//,
                       //resolve: RCTPromiseResolveBlock,
                       //reject: RCTPromiseRejectBlock)

    DispatchQueue.main.async {
      let view = self.bridge.uiManager.view(forReactTag: node)

      // TODO: convert to Swift and make this check for all functions!
      // if (![view isKindOfClass:[MBLMapView class]]) {
      //     RCTLogError(@"Invalid react tag, could not find MBLMapView");
      //     return;
      // }
      
      let mapView = view as! MBLMapView

      // self.stopFollowingUser(mapView: mapView, resetCamera: false)
      mapView.userTrackingMode = MGLUserTrackingMode.none

      let ne = CLLocationCoordinate2DMake(latNorth, lonEast)
      let sw = CLLocationCoordinate2DMake(latSouth, lonWest)

      let bounds = MGLCoordinateBoundsMake(sw, ne)
      //UIEdgeInsets insets = UIEdgeInsetsMake(padTop, padLeft, padBottom, padRight);

      let insets = mapView.reactMapPadding
      
      // switch to pitch 0 first
      let camera = mapView.camera
      camera.pitch = 0
      camera.heading = 0
      mapView.setCamera(camera, animated: false)
      
      /* TODO: why does `cameraThatFitsCoordinateBounds` no longer respect edgePadding?
      // switch to pitch 0 first
      //MGLMapCamera* camera = mapView.camera;
      //camera.pitch = 0
      //camera.heading = 0
      //[mapView setCamera:camera];
      let camera = mapView.cameraThatFitsCoordinateBounds(bounds, edgePadding:insets)
      var durationSecs = TimeInterval(duration)
      durationSecs /= 1000;

      mapView.fly(to: camera, withDuration: durationSecs) {
        // TODO: support the callback function (change to callback from Promise)
        // resolve(nil);
      }
      */

      // TEMP: figure out why the fly option no longer works (camera does not have edge padding)
      mapView.setVisibleCoordinateBounds(bounds, edgePadding:insets, animated: true) {
        
      }
    }
  }

  @objc func setContentInset(_ node: NSNumber, top: Int, right: Int, bottom: Int, left: Int) {
    DispatchQueue.main.async {
      let view = self.bridge.uiManager.view(forReactTag: node)

      // TODO: convert to Swift and make this check for all functions!
      // if (![view isKindOfClass:[MBLMapView class]]) {
      //     RCTLogError(@"Invalid react tag, could not find MBLMapView");
      //     return;
      // }
      
      let mapView = view as! MBLMapView

      // The content inset controls the map UI element positions and camera placement.
      // However, it might be too restrictive to rely on. It only seems to partially work
      // with `cameraThatFitsCoordinateBounds` for example (the bounds stay the same size
      // as they do without inset, and the area is just pushed up).
      //reactMapView.contentInset = UIEdgeInsetsMake(top, left, bottom, right);

      // When the map padding is applied after the MapView is created, the map's
      // `center` property may or may not haves already been applied. We need to recenter
      // on the coordinates. We can't guarantee property call order:
      // https://github.com/facebook/react-native/issues/8181
      // TODO: need a more reliable way to do this!
      //BOOL firstSet = reactMapView.reactMapPadding.bottom == 0;

      mapView.reactMapPadding = UIEdgeInsets(top: CGFloat(top), left: CGFloat(left+20), bottom: CGFloat(bottom), right: CGFloat(right+20))

      mapView.updateMapCenter()
    }
  }

  // TODO: this function is never called, should we remove it?
  @objc func addSymbolLayer(_ node: NSNumber, idName: NSString, imageObject: NSDictionary, size: Float) {
    
    DispatchQueue.main.async {
      let view = self.bridge.uiManager.view(forReactTag: node)

      let mapView = view as! MBLMapView

      let sourceId = "id-" + (idName as String) + "-source"
      let layerId = idName as String

      // make sure it doesn't already exist
      if mapView.style?.source(withIdentifier: sourceId) != nil {
        return;
      }

      let source = MGLShapeSource(identifier: sourceId, shape: nil, options: nil)
      mapView.style?.addSource(source)
      
      let layer = MGLCircleStyleLayer(identifier: layerId, source: source)
      layer.circleColor = NSExpression(forConstantValue: UIColor(red: 66/255.0, green: 100/255.0, blue: 251/255.0, alpha: 1))
      layer.circleRadius = NSExpression(forConstantValue: 8)
      
      mapView.style?.addLayer(layer)
    }
  }

  @objc func addIconSymbolLayer(_ node: NSNumber,
                                idName: NSString,
                                iconName: NSString,
                                iconSize: NSNumber,
                                iconOffsetX: NSInteger,
                                iconOffsetY: NSInteger,
                                text: Bool,
                                textOffsetX: Float,
                                textOffsetY: Float,
                                collision: Bool,
                                relativeToMap: Bool) {
    DispatchQueue.main.async {
      let view = self.bridge.uiManager.view(forReactTag: node)

      let mapView = view as! MBLMapView

      let sourceId = "id-" + (idName as String) + "-source"
      //let layerId = "id-" + (idName as String) + "-layer"
      let layerId = idName as String

      // make sure it doesn't already exist
      if mapView.style?.source(withIdentifier: sourceId) != nil {
        return;
      }

      let source = MGLShapeSource(identifier: sourceId, shape: nil, options: nil)
      mapView.style?.addSource(source)
      
      let layer = MGLSymbolStyleLayer(identifier: layerId, source: source)
      layer.iconImageName = NSExpression(forConstantValue: iconName)
      layer.iconScale = NSExpression(forConstantValue: iconSize)
      layer.iconRotation = NSExpression(forKeyPath: "angle")
      layer.iconOffset = NSExpression(forConstantValue: CGVector(dx: iconOffsetX, dy: iconOffsetY))
      
      if relativeToMap {
        layer.iconRotationAlignment = NSExpression(forConstantValue: "map")
      }
      
      if text {
        let offset = CGVector(dx: CGFloat(textOffsetX), dy: CGFloat(textOffsetY))
        let offsetVal = NSValue(cgVector: offset)
        layer.text = NSExpression(forKeyPath: "text")
        layer.textTranslation = NSExpression(forConstantValue: offsetVal)
        layer.textHaloColor = NSExpression(forConstantValue: UIColor(red: 1, green: 1, blue: 1, alpha: 1))
        layer.textHaloWidth = NSExpression(forConstantValue: 3)
      }
      if collision {
        layer.iconAllowsOverlap = NSExpression(forConstantValue: true)
        layer.iconIgnoresPlacement = NSExpression(forConstantValue: true)
      }
      
      mapView.style?.addLayer(layer)
    }
  }
  
  // TODO: For layers with custom images, we need a function to remove symbol layers
  // so we can remove the images from the map style. See https://github.com/nitaliano/react-native-mapbox-gl/blob/master/ios/RCTMGL/RCTMGLShapeSource.m

  @objc func addCircleLayer(_ node: NSNumber,
                            idName: NSString,
                            minZoom: Float) {

    DispatchQueue.main.async {
      let view = self.bridge.uiManager.view(forReactTag: node)

      let mapView = view as! MBLMapView

      let sourceId = "id-" + (idName as String) + "-source"
      let layerId = idName as String

      // make sure it doesn't already exist
      if mapView.style?.source(withIdentifier: sourceId) != nil {
        return;
      }

      let source = MGLShapeSource(identifier: sourceId, shape: nil, options: nil)
      mapView.style?.addSource(source)
      
      let layer = MGLCircleStyleLayer(identifier: layerId, source: source)
      layer.circleColor = NSExpression(forKeyPath: "circleColor")
      layer.circleRadius = NSExpression(forKeyPath: "circleRadius")
      layer.circleStrokeColor = NSExpression(forKeyPath: "circleStrokeColor")
      layer.circleStrokeWidth = NSExpression(forKeyPath: "circleStrokeWidth")
      if minZoom != 0 {
        layer.minimumZoomLevel = minZoom
      }
      
      mapView.style?.addLayer(layer)
    }
  }

  @objc func addLineLayer(_ node: NSNumber,
                          idName: NSString) {

    DispatchQueue.main.async {
      let view = self.bridge.uiManager.view(forReactTag: node)

      let mapView = view as! MBLMapView

      let sourceId = "id-" + (idName as String) + "-source"
      let layerId = idName as String

      // make sure it doesn't already exist
      if mapView.style?.source(withIdentifier: sourceId) != nil {
        return;
      }

      let source = MGLShapeSource(identifier: sourceId, shape: nil, options: nil)
      mapView.style?.addSource(source)
      
      let layer = MGLLineStyleLayer(identifier: layerId, source: source)
      layer.lineJoin = NSExpression(forKeyPath: "lineJoin")
      layer.lineColor = NSExpression(forKeyPath: "lineColor")
      layer.lineWidth = NSExpression(forKeyPath: "lineWidth")
      // layer.linePattern = nil;
      // layer.lineDashPattern = [NSExpression expressionForKeyPath:@"lineDasharray"];  //Data expressions not supported for dash pattern :(
      // try upgrading in future
      
      mapView.style?.addLayer(layer)
    }
  }

  @objc func updateLayer(_ node: NSNumber,
                    layerId: NSString,
                    geoJson: NSString) {

    DispatchQueue.main.async {
      let view = self.bridge.uiManager.view(forReactTag: node)

      let mapView = view as! MBLMapView

      let fullId = "id-" + (layerId as String) + "-source"
      if let source = mapView.style?.source(withIdentifier: fullId) {
        do {
          let shapeSource = source as! MGLShapeSource
          let data = geoJson.data(using: String.Encoding.utf8.rawValue)!
          let shape = try MGLShape(data: data, encoding: String.Encoding.utf8.rawValue)
          shapeSource.shape = shape
        } catch {
          // development error
        }
      }
    }
  }

  @objc func showLayer(_ node: NSNumber,
                        layerId: NSString) {

    DispatchQueue.main.async {
      let view = self.bridge.uiManager.view(forReactTag: node)

      let mapView = view as! MBLMapView

      let showLayerId = layerId as String
      let layer = mapView.style?.layer(withIdentifier: showLayerId)
      if layer != nil {
        layer?.isVisible = true
      }
    }
  }

  @objc func hideLayer(_ node: NSNumber,
                       layerId: NSString) {

    DispatchQueue.main.async {
      let view = self.bridge.uiManager.view(forReactTag: node)

      let mapView = view as! MBLMapView

      let hideLayerId = layerId as String
      let layer = mapView.style?.layer(withIdentifier: hideLayerId)
      if layer != nil {
        layer?.isVisible = false
      }
    }
  }

  @objc func setCamera(_ mpde: NSNumber,
                       config: NSDictionary) {
    print("GOT setCamera MESSAGE!")
  }

  @objc func updateStyle(_ node: NSNumber,
                         styleURI: NSString) {

    DispatchQueue.main.async {
      let view = self.bridge.uiManager.view(forReactTag: node)

      let mapView = view as! MBLMapView

      mapView.styleURL = URL(string: styleURI as String)
    }
  }
  /*
  func setRoute(jsonString: NSString) {
    let jsonData = jsonString.data(using: String.Encoding.utf8.rawValue)!

    do {
      // make sure this JSON is in the format we expect
      if let routeJson = try JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any] {
        let routeOptionsJson = routeJson["routeOptions"] as! [String: Any]
        let coordinates = routeOptionsJson["coordinates"] as! Array<Any>
        
        // TODO: eliminate waypoints?
        var waypoints = [Waypoint]()
        for coords in coordinates {
          let coordsList = coords as! Array<Any>
          let lat = CLLocationDegrees(coordsList[1] as! Double)
          let lng = CLLocationDegrees(coordsList[0] as! Double)
          let coordObj = CLLocationCoordinate2D(latitude: lat, longitude: lng)
          let waypoint = Waypoint(coordinate: coordObj)
          waypoints.append(waypoint)
        }
        
        self.routeOptions = NavigationRouteOptions(waypoints: waypoints, profileIdentifier: DirectionsProfileIdentifier.automobile)
        
        let decoder = JSONDecoder()
        decoder.userInfo[CodingUserInfoKey.options] = self.routeOptions
        self.route = try decoder.decode(Route.self, from: jsonData)
      }
    } catch let error as NSError {
      print("Failed to load route JSON: \(error.localizedDescription)")
    }
  }

  @objc func addRoute(_ node: NSNumber,
                      jsonString: NSString) {
    DispatchQueue.main.async {
      let view = self.bridge.uiManager.view(forReactTag: node)

      let mapView = view as! MBLMapView
      self.setRoute(jsonString: jsonString)
      mapView.onNavigationReady?(nil);
    }
  }
  
  @objc func updateRoute(_ node: NSNumber,
                         jsonString: NSString) {

    DispatchQueue.main.async {
      //let view = self.bridge.uiManager.view(forReactTag: node)

      //let mapView = view as! MBLMapView
      
      self.setRoute(jsonString: jsonString)
      if self.navService != nil {
        let router = self.navService!.router as! RouteController
        router.indexedRoute = (self.route!, 0)
      }
    }
  }

  @objc func startNavigation(_ node: NSNumber,
                    simulateRoute: Bool) {

    DispatchQueue.main.async {
      //let view = self.bridge.uiManager.view(forReactTag: node)

      //let mapView = view as! MBLMapView
    
      // TODO: try to get around having a directions object. If we set this to nil, it will create a shared directions
      // object, which will fail if there's no access token in the info.plist (see MBDirections.swift).
      let accessToken = MGLAccountManager.accessToken;
      let directions = Directions(credentials: DirectionsCredentials(accessToken: accessToken));
    
      //MapLocationDelegator *locationManager = [MapLocationDelegator sharedManager];
      //NaviLocationDelegator *naviLocationManager = [NaviLocationDelegator init];

      let simulating = simulateRoute ? SimulationMode.always : SimulationMode.never;
      self.navService = MapboxNavigationService(route: self.route!, routeIndex: 0, routeOptions:self.routeOptions!, directions: directions, locationSource: nil, eventsManagerType: nil, simulating: simulating, routerType: nil)
    
      if (simulateRoute) {
        self.navService!.simulationSpeedMultiplier = 1
      }
    
      /*
      if (showUI) {
        MBNavigationOptions *navOptions = [[MBNavigationOptions alloc] init];
        navOptions.navigationService = navService;
        MBNavigationViewController *viewController = [[MBNavigationViewController alloc] initWithRoute:route options:navOptions];
        viewController.delegate = self;
        
        UIViewController *rootViewController = [UIApplication sharedApplication].keyWindow.rootViewController;
        [rootViewController presentViewController:viewController animated:YES completion:nil];
      } else { */
      //[self startViewlessNavigation:simulateRoute];
      self.navService!.delegate = self;
      
      // Offline text to speech, lesser quality than the Mapbox version.
      //voiceController = [[MBRouteVoiceController alloc] initWithNavigationService:navService];
      
      // `MultiplexedSpeechSynthesizer` will provide "a backup" functionality to cover cases that aren't handled
      let mapboxSynth = MapboxSpeechSynthesizer(accessToken: accessToken)
      let systemSynth = SystemSpeechSynthesizer()
      let speechSynthesizer = MultiplexedSpeechSynthesizer([mapboxSynth, systemSynth] as? [SpeechSynthesizing])
      self.voiceController = RouteVoiceController(navigationService: self.navService!, speechSynthesizer: speechSynthesizer)

      NavigationSettings.shared.voiceVolume = 1.8
      
      //CLLocationDistance distFilter = kCLDistanceFilterNone;
      //[locationManager setDistanceFilter:distFilter];
      self.navService!.start()
      
      // This is buggy on android at least
      //if (legStartIndex != 0) {
      //    [navService.router updateLegIndexWithIndex:legStartIndex];
      //}
    }
  }

  @objc func stopNavigation(_ node: NSNumber) {
    DispatchQueue.main.async {
      if (self.navService != nil) {
        self.navService!.stop()
        self.navService = nil
        
        // TODO: use global location manager
        //[[MapLocationDelegator sharedManager] setDistanceFilter:5];
        //[[MapLocationDelegator sharedManager] clearAllGeofences];
        
        // TEMP: do this at javascript side
        self.setUserFollowMode(node, mode: nil, altitudeMeters: 0, zoom: 0, pitch: 0, durationMS: 0)
      }
    }
  }*/

  /*@objc func setVoiceVolume(_ node: NSNumber,
                            volume: Float) {
    if volume == 0 {
      NavigationSettings.shared.voiceMuted = true
    }
    else {
      NavigationSettings.shared.voiceMuted = false
      NavigationSettings.shared.voiceVolume = volume
    }
  }*/
  
  func togglePreciseLocation(turnOn: Bool, mapView: MBLMapView) {
    let hasChanged = turnOn != mapView.showsUserLocation
    if hasChanged {
      // toggle the normal location indicator on or off.
      let layer = mapView.style?.layer(withIdentifier: "id-user-location-layer")
      layer?.isVisible = !turnOn
      
      if (turnOn) {
        // Enable the always-on heading indicator for the user location annotation.
        mapView.showsUserLocation = true
        mapView.showsUserHeadingIndicator = true
      } else {
        mapView.showsUserHeadingIndicator = false
        mapView.showsUserLocation = false
      }
    }
  }

  // TODO: implement this for Android and call in the same places
  func stopFollowingUser(mapView: MBLMapView, resetCamera: Bool) {
    if mapView.userTrackingMode != MGLUserTrackingMode.none {
      mapView.userTrackingMode = MGLUserTrackingMode.none
      self.togglePreciseLocation(turnOn: false, mapView: mapView)
    }
    if resetCamera {
      let camera = mapView.camera
      if camera.pitch != 0 || camera.heading != 0 {
        camera.pitch = 0
        camera.heading = 0
        mapView.setCamera(camera, animated: true)
      }
    }
  }

/*
  func manueverDirToInt(d: ManeuverDirection?) -> Int {
    switch (d) {
      case .sharpRight:
          return 1
      case .right:
          return 2
      case .slightRight:
          return 3
      case .straightAhead:
          return 4
      case .slightLeft:
          return 5
      case .left:
          return 6
      case .sharpLeft:
          return 7
      case .uTurn:
          return 8
      default:
          return 0
    }
  }
  
  func manueverToInt(m: ManeuverType?) -> Int {
    switch (m) {
      case .depart:
        return 1
      case .turn:
        return 2
      case .continue:
        return 3
      case .passNameChange:
        return 4
      case .merge:
        return 5
      case .takeOnRamp:
        return 6
      case .takeOffRamp:
        return 7
      case .reachFork:
        return 8
      case .reachEnd:
        return 9
      case .useLane:
        return 10
      case .takeRoundabout:
        return 11
      case .takeRotary:
        return 12
      case .turnAtRoundabout:
        return 13
      case .heedWarning:
        return 14
      case .arrive:
        return 15
      default:
        return 0
    }
  }
  
  func manueverJson(instruction: VisualInstruction?) -> [String:Any] {
    // See https://docs.mapbox.com/ios/api/directions/0.29.0/Enums/ManeuverType.html
    // and https://docs.mapbox.com/ios/api/directions/0.29.0/Enums/ManeuverDirection.html
    let json : [String:Any] = [
      "text": instruction?.text as Any,
      "maneuverType": self.manueverToInt(m: instruction?.maneuverType),
      "maneuverDirection": self.manueverDirToInt(d: instruction?.maneuverDirection)
    ]
    return json
  }*/

  // MARK: MGLMapViewDelegate
  
  func mapView(_ mapView: MGLMapView, didFinishLoading style: MGLStyle) {
    // New sources and layers are added to the view's style. You must wait for this
    // function to make sure the style has finished loading before modifying it.
    let reactMapView = mapView as! MBLMapView

    // make sure it doesn't already exist
    if reactMapView.style?.source(withIdentifier: "id-user-location-source") != nil {
      return;
    }
    userLocationSource = MGLShapeSource(identifier: "id-user-location-source", shape: nil, options: nil)
    reactMapView.style?.addSource(userLocationSource!)
    
    let layer = MGLCircleStyleLayer(identifier: "id-user-location-layer", source: userLocationSource!)
    layer.circleColor = NSExpression(forConstantValue: UIColor(red: 66/255.0, green: 100/255.0, blue: 251/255.0, alpha: 1))
    layer.circleRadius = NSExpression(forConstantValue: 7)
    layer.circleStrokeColor = NSExpression(forConstantValue: UIColor(red: 255/255.0, green: 255/255.0, blue: 255/255.0, alpha: 1))
    layer.circleStrokeWidth = NSExpression(forConstantValue: 4)
    reactMapView.style?.addLayer(layer)

    mapLoaded = true
    reactMapView.onMapStyleLoaded?(nil);
  }
  
  func mapView(_ mapView: MGLMapView, regionDidChangeAnimated animated: Bool) {
    let reactMapView = mapView as! MBLMapView
    let event: [String:Any] = [
      "type": "mapcenterchange",
      "LatLng": [mapView.centerCoordinate.latitude, mapView.centerCoordinate.longitude]
    ]
    reactMapView.onMapCenterChange?(event)
  }
  
  func mapViewUserLocationAnchorPoint(_ mapView: MGLMapView) -> CGPoint {
    if (mapView.camera.pitch > 40 && mapView.userTrackingMode == MGLUserTrackingMode.followWithCourse) {
      return CGPoint(x: mapView.bounds.width / 2, y: mapView.bounds.height * 2 / 3)
    }
    return CGPoint(x: mapView.bounds.width / 2, y: mapView.bounds.height / 2)
  }
  
  /*
  // Uncomment this debug function to see what GPS messages (real or simulated)
  // are actually passing through the map.
  func mapView(_ mapView: MGLMapView, didUpdate userLocation: MGLUserLocation?) {
    let heading = userLocation?.heading?.trueHeading
    if heading != nil {
      NSLog("got heading %f", heading!)
    }
  }
  */

  /*
  // MARK: MBNavigationServiceDelegate

  func navigationService(_ service: NavigationService, shouldRerouteFrom location: CLLocation) -> Bool {

    let array = [location.coordinate.latitude, location.coordinate.longitude]
    
    let event = [
      "location": array
    ]
    
    _mapView!.onUserOffRoute?(event)
    
    return false
  }
  
  func navigationService(_ service: NavigationService, didPassVisualInstructionPoint instruction: VisualInstructionBanner, routeProgress: RouteProgress) {

    let routeLegProgress = routeProgress.currentLegProgress

    _mapView!.onVisualInstruction?([
      "legIndex": routeProgress.legIndex,
      "stepIndex": routeLegProgress.stepIndex,
      //"distAlongStep": instruction.distanceAlongStep,
      "primary": self.manueverJson(instruction: instruction.primaryInstruction),
      "secondary": self.manueverJson(instruction: instruction.secondaryInstruction),
      "tertiary": self.manueverJson(instruction: instruction.tertiaryInstruction)
    ])
  }

  func navigationService(_ service: NavigationService, didArriveAt waypoint: Waypoint) -> Bool {

    let routeProgress = service.routeProgress
    let routeLegProgress = routeProgress.currentLegProgress
    
    let array = [routeProgress.legIndex, routeLegProgress.stepIndex]
    let event = ["milestone": array]

    // TODO: make a separate component class for navigation instead of using the global mapview object
    _mapView!.onNavigationMilestone?(event);
    
    // allow transition
    return true
  }

  func navigationService(_ service: NavigationService, didUpdate progress: RouteProgress, with location: CLLocation, rawLocation: CLLocation) {

    let routeLegProgress = progress.currentLegProgress
    let routeStepProgress = routeLegProgress.currentStepProgress
    
    let current_step_progress: [String:Any] = [
      "distanceRemaining": routeStepProgress.distanceRemaining,
      "distanceTraveled": routeStepProgress.distanceTraveled,
      "durationRemaining": routeStepProgress.durationRemaining,
      "fractionTraveled": routeStepProgress.fractionTraveled,
      // "intersectionIndex": routeStepProgress.intersectionIndex,
      // "userDistanceToManeuverLocation": routeStepProgress.userDistanceToManeuverLocation
    ]
    
    let upcoming_step: [String:Any] = [
      // @"description": routeLegProgress.upcomingStep.description ?: [NSNull null],
      "distance": routeLegProgress.upcomingStep?.distance as Any,
      "duration": routeLegProgress.upcomingStep?.expectedTravelTime as Any,
      "instructions": routeLegProgress.upcomingStep?.instructions as Any,
      "maneuverDirection": self.manueverDirToInt(d: routeLegProgress.upcomingStep?.maneuverDirection),
      "maneuverType": self.manueverToInt(m: routeLegProgress.upcomingStep?.maneuverType),
      //"transportType": routeLegProgress.upcomingStep?.transportType
    ]
    
    let current_step: [String:Any] = [
      // @"description": routeLegProgress.currentStep.description ?: [NSNull null],
      "distance": routeLegProgress.currentStep.distance,
      "duration": routeLegProgress.currentStep.expectedTravelTime,
      "instructions": routeLegProgress.currentStep.instructions,
      "maneuverDirection": manueverDirToInt(d: routeLegProgress.currentStep.maneuverDirection),
      "maneuverType": manueverToInt(m: routeLegProgress.currentStep.maneuverType),
      //"transportType": routeLegProgress.currentStep.transportType,
      "currentStepProgress": current_step_progress,
      "upcomingStep": upcoming_step
    ]
    
    let current_leg_progress: [String:Any] = [
      "distanceRemaining": routeLegProgress.distanceRemaining,
      "distanceTraveled": routeLegProgress.distanceTraveled,
      "durationRemaining": routeLegProgress.durationRemaining,
      "fractionTraveled": routeLegProgress.fractionTraveled,
      "stepIndex": routeLegProgress.stepIndex,
      // "userHasArrivedAtWaypoint": routeLegProgress.userHasArrivedAtWaypoint
    ]
    /*
    let upcoming_leg: [String:Any] = [
      // @"description": routeProgress.upcomingLeg.description ?: [NSNull null],
      "distance": progress.upcomingLeg.distance,
      "duration": progress.upcomingLeg.expectedTravelTime,
      "name": progress.upcomingLeg.name,
      "profileIdentifier": progress.upcomingLeg.profileIdentifier
    ]*/
    
    let current_leg: [String:Any] = [
      // @"description": routeProgress.currentLeg.description ?: [NSNull null],
      "distance": progress.currentLeg.distance,
      "duration": progress.currentLeg.expectedTravelTime,
      "name": progress.currentLeg.name,
      //"profileIdentifier": progress.currentLeg.profileIdentifier,
      "currentLegProgress": current_leg_progress,
      //"upcomingLeg":upcoming_leg,
      "currentStep": current_step
    ]
    
    let route_progress: [String:Any] = [
      "distanceRemaining": progress.distanceRemaining,
      "distanceTraveled": progress.distanceTraveled,
      "durationRemaining": progress.durationRemaining,
      "fractionTraveled": progress.fractionTraveled,
      "legIndex": progress.legIndex,
      "currentLeg": current_leg
    ]
    
    let array: Any = [location.coordinate.latitude, location.coordinate.longitude, rawLocation.course, route_progress]
    
    let event = [
      "progress": array
    ]
    
    // TODO: make a separate component class for navigation instead of using the global mapview object
    _mapView!.onNavigationProgress?(event)
    
    //if progress.currentLeg == nil {
    //  _mapView!.onNavigationComplete?(nil);
    //}
  }*/
  
  // MARK - UIGestureRecognizers
  
  @objc @IBAction func handleMapTap(sender: UITapGestureRecognizer) {
    let mapView = sender.view as! MBLMapView
    let spot = sender.location(in: mapView)
     
    let area = CGFloat(44.0)
    let top = spot.y - (area / 2.0)
    let left = spot.x - (area / 2.0)
    let hitboxRect = CGRect(x: left, y: top, width: area, height: area)
    
    // TODO: add rentals to the Set.
    // past value: ["cota-stops", "cota-pantry-dots", "schools-food-dots"]
    let features = mapView.visibleFeatures(in: hitboxRect, styleLayerIdentifiers: Set(["cota-stops"]))

    let tapCoordinate: CLLocationCoordinate2D = mapView.convert(spot, toCoordinateFrom: nil)
    var payload : [String:Any] = ["point":[tapCoordinate.longitude, tapCoordinate.latitude]]

    if let feature = features.first/*, let state = feature.attribute(forKey: "name") as? String*/ {
      //let hits: [String:Any] = [
      //  "features": feature
      //]
      let geoJSON = feature.geoJSONDictionary()
      payload["feature"] = geoJSON
      // mapView.onPress?(["payload": geoJSON])
    }
    mapView.onPress?(["payload": payload])
  }
  
  @objc @IBAction func handleMapPan(sender: UIPanGestureRecognizer) {
    let mapView = sender.view as! MBLMapView
    var payload:[String:Any] = ["state": "unknown"]
    payload["state"] = "unknown"
    if sender.state == .began {
      payload["state"] = "start"
    }
    if sender.state == .changed {
      payload["state"] = "change"
    }
    if sender.state == .ended {
      payload["state"] = "end"
    }
    mapView.onPan?(["payload": payload]);
  }
}
