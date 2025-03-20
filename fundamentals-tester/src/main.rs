use std::path::PathBuf;

use fundamentals_sdk::{logger::Logger, plotter::Plotter};
use clap::Parser;
use log::info;
#[derive(Parser, Debug, Clone)]
#[clap(author, version, about)]
struct Args {
    #[clap(short, long, default_value = "test_logger.json")]
    output: String,
}
#[tokio::main]
async fn main() {   
    let args = Args::parse();
    pretty_env_logger::init();  
    info!("Starting Test Logger");

    let mut logger = Logger::new("Test Logger".to_string());

    let mut plotter = Plotter::new("Test Plotter");
    
    // Generate 100 sin waves
    for i in 0..100 {
        let x = i as f64 / 10.0;
        let y = (x * 10.0).sin();
        plotter.add_point(x, y);
    }
    info!("Logging Test Plotter");
    plotter.log(&mut logger.recording);

    info!("Launching Web Viewer");
    logger.launch_bridge().await.unwrap();

    
}
