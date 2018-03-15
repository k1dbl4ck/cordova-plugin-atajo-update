package io.atajo.qas.admin;

import android.content.SharedPreferences;
import android.util.Log;

import android.os.Bundle;
import org.apache.cordova.*;
import android.app.Activity;

public class MainActivity extends CordovaActivity {
    public static final String TAG = "ATAJO:OVERRIDE:ACTIVITY";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // enable Cordova apps to be started in the background
        Bundle extras = getIntent().getExtras();
        if (extras != null && extras.getBoolean("cdvStartInBackground", false)) {
            moveTaskToBack(true);
        }

        String PREFS_NAME = preferences.getString("NativeStorageSharedPreferencesName", "NativeStorage");
        SharedPreferences sharedPref = this.getSharedPreferences(PREFS_NAME, Activity.MODE_PRIVATE);
        String location = sharedPref.getString("atajo.code.update.location", "null");
        location = location.replace("\"", "");

        // Set by <content src="index.html" /> in config.xml
        if (location != "null") {
            Log.d(TAG, "LAUNCING UPDATED CODE FROM : " + location);
            loadUrl(location);
        } else {
            Log.d(TAG, "LAUNCHING DEFAULT (COMPILED) CODE FROM : " + launchUrl);
            loadUrl(launchUrl);

        }

    }
}