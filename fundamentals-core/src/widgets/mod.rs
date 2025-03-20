pub mod plot_scalar;
pub mod three_d_view;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Widget{
    #[serde(rename = "plot_scalar")]
    PlotScalar(plot_scalar::PlotScalarData),
    #[serde(rename = "3d_view")]
    ThreeDView(three_d_view::ThreeDViewData),
}