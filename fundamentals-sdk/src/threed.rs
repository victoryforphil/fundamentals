use fundamentals_core::{
    recording::Recording, 
    widgets::{Widget, three_d_view::{ThreeDPrimative, ThreeDViewData}},
    viz::Viz
};

pub struct ThreeDView {
    name: String,
    primatives: Vec<(f64, ThreeDPrimative)>,
}

impl ThreeDView {
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            primatives: Vec::new(),
        }
    }

    pub fn add_points(&mut self, points: Vec<(f64, f64, f64)>, intensity: f64) {
        self.primatives.push((intensity, ThreeDPrimative::Point(points)));
    }

    pub fn log(&self, recording: &mut Recording) {
        recording.add_viz(self.as_viz());
    }

    pub fn as_view_data(&self) -> ThreeDViewData {
        ThreeDViewData {
            primatives: self.primatives.clone(),
        }
    }

    pub fn as_viz(&self) -> Viz {
        let three_d_view_data = self.as_view_data();
        let widget = Widget::ThreeDView(three_d_view_data);
        Viz::new(self.name.clone()).with_widget(widget)
    }
} 