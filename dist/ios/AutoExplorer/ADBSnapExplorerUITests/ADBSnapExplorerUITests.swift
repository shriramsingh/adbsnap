import XCTest

private struct NavigationAction {
    let label: String
    let identifier: String
    let occurrence: Int
}

private struct ScreenRoute {
    let tabLabel: String?
    let tabIndex: Int
    let actions: [NavigationAction]

    var displayName: String {
        ([tabLabel ?? "Home"] + actions.map(\.label)).joined(separator: "-")
    }
}

final class ADBSnapExplorerUITests: XCTestCase {
    private let maximumDepth = 2
    private let maximumScreens = 20
    private let maximumNavigationAttempts = 30
    private let navigationLabels = [
        "about", "account", "browse", "details", "explore", "help", "learn more",
        "menu", "more info", "notifications", "preferences", "profile", "see all",
        "settings", "view",
    ]
    private let excludedLabels = [
        "accept", "allow", "buy", "cancel", "clear", "confirm", "decline", "delete",
        "deny", "disable", "download", "enable", "log out", "logout", "pay",
        "post", "purchase", "remove", "reset", "save", "send", "share", "sign out",
        "signout", "submit", "subscribe", "unsubscribe", "upload",
    ]

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testExploreReachableScreens() throws {
        guard
            let bundleIdentifier = Bundle(for: ADBSnapExplorerUITests.self)
                .object(forInfoDictionaryKey: "ADBSNAP_TARGET_BUNDLE_ID") as? String,
            !bundleIdentifier.isEmpty
        else {
            XCTFail("Missing ADBSNAP_TARGET_BUNDLE_ID build setting.")
            return
        }

        let app = XCUIApplication(bundleIdentifier: bundleIdentifier)
        app.launch()
        XCTAssertTrue(
            app.wait(for: .runningForeground, timeout: 30),
            "App \(bundleIdentifier) did not reach the foreground."
        )

        let tabButtons = app.tabBars.buttons
        let tabs = tabButtons.allElementsBoundByIndex.compactMap { button -> String? in
            let label = button.label.trimmingCharacters(in: .whitespacesAndNewlines)
            return !label.isEmpty && button.isEnabled ? label : nil
        }
        let initialRoutes: [ScreenRoute]
        if tabs.isEmpty {
            initialRoutes = [ScreenRoute(tabLabel: nil, tabIndex: -1, actions: [])]
        } else {
            initialRoutes = tabs.enumerated().map { index, label in
                ScreenRoute(tabLabel: label, tabIndex: index, actions: [])
            }
        }

        var pendingRoutes = initialRoutes
        var nextRoute = 0
        var attemptedRoutes = 0
        var attachmentIndex = 0
        var visitedRoutes = Set<String>()

        while nextRoute < pendingRoutes.count &&
                attachmentIndex < maximumScreens &&
                attemptedRoutes < maximumNavigationAttempts {
            let route = pendingRoutes[nextRoute]
            nextRoute += 1
            let routeKey = Self.routeKey(route)
            guard visitedRoutes.insert(routeKey).inserted else { continue }

            XCTAssertTrue(
                open(route, in: app),
                "Could not replay navigation path '\(route.displayName)' in \(bundleIdentifier)."
            )
            Thread.sleep(forTimeInterval: 0.4)

            attachmentIndex += 1
            let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
            attachment.name = String(
                format: "ADBSnap-screen-%03d-%@",
                attachmentIndex,
                Self.fileSafe(route.displayName)
            )
            attachment.lifetime = .keepAlways
            add(attachment)

            guard route.actions.count < maximumDepth else { continue }
            for action in navigationActions(in: app, hasNavigationHistory: !route.actions.isEmpty) {
                guard attemptedRoutes < maximumNavigationAttempts else { break }
                let childRoute = ScreenRoute(
                    tabLabel: route.tabLabel,
                    tabIndex: route.tabIndex,
                    actions: route.actions + [action]
                )
                let childKey = Self.routeKey(childRoute)
                guard !visitedRoutes.contains(childKey) else { continue }
                pendingRoutes.append(childRoute)
                attemptedRoutes += 1
            }
        }

        XCTAssertGreaterThan(attachmentIndex, 0, "No screens were captured from \(bundleIdentifier).")
        app.terminate()
    }

    private func open(_ route: ScreenRoute, in app: XCUIApplication) -> Bool {
        if app.state == .runningForeground {
            app.terminate()
        }
        app.launch()
        guard app.wait(for: .runningForeground, timeout: 30) else { return false }

        if route.tabIndex >= 0 {
            let tabButtons = app.tabBars.buttons
            guard route.tabIndex < tabButtons.count else { return false }
            let tab = tabButtons.element(boundBy: route.tabIndex)
            guard tab.label == route.tabLabel, tab.isEnabled, tab.isHittable else { return false }
            tab.tap()
            Thread.sleep(forTimeInterval: 0.3)
        }

        for action in route.actions {
            guard navigationActions(in: app, hasNavigationHistory: !route.actions.isEmpty).contains(where: {
                $0.label == action.label &&
                    $0.identifier == action.identifier &&
                    $0.occurrence == action.occurrence
            }) else {
                return false
            }
            let matches = app.buttons.allElementsBoundByIndex.filter {
                $0.label == action.label && $0.identifier == action.identifier && $0.isHittable
            }
            guard action.occurrence < matches.count else { return false }
            matches[action.occurrence].tap()
            Thread.sleep(forTimeInterval: 0.4)
        }
        return true
    }

    private func navigationActions(
        in app: XCUIApplication,
        hasNavigationHistory: Bool
    ) -> [NavigationAction] {
        let tabBar = app.tabBars.firstMatch
        let navigationBar = app.navigationBars.firstMatch
        var occurrences: [String: Int] = [:]
        var actions: [NavigationAction] = []

        for button in app.buttons.allElementsBoundByIndex {
            let label = button.label.trimmingCharacters(in: .whitespacesAndNewlines)
            let normalizedLabel = label.lowercased()
            guard !label.isEmpty, button.isEnabled, button.isHittable else { continue }
            if tabBar.exists && tabBar.frame.contains(CGPoint(x: button.frame.midX, y: button.frame.midY)) { continue }
            if hasNavigationHistory &&
                navigationBar.exists &&
                navigationBar.frame.contains(CGPoint(x: button.frame.midX, y: button.frame.midY)) &&
                button.frame.midX < navigationBar.frame.midX {
                continue
            }
            guard !excludedLabels.contains(where: { normalizedLabel.contains($0) }) else { continue }
            guard navigationLabels.contains(where: {
                normalizedLabel == $0 || normalizedLabel.hasPrefix("\($0) ")
            }) else { continue }

            let key = "\(button.identifier)|\(label)"
            let occurrence = occurrences[key, default: 0]
            occurrences[key] = occurrence + 1
            actions.append(NavigationAction(label: label, identifier: button.identifier, occurrence: occurrence))
        }
        return actions
    }

    private static func routeKey(_ route: ScreenRoute) -> String {
        let path = route.actions.map { "\($0.identifier)|\($0.label)|\($0.occurrence)" }
        return "\(route.tabIndex)|\(route.tabLabel ?? "Home")|\(path.joined(separator: "/"))"
    }

    private static func fileSafe(_ value: String) -> String {
        let safe = value.replacingOccurrences(
            of: "[^A-Za-z0-9_-]+",
            with: "-",
            options: .regularExpression
        )
        return String((safe.isEmpty ? "Screen" : safe).prefix(72))
    }
}
