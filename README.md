# Complete Trip

## Adding Packages
In some cases adding a package via `yarn` will result in iOS Pods being automatically installed.  When this happens the Pod `React-Codegen` has it's iOS Deployment Target rest to 11.0 causing builds to fail.  

To fix this open Xcode, click on ***Pods*** in ***Project Navigator***, and look for ***React-Codegen*** under targets.  Scroll down to the property ***iOS Deployment Target*** and change to ***12.4***.

## Android
If Android changes are not detected when debugging, run the following command.
```
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/
```

```
source ~/.bash_profile
adb reverse tcp:8081 tcp:8081
npx react-native run-android
```

However, after running that command several folders are created that cause the command `./gradlew bundleRelease` to fail.  Prior to running this command delete the folders in `\android\app\src\main\res` that start with `\drawable-`, being sure to KEEP the folder named `drawable`.