package app.etch.completetrip;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.mapbox.mapboxsdk.Mapbox;

public class MapBoxLiteModule extends ReactContextBaseJavaModule {

  private ReactContext reactContext;

  public MapBoxLiteModule(ReactApplicationContext context) {
    super(context);
    reactContext = context;
  }

  @Override
  public String getName() {
    return "Mapbox";
  }

  @ReactMethod
  public void setAccessToken(final String accessToken, Promise promise) {
    reactContext.runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        Mapbox.getInstance(getReactApplicationContext(), accessToken);
        promise.resolve(accessToken);
      }
    });
  }

  @ReactMethod
  public void getAccessToken(Promise promise) {
    // WritableMap map = Arguments.createMap();
    // map.putString("accessToken", Mapbox.getAccessToken());
    // promise.resolve(map);
    promise.resolve(Mapbox.getAccessToken());
  }

  // @ReactMethod
  // public void test(Promise promise) {
  //   MBLMapView mapView = (MBLMapView) ((Activity) Mapbox.getContext()).findViewById(R.id.textView1);
  // }

}
