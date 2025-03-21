use clap::Parser;
use fundamentals_core::recording::Recording;
use log::info;
use warp::Filter;
use warp::Rejection;
mod state;
mod ws_handler;

// Import std::path for handling file paths
use std::path::{Path, PathBuf};

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
}

#[tokio::main]
async fn main() {
    let args = WSBridgeArgs::parse();
    pretty_env_logger::init();

    // Set the exit_after_serve flag from the command line argument
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
    let cargo_root = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let static_dir = Path::new(&cargo_root)
        .parent()
        .unwrap()
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

    println!("Server started at http://0.0.0.0:{}", args.port);

    // Wait 500ms before opening the browser
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;

    // Auto open static path + /plot/0?ws=ws://0.0.0.0:3031/ws
    let url = format!("http://localhost:{}/plot/0", args.port);

    open::that(url).unwrap();

    warp::serve(routes).run(([0, 0, 0, 0], args.port)).await;
}

fn with_state(
    state: state::StateHandle,
) -> impl Filter<Extract = (state::StateHandle,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || state.clone())
}
