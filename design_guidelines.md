# Earnings Analysis Bot - Design Guidelines

## Design Approach

**Selected Framework**: Carbon Design System (IBM) with financial dashboard patterns
**Rationale**: Data-intensive enterprise application requiring clear information hierarchy, extensive data tables, charts, and professional credibility. Carbon excels at complex data visualization and structured layouts.

**Key Design Principles**:
1. Information clarity over decoration
2. Hierarchical data presentation
3. Scannable metrics and key insights
4. Professional credibility and trust
5. Efficient task completion

---

## Typography

**Font Stack**: 
- Headers: IBM Plex Sans (600 weight for primary, 500 for secondary)
- Body/Data: IBM Plex Sans (400 regular, 500 medium for emphasis)
- Numbers/Metrics: IBM Plex Mono (for financial figures, tabular alignment)

**Type Scale**:
- Hero/Page Title: text-4xl (36px)
- Section Headers: text-2xl (24px)
- Card Headers: text-lg (18px)
- Body/Labels: text-base (16px)
- Data/Captions: text-sm (14px)
- Fine print: text-xs (12px)

**Usage**:
- Financial metrics in monospace for alignment
- Bold weights (font-semibold) for current values
- Regular weights for labels and descriptions
- Color differentiation for positive/negative values (not just color alone)

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Component padding: p-6
- Card spacing: space-y-4, gap-6
- Section margins: mb-8, mb-12
- Grid gaps: gap-4, gap-6
- Container max-width: max-w-7xl

**Grid Structure**:
- Main dashboard: 12-column grid system
- Metrics cards: 3-4 columns on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Data tables: Full-width with horizontal scroll
- Charts: 2-column layout (grid-cols-1 lg:grid-cols-2)
- Sidebar + Main: 1/4 + 3/4 split for filters/content

---

## Component Library

### Dashboard Header
- Ticker search bar (prominent, autofocus)
- Company name and current metrics summary
- Date range selector
- Quick action buttons (Compare, Export, Refresh)

### Metrics Cards
- Large number display with label
- Trend indicator (↑ up, ↓ down, → flat) with percentage
- Mini sparkline chart (optional context)
- Beat/miss badge (green/red indicator)
- Compact 4-column grid on desktop

### Data Tables
- Striped rows for readability
- Fixed header on scroll
- Monospace fonts for numerical columns
- Right-aligned numbers
- Sort indicators in headers
- Alternating row backgrounds (subtle gray)

### Charts & Visualizations
- Line charts for trends (revenue over time)
- Bar charts for comparisons (peer metrics)
- Horizontal bars for margins breakdown
- Clean axes, gridlines, legends
- Tooltips on hover with detailed data
- Consistent color coding across charts

### Analysis Cards
- Sentiment score with visual gauge
- Key highlights as bulleted list with icons
- Beat/miss summary with badges
- Guidance section with quoted text
- Expandable sections for detailed data

### Comparison View
- Side-by-side metric cards
- Tabular comparison with highlighting
- Visual indicators for best/worst performers
- Benchmark against index/average

### Report Section
- Executive summary at top
- Expandable detailed sections
- Export buttons (JSON, PDF, Copy)
- Print-friendly layout

---

## Color Strategy

**Notation**: Colors specified separately - focus on structure and hierarchy here.

**Semantic Meaning**:
- Positive metrics: Success indicators
- Negative metrics: Warning/danger indicators  
- Neutral: Default state
- Beat estimates: Success highlight
- Miss estimates: Warning highlight
- Chart series: Distinct but harmonious palette

**Backgrounds**:
- Cards: Elevated surface
- Tables: Alternating subtle rows
- Sidebar: Secondary background
- Main content: Primary background

---

## Interaction Patterns

**Search/Input**:
- Autofocus on ticker search
- Autocomplete suggestions
- Clear button when populated
- Loading state during data fetch

**Data Loading**:
- Skeleton screens for cards and tables
- Spinners for charts
- Progressive disclosure (load critical data first)
- Error states with retry actions

**Tables**:
- Sortable columns (click header)
- Row hover highlights
- Fixed headers on scroll
- Pagination for large datasets

**Charts**:
- Hover tooltips with precise values
- Legend toggle to show/hide series
- Zoom/pan for time-series data
- Export chart as image

**Navigation**:
- Tabs for different analysis views (Overview, Financials, Sentiment, Peers)
- Breadcrumbs for nested views
- Sticky navigation header

---

## Page Layouts

### Main Dashboard
- Search header (ticker input, company selector)
- Metrics overview (4-column card grid)
- Revenue trend chart (full-width)
- Margin analysis (2-column: pie chart + breakdown table)
- Recent earnings history table
- Key highlights cards

### Analysis View
- Company header with key stats
- Tab navigation (Financials | Sentiment | Guidance | Comparison)
- Content area adapts per tab
- Sidebar with filters/options
- Export/share actions in top-right

### Peer Comparison
- Multi-select ticker input
- Comparison matrix table
- Side-by-side metric cards
- Relative performance charts
- Summary insights

---

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support (tab order, enter to submit)
- Screen reader announcements for dynamic content
- Focus indicators on inputs and buttons
- Sufficient contrast ratios
- Alternative text for chart insights

---

## Images

**No hero images required** - This is a data-driven utility application. Focus on:
- Company logos (small, 32x32 or 48x48) next to ticker symbols
- Chart visualizations (generated from data)
- Icon set for metrics (revenue icon, EPS icon, margin icon, growth arrow icons)
- Empty states: Illustrative graphics for "no data" or "search to begin"

---

## Key Differentiators

- **Dense but organized**: Pack information efficiently without overwhelming
- **Scannable hierarchy**: Users should find key metrics at a glance
- **Professional credibility**: Clean, serious design that builds trust
- **Task-focused**: Minimize chrome, maximize data visibility
- **Responsive data**: Tables and charts adapt gracefully to mobile (stack, horizontal scroll)