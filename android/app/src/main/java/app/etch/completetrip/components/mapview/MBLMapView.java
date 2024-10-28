package app.etch.completetrip.components.mapview;

import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import android.graphics.Bitmap;
import android.graphics.PointF;
import android.graphics.RectF;
import android.graphics.Color;
import android.location.Location;
import android.os.Handler;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.View;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import com.mapbox.android.gestures.MoveGestureDetector;
import com.mapbox.mapboxsdk.camera.CameraPosition;
import com.mapbox.mapboxsdk.camera.CameraUpdate;
import com.mapbox.mapboxsdk.camera.CameraUpdateFactory;
import com.mapbox.mapboxsdk.geometry.LatLng;
import com.mapbox.mapboxsdk.geometry.LatLngBounds;
import com.mapbox.mapboxsdk.location.LocationComponentActivationOptions;
import com.mapbox.mapboxsdk.location.LocationComponentOptions;
import com.mapbox.mapboxsdk.maps.MapView;
import com.mapbox.mapboxsdk.maps.MapboxMap;
import com.mapbox.mapboxsdk.maps.MapboxMapOptions;
import com.mapbox.mapboxsdk.maps.OnMapReadyCallback;
import com.mapbox.mapboxsdk.maps.UiSettings;
import com.mapbox.mapboxsdk.maps.Style;
import com.mapbox.geojson.Feature;
import com.mapbox.geojson.Point;
import com.mapbox.geojson.FeatureCollection;
import com.mapbox.mapboxsdk.style.layers.Layer;
import com.mapbox.mapboxsdk.style.layers.SymbolLayer;
import com.mapbox.mapboxsdk.style.layers.LineLayer;
import com.mapbox.mapboxsdk.style.sources.GeoJsonSource;
import com.mapbox.mapboxsdk.style.sources.Source;
import com.mapbox.mapboxsdk.style.layers.CircleLayer;
import com.mapbox.mapboxsdk.style.layers.Property;
import com.mapbox.mapboxsdk.style.layers.PropertyFactory;

/*
import com.mapbox.services.android.navigation.ui.v5.NavigationLauncherOptions;
import com.mapbox.services.android.navigation.ui.v5.route.NavigationMapRoute;
import com.mapbox.services.android.navigation.v5.navigation.MapboxNavigation;
import com.mapbox.services.android.navigation.v5.navigation.MapboxNavigationOptions;
import com.mapbox.api.directions.v5.models.DirectionsRoute;
import com.mapbox.api.directions.v5.models.RouteLeg;
import com.mapbox.services.android.navigation.ui.v5.NavigationLauncher;
*/

/*
import com.mapbox.android.core.location.LocationEngine;
import com.mapbox.android.core.location.LocationEngineProvider;
*/

import com.mapbox.mapboxsdk.location.LocationComponent;
import com.mapbox.mapboxsdk.location.modes.CameraMode;
import com.mapbox.mapboxsdk.location.modes.RenderMode;

/*
import com.mapbox.services.android.navigation.v5.location.replay.ReplayRouteLocationEngine;
import com.mapbox.services.android.navigation.v5.offroute.OffRouteListener;
import com.mapbox.services.android.navigation.v5.routeprogress.ProgressChangeListener;
import com.mapbox.services.android.navigation.v5.routeprogress.RouteProgress;
import com.mapbox.services.android.navigation.v5.routeprogress.RouteLegProgress;
import com.mapbox.services.android.navigation.v5.routeprogress.RouteStepProgress;
import com.mapbox.services.android.navigation.v5.routeprogress.RouteProgressState;
import com.mapbox.services.android.navigation.v5.milestone.RouteMilestone;
import com.mapbox.services.android.navigation.v5.milestone.MilestoneEventListener;
import com.mapbox.services.android.navigation.v5.milestone.Milestone;
import com.mapbox.services.android.navigation.v5.milestone.VoiceInstructionMilestone;
import com.mapbox.services.android.navigation.v5.navigation.NavigationEventListener;
import com.mapbox.services.android.navigation.ui.v5.voice.NavigationSpeechPlayer;
import com.mapbox.services.android.navigation.ui.v5.voice.SpeechAnnouncement;
import com.mapbox.services.android.navigation.ui.v5.voice.SpeechPlayerProvider;
import com.mapbox.services.android.navigation.ui.v5.voice.VoiceInstructionLoader;
import com.mapbox.services.android.navigation.v5.milestone.Trigger;
import com.mapbox.services.android.navigation.v5.milestone.TriggerProperty;
*/

import static com.mapbox.mapboxsdk.style.expressions.Expression.eq;
import static com.mapbox.mapboxsdk.style.expressions.Expression.literal;
import static com.mapbox.mapboxsdk.style.expressions.Expression.get;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import okhttp3.Cache;

import app.etch.completetrip.utils.DownloadImageTask;
import app.etch.completetrip.GlobalLocationManager;
import app.etch.completetrip.LocationListener;

@SuppressWarnings({ "MissingPermission" })
public class MBLMapView extends MapView implements OnMapReadyCallback, MapboxMap.OnMapClickListener,
    MapboxMap.OnCameraMoveListener, MapboxMap.OnCameraIdleListener, LocationListener,
        MapboxMap.OnMoveListener
    /*, ProgressChangeListener, NavigationEventListener,
    MilestoneEventListener, OffRouteListener*/ {

  private MapboxMap mMap;
  private Style mStyle;
  private MBLMapViewManager mManager;
  private LatLng mCenter;
  private double mBearing;
  private double mTilt;
  private double mZoom;
  private Handler mHandler;
  private Context mContext;
  private LifecycleEventListener mLifeCycleListener;
  private boolean mPaused;
  private boolean mDestroyed;
  private int[] mInsets = new int[4]; // map padding with order (top, right, bottom, left)
/*
  private DirectionsRoute currentRoute;
  //private RouteProgressState currentRouteProgressState;
  private static final String TAG = "DirectionsActivity";
  private NavigationMapRoute mNavigationMapRoute;
  private NavigationSpeechPlayer speechPlayer;
*/
  private GeoJsonSource mUserLocationGeoJson;
  private Point mUserLocation;
  private CircleLayer mUserLocationLyr;
  private LatLng mReverseGeocodeCoordinate;
/*
  private List<Point> routeOptionsCoordinates;

  private MapboxNavigation mNavigation;

  private LocationEngine mLocationEngine;

  private ReplayRouteLocationEngine mReplayLocationEngine;
  private int currentNavigationLeg = 0;
*/

  public MBLMapView(Context context, MBLMapViewManager manager, MapboxMapOptions options) {
    super(context, options);

    mContext = context;
    mManager = manager;

    // routeOptionsCoordinates = new ArrayList<Point>();

    onCreate(null);
    onStart();
    // onResume();
    // onPause();
    // onStop();

    mUserLocationGeoJson = new GeoJsonSource("id-user-location-source");
    getMapAsync(this);

    mHandler = new Handler();

    setLifecycleListeners();
  }

  @Override
  public void onResume() {
    super.onResume();
  }

  @Override
  public void onPause() {
    super.onPause();
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
  }

  @Override
  public void onStop() {
    super.onStop();
  }

  @Override
  public void onMapReady(final MapboxMap mapboxMap) {
    mMap = mapboxMap;

    // in case props were set before the map was ready
    //updateInsets();

    UiSettings uiSettings = mapboxMap.getUiSettings();
    uiSettings.setCompassMargins(uiSettings.getCompassMarginLeft(), 350, 30, uiSettings.getCompassMarginBottom());
    uiSettings.setFlingVelocityAnimationEnabled(false);

    final ReactContext reactContext = (ReactContext) getContext();

    WritableMap mrEvent = Arguments.createMap();
    reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "mapReady", mrEvent);

    mMap.setStyle("mapbox://styles/jesseglascock/ckzharkag000815s8rewphri4", new Style.OnStyleLoaded() {
      @Override
      public void onStyleLoaded(Style style) {

        mStyle = style;

        mStyle.addSource(mUserLocationGeoJson);

        mUserLocationLyr = new CircleLayer("user-location", "id-user-location-source");
        mUserLocationLyr.setProperties(PropertyFactory.circleColor(Color.BLUE), PropertyFactory.circleRadius(7f),
            PropertyFactory.circleStrokeColor("#ffffff"), PropertyFactory.circleStrokeWidth(4f));
        mUserLocationLyr.setFilter(eq(literal("$type"), literal("Point")));
        mStyle.addLayer(mUserLocationLyr);

        // TODO: why are these calls the same?
        if (mCenter != null) {
          updateCameraPosition(true, false, 0);
        } else {
          updateCameraPosition(true, false, 0);
        }
        refreshUserLocation();

        // initializeSpeechPlayer();
        // MapboxNavigationOptions.Builder mnBuilder = MapboxNavigationOptions.builder();
        // mnBuilder.enableRefreshRoute(false);
        // mNavigation = new MapboxNavigation(mContext, Mapbox.getAccessToken(), mnBuilder.build());
        // mNavigationMapRoute = new NavigationMapRoute(mNavigation,
        // mManager.getMapView(), mMap);
        // mNavigationMapRoute.updateRouteVisibilityTo(false);

        configureLocation();

        WritableMap mslEvent = Arguments.createMap();
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "mapStyleLoaded", mslEvent);
      }
    });

    mMap.addOnMapClickListener(this);
    mMap.addOnCameraMoveListener(this);
    mMap.addOnCameraIdleListener(this);
    mMap.addOnMoveListener(this);

    reflow();
  }

  @Override
  public void locationUpdated(Location location) {
    // Pass the new location to the Maps SDK's LocationComponent (puck icon)
    getActivity(mContext).runOnUiThread(new Runnable() {
      public void run() {
        LocationComponent locationComponent = mMap.getLocationComponent();
        locationComponent.forceLocationUpdate(location);
      }
    });
  }
  @Override
  public void geofenceEntered(String name) { // needed by LocationListener
  }
  @Override
  public void errorOccurred(String error) { // needed by LocationListener
  }

  private void setLifecycleListeners() {
    final ReactContext reactContext = (ReactContext) mContext;

    mLifeCycleListener = new LifecycleEventListener() {
      @Override
      public void onHostResume() {
        onResume();
        mPaused = false;
      }

      @Override
      public void onHostPause() {
        onPause();
        mPaused = true;
      }

      @Override
      public void onHostDestroy() {
        dispose();
        mDestroyed = true;
      }
    };

    reactContext.addLifecycleEventListener(mLifeCycleListener);
  }

  public synchronized void dispose() {
    ReactContext reactContext = (ReactContext) mContext;

    if (mDestroyed) {
      return;
    }

    reactContext.removeLifecycleEventListener(mLifeCycleListener);

    // WritableMap mrEvent = Arguments.createMap();
    // reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "navigationClosed", mrEvent);

    if (!mPaused) {
      onPause();
    }

    onStop();
    onDestroy();
  }

  public void reflow() {
    mHandler.post(new Runnable() {
      @Override
      public void run() {
        measure(View.MeasureSpec.makeMeasureSpec(getMeasuredWidth(), View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(getMeasuredHeight(), View.MeasureSpec.EXACTLY));
        layout(getLeft(), getTop(), getRight(), getBottom());
      }
    });
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    if (!mPaused) {
      super.onLayout(changed, left, top, right, bottom);
    }
  }

  public MapboxMap getMapboxMap() {
    return mMap;
  }

  public Activity getActivity(Context context) {
    if (context == null) {
      return null;
    } else if (context instanceof ContextWrapper) {
      if (context instanceof Activity) {
        return (Activity) context;
      } else {
        return getActivity(((ContextWrapper) context).getBaseContext());
      }
    }

    return null;
  }

  public void init() {
    // very important, this will make sure that mapbox-gl-native initializes the gl
    // surface
    // https://github.com/mapbox/react-native-mapbox-gl/issues/955
    getViewTreeObserver().dispatchOnGlobalLayout();
  }

  /**
   * Note: This requires location permission to already have been granted. See how
   * permission can be granted in Java code here:
   * https://docs.mapbox.com/android/maps/examples/location-change-listening/
   */
  private void configureLocation() {

    LocationComponent locationComponent = mMap.getLocationComponent();
/*
    LocationComponentOptions locationComponentOptions = LocationComponentOptions.builder(mContext)
            .padding()
  	  .build();

    LocationComponentActivationOptions locationComponentActivationOptions = LocationComponentActivationOptions
            .builder(this, style)
            .locationComponentOptions(locationComponentOptions)
            .build();
 */

    LocationComponentActivationOptions locationComponentActivationOptions =
    LocationComponentActivationOptions.builder(mContext, mStyle)
            .useDefaultLocationEngine(false).build();
    locationComponent.activateLocationComponent(locationComponentActivationOptions);

    locationComponent.setLocationComponentEnabled(false);

    locationComponent.setRenderMode(RenderMode.COMPASS);

    GlobalLocationManager.getInstance().addListener(this);

    //mLocationEngine = LocationEngineProvider.getBestLocationEngine(mContext);
    //mReplayLocationEngine = new ReplayRouteLocationEngine();
  }

  /** Public Events */

  @Override
  public void onCameraMove() {
    // if (mMap != null) {
    // LatLng center = mMap.getCameraPosition().target;
    // WritableArray array = new WritableNativeArray();
    // array.pushDouble(center.getLatitude());
    // array.pushDouble(center.getLongitude());
    // WritableMap event = Arguments.createMap();
    // ReactContext reactContext = (ReactContext) getContext();
    // event.putArray("LatLng", array);
    // reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(),
    // "mapCenterChanged", event);
    // }
  }

  @Override
  public void onCameraIdle() {
    if (mMap != null) {
      LatLng center = mMap.getCameraPosition().target;
      WritableArray array = new WritableNativeArray();
      array.pushDouble(center.getLatitude());
      array.pushDouble(center.getLongitude());
      WritableMap event = Arguments.createMap();
      ReactContext reactContext = (ReactContext) getContext();
      event.putArray("LatLng", array);
      reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "mapCenterChanged", event);
    }
  }

  @SuppressWarnings({ "MissingPermission" })
  @Override
  public boolean onMapClick(LatLng point) {
    PointF pointf = mMap.getProjection().toScreenLocation(point);
    RectF rectF = new RectF(pointf.x - 22, pointf.y - 22, pointf.x + 22, pointf.y + 22);
    WritableArray array = new WritableNativeArray();
    array.pushDouble(point.getLongitude());
    array.pushDouble(point.getLatitude());
    WritableMap pt = Arguments.createMap();
    pt.putArray("point", array);
    
    WritableMap event = Arguments.createMap();
    event.putMap("payload", pt);
    //List<Feature> featureList = mMap.queryRenderedFeatures(rectF, "cota-stops,ota-pantry-dots,schools-food-dots");
    List<Feature> featureList = mMap.queryRenderedFeatures(rectF, "cota-stops");
    if (featureList.size() > 0) {
      Feature f = featureList.get(0);
      // WritableMap event = Arguments.createMap();
      event.putString("feature", f.toJson());
      ReactContext reactContext = (ReactContext) getContext();
      reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "mapClick", event);
      return true;
    }
    ReactContext reactContext = (ReactContext) getContext();
      reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "mapClick", event);
    return true;
  }

  /** Public Properties */
  public void setContentInset(ReadableArray array) {

    final DisplayMetrics metrics = mContext.getResources().getDisplayMetrics();
    float scale = metrics.density;
    mInsets[0] = Float.valueOf(array.getInt(0) * scale).intValue();
    mInsets[1] = Float.valueOf(array.getInt(1) * scale).intValue();
    mInsets[2] = Float.valueOf(array.getInt(2) * scale).intValue();
    mInsets[3] = Float.valueOf(array.getInt(3) * scale).intValue();

    updateCameraPosition(false, true,200);

    //mInsets = array;
    //updateInsets();
  }
/*
  private void updateInsets() {
    if (mMap == null || mInsets == null) {
      return;
    }

    final DisplayMetrics metrics = mContext.getResources().getDisplayMetrics();
    int top = 0, right = 0, bottom = 0, left = 0;

    if (mInsets.size() == 4) {
      top = mInsets.getInt(0);
      right = mInsets.getInt(1);
      bottom = mInsets.getInt(2);
      left = mInsets.getInt(3);
    } else if (mInsets.size() == 2) {
      top = mInsets.getInt(0);
      right = mInsets.getInt(1);
      bottom = top;
      left = right;
    } else if (mInsets.size() == 1) {
      top = mInsets.getInt(0);
      right = top;
      bottom = top;
      left = top;
    }

    float scale = metrics.density * 2;
    mMap.setPadding(
        Float.valueOf(left * scale).intValue(),
        Float.valueOf(top * scale).intValue(),
        Float.valueOf(right * scale).intValue(),
        Float.valueOf(bottom * scale).intValue());
  }
*/
  public void setCenter(double lat, double lng) {
    mCenter = new LatLng(lat, lng);
    updateCameraPosition(true, false, 0);
  }

  public void setZoom(double zoom) {
    mZoom = zoom;
    updateCameraPosition(false, false, 0);
  }

  private void updateCameraPosition(boolean updateTarget, boolean animate, int duration) {
    if (mMap != null) {
      CameraPosition.Builder builder = new CameraPosition.Builder(mMap.getCameraPosition()).bearing(mBearing)
          .tilt(mTilt).zoom(mZoom).padding(mInsets[3], mInsets[0], mInsets[1], mInsets[2]);
      if (updateTarget) {
        builder.target(mCenter);
      }
      CameraPosition newPosition = builder.build();
      CameraUpdate cameraUpdate = CameraUpdateFactory.newCameraPosition(newPosition);
      if (animate) {
        mMap.animateCamera(cameraUpdate, duration);
      } else {
        mMap.setCameraPosition(newPosition);
      }
    }
  }

  /** Public Methods */

  /** map interaction */
  public void setCamera(Double lat, Double lng, Double zoom, Double bearing, Double tilt, int duration) {
    mCenter = new LatLng(lat, lng);
    mZoom = zoom;
    mBearing = bearing;
    mTilt = tilt;
    updateCameraPosition(true, true, duration);
  }

  // TODO: Remove padding parameters
  public void setCamera(double latNorth, double lonEast, double latSouth, double lonWest, int padLeft, int padTop,
      int padRight, int padBottom, int duration) {
    LatLngBounds bnds = LatLngBounds.from(latNorth, lonEast, latSouth, lonWest);
    padTop = mInsets[0];
    padRight = mInsets[1];
    padBottom = mInsets[2];
    padLeft = mInsets[3];
    mMap.animateCamera(CameraUpdateFactory.newLatLngBounds(bnds, padLeft, padTop, padRight, padBottom), duration,
        new MapboxMap.CancelableCallback() {
          @Override
          public void onCancel() {
            CameraPosition cPos = mMap.getCameraPosition();
            mCenter = new LatLng(cPos.target.getLatitude(), cPos.target.getLongitude());
            mZoom = cPos.zoom;
            mBearing = cPos.bearing;
            mTilt = cPos.tilt;
          }

          @Override
          public void onFinish() {
            CameraPosition cPos = mMap.getCameraPosition();
            mCenter = new LatLng(cPos.target.getLatitude(), cPos.target.getLongitude());
            mZoom = cPos.zoom;
            mBearing = cPos.bearing;
            mTilt = cPos.tilt;
          }
        });
  }

  public void updateUserLocation(Double lat, Double lng) {
    mUserLocation = Point.fromLngLat(lng, lat);
    refreshUserLocation();
  }

  public void refreshUserLocation() {
    if (mUserLocation != null) {
      mUserLocationGeoJson.setGeoJson(Feature.fromGeometry(mUserLocation));
    }
  }

  public void setUserFollowMode(final String mode, final int altitude, final Double zoom, final int pitch,
      final int durationMS) {

    LocationComponent locationComponent = mMap.getLocationComponent();

    if (mode != null) {
      if (mode.equals("course")) {
        locationComponent.setCameraMode(CameraMode.TRACKING_GPS);
      } else if (mode.equals("heading")) {
        locationComponent.setCameraMode(CameraMode.TRACKING_COMPASS);
      } else {
        locationComponent.setCameraMode(CameraMode.TRACKING);
      }
      togglePreciseUserLocation(true);

      if (mode.equals("course")) {
        // has to be after the component is enabled.
        locationComponent.paddingWhileTracking(new double[]{ 0, pitch > 40 ? 400 : 200, 0, 0 });
      }
/*
      CameraPosition.Builder builder = new CameraPosition.Builder(mMap.getCameraPosition());
      if (pitch != -1)
        builder.tilt(pitch);
      if (zoom != -1)
        builder.zoom(zoom);
      CameraPosition newPosition = builder.build();
      CameraUpdate cameraUpdate = CameraUpdateFactory.newCameraPosition(newPosition);
      mMap.animateCamera(cameraUpdate, durationMS);*/

      if (pitch != -1)
        locationComponent.tiltWhileTracking(pitch, durationMS);
      if (zoom != -1)
        locationComponent.zoomWhileTracking(zoom, durationMS);
    } else {
      locationComponent.setCameraMode(CameraMode.NONE);
    }
  }

  public void togglePreciseUserLocation(final Boolean turnOn) {
    LocationComponent locationComponent = mMap.getLocationComponent();
    if (turnOn) {
      hideLayer("user-location");
      locationComponent.setRenderMode(RenderMode.GPS);
      locationComponent.setLocationComponentEnabled(true);
    } else {
      showLayer("user-location");
      locationComponent.setRenderMode(RenderMode.COMPASS);
      locationComponent.setLocationComponentEnabled(false);
    }
  }

  public void setReverseGeocodeCoordinate(final Double x, final Double y) {

    final DisplayMetrics metrics = mContext.getResources().getDisplayMetrics();
    float px = x.floatValue() * metrics.density;
    float py = y.floatValue() * metrics.density;

    PointF pointf = new PointF(px, py);
    mReverseGeocodeCoordinate = mMap.getProjection().fromScreenLocation(pointf);

    WritableArray array = new WritableNativeArray();
    array.pushDouble(mReverseGeocodeCoordinate.getLatitude());
    array.pushDouble(mReverseGeocodeCoordinate.getLongitude());
    WritableMap event = Arguments.createMap();
    ReactContext reactContext = (ReactContext) getContext();
    event.putArray("LatLng", array);
    reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "reverseGeocodeChange", event);
  }

  /** layers */
  public void addCircleLayer(final String id) {
    Layer rLyr = mStyle.getLayer(id);
    Source rSrc = mStyle.getSource("id-" + id + "-source");
    if (rLyr != null || rSrc != null) {
      return;
    }

    GeoJsonSource newSymbolGeoJsonSource = new GeoJsonSource("id-" + id + "-source");
    mStyle.addSource(newSymbolGeoJsonSource);

    CircleLayer newCircleLyr = new CircleLayer(id, "id-" + id + "-source");
    newCircleLyr.setProperties(PropertyFactory.circleColor(get("circleColor")),
        PropertyFactory.circleRadius(get("circleRadius")), PropertyFactory.circleStrokeColor(get("circleStrokeColor")),
        PropertyFactory.circleStrokeWidth(get("circleStrokeWidth")));

    mStyle.addLayer(newCircleLyr);
  }

  public void addLineLayer(final String id) {
    Layer rLyr = mStyle.getLayer(id);
    Source rSrc = mStyle.getSource("id-" + id + "-source");
    if (rLyr != null || rSrc != null) {
      return;
    }

    GeoJsonSource newSymbolGeoJsonSource = new GeoJsonSource("id-" + id + "-source");
    mStyle.addSource(newSymbolGeoJsonSource);

    LineLayer newLineLyr = new LineLayer(id, "id-" + id + "-source");
    newLineLyr.setProperties(
      PropertyFactory.lineColor(get("lineColor")),
      PropertyFactory.lineWidth(get("lineWidth")),
      PropertyFactory.lineOpacity(get("lineOpacity")),
      PropertyFactory.lineJoin(get("lineJoin"))//,
      //PropertyFactory.lineDasharray(get("lineDasharray")) // "Error setting property: line-dasharray data expressions not supported"
      );
    mStyle.addLayer(newLineLyr);
  }

  public void addFillLayer(String id) {

  }

  public void addSymbolLayer(final String id, ReadableMap imageObject, final Double size) {
    Layer rLyr = mStyle.getLayer(id);
    Source rSrc = mStyle.getSource("id-" + id + "-source");
    if (rLyr != null || rSrc != null) {
      return;
    }

    DownloadImageTask.OnImageLoaded imageDownloadCompleteCallback = new DownloadImageTask.OnImageLoaded() {
      @Override
      public void onImageLoaded(Bitmap image) {

        mStyle.addImage("id-" + id + "-image", image);

        GeoJsonSource newSymbolGeoJsonSource = new GeoJsonSource("id-" + id + "-source");
        mStyle.addSource(newSymbolGeoJsonSource);

        SymbolLayer newSymbolLayer = new SymbolLayer(id, "id-" + id + "-source");
        newSymbolLayer.setProperties(PropertyFactory.iconImage("id-" + id + "-image"),
            PropertyFactory.iconIgnorePlacement(true), PropertyFactory.iconAllowOverlap(true),
            PropertyFactory.iconSize(size.floatValue()));
        mStyle.addLayer(newSymbolLayer);

      }
    };
    DownloadImageTask task = new DownloadImageTask(mContext, imageDownloadCompleteCallback);
    task.execute(new String[] { imageObject.getString("uri") });
  }

  public void addIconSymbolLayer(final String id, final String iconName, final Double size, final Integer iconOffsetX, final Integer iconOffsetY,
                                 final Boolean showText, final Double textOffsetX, final Double textOffsetY, final Boolean allowCollision, final Boolean relativeToMap) {

    Log.i("SYMBOL id", id);
    Log.i("SYMBOL iconName", iconName);
    Log.i("SYMBOL allowCollision", allowCollision.toString());
    Layer rLyr = mStyle.getLayer(id);
    Source rSrc = mStyle.getSource("id-" + id + "-source");
    if (rLyr != null || rSrc != null) {
      return;
    }

    GeoJsonSource newSymbolGeoJsonSource = new GeoJsonSource("id-" + id + "-source");
    mStyle.addSource(newSymbolGeoJsonSource);

    SymbolLayer newSymbolLayer = new SymbolLayer(id, "id-" + id + "-source");
    newSymbolLayer.setProperties(PropertyFactory.iconImage(iconName), PropertyFactory.iconSize(size.floatValue()),
        PropertyFactory.iconOffset(new Float[] { iconOffsetX.floatValue(), iconOffsetY.floatValue() }),
        PropertyFactory.iconRotate(get("angle")));
    if (relativeToMap) {
      newSymbolLayer.setProperties(PropertyFactory.iconRotationAlignment(Property.ICON_ROTATION_ALIGNMENT_MAP));
    }
    if (showText) {
      newSymbolLayer.setProperties(PropertyFactory.textField(get("text")),
          PropertyFactory.textTranslate(new Float[] { textOffsetX.floatValue(), textOffsetY.floatValue() }),
          PropertyFactory.textHaloColor(Color.WHITE), PropertyFactory.textHaloWidth(3f));
    }
    if (allowCollision) {
      newSymbolLayer.setProperties(PropertyFactory.iconIgnorePlacement(true), PropertyFactory.iconAllowOverlap(true));
    }
    mStyle.addLayer(newSymbolLayer);
  }

  public void updateLayer(String id, String geoJsonString) {
    if (mStyle != null) {
      Log.i("updateLayer id", id);
      Log.i("updateLayer geojson", geoJsonString);
      GeoJsonSource rSrc = mStyle.getSourceAs("id-" + id + "-source");
      if (rSrc != null) {
        rSrc.setGeoJson(FeatureCollection.fromJson(geoJsonString));
      }
    }
  }

  public void removeLayer(String id) {
    Layer rLyr = mStyle.getLayer(id);
    if (rLyr != null) {
      mStyle.removeLayer(id);
    }
    Source rSrc = mStyle.getSource("id-" + id + "-source");
    if (rSrc != null) {
      mStyle.removeSource("id-" + id + "-source");
    }
    Bitmap rImg = mStyle.getImage("id-" + id + "-image");
    if (rImg != null) {
      mStyle.removeImage("id-" + id + "-image");
    }
  }

  public void showLayer(String id) {
    Layer lyr = mStyle.getLayer(id);
    if (lyr != null) {
      lyr.setProperties(PropertyFactory.visibility(Property.VISIBLE));
    }
  }

  public void hideLayer(String id) {
    Layer lyr = mStyle.getLayer(id);
    if (lyr != null) {
      lyr.setProperties(PropertyFactory.visibility(Property.NONE));
    }
  }

  @Override
  public void onMoveBegin(@NonNull MoveGestureDetector detector) {
    WritableMap event = Arguments.createMap();
    WritableMap state = Arguments.createMap();
    state.putString("state", "start");
    event.putMap("payload", state);
    ReactContext reactContext = (ReactContext) getContext();
    reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "mapPan", event);
  }

  @Override
  public void onMove(@NonNull MoveGestureDetector detector) {
    WritableMap event = Arguments.createMap();
    WritableMap state = Arguments.createMap();
    state.putString("state", "change");
    event.putMap("payload", state);
    ReactContext reactContext = (ReactContext) getContext();
    reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "mapPan", event);
  }

  @Override
  public void onMoveEnd(@NonNull MoveGestureDetector detector) {
    WritableMap event = Arguments.createMap();
    WritableMap state = Arguments.createMap();
    state.putString("state", "end");
    event.putMap("payload", state);
    ReactContext reactContext = (ReactContext) getContext();
    reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "mapPan", event);
  }

  /** navigation */
/*
  public void addRoute(String jsonRoute) {

    Log.i("route", "route added for first time!");
    currentRoute = DirectionsRoute.fromJson(jsonRoute);
    Log.i("route", "setting route with steps: " + currentRoute.legs().get(0).steps().size() + " (" + currentRoute.legs().get(0).distance() + ")");

    // if (mNavigationMapRoute != null) {
    // mNavigationMapRoute.removeRoute();
    // } else {
    // MBLMapView mView = mManager.getMapView();
    // mNavigationMapRoute = new NavigationMapRoute(mView, mMap);
    // }
    // mNavigationMapRoute.addRoute(currentRoute);

    WritableMap event = Arguments.createMap();
    // event.putString("route", currentRoute.toJson());
    ReactContext reactContext = (ReactContext) getContext();
    reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "navigationReady", event);
  }*/
  /*
   * public void generateRoute(String jsonString) { currentRoute =
   * DirectionsRoute.fromJson(jsonString);
   * 
   * // mNavigationMapRoute.addRoute(currentRoute); //
   * mNavigationMapRoute.updateRouteVisibilityTo(true);
   * 
   * WritableMap event = Arguments.createMap(); event.putString("route",
   * currentRoute.toJson()); ReactContext reactContext = (ReactContext)
   * getContext();
   * reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(),
   * "navigationReady", event); }
   */
/*
  public void updateRoute(String jsonRoute) {

    currentRoute = DirectionsRoute.fromJson(jsonRoute);
    Log.i("route", "updating route with steps: " + currentRoute.legs().get(0).steps().size() + " (" + currentRoute.legs().get(0).distance() + ")");
    // TODO: Restore these two lines, but only do it if we're simulating.
    //mReplayLocationEngine.assign(currentRoute);
    //mNavigation.setLocationEngine(mReplayLocationEngine);
    mNavigation.startNavigation(currentRoute);
  }

  public void startNavigation(boolean simulateRoute) {

    /*if (showUI) {
      NavigationLauncherOptions options = NavigationLauncherOptions.builder().directionsRoute(currentRoute)
          .shouldSimulateRoute(simulateRoute).build();

      Activity mActivity = getActivity(mContext);
      NavigationLauncher.startNavigation(mActivity, options);
    } else*/ /*{
      // Log.i("route", "navigation started!");
      //currentNavigationLeg = legStartIndex;
      startViewlessNavigation(simulateRoute);//,legStartIndex);
      this.setKeepScreenOn(true);
    }
  }

  public void stopNavigation() {
    if (mNavigation != null) {
      mNavigation.stopNavigation();
      this.setKeepScreenOn(false);
    }
  }*/

  /** viewless navigation */
/*  public void startViewlessNavigation(boolean simulateRoute) {//}, int legStartIndex) {

    mNavigation.addNavigationEventListener(this);
    mNavigation.addProgressChangeListener(this);
    mNavigation.addMilestoneEventListener(this);
    mNavigation.addOffRouteListener(this);

    int legSize = currentRoute.legs().size();
    int milestoneCount = 0;
    for (int i = 0; i < legSize; i++) {
      RouteLeg leg = currentRoute.legs().get(i);
      int stepSize = leg.steps().size();
      for (int j = 0; j < stepSize; j++) {
        mNavigation.addMilestone(new RouteMilestone.Builder().setIdentifier(milestoneCount)
            .setTrigger(Trigger.eq(TriggerProperty.STEP_INDEX, milestoneCount)).build());
        milestoneCount++;
      }
    }

    LocationEngine locationEngine;
    /*if (simulateRoute) {
      locationEngine = mReplayLocationEngine;
      mReplayLocationEngine.assign(currentRoute);
      mReplayLocationEngine.updateSpeed(30);
    } else*/ /*{
      locationEngine = mLocationEngine;
    }
    mNavigation.setLocationEngine(locationEngine);

    mMap.getLocationComponent().setLocationComponentEnabled(true);

    mNavigation.startNavigation(currentRoute);

    // TODO: remove the legStartIndex parameter. it seems to be giving us issues.
    //mNavigation.updateRouteLegIndex(legStartIndex);
  }

  private void initializeSpeechPlayer() {
    String lang = "en";
    Cache cache = new Cache(
      new File(mContext.getCacheDir(), "component-navigation-instruction-cache"),
      10 * 1024 * 1024
    );
    VoiceInstructionLoader voiceInstructionLoader = new VoiceInstructionLoader(mContext,
            Mapbox.getAccessToken(), cache);
    SpeechPlayerProvider speechPlayerProvider = new SpeechPlayerProvider(mContext, lang, true,
            voiceInstructionLoader);
    speechPlayer = new NavigationSpeechPlayer(speechPlayerProvider);
  }

  private void playAnnouncement(Milestone milestone) {
    if (milestone instanceof VoiceInstructionMilestone) {
        SpeechAnnouncement announcement = SpeechAnnouncement.builder()
                .voiceInstructionMilestone((VoiceInstructionMilestone) milestone)
                .build();
        speechPlayer.play(announcement);
    }
  }

  public void setVoiceVolume(final Double volume) {
    speechPlayer.setMuted(volume < 1);
  }

  @Override
  public void onMilestoneEvent(RouteProgress routeProgress, String instruction, Milestone milestone) {
    playAnnouncement(milestone);

    int legIndex = routeProgress.legIndex();
    RouteLegProgress routeLegProgress = routeProgress.currentLegProgress();
    int stepIndex = routeLegProgress.stepIndex();

    WritableArray array = new WritableNativeArray();
    array.pushInt(legIndex);
    array.pushInt(stepIndex);
    WritableMap event = Arguments.createMap();
    ReactContext reactContext = (ReactContext) getContext();
    event.putArray("milestone", array);
    reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "navigationMilestone", event);
  }

  @Override
  public void userOffRoute(Location location) {
    // Log.i("route", "gone off route! (" + location.getLatitude() + ", " + location.getLongitude() + ")");
//    if(currentRouteProgressState == RouteProgressState.) // UPDATE SDK??
    WritableArray array = new WritableNativeArray();
    array.pushDouble(location.getLatitude());
    array.pushDouble(location.getLongitude());
    WritableMap event = Arguments.createMap();
    ReactContext reactContext = (ReactContext) getContext();
    event.putArray("location", array);

    reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "userOffRoute", event);
  }

  @Override
  public void onProgressChange(Location location, RouteProgress routeProgress) {
    RouteLegProgress routeLegProgress = routeProgress.currentLegProgress();
    RouteStepProgress routeStepProgress = routeLegProgress.currentStepProgress();
    // Log.i("route", "progress for steps: " + routeProgress.currentLeg().steps().size() + " (" + routeLegProgress.distanceTraveled() + "/" + routeLegProgress.distanceRemaining() + ")");
    /*
    WritableMap legProgress = Arguments.createMap();
    legProgress.putInt("index", routeProgress.legIndex());
    legProgress.putDouble("pctComplete", routeLegProgress.fractionTraveled());
    legProgress.putDouble("timeRemaining", routeLegProgress.durationRemaining());

    WritableMap legStepProgress = Arguments.createMap();
    legStepProgress.putInt("index", routeLegProgress.stepIndex());
    legStepProgress.putDouble("pctComplete", routeStepProgress.fractionTraveled());
    legStepProgress.putDouble("timeRemaining", routeStepProgress.durationRemaining());
    */
/*
    WritableMap current_step_progress = Arguments.createMap();
    current_step_progress.putDouble("distanceRemaining", routeStepProgress.distanceRemaining());
    current_step_progress.putDouble("distanceTraveled", routeStepProgress.distanceTraveled());
    current_step_progress.putDouble("durationRemaining", routeStepProgress.durationRemaining());
    current_step_progress.putDouble("fractionTraveled", routeStepProgress.fractionTraveled());

    WritableMap upcoming_step = Arguments.createMap();
    upcoming_step.putDouble("distance", routeLegProgress.upComingStep() != null ? routeLegProgress.upComingStep().distance() : -1);
    upcoming_step.putDouble("duration", routeLegProgress.upComingStep() != null ? routeLegProgress.upComingStep().duration() : -1);
    upcoming_step.putString("instructions", routeLegProgress.upComingStep() != null ? routeLegProgress.upComingStep().maneuver().instruction() : null);
    upcoming_step.putString("maneuverDirection", routeLegProgress.upComingStep() != null ? routeLegProgress.upComingStep().maneuver().modifier() : null);
    upcoming_step.putString("maneuverType", routeLegProgress.upComingStep() != null ? routeLegProgress.upComingStep().maneuver().type() : null);
    upcoming_step.putString("transportType", routeLegProgress.upComingStep() != null ? routeLegProgress.upComingStep().mode() : null);

    WritableMap current_step = Arguments.createMap();
    current_step.putDouble("distance", routeLegProgress.currentStep().distance());
    current_step.putDouble("duration", routeLegProgress.currentStep().duration());
    current_step.putString("instructions", routeLegProgress.currentStep().maneuver().instruction());
    current_step.putString("maneuverDirection", routeLegProgress.currentStep().maneuver().modifier());
    current_step.putString("maneuverType", routeLegProgress.currentStep().maneuver().type());
    current_step.putString("transportType", routeLegProgress.currentStep().mode());
    current_step.putMap("currentStepProgress", current_step_progress);
    current_step.putMap("upcomingStep", upcoming_step);

    WritableMap current_leg_progress = Arguments.createMap();
    current_leg_progress.putDouble("distanceRemaining", routeLegProgress.distanceRemaining());
    current_leg_progress.putDouble("distanceTraveled", routeLegProgress.distanceTraveled());
    current_leg_progress.putDouble("durationRemaining", routeLegProgress.durationRemaining());
    current_leg_progress.putDouble("fractionTraveled", routeLegProgress.fractionTraveled());
    current_leg_progress.putInt("stepIndex", routeLegProgress.stepIndex());

    // WritableMap upcoming_leg = Arguments.createMap();
    // upcoming_leg.putDouble("distance", -1);
    // upcoming_leg.putDouble("duration", -1);
    // upcoming_leg.putString("name", null);
    // upcoming_leg.putString("profileIdentifier", null);

    WritableMap current_leg = Arguments.createMap();
    current_leg.putDouble("distance", routeProgress.currentLeg().distance());
    current_leg.putDouble("duration", routeProgress.currentLeg().duration());
    current_leg.putString("name", routeProgress.currentLeg().summary());
    // current_leg.putString("profileIdentifier", null);
    current_leg.putMap("currentLegProgress", current_leg_progress);
    // current_leg.putMap("upcomingLeg", upcoming_leg);
    current_leg.putMap("currentStep", current_step);

    WritableMap route_progress = Arguments.createMap();
    route_progress.putDouble("distanceRemaining", routeProgress.distanceRemaining());
    route_progress.putDouble("distanceTraveled", routeProgress.distanceTraveled());
    route_progress.putDouble("durationRemaining", routeProgress.durationRemaining());
    route_progress.putDouble("fractionTraveled", routeProgress.fractionTraveled());
    //route_progress.putInt("legIndex", routeProgress.legIndex());
    route_progress.putMap("currentLeg", current_leg);

    WritableArray array = new WritableNativeArray();
    array.pushDouble(location.getLatitude());
    array.pushDouble(location.getLongitude());
    array.pushDouble(location.getBearing());
    array.pushMap(route_progress);

    WritableMap event = Arguments.createMap();
    ReactContext reactContext = (ReactContext) getContext();
    event.putArray("progress", array);
    reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "navigationProgress", event);

    // NOTE: the ROUTE_ARRIVED state is when you reach the end of a leg, not the end of the whole route.
    // From doc: "The user has arrived at the destination of the given RouteLeg."
    //if (routeProgress.currentState() == RouteProgressState.ROUTE_ARRIVED) {
    //  WritableMap ncEvent = Arguments.createMap();
    //  reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "navigationComplete", ncEvent);
      // mNavigation.stopNavigation();
    //}
  }

  @Override
  public void onRunning(boolean running) {
    // mNavigation.updateRouteLegIndex(currentNavigationLeg);
  }
*/
}
