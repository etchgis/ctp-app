package app.etch.completetrip.utils;

import android.content.res.Resources;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.AsyncTask;
import android.util.Log;

import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;

/**
 * Created by nickitaliano on 9/13/17.
 */

public class DownloadImageTask extends AsyncTask<String, Void, Bitmap> {
  public static final String LOG_TAG = DownloadImageTask.class.getSimpleName();

  private Context mContext;
  private OnImageLoaded mCallback;

  public DownloadImageTask(Context context, OnImageLoaded callback) {
    mContext = context;
    mCallback = callback;
  }

  public interface OnImageLoaded {
    void onImageLoaded(Bitmap image);
  }

  @SafeVarargs
  @Override
  protected final Bitmap doInBackground(String... params) {

    String uri = (String) params[0];

    if (uri.contains("://")) { // has scheme attempt to get bitmap from url
      try {
        InputStream bitmapStream = new URL(uri).openStream();
        Bitmap image = BitmapFactory.decodeStream(bitmapStream, null, null);
        bitmapStream.close();
        return image;
      } catch (Exception e) {
        Log.w(LOG_TAG, e.getLocalizedMessage());
        return Bitmap.createBitmap(1, 1, Bitmap.Config.ALPHA_8);
      }
    } else {
      Resources resources = mContext.getResources();
      int resID = resources.getIdentifier(uri, "drawable", mContext.getPackageName());
      Bitmap image = BitmapFactory.decodeResource(resources, resID, null);
      return image;
    }

  }

  @Override
  protected void onPostExecute(Bitmap image) {
    if (mCallback != null) {
      mCallback.onImageLoaded(image);
    }
  }
}
