// swift-tools-version:6.0
import PackageDescription
import Foundation

// ScreenCaptureKit's iOS APIs require the actual iOS 27 SDK, not a UA check.
// CI/build host sets this only after checking xcrun --sdk iphoneos --show-sdk-version.
let screenSDK = ProcessInfo.processInfo.environment["CLIPT_IOS27_SDK"] == "1"
let package = Package(
    name: "CliptBroadcastCore",
    platforms: [.iOS(.v15), .macOS(.v12)],
    products: [
        .library(name: "CliptBroadcastCore", targets: ["CliptBroadcastCore"]),
        .library(name: "CliptBroadcaster", targets: ["CliptBroadcaster"])
    ],
    dependencies: [
        .package(url: "https://github.com/HaishinKit/HaishinKit.swift", revision: "dc880cb540b8feeb98f64e8b7dcfaaf320b6b2bd"),
        .package(url: "https://github.com/shogo4405/Logboard.git", exact: "2.6.0"),
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.6.0")
    ],
    targets: [
        .target(name: "CliptBroadcastCore", dependencies: [
            .product(name: "HaishinKit", package: "HaishinKit.swift"),
            .product(name: "RTMPHaishinKit", package: "HaishinKit.swift"),
            .product(name: "Logboard", package: "Logboard")
        ], swiftSettings: screenSDK ? [.define("CLIPT_IOS27_SCREEN_CAPTURE")] : []),
        .target(name: "CliptBroadcaster", dependencies: [
            "CliptBroadcastCore", .product(name: "Capacitor", package: "capacitor-swift-pm")
        ]),
        .testTarget(name: "CliptBroadcastCoreTests", dependencies: ["CliptBroadcastCore"])
    ],
    swiftLanguageModes: [.v5]
)
