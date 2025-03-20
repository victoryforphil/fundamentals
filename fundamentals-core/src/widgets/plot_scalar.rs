use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlotScalarData {
    pub data_x: Vec<(f64, f64)>,
}

impl PlotScalarData {
    pub fn new(data_x: Vec<(f64, f64)>) -> Self {
        Self { data_x }
    }
}
