use serde::{Deserialize, Serialize};

use crate::widgets::Widget;

#[derive(Debug, Clone, Serialize, Deserialize)]

pub struct Viz {
    pub name: String,
    pub source: Option<String>,
    pub widgets: Vec<Widget>,
    pub range: Option<(f64, f64)>,
}

impl Viz {
    pub fn new(name: String) -> Self {
        Self {
            name,
            source: None,
            widgets: Vec::new(),
            range: None,
        }
    }

    pub fn with_widget(mut self, widget: Widget) -> Self {
        self.widgets.push(widget);
        self
    }

    pub fn add_widget(&mut self, widget: Widget) {
        self.widgets.push(widget);
    }

    pub fn set_source(&mut self, source: String) {
        self.source = Some(source);
    }

    pub fn set_range(&mut self, range: (f64, f64)) {
        self.range = Some(range);
    }

    pub fn get_name(&self) -> &str {
        &self.name
    }
}
