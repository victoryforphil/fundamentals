use std::path::PathBuf;

use fundamentals_sdk::{logger::Logger, plotter::Plotter, threed::ThreeDView};
use clap::Parser;
use log::info;
#[derive(Parser, Debug, Clone)]
#[clap(author, version, about)]
struct Args {
    #[clap(short, long, default_value = "test_logger.json")]
    output: String,

    #[clap(short, long, default_value = "false")]
    viewer: bool,

    #[clap(short, long, default_value = "true")]
    bridge: bool,

    #[clap(short, long, default_value = "false")]
    open_browser: bool,
}
#[tokio::main]
async fn main() {   
    let args = Args::parse();
    pretty_env_logger::init();  
    info!("Starting Test Logger");

    let mut logger = Logger::new("Test Logger".to_string());

    // Create and log a plot scalar visualization
    let mut plotter = Plotter::new("Test Plotter");
    
    // Generate 100 sin waves
    for i in 0..100 {
        let x = i as f64 / 20.0;
        let y = (x * 10.0).sin();
        plotter.add_point(x, y);
    }
    info!("Logging Test Plotter");
    plotter.log(&mut logger.recording);

    // Create and log a 3D visualization
    let mut three_d_view = ThreeDView::new("Test 3D View");
    
    // Generate a spiral of 3D points
    let mut points = Vec::new();
    for i in 0..100 {
        let t = i as f64 * 0.1;
        let x = t.cos() * t;
        let y = t.sin() * t;
        let z = t * 0.5;
        points.push((x, y, z));
    }
    three_d_view.add_points(points, 1.0);
    
    info!("Logging 3D View");
    three_d_view.log(&mut logger.recording);

    if args.viewer {
        info!("Launching Web Viewer");
        logger.launch_tauri().unwrap();
    }

    if args.bridge {
        info!("Launching Bridge");
        logger.launch_bridge(args.open_browser).await.unwrap();
    }
}
