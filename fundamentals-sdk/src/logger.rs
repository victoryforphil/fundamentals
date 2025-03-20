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
    
    pub async fn launch_bridge(&self) -> Result<(), anyhow::Error> {
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
                fundamentals_bridge::start_server_with_recording(recording_path, port).await;
            });
        });
        handle.join().unwrap();
        
        Ok(())
    }
}

impl Drop for Logger{
    fn drop(&mut self){
        let path = PathBuf::from("recording.json");
        self.save(&path).unwrap();
    }
}
