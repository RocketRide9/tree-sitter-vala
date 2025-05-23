// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterVala",
    products: [
        .library(name: "TreeSitterVala", targets: ["TreeSitterVala"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterVala",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                // NOTE: if your language has an external scanner, add it here.
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterValaTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterVala",
            ],
            path: "bindings/swift/TreeSitterValaTests"
        )
    ],
    cLanguageStandard: .c11
)
