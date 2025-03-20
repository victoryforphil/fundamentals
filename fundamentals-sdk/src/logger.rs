use std::path::PathBuf;

use fundamentals_core::recording::Recording;
use log::info;



pub struct Logger{
    pub name: String,
    pub session_id: String,
    pub recording: Recording,
}

impl Logger{
    pub fn new(name: String) -> Self{
        info!("Creating logger for {}", name);
        let session_id = uuid::Uuid::new_v4().to_string();
        Self{name: name.clone(), session_id: session_id.clone(), recording: Recording::new(name, session_id)}
    }

    pub fn save(&self, path: &PathBuf) -> Result<(), anyhow::Error>{
        info!("Saving recording to {}", path.display());
        self.recording.save_to_file(path)
    }
    
    pub async fn launch_bridge(&self, open_browser: bool) -> Result<(), anyhow::Error> {
        // First save the recording to a file
        let path = PathBuf::from("recording.json");
        self.save(&path)?;
        
        // Then launch the bridge
        let recording_path = path.clone();
        let port = 3031;
        
        // Spawn a new thread to run the async bridge server
        let handle = std::thread::spawn(move || {
            let rt = tokio::runtime::Runtime::new().unwrap();
            rt.block_on(async {
                fundamentals_bridge::start_server_with_recording(recording_path, port, true, open_browser).await;
            });
        });
        handle.join().unwrap();
        
        Ok(())
    }
    
    pub fn launch_tauri(&self) -> Result<(), anyhow::Error> {
        // First save the recording to the default path expected by Tauri
        let path = PathBuf::from("recording.json");
        self.save(&path)?;
        
        // Change the working directory to the repository root to ensure proper asset resolution
        let current_dir = std::env::current_dir()?;
        let repo_root = current_dir.ancestors()
            .find(|p| p.join("fundamentals-web").exists())
            .ok_or_else(|| anyhow::anyhow!("Could not find repository root"))?;
        
        std::env::set_current_dir(repo_root)?;
        info!("Changed working directory to repository root: {}", repo_root.display());
        
        fundamentals_tauri_lib::run();
        
        info!("Tauri app launched with default recording at recording.json");
        Ok(())
    }
    
    pub fn launch_tauri_with_recording(&self, recording_path: Option<PathBuf>, port: Option<u16>) -> Result<(), anyhow::Error> {
        // Use provided path or default
        let path = recording_path.unwrap_or_else(|| PathBuf::from("recording.json"));
        let port = port.unwrap_or(3031);
        
        // Save the recording
        self.save(&path)?;
        
        // Change the working directory to the repository root to ensure proper asset resolution
        let current_dir = std::env::current_dir()?;
        let repo_root = current_dir.ancestors()
            .find(|p| p.join("fundamentals-web").exists())
            .ok_or_else(|| anyhow::anyhow!("Could not find repository root"))?;
        
        std::env::set_current_dir(repo_root)?;
        info!("Changed working directory to repository root: {}", repo_root.display());
        
        info!("Saved recording to {} for Tauri app", path.display());
        
        // Save the absolute path for use in the Tauri app
        let abs_path = std::fs::canonicalize(&path)?;
        let abs_path_str = abs_path.to_string_lossy().to_string();
        
        // If we're using the default path, Tauri will auto-detect it
        // Otherwise we need to manually start the bridge once Tauri launches
        let use_custom_path = path.to_string_lossy() != "recording.json";
        
        // Use a clone of the path for the closure
        let path_for_closure = abs_path_str.clone();
        let port_for_closure = port;
        
        fundamentals_tauri_lib::run();
        
        info!("Launched Tauri app");
        
        if use_custom_path {
            // For non-default paths, we should give instructions on how to connect
            info!("For non-default recording paths, use the start_bridge_with_recording command from the Tauri frontend:");
            info!("await invoke('start_bridge_with_recording', {{ path: '{}', port: {} }})", abs_path_str, port);
        }
        
        Ok(())
    }
}

impl Drop for Logger{
    fn drop(&mut self){
        let path = PathBuf::from("recording.json");
        self.save(&path).unwrap();
    }
}
