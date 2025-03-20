
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ThreeDPrimative{
    Point(Vec<(f64, f64, f64)>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreeDViewData{
    pub primatives: Vec<(f64, ThreeDPrimative)>,
}


