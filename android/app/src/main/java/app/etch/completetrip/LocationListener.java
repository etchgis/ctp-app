package app.etch.completetrip;

import android.location.Location;

public interface LocationListener {
    void locationUpdated(Location location);
    // void headingUpdated(double heading);
    void geofenceEntered(String name);
    void errorOccurred(String error);
}
