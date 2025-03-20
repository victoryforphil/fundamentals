use clap::Parser;
use fundamentals_core::recording::Recording;
use log::info;
use std::net::SocketAddr;
use std::path::{Path, PathBuf};
use warp::Filter;

pub mod state;
pub mod ws_handler;

/// Command line arguments for the WebSocket bridge
#[derive(Parser, Debug, Clone)]
#[clap(author, version, about)]
pub struct WSBridgeArgs {
    /// WebSocket server address
    #[clap(short, long, default_value = "127.0.0.1")]
    pub address: String,

    /// WebSocket server port
    #[clap(short, long, default_value_t = 3031)]
    pub port: u16,

    /// Path to the input recording file
    #[clap(short, long)]
    pub input: PathBuf,

    /// Exit after serving the first request
    #[clap(long)]
    pub exit_after_serve: bool,

    /// Open the browser after serving the first request
    #[clap(long)]
    pub open_browser: bool,
}

/// Starts the WebSocket bridge server with the given arguments
pub async fn start_server(args: WSBridgeArgs) {
    // Set the exit_after_serve flag from arguments
    ws_handler::set_exit_after_serve(args.exit_after_serve);

    // Initialize state with command line arguments
    let mut state = state::WSBridgeState::new();
    let recording = Recording::load_from_file(&args.input).unwrap();
    state.add_recording(recording);

    info!("Loaded recording from {}", args.input.display());

    if args.exit_after_serve {
        info!(
            "Exit after serve flag is set - application will exit after serving the first request"
        );
    }

    let state = state.as_handle();

    // WebSocket route
    let ws_route = warp::path("ws")
        // The `ws()` filter will prepare the Websocket handshake.
        .and(warp::ws())
        .and(with_state(state))
        .and_then(ws_handler::ws_handler);

    // Static files route - serve files from the static directory
    let cargo_root = std::env::var("CARGO_MANIFEST_DIR").unwrap_or_else(|_| ".".to_string());
    let static_dir = Path::new(&cargo_root)
        .parent()
        .unwrap_or(Path::new("."))
        .join("fundamentals-web/dist");

    // Route to serve static files
    let static_route = warp::fs::dir(static_dir.clone());

    // SPA fallback route - redirect all non-matching routes to index.html
    // This is necessary for React Router to work properly in a SPA
    let index_html_path = static_dir.join("index.html");
    let spa_fallback = warp::any().and(warp::fs::file(index_html_path));

    // Combine all routes with proper precedence:
    // 1. WebSocket route first
    // 2. Static files for exact matches
    // 3. Fallback to index.html for everything else (SPA routing)
    let routes = ws_route.or(static_route).or(spa_fallback);

    let socket_addr: SocketAddr = format!("0.0.0.0:{}", args.port).parse().unwrap();
    println!("Server started at http://0.0.0.0:{}", args.port);

    // Auto open static path + /plot/0
    if args.open_browser {
        let url = format!("http://localhost:{}", args.port);
        open::that(url).unwrap();
    }

    warp::serve(routes).run(socket_addr).await;
}

/// Starts the WebSocket bridge server with the given recording file
pub async fn start_server_with_recording(
    recording_path: PathBuf,
    port: u16,
    exit_after_serve: bool,
    open_browser: bool,
) {
    let args = WSBridgeArgs {
        address: "127.0.0.1".to_string(),
        port,
        input: recording_path,
        exit_after_serve,
        open_browser,
    };

    start_server(args).await;
}

fn with_state(
    state: state::StateHandle,
) -> impl Filter<Extract = (state::StateHandle,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || state.clone())
}
