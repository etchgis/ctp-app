package app.etch.completetrip;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.pm.PackageManager;
import android.location.Location;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.tasks.OnSuccessListener;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

// TODO: pause when app goes to background

// Global location manager that centralizes all control of GPS usage.
public class GlobalLocationManager {

    private static final long GPS_AREA_INTERVAL_MS = 5000L;
    private static final long GPS_NAVI_INTERVAL_MS = 1000L;

    private static final long GPS_AREA_MAX_WAIT_TIME = GPS_AREA_INTERVAL_MS * 5;  // batching several updates
    private static final long GPS_NAVI_WAIT_TIME = GPS_NAVI_INTERVAL_MS * 1;  // batching several updates
    private static final long GPS_PASSIVE_INTERVAL = 1000L;  // max rate we get updates from other apps using GPS

    private static GlobalLocationManager singleton = null;
    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private Location lastLocation = null;

    private int accuracyLevel = 1;
    private boolean running = false;

    private Activity activity;

    private List<LocationListener> listeners = new ArrayList<>();

    public static void init(Activity activity) {
        singleton = new GlobalLocationManager(activity);
    }

    public static GlobalLocationManager getInstance() {
        return singleton;
    }

    // private constructor so other instances can't be created
    private GlobalLocationManager(Activity activity) {
        this.activity = activity;
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(activity);
        locationCallback = new LocationListeningCallback();
    }

    private void initLocationEngine() {
        resumeLocationListening();
    }

    public void pauseLocationListening() {
        if (fusedLocationClient != null) {
            fusedLocationClient.removeLocationUpdates(locationCallback);
            running = false;
        }
    }

    public void resumeLocationListening() {
        if (fusedLocationClient != null) {
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                    || ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {

                LocationRequest request = LocationRequest.create()
                        .setInterval(accuracyLevel == 1 ? GPS_AREA_INTERVAL_MS : GPS_NAVI_INTERVAL_MS)
                        .setFastestInterval(GPS_PASSIVE_INTERVAL)
                        .setPriority(accuracyLevel == 1 ? LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY : LocationRequest.PRIORITY_HIGH_ACCURACY)
                        .setMaxWaitTime(accuracyLevel == 1 ? GPS_AREA_MAX_WAIT_TIME : GPS_NAVI_WAIT_TIME);

                fusedLocationClient.requestLocationUpdates(request, locationCallback, activity.getMainLooper());
                // fusedLocationClient.getLastLocation().addOnSuccessListener(new OnSuccessListener<Location>() {
                //     @Override
                //     public void onSuccess(Location location) {
                //         if (location != null) {
                //             onNewPoint(location);
                //         }
                //     }
                // });

                running = true;
            }
        }
    }

    public void turnOnLocation() {
        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            initLocationEngine();
        } else {
            ActivityCompat.requestPermissions(activity, new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, 1);
        }
    }

    public void setAccuracy(int accuracyLevel) {
        boolean wasRunning = running;
        this.accuracyLevel = accuracyLevel;
        pauseLocationListening();
        if (wasRunning)
            resumeLocationListening();
    }

    public void addListener(LocationListener listener) {
        if (!listeners.contains(listener)) {
            listeners.add(listener);
        }
    }

    public void removeListener(LocationListener listener) {
        if (listener != null && listeners.contains(listener)) {
            listeners.remove(listeners.indexOf(listener));
        }
    }

    public void simulate(double lat, double lng, double heading, double speed) {
        Location location = new Location("");
        location.setLatitude(lat);
        location.setLongitude(lng);
        location.setBearing((float) heading);
        location.setSpeed((float) speed);
        location.setAccuracy(0);
        onNewPoint(location);
    }

    private void onNewPoint(Location location) {
        lastLocation = location;
        for (LocationListener l : listeners) {
            l.locationUpdated(location);
        }
    }

    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        if (requestCode == 1) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                turnOnLocation();
            } else {
                for (LocationListener l : listeners) {
                    l.errorOccurred("Permission not granted");
                }
            }
        }
    }

    private class LocationListeningCallback extends LocationCallback {

        @Override
        public void onLocationResult(LocationResult result) {
            if (result == null) {
                return;
            }
            Location location = result.getLastLocation();
            if (location != null) {
                onNewPoint(location);
            }
        }
    }
}
