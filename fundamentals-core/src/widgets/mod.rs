pub mod plot_scalar;
pub mod three_d_view;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Widget{
    PlotScalar(plot_scalar::PlotScalarData),
    ThreeDView(three_d_view::ThreeDViewData),
}