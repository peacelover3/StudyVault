# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.swmansion.** { *; }
-dontwarn com.facebook.**
-dontwarn org.bouncycastle.**
-dontwarn org.apache.commons.**

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Google Play Services
-keep class com.google.android.gms.common.** { *; }
-keep class com.google.android.gms.auth.** { *; }

# Crypto
-keepclassmembers class * {
    *** *Cipher*(...);
}

# Preserve annotations
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception

# Notifee
-keep class com.notifee.** { *; }
-dontwarn com.notifee.**
