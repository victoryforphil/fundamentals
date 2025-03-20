pub mod plot_scalar;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Widget{
    PlotScalar(plot_scalar::PlotScalarData),
}