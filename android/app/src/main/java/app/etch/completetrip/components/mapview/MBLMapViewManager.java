package app.etch.completetrip.components.mapview;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import com.mapbox.mapboxsdk.Mapbox;
import com.mapbox.mapboxsdk.camera.CameraPosition;
import com.mapbox.mapboxsdk.geometry.LatLng;
import com.mapbox.mapboxsdk.maps.MapboxMapOptions;
import com.mapbox.mapboxsdk.maps.OnMapReadyCallback;
import com.mapbox.mapboxsdk.maps.Style;

import android.widget.Toast;

import java.util.Map;

import javax.annotation.Nullable;

public class MBLMapViewManager extends SimpleViewManager<MBLMapView> {

  public static final String REACT_CLASS = "MBLMapView";

  private MBLMapView mView;
  private ReactApplicationContext mContext;

  public MBLMapViewManager(ReactApplicationContext context) {
    // super(context);
    mContext = context;
  }

  public MBLMapView getMapView() {
    return mView;
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public MBLMapView createViewInstance(ThemedReactContext context) {
    MapboxMapOptions options = new MapboxMapOptions()
        .camera(new CameraPosition.Builder().target(new LatLng(39.984017, -83.005017)).zoom(9).build());
    return new MBLMapView(context, this, null);
  }

  @Override
  protected void onAfterUpdateTransaction(MBLMapView mapView) {
    super.onAfterUpdateTransaction(mapView);

    if (mapView.getMapboxMap() == null) {
      mView = mapView;
      mapView.init();
    }
  }

  @Override
  public Map getExportedCustomBubblingEventTypeConstants() {
    return MapBuilder.builder()
        .put("mapClick", MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onPress")))
        .put("mapCenterChanged",
            MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onMapCenterChange")))
        .put("mapPan",
                MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onPan")))
        .put("routeAdded", MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onRouteAdded")))
        .put("routeReceived", MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onRouteReceived")))
        .put("mapReady", MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onMapReady")))
        .put("mapStyleLoaded", MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onMapStyleLoaded")))
        .put("navigationReady", MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onNavigationReady")))
        .put("reverseGeocodeChange",
            MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onReverseGeocodeChange")))
        .put("navigationMilestone",
            MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onNavigationMilestone")))
        .put("navigationProgress",
            MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onNavigationProgress")))
        .put("navigationComplete",
            MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onNavigationComplete")))
        .put("navigationClosed",
            MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onNavigationClosed")))
        .put("userOffRoute", MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onUserOffRoute")))
        .build();
  }

  // map interaction
  public static final int METHOD_SET_CAMERA = 1;
  public static final int METHOD_FIT_BOUNDS = 2;
  public static final int METHOD_SET_CONTENT_INSET = 3;
  public static final int METHOD_UPDATE_USER_LOCATION = 4;
  public static final int METHOD_SET_USER_FOLLOW_MODE = 19;
  public static final int METHOD_TOGGLE_PRECISE_USER_LOCATION = 20;
  public static final int METHOD_SET_REVERSE_GEOCODE_COORDINATE = 5;
  // layers
  public static final int METHOD_ADD_CIRCLE_LAYER = 6;
  public static final int METHOD_ADD_LINE_LAYER = 7;
  public static final int METHOD_ADD_FILL_LAYER = 8;
  public static final int METHOD_ADD_SYMBOL_LAYER = 9;
  public static final int METHOD_ADD_ICON_SYMBOL_LAYER = 10;
  public static final int METHOD_UPDATE_LAYER = 11;
  public static final int METHOD_REMOVE_LAYER = 12;
  public static final int METHOD_SHOW_LAYER = 13;
  public static final int METHOD_HIDE_LAYER = 14;
  // navigation
  // public static final int METHOD_ADD_ROUTE = 15;
  // public static final int METHOD_UPDATE_ROUTE = 16;
  // public static final int METHOD_START_NAVIGATION = 17;
  // public static final int METHOD_STOP_NAVIGATION = 18;
  // public static final int METHOD_SET_VOICE_VOLUME = 21;

  @Nullable
  @Override
  public Map<String, Integer> getCommandsMap() {
    return MapBuilder.<String, Integer>builder().put("setCamera", METHOD_SET_CAMERA).put("fitBounds", METHOD_FIT_BOUNDS)
        .put("setContentInset", METHOD_SET_CONTENT_INSET).put("updateUserLocation", METHOD_UPDATE_USER_LOCATION)
        .put("setUserFollowMode", METHOD_SET_USER_FOLLOW_MODE)
        .put("togglePreciseUserLocation", METHOD_TOGGLE_PRECISE_USER_LOCATION)
        .put("setReverseGeocodeCoordinate", METHOD_SET_REVERSE_GEOCODE_COORDINATE)
        .put("addCircleLayer", METHOD_ADD_CIRCLE_LAYER).put("addLineLayer", METHOD_ADD_LINE_LAYER)
        .put("addFillLayer", METHOD_ADD_FILL_LAYER).put("addSymbolLayer", METHOD_ADD_SYMBOL_LAYER)
        .put("addIconSymbolLayer", METHOD_ADD_ICON_SYMBOL_LAYER).put("updateLayer", METHOD_UPDATE_LAYER)
        .put("removeLayer", METHOD_REMOVE_LAYER).put("showLayer", METHOD_SHOW_LAYER).put("hideLayer", METHOD_HIDE_LAYER)
        // .put("addRoute", METHOD_ADD_ROUTE).put("updateRoute", METHOD_UPDATE_ROUTE)
        // .put("startNavigation", METHOD_START_NAVIGATION).put("stopNavigation",
        // METHOD_STOP_NAVIGATION)
        // .put("setVoiceVolume", METHOD_SET_VOICE_VOLUME)
        .build();
  }

  @Override
  public void receiveCommand(MBLMapView mapView, int commandID, @Nullable ReadableArray args) {
    switch (commandID) {
      case METHOD_SET_CAMERA:
        mapView.setCamera(args.getDouble(0), args.getDouble(1), args.getDouble(2), args.getDouble(3), args.getDouble(4),
            args.getInt(5));
        break;
      case METHOD_FIT_BOUNDS:
        mapView.setCamera(args.getDouble(0), args.getDouble(1), args.getDouble(2), args.getDouble(3), args.getInt(4),
            args.getInt(5), args.getInt(6), args.getInt(7), args.getInt(8));
        break;
      case METHOD_UPDATE_USER_LOCATION:
        mapView.updateUserLocation(args.getDouble(0), args.getDouble(1));
        break;
      case METHOD_SET_USER_FOLLOW_MODE:
        mapView.setUserFollowMode(args.getString(0), args.getInt(1), args.getDouble(2), args.getInt(3), args.getInt(4));
        break;
      case METHOD_TOGGLE_PRECISE_USER_LOCATION:
        mapView.togglePreciseUserLocation(args.getBoolean(0));
        break;
      case METHOD_SET_REVERSE_GEOCODE_COORDINATE:
        mapView.setReverseGeocodeCoordinate(args.getDouble(0), args.getDouble(1));
        break;
      case METHOD_ADD_CIRCLE_LAYER:
        mapView.addCircleLayer(args.getString(0));
        break;
      case METHOD_ADD_LINE_LAYER:
        mapView.addLineLayer(args.getString(0));
        break;
      case METHOD_ADD_FILL_LAYER:
        mapView.addFillLayer(args.getString(0));
        break;
      case METHOD_ADD_SYMBOL_LAYER:
        mapView.addSymbolLayer(args.getString(0), args.getMap(1), args.getDouble(2));
        break;
      case METHOD_ADD_ICON_SYMBOL_LAYER:
        mapView.addIconSymbolLayer(args.getString(0), args.getString(1), args.getDouble(2), args.getInt(3),
            args.getInt(4), args.getBoolean(5), args.getDouble(6), args.getDouble(7), args.getBoolean(8),
            args.getBoolean(9));
        break;
      case METHOD_UPDATE_LAYER:
        mapView.updateLayer(args.getString(0), args.getString(1));
        break;
      case METHOD_REMOVE_LAYER:
        mapView.removeLayer(args.getString(0));
        break;
      case METHOD_SHOW_LAYER:
        mapView.showLayer(args.getString(0));
        break;
      case METHOD_HIDE_LAYER:
        mapView.hideLayer(args.getString(0));
        break;
      // case METHOD_ADD_ROUTE:
      // mapView.addRoute(args.getString(0));
      // break;
      // case METHOD_UPDATE_ROUTE:
      // mapView.updateRoute(args.getString(0));
      // break;
      // case METHOD_START_NAVIGATION:
      // mapView.startNavigation(args.getBoolean(0));
      // break;
      // case METHOD_STOP_NAVIGATION:
      // mapView.stopNavigation();
      // break;
      // case METHOD_SET_VOICE_VOLUME:
      // mapView.setVoiceVolume(args.getDouble(0));
      // break;
      case METHOD_SET_CONTENT_INSET:
        mapView.setContentInset(args);
        break;
    }
  }

  @ReactProp(name = "center")
  public void setCenter(MBLMapView mapView, ReadableArray coordinates) {
    mapView.setCenter(coordinates.getDouble(0), coordinates.getDouble(1));
  }

  @ReactProp(name = "zoom")
  public void setZoom(MBLMapView mapView, double zoomLevel) {
    mapView.setZoom(zoomLevel);
  }

}