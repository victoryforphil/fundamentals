declare module 'react-plotly.js' {
  import * as React from 'react';
  import * as Plotly from 'plotly.js';
  
  interface PlotProps {
    data?: Plotly.Data[];
    layout?: Partial<Plotly.Layout>;
    config?: Partial<Plotly.Config>;
    frames?: Plotly.Frame[];
    style?: React.CSSProperties;
    className?: string;
    onInitialized?: (figure: Plotly.Figure, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: Plotly.Figure, graphDiv: HTMLElement) => void;
    onRender?: () => void;
    onError?: () => void;
    onPurge?: () => void;
    useResizeHandler?: boolean;
  }
  
  declare const Plot: React.ComponentClass<PlotProps>;
  export default Plot;
} 