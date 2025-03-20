use fundamentals_core::{recording::Recording, viz::Viz, widgets::{plot_scalar::PlotScalarData, Widget}};

pub struct Plotter{
    pub name: String,
    pub points_x: Vec<f64>,
    pub points_y: Vec<f64>,
}

impl Plotter{
    pub fn new( name: &str) -> Self{
        Self{name: name.to_string(), points_x: Vec::new(), points_y: Vec::new()}
    }

    pub fn add_point(&mut self, x: f64, y: f64){
        self.points_x.push(x);
        self.points_y.push(y);
    }

    pub fn log(&self, recording: &mut Recording){
        recording.add_viz(self.as_viz());
    }

    pub fn as_scalar_data(&self) -> PlotScalarData{
        PlotScalarData::new(self.points_x.iter().zip(self.points_y.iter()).map(|(x, y)| (*x, *y)).collect())
    }
    pub fn as_viz(&self) -> Viz{
        let plot_scalar_data = self.as_scalar_data();
        let widget = Widget::PlotScalar(plot_scalar_data);
        Viz::new(self.name.clone()).with_widget(widget)
    }
}