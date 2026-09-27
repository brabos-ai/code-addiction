# Recharts

Recharts is a declarative charting library built with React and D3, designed to make building data visualizations as simple as composing React components. The library provides a comprehensive set of chart types including line, bar, area, pie, radar, radial bar, scatter, composed, treemap, sankey, sunburst, and funnel charts, all built on native SVG with minimal dependencies. Recharts follows the principle of composability, where each component (axes, tooltips, legends, grids) is independent and can be mixed and matched to create complex visualizations.

The library (version 3.5.1) is built on a Redux-based state management system powered by @reduxjs/toolkit that handles chart layout, tooltip interactions, axis calculations, and graphical item rendering. It supports React 16.8+ through React 19, responsive containers, animations, custom shapes, accessibility features, and chart synchronization. All charts can be extended with interactive elements like tooltips, legends, brushes, and reference lines. The API is designed to be intuitive for React developers, using props for configuration and JSX for composition, plus a set of custom hooks for accessing chart state and dimensions.

## LineChart Component

Create line charts to visualize trends and changes over time with support for multiple lines, dots, curves, and custom styling.

```jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', sales: 4000, expenses: 2400, profit: 1600 },
  { name: 'Feb', sales: 3000, expenses: 1398, profit: 1602 },
  { name: 'Mar', sales: 2000, expenses: 9800, profit: -7800 },
  { name: 'Apr', sales: 2780, expenses: 3908, profit: -1128 },
  { name: 'May', sales: 1890, expenses: 4800, profit: -2910 },
  { name: 'Jun', sales: 2390, expenses: 3800, profit: -1410 },
  { name: 'Jul', sales: 3490, expenses: 4300, profit: -810 },
];

function LineChartExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="sales"
          stroke="#8884d8"
          strokeWidth={2}
          activeDot={{ r: 8 }}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="#82ca9d"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="profit"
          stroke="#ff7300"
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default LineChartExample;
```

## BarChart Component

Render bar charts for comparing values across categories with support for stacked, grouped, and custom bar styles.

```jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Page A', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Page C', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Page D', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'Page E', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Page F', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Page G', uv: 3490, pv: 4300, amt: 2100 },
];

const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

function StackedBarChartExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        {/* Stacked bars */}
        <Bar dataKey="pv" stackId="a" fill="#8884d8" />
        <Bar dataKey="uv" stackId="a" fill="#82ca9d" />
        {/* Individual bars with custom colors using Cell */}
        <Bar dataKey="amt" fill="#8884d8">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default StackedBarChartExample;
```

## PieChart Component

Display proportional data in circular charts with support for donuts, custom labels, and interactive slices.

```jsx
import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 },
  { name: 'Group D', value: 200 },
  { name: 'Group E', value: 278 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function PieChartExample() {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={120}
          innerRadius={60}
          fill="#8884d8"
          dataKey="value"
          activeIndex={activeIndex}
          activeShape={{
            outerRadius: 130,
            stroke: '#000',
            strokeWidth: 2,
          }}
          onMouseEnter={onPieEnter}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default PieChartExample;
```

## AreaChart Component

Visualize cumulative data and ranges with filled area charts supporting gradients and stacking.

```jsx
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '00:00', uv: 4000, pv: 2400, amt: 2400 },
  { name: '03:00', uv: 3000, pv: 1398, amt: 2210 },
  { name: '06:00', uv: 2000, pv: 9800, amt: 2290 },
  { name: '09:00', uv: 2780, pv: 3908, amt: 2000 },
  { name: '12:00', uv: 1890, pv: 4800, amt: 2181 },
  { name: '15:00', uv: 2390, pv: 3800, amt: 2500 },
  { name: '18:00', uv: 3490, pv: 4300, amt: 2100 },
  { name: '21:00', uv: 4000, pv: 2400, amt: 2400 },
];

function AreaChartExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="uv"
          stroke="#8884d8"
          fillOpacity={1}
          fill="url(#colorUv)"
        />
        <Area
          type="monotone"
          dataKey="pv"
          stroke="#82ca9d"
          fillOpacity={1}
          fill="url(#colorPv)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default AreaChartExample;
```

## ComposedChart Component

Combine multiple chart types (line, bar, area) in a single visualization for complex data relationships.

```jsx
import React from 'react';
import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', uv: 590, pv: 800, amt: 1400, cnt: 490 },
  { name: 'Feb', uv: 868, pv: 967, amt: 1506, cnt: 590 },
  { name: 'Mar', uv: 1397, pv: 1098, amt: 989, cnt: 350 },
  { name: 'Apr', uv: 1480, pv: 1200, amt: 1228, cnt: 480 },
  { name: 'May', uv: 1520, pv: 1108, amt: 1100, cnt: 460 },
  { name: 'Jun', uv: 1400, pv: 680, amt: 1700, cnt: 380 },
];

function ComposedChartExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <CartesianGrid stroke="#f5f5f5" />
        <XAxis dataKey="name" scale="band" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="amt" fill="#8884d8" stroke="#8884d8" />
        <Bar dataKey="pv" barSize={20} fill="#413ea0" />
        <Line type="monotone" dataKey="uv" stroke="#ff7300" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default ComposedChartExample;
```

## ResponsiveContainer Component

Create fluid, responsive charts that automatically adjust to parent container size changes.

```jsx
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const data = [
  { name: 'Page A', uv: 4000 },
  { name: 'Page B', uv: 3000 },
  { name: 'Page C', uv: 2000 },
  { name: 'Page D', uv: 2780 },
  { name: 'Page E', uv: 1890 },
];

function ResponsiveExample() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Percentage-based sizing */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="uv" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>

      {/* Aspect ratio constraint */}
      <ResponsiveContainer width="100%" aspect={2}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>

      {/* With resize callback and debounce */}
      <ResponsiveContainer
        width="100%"
        height={400}
        debounce={300}
        onResize={(width, height) => console.log(`Chart resized to ${width}x${height}`)}
      >
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="uv" stroke="#ff7300" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ResponsiveExample;
```

## XAxis and YAxis Components

Configure chart axes with custom domains, ticks, labels, and formatting options.

```jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: '2024-01-01', value: 4000, category: 'A' },
  { date: '2024-02-01', value: 3000, category: 'B' },
  { date: '2024-03-01', value: 2000, category: 'C' },
  { date: '2024-04-01', value: 2780, category: 'D' },
  { date: '2024-05-01', value: 1890, category: 'E' },
];

const CustomTick = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="#666"
        transform="rotate(-35)"
      >
        {payload.value}
      </text>
    </g>
  );
};

function AxisConfigurationExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />

        {/* Custom X-Axis with formatting */}
        <XAxis
          dataKey="date"
          angle={-45}
          textAnchor="end"
          height={80}
          tick={CustomTick}
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
        />

        {/* Y-Axis with custom domain and ticks */}
        <YAxis
          domain={[0, 5000]}
          ticks={[0, 1000, 2000, 3000, 4000, 5000]}
          tickFormatter={(value) => `$${value}`}
          label={{ value: 'Revenue', angle: -90, position: 'insideLeft' }}
        />

        {/* Secondary Y-Axis */}
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#82ca9d"
          label={{ value: 'Count', angle: 90, position: 'insideRight' }}
        />

        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#8884d8" yAxisId="left" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default AxisConfigurationExample;
```

## Tooltip Component

Add interactive tooltips with custom content, positioning, and styling for enhanced data exploration.

```jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', value: 4000, status: 'active' },
  { name: 'Feb', value: 3000, status: 'inactive' },
  { name: 'Mar', value: 2000, status: 'active' },
  { name: 'Apr', value: 2780, status: 'pending' },
  { name: 'May', value: 1890, status: 'active' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{`${label}`}</p>
        <p style={{ margin: '5px 0 0 0', color: payload[0].color }}>
          {`Value: ${payload[0].value}`}
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
          {`Status: ${payload[0].payload.status}`}
        </p>
      </div>
    );
  }
  return null;
};

function TooltipExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <XAxis dataKey="name" />
        <YAxis />

        {/* Custom tooltip with default content */}
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: 'red', strokeWidth: 2 }}
          wrapperStyle={{ outline: 'none' }}
        />

        {/* Controlled tooltip */}
        <Tooltip
          active={true}
          position={{ x: 100, y: 50 }}
          filterNull={true}
        />

        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default TooltipExample;
```

## Legend Component

Display chart legends with custom content, positioning, and interaction handlers.

```jsx
import React from 'react';
import { LineChart, Line, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Page A', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Page C', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Page D', uv: 2780, pv: 3908, amt: 2000 },
];

const renderCustomLegend = (props) => {
  const { payload } = props;

  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', justifyContent: 'center' }}>
      {payload.map((entry, index) => (
        <li key={`item-${index}`} style={{ marginRight: '20px', display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '12px',
            height: '12px',
            backgroundColor: entry.color,
            marginRight: '5px',
            borderRadius: '50%'
          }} />
          <span style={{ color: '#666' }}>{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

function LegendExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />

        {/* Custom legend */}
        <Legend
          content={renderCustomLegend}
          verticalAlign="top"
          height={36}
          onClick={(data) => console.log('Legend clicked:', data)}
          onMouseEnter={(data) => console.log('Legend hover:', data)}
        />

        <Line type="monotone" dataKey="uv" stroke="#8884d8" name="Unique Visitors" />
        <Line type="monotone" dataKey="pv" stroke="#82ca9d" name="Page Views" />
        <Line type="monotone" dataKey="amt" stroke="#ffc658" name="Amount" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default LegendExample;
```

## ScatterChart Component

Visualize correlations and distributions with scatter plots supporting bubbles, custom shapes, and Z-axis scaling.

```jsx
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const data01 = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
];

const data02 = [
  { x: 300, y: 300, z: 200 },
  { x: 400, y: 500, z: 260 },
  { x: 200, y: 700, z: 400 },
  { x: 340, y: 350, z: 280 },
  { x: 560, y: 500, z: 500 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function ScatterChartExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name="weight" unit="kg" />
        <YAxis type="number" dataKey="y" name="height" unit="cm" />
        <ZAxis type="number" dataKey="z" range={[60, 400]} name="score" unit="points" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />

        <Scatter name="Group A" data={data01} fill="#8884d8">
          {data01.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Scatter>

        <Scatter name="Group B" data={data02} fill="#82ca9d" shape="triangle" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export default ScatterChartExample;
```

## RadarChart Component

Display multivariate data in a radar/spider chart format for comparing multiple variables.

```jsx
import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { subject: 'Math', A: 120, B: 110, fullMark: 150 },
  { subject: 'Chinese', A: 98, B: 130, fullMark: 150 },
  { subject: 'English', A: 86, B: 130, fullMark: 150 },
  { subject: 'Geography', A: 99, B: 100, fullMark: 150 },
  { subject: 'Physics', A: 85, B: 90, fullMark: 150 },
  { subject: 'History', A: 65, B: 85, fullMark: 150 },
];

function RadarChartExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={90} domain={[0, 150]} />
        <Radar
          name="Student A"
          dataKey="A"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />
        <Radar
          name="Student B"
          dataKey="B"
          stroke="#82ca9d"
          fill="#82ca9d"
          fillOpacity={0.6}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export default RadarChartExample;
```

## Brush Component

Enable data filtering and zooming with an interactive brush selector for large datasets.

```jsx
import React from 'react';
import { LineChart, Line, Brush, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const generateData = () => {
  const data = [];
  for (let i = 0; i < 100; i++) {
    data.push({
      name: `Point ${i}`,
      value: Math.random() * 1000 + 100,
    });
  }
  return data;
};

const data = generateData();

function BrushExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />

        {/* Brush for data filtering */}
        <Brush
          dataKey="name"
          height={30}
          stroke="#8884d8"
          startIndex={0}
          endIndex={20}
          onChange={(range) => console.log('Brush range:', range)}
        >
          <LineChart>
            <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />
          </LineChart>
        </Brush>
      </LineChart>
    </ResponsiveContainer>
  );
}

export default BrushExample;
```

## ReferenceLines and ReferenceAreas

Add reference markers and highlighted regions to emphasize specific values or ranges.

```jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 700 },
];

function ReferenceExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />

        {/* Horizontal reference line for average */}
        <ReferenceLine
          y={550}
          label="Average"
          stroke="red"
          strokeDasharray="3 3"
        />

        {/* Vertical reference line for specific month */}
        <ReferenceLine
          x="Mar"
          label="Q1 End"
          stroke="green"
        />

        {/* Reference area to highlight a range */}
        <ReferenceArea
          x1="Mar"
          x2="May"
          y1={300}
          y2={700}
          stroke="red"
          strokeOpacity={0.3}
          fill="red"
          fillOpacity={0.1}
          label="Critical Period"
        />

        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default ReferenceExample;
```

## Cell Component

Customize individual elements in Bar and Pie charts with unique colors and properties.

```jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Product A', value: 400, status: 'success' },
  { name: 'Product B', value: 300, status: 'warning' },
  { name: 'Product C', value: 200, status: 'error' },
  { name: 'Product D', value: 278, status: 'success' },
  { name: 'Product E', value: 189, status: 'warning' },
];

const getColorByStatus = (status) => {
  switch (status) {
    case 'success': return '#00C49F';
    case 'warning': return '#FFBB28';
    case 'error': return '#FF8042';
    default: return '#8884d8';
  }
};

function CellExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value">
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getColorByStatus(entry.status)}
              onClick={() => console.log(`Clicked ${entry.name}`)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default CellExample;
```

## Animation Configuration

Control chart animations with custom durations, easing functions, and animation states.

```jsx
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Page A', uv: 4000 },
  { name: 'Page B', uv: 3000 },
  { name: 'Page C', uv: 2000 },
  { name: 'Page D', uv: 2780 },
  { name: 'Page E', uv: 1890 },
];

function AnimationExample() {
  const [animationKey, setAnimationKey] = useState(0);

  return (
    <div>
      <button onClick={() => setAnimationKey(prev => prev + 1)}>
        Replay Animation
      </button>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} key={animationKey}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="uv"
            stroke="#8884d8"
            isAnimationActive={true}
            animationDuration={2000}
            animationEasing="ease-in-out"
            animationBegin={0}
            onAnimationStart={() => console.log('Animation started')}
            onAnimationEnd={() => console.log('Animation ended')}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AnimationExample;
```

## Treemap Component

Visualize hierarchical data using nested rectangles where each branch is represented by a rectangle sized proportionally to its value.

```jsx
import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  {
    name: 'Products',
    children: [
      {
        name: 'Electronics',
        size: 5000,
        children: [
          { name: 'Phones', size: 2000 },
          { name: 'Laptops', size: 2500 },
          { name: 'Tablets', size: 500 },
        ],
      },
      {
        name: 'Clothing',
        size: 3000,
        children: [
          { name: 'Shirts', size: 1200 },
          { name: 'Pants', size: 1000 },
          { name: 'Shoes', size: 800 },
        ],
      },
      {
        name: 'Food',
        size: 2000,
        children: [
          { name: 'Fruits', size: 800 },
          { name: 'Vegetables', size: 700 },
          { name: 'Dairy', size: 500 },
        ],
      },
    ],
  },
];

const COLORS = ['#8889DD', '#9597E4', '#8DC77B', '#A5D297', '#E2CF45', '#F8C12D'];

const CustomizedContent = (props) => {
  const { x, y, width, height, index, name, value } = props;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: COLORS[index % COLORS.length],
          stroke: '#fff',
          strokeWidth: 2,
        }}
      />
      {width > 50 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={14}
        >
          {name}
        </text>
      )}
      {width > 50 && height > 50 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 20}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
        >
          {value}
        </text>
      )}
    </g>
  );
};

function TreemapExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        data={data}
        dataKey="size"
        ratio={4 / 3}
        stroke="#fff"
        fill="#8884d8"
        content={<CustomizedContent />}
      >
        <Tooltip />
      </Treemap>
    </ResponsiveContainer>
  );
}

export default TreemapExample;
```

## Sankey Diagram

Display flow and relationships between nodes using proportional link widths to represent quantities.

```jsx
import React from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';

const data = {
  nodes: [
    { name: 'Visit' },
    { name: 'Direct' },
    { name: 'Search' },
    { name: 'Social' },
    { name: 'Product Page' },
    { name: 'Cart' },
    { name: 'Checkout' },
  ],
  links: [
    { source: 0, target: 1, value: 3000 },
    { source: 0, target: 2, value: 2000 },
    { source: 0, target: 3, value: 1000 },
    { source: 1, target: 4, value: 2500 },
    { source: 2, target: 4, value: 1800 },
    { source: 3, target: 4, value: 900 },
    { source: 4, target: 5, value: 3200 },
    { source: 5, target: 6, value: 1800 },
  ],
};

const nodeColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

function SankeyExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <Sankey
        data={data}
        nodeWidth={10}
        nodePadding={60}
        linkCurvature={0.5}
        iterations={64}
        node={(props) => {
          const { x, y, width, height, index, payload } = props;
          return (
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill={nodeColors[index % nodeColors.length]}
              fillOpacity="0.8"
            />
          );
        }}
        link={(props) => {
          return <path d={props.linkPath} fill="none" stroke="#8884d8" strokeOpacity="0.3" strokeWidth={Math.max(props.linkWidth, 1)} />;
        }}
      >
        <Tooltip />
      </Sankey>
    </ResponsiveContainer>
  );
}

export default SankeyExample;
```

## SunburstChart Component

Create hierarchical radial visualizations showing parent-child relationships in a circular layout with nested rings.

```jsx
import React from 'react';
import { SunburstChart, ResponsiveContainer } from 'recharts';

const data = {
  name: 'Root',
  children: [
    {
      name: 'Sales',
      value: 4000,
      fill: '#8884d8',
      children: [
        { name: 'Q1', value: 1200, fill: '#8884d8' },
        { name: 'Q2', value: 1000, fill: '#83a6ed' },
        { name: 'Q3', value: 900, fill: '#8dd1e1' },
        { name: 'Q4', value: 900, fill: '#82ca9d' },
      ],
    },
    {
      name: 'Marketing',
      value: 3000,
      fill: '#82ca9d',
      children: [
        { name: 'Digital', value: 1800, fill: '#82ca9d' },
        { name: 'Print', value: 700, fill: '#a4de6c' },
        { name: 'Events', value: 500, fill: '#d0ed57' },
      ],
    },
    {
      name: 'Engineering',
      value: 5000,
      fill: '#ffc658',
      children: [
        { name: 'Frontend', value: 2000, fill: '#ffc658' },
        { name: 'Backend', value: 2200, fill: '#ffb347' },
        { name: 'DevOps', value: 800, fill: '#ff9c33' },
      ],
    },
  ],
};

function SunburstExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <SunburstChart
        data={data}
        dataKey="value"
        fill="#8884d8"
        startAngle={0}
        endAngle={360}
        innerRadius="20%"
        outerRadius="80%"
      />
    </ResponsiveContainer>
  );
}

export default SunburstExample;
```

## FunnelChart Component

Display conversion funnels and sequential processes with progressively narrowing stages.

```jsx
import React from 'react';
import { FunnelChart, Funnel, Tooltip, Cell, LabelList, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Website Visits', value: 10000, fill: '#8884d8' },
  { name: 'Product Views', value: 7500, fill: '#83a6ed' },
  { name: 'Add to Cart', value: 4500, fill: '#8dd1e1' },
  { name: 'Checkout Started', value: 2800, fill: '#82ca9d' },
  { name: 'Payment Info', value: 1900, fill: '#a4de6c' },
  { name: 'Purchase Complete', value: 1500, fill: '#d0ed57' },
];

function FunnelChartExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <FunnelChart>
        <Tooltip />
        <Funnel
          dataKey="value"
          data={data}
          isAnimationActive
        >
          <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
          <LabelList position="inside" fill="#fff" stroke="none" dataKey="value" />
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

export default FunnelChartExample;
```

## RadialBarChart Component

Create radial bar charts that display data in circular bars, useful for showing progress, comparisons, or cyclical data.

```jsx
import React from 'react';
import { RadialBarChart, RadialBar, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '18-24', uv: 31.47, fill: '#8884d8' },
  { name: '25-29', uv: 26.69, fill: '#83a6ed' },
  { name: '30-34', uv: 15.69, fill: '#8dd1e1' },
  { name: '35-39', uv: 8.22, fill: '#82ca9d' },
  { name: '40-49', uv: 8.63, fill: '#a4de6c' },
  { name: '50+', uv: 2.63, fill: '#d0ed57' },
  { name: 'Unknown', uv: 6.67, fill: '#ffc658' },
];

function RadialBarChartExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="10%"
        outerRadius="80%"
        barSize={10}
        data={data}
      >
        <RadialBar
          minAngle={15}
          label={{ position: 'insideStart', fill: '#fff' }}
          background
          clockWise
          dataKey="uv"
        />
        <Legend
          iconSize={10}
          layout="vertical"
          verticalAlign="middle"
          align="right"
        />
        <Tooltip />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

export default RadialBarChartExample;
```

## Custom Hooks

Access chart state, dimensions, and active data programmatically using Recharts custom hooks.

```jsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  useChartWidth,
  useChartHeight,
  useMargin,
  useOffset,
  usePlotArea,
  useActiveTooltipLabel,
  useActiveTooltipDataPoints,
  useXAxisDomain,
  useYAxisDomain,
} from 'recharts';

// Note: All hooks are exported from the main 'recharts' package:
// - useChartWidth, useChartHeight, useMargin: from recharts/chartLayoutContext
// - useOffset, usePlotArea, useActiveTooltipLabel, useActiveTooltipDataPoints,
//   useXAxisDomain, useYAxisDomain: from recharts/hooks

const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
];

// Custom component that uses hooks
function ChartInfo() {
  const width = useChartWidth();
  const height = useChartHeight();
  const margin = useMargin();
  const offset = useOffset();
  const plotArea = usePlotArea();
  const activeLabel = useActiveTooltipLabel();
  const activeDataPoints = useActiveTooltipDataPoints();
  const xDomain = useXAxisDomain();
  const yDomain = useYAxisDomain();

  return (
    <div style={{ padding: '10px', backgroundColor: '#f5f5f5', marginTop: '10px' }}>
      <h3>Chart Information</h3>
      <p>Width: {width}px, Height: {height}px</p>
      <p>Margin: {JSON.stringify(margin)}</p>
      <p>Offset: {JSON.stringify(offset)}</p>
      <p>Plot Area: {JSON.stringify(plotArea)}</p>
      <p>X Domain: {JSON.stringify(xDomain)}</p>
      <p>Y Domain: {JSON.stringify(yDomain)}</p>
      {activeLabel && (
        <div>
          <p>Active Label: {activeLabel}</p>
          <p>Active Data: {JSON.stringify(activeDataPoints)}</p>
        </div>
      )}
    </div>
  );
}

function HooksExample() {
  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
      <ChartInfo />
    </div>
  );
}

export default HooksExample;
```

Available hooks:
- `useChartWidth()`: Returns the chart width in pixels
- `useChartHeight()`: Returns the chart height in pixels
- `useMargin()`: Returns the chart margin settings
- `useOffset()`: Returns offset between chart and plot area (includes axes, legends)
- `usePlotArea()`: Returns the area where data is rendered
- `useActiveTooltipLabel()`: Returns the currently active tooltip label
- `useActiveTooltipDataPoints()`: Returns active data points in tooltip
- `useXAxisDomain(xAxisId?)`: Returns the calculated X-axis domain
- `useYAxisDomain(yAxisId?)`: Returns the calculated Y-axis domain

## Summary

Recharts provides a comprehensive solution for building data visualizations in React applications with minimal setup and maximum flexibility. The library excels at common use cases including dashboards displaying KPIs with mixed chart types, time-series analysis with zooming and brushing, comparative analytics with stacked or grouped bars, proportional data display with pie and donut charts, radial progress visualization with radial bar charts, hierarchical data exploration with treemaps and sunburst charts, flow visualization with Sankey diagrams, conversion tracking with funnel charts, and real-time monitoring with animated updates. All components are fully typed with TypeScript, support SSR for Next.js applications, and work seamlessly with modern React patterns including hooks and functional components.

Integration is straightforward through npm installation (`npm install recharts react-is`) and imports. Charts can be customized extensively through props for styling, configured with custom domains and scales for axes, enhanced with interactive features like tooltips and legends, and styled with SVG properties for complete visual control. The library's Redux-based architecture (@reduxjs/toolkit) enables advanced features like chart synchronization across multiple visualizations, programmatic control of active states through custom hooks (useChartWidth, useChartHeight, useOffset, usePlotArea, useActiveTooltipDataPoints, useXAxisDomain, useYAxisDomain), and custom middleware for complex interactions. With responsive containers, accessibility support, extensive documentation, and support for React 16.8+ through React 19, Recharts scales from simple line charts to complex hierarchical and flow visualizations with custom shapes and interactions.
