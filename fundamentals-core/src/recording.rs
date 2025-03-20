use std::{fs::File, io::{BufReader, BufWriter}, path::PathBuf};

use crate::viz::Viz;    
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Recording{
    pub name: String,
    pub session_id: String,
    pub vizs: Vec<Viz>,
}

impl Recording{
    pub fn new(name: String, session_id: String) -> Self{
        Self{name, session_id, vizs: Vec::new()}
    }

    pub fn add_viz(&mut self, viz: Viz){
        self.vizs.push(viz);
    }

    pub fn get_vizs(&self) -> &Vec<Viz>{
        &self.vizs
    }

    pub fn save_to_file(&self, path: &PathBuf) -> Result<(), anyhow::Error>{
        let file = File::create(path)?;
        let writer = BufWriter::new(file);
        serde_json::to_writer(writer, self)?;
        Ok(())
    }

    pub fn load_from_file(path: &PathBuf) -> Result<Self, anyhow::Error>{
        let file = File::open(path)?;
        let reader = BufReader::new(file);
        let recording: Self = serde_json::from_reader(reader)?;
        Ok(recording)
    }
}
