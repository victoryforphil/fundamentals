use crate::state::StateHandle;
use fundamentals_core::viz::Viz;
use log::{debug, error, info};
use std::collections::BTreeMap;
use warp::ws::{Message, WebSocket};
use warp::{Rejection, Reply};
type Result<T> = std::result::Result<T, Rejection>;


use futures::{FutureExt, SinkExt, StreamExt};
use arrow::error::ArrowError;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

#[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
pub enum WSMessage {
   VizUpdate(Viz),
}

// Flag to track if the application should exit after serving
static EXIT_AFTER_SERVE: AtomicBool = AtomicBool::new(false);

// Function to set the exit after serve flag
pub fn set_exit_after_serve(exit: bool) {
    EXIT_AFTER_SERVE.store(exit, Ordering::SeqCst);
}

pub async fn ws_handler(ws: warp::ws::Ws, state: StateHandle) -> Result<impl Reply> {
    // Clone state outside the closure to avoid the borrowed value error
    let state_clone = state.clone();
    
    Ok(ws.on_upgrade(move |socket| async move {
        ws_connect(socket, state_clone).await;
        
        // If EXIT_AFTER_SERVE is true, exit the application after serving
        if EXIT_AFTER_SERVE.load(Ordering::SeqCst) {
            info!("Exit after serve flag is set, shutting down...");
            // Use a small delay to ensure all pending messages are sent before exit
            tokio::time::sleep(std::time::Duration::from_millis(200)).await;
            std::process::exit(0);
        }
    }))
}

pub async fn ws_connect(ws: WebSocket, state: StateHandle) {
    info!("New WebSocket connection");

    let (mut client_ws_sender, _client_ws_rcv) = ws.split();

    let recordings = state.lock().await;

    for recording in recordings.recordings.iter(){
        for viz in recording.vizs.iter(){
            let msg_json = serde_json::to_string(&WSMessage::VizUpdate(viz.clone())).unwrap();
            client_ws_sender.send(Message::text(msg_json)).await.unwrap();
            info!("Sent VizUpdate message");
            // Wait 50ms
            tokio::time::sleep(std::time::Duration::from_millis(50)).await;
        }
    }
}