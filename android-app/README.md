# TrueID Android App

The TrueID Android application provides a secure and convenient way for users to manage their digital identity and biometric data on their mobile devices.

## Features

- Secure biometric authentication
- Digital identity management
- Document scanning and verification
- QR code generation for identity verification
- Offline capability for basic functions
- Real-time blockchain status updates
- Push notifications for important updates

## Tech Stack

- Kotlin/Java
- Android SDK
- Room Database for local storage
- Retrofit for API communication
- Biometric API integration
- CameraX for document scanning
- WorkManager for background tasks
- Jetpack Compose for modern UI

## Prerequisites

- Android Studio Arctic Fox or newer
- JDK 11 or newer
- Android SDK 31 (Android 12) or newer
- Gradle 7.0 or newer

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/trueid.git
cd trueid/android-app
```

2. Open the project in Android Studio

3. Create a `local.properties` file with your SDK path:
```properties
sdk.dir=/path/to/your/Android/Sdk
```

4. Sync the project with Gradle files

5. Build and run the app:
```bash
./gradlew assembleDebug
```

## Configuration

The app requires the following configurations in `app/src/main/res/values/config.xml`:

- API endpoints
- Blockchain network settings
- Biometric service configuration
- Push notification settings

## Security Features

- Biometric authentication
- Secure storage using EncryptedSharedPreferences
- Certificate pinning
- ProGuard/R8 code obfuscation
- Root detection
- SSL pinning
- Secure key storage

## Testing

Run the test suite:
```bash
./gradlew test
```

Run UI tests:
```bash
./gradlew connectedAndroidTest
```

## Building for Production

1. Update version in `build.gradle`
2. Generate signed APK/Bundle:
```bash
./gradlew bundleRelease
```

## Contributing

Please follow the contribution guidelines in the main project README.

## License

This project is licensed under the MIT License - see the main project LICENSE file for details. 