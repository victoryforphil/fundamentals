use std::collections::BTreeMap;

use fundamentals_core::recording::Recording;

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct WSBridgeState {
    pub recordings: Vec<Recording>,
}

pub type StateHandle = std::sync::Arc<tokio::sync::Mutex<WSBridgeState>>;

impl Default for WSBridgeState {
    fn default() -> Self {
        Self {
            recordings: Vec::new(),
        }
    }
}

impl WSBridgeState {
    pub fn new() -> Self {
        Default::default()
    }

    pub fn as_handle(self) -> StateHandle {
        std::sync::Arc::new(tokio::sync::Mutex::new(self))
    }

    pub fn add_recording(&mut self, recording: Recording) {
        self.recordings.push(recording);
    }

    pub fn get_recordings(&self) -> &Vec<Recording> {
        &self.recordings
    }
}
