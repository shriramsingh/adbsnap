import SwiftUI

@main
struct ADBSnapExplorerDemoApp: App {
    var body: some Scene {
        WindowGroup {
            ExplorerDemoTabs()
        }
    }
}

private struct ExplorerDemoTabs: View {
    var body: some View {
        TabView {
            DemoScreen(title: "Home")
                .tabItem {
                    Label("Home", systemImage: "house")
                }

            DemoScreen(title: "Search")
                .tabItem {
                    Label("Search", systemImage: "magnifyingglass")
                }

            DemoScreen(title: "Profile")
                .tabItem {
                    Label("Profile", systemImage: "person")
                }
        }
    }
}

private struct DemoScreen: View {
    let title: String

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Text(title)
                    .font(.largeTitle)
                    .accessibilityIdentifier("screen-\(title.lowercased())")

                if title == "Home" {
                    NavigationLink("View Details") {
                        DemoDetails()
                    }
                    .accessibilityIdentifier("open-details")
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(uiColor: .systemBackground))
                .navigationTitle(title)
        }
    }
}

private struct DemoDetails: View {
    var body: some View {
        VStack(spacing: 24) {
            Text("Details")
                .font(.largeTitle)
                .accessibilityIdentifier("screen-details")

            NavigationLink("More Info") {
                Text("More Info")
                    .font(.largeTitle)
                    .accessibilityIdentifier("screen-more-info")
                    .navigationTitle("More Info")
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(uiColor: .systemBackground))
        .navigationTitle("Details")
    }
}
