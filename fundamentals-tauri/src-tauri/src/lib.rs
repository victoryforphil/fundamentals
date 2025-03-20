// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::path::PathBuf;
use std::sync::Arc;
use tokio::runtime::Runtime;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn start_bridge_with_recording(path: String, port: u16) -> Result<String, String> {
    let recording_path = PathBuf::from(path);

    // Create a Tokio runtime for the bridge
    let rt = Arc::new(Runtime::new().expect("Failed to create Tokio runtime"));

    // Spawn the bridge server in a separate thread
    std::thread::spawn(move || {
        rt.block_on(async {
            // Launch the bridge with the recording
            fundamentals_bridge::start_server_with_recording(recording_path, port, false, false)
                .await;
        });
    });

    Ok(format!("Bridge started on port {}", port))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Default recording file path
    let default_recording = PathBuf::from("recording.json");
    let default_port = 3031;

    // Log the current working directory to help with debugging
    println!(
        "Current working directory: {:?}",
        std::env::current_dir().unwrap_or_default()
    );

    // Create a Tokio runtime for the bridge
    let rt = Arc::new(Runtime::new().expect("Failed to create Tokio runtime"));
    let rt_clone = rt.clone();

    // Check if the default recording file exists
    if default_recording.exists() {
        // Spawn the bridge server in a separate thread with the default recording
        let recording_path = default_recording.clone();
        std::thread::spawn(move || {
            rt_clone.block_on(async {
                // Launch the bridge with the recording
                fundamentals_bridge::start_server_with_recording(
                    recording_path,
                    default_port,
                    true,
                    false,
                )
                .await;
            });
        });
    } else {
        // Log that no recording file was found
        eprintln!(
            "No recording file found at {:?}. Bridge server not started automatically.",
            default_recording
        );
        eprintln!(
            "You can start the bridge manually using the start_bridge_with_recording command."
        );
    }

    // Log the tauri.conf.json path and content for debugging
    let mut context = tauri::generate_context!();

    // Launch the Tauri application with custom dev web address in case paths are wrong
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, start_bridge_with_recording])
        .run(context)
        .expect("error while running tauri application");

    while true {
        std::thread::sleep(std::time::Duration::from_secs(1));
    }
}
