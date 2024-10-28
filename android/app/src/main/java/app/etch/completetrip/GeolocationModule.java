package app.etch.completetrip;

import android.location.Location;
import android.util.Log;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class GeolocationModule extends ReactContextBaseJavaModule implements LocationListener {

  private ReactApplicationContext reactContext;

  GeolocationModule(ReactApplicationContext context) {
    super(context);
    reactContext = context;
  }

  @Override
  public String getName() {
    return "Geolocation";
  }

  @ReactMethod
  public void start() {
    GlobalLocationManager mgr = GlobalLocationManager.getInstance();
    mgr.addListener(this);
    mgr.turnOnLocation();
  }

  @ReactMethod
  public void stop() {
    GlobalLocationManager.getInstance().removeListener(this);
  }

  @ReactMethod
  public void pause()
  {
    GlobalLocationManager.getInstance().pauseLocationListening();
  }

  @ReactMethod
  public void resume()
  {
    GlobalLocationManager.getInstance().resumeLocationListening();
  }

  @ReactMethod
  public void setAccuracy(int accuracyLevel)
  {
    GlobalLocationManager.getInstance().setAccuracy(accuracyLevel);
  }

  @ReactMethod
  public void addGeofence(double lat, double lng, double radius, String name)
  {
  }

  @ReactMethod
  public void clearGeofences()
  {
  }

  @ReactMethod
  public void simulate(double lat, double lng, double heading, double speed)
  {
    GlobalLocationManager.getInstance().simulate(lat, lng, heading, speed);
  }

  @Override
  public void locationUpdated(Location location) {

    double latitude = location.getLatitude();
    double longitude = location.getLongitude();
    double heading = location.getBearing();
    double speed = location.getSpeed();
    double accuracy = location.getAccuracy();

    Log.d("Geolocation", "Got new user position ("
      + latitude + ", " + longitude + " " + heading + " " + speed + " " + accuracy + ")");

    WritableMap params = Arguments.createMap();
    params.putDouble("lat", latitude);
    params.putDouble("lng", longitude);
    params.putDouble("speed", speed);
    params.putDouble("heading", heading);  // 0 = north, 90 = east
    params.putDouble("accuracy", accuracy);
    sendEvent(reactContext, "UpdateLocation", params);
  }

/*
  @Override
  public void headingUpdated(double heading) {
    Log.d("Geolocation", "Got new user heading ("
      + heading + ")");

    WritableMap params = Arguments.createMap();
    params.putDouble("heading", heading);
    sendEvent(reactContext, "UpdateHeading", params);
  }
*/

  @Override
  public void geofenceEntered(String name) {
    Log.d("Geolocation", "Entered geofence (" + name + ")");

    WritableMap params = Arguments.createMap();
    params.putString("name", name);
    params.putBoolean("didEnter", true);
    sendEvent(reactContext, "GeofenceEvent", params);
  }

  @Override
  public void errorOccurred(String error) {
    Log.d("Geolocation", "Got error (" + error + ")");

    WritableMap params = Arguments.createMap();
    params.putString("msg", error);
    sendEvent(reactContext, "LocationError", params);
  }

  private void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap params) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, params);
  }
}
