# Analytics Updates - Color-Coded Categories & DeepSeek AI Integration

## Overview
Updated the analytics system to display different colors for each complaint category and integrated DeepSeek AI for intelligent category analysis.

## Changes Made

### 1. Backend Updates (analytics.js)

#### Color-Coded Category Endpoint
- **Updated**: `/api/analytics/category` endpoint
- **Colors Assigned**:
  - Technical: `#3B82F6` (Blue)
  - Billing: `#10B981` (Green)
  - Service: `#F59E0B` (Amber)
  - Product: `#8B5CF6` (Purple)
  - General: `#EF4444` (Red)
  - Support: `#06B6D4` (Cyan)
  - Account: `#EC4899` (Pink)
  - Delivery: `#14B8A6` (Teal)
  - Quality: `#F97316` (Orange)
  - Other: `#6B7280` (Gray)

#### New AI-Powered Insights Endpoint
- **Added**: `/api/analytics/category-insights`
- **Features**:
  - Uses DeepSeek AI to analyze category trends
  - Provides resolution rates per category
  - Average resolution time analysis
  - AI-generated recommendations
  - Includes color coding for visual consistency

**API Response Structure**:
```json
{
  "categoryStats": [
    {
      "_id": "Technical",
      "count": 45,
      "color": "#3B82F6",
      "resolutionRate": "78.5",
      "avgResolutionTime": 2.3,
      "resolvedCount": 35
    }
  ],
  "aiInsights": "Technical category shows highest volume...",
  "totalComplaints": 120,
  "timestamp": "2025-12-03T..."
}
```

### 2. Frontend Updates

#### UserDashboard.tsx
- Added distinct color mapping for categories
- Updated Bar Chart to use individual colors per category
- Each bar now displays in its designated color
- Improved visual distinction between categories

#### AdminDashboard.tsx
- Applied color-coded categories to admin analytics
- Updated category distribution chart
- Consistent color scheme across admin views

#### AnalyticsReportsDashboard.tsx
- Implemented color-coded category bars
- Enhanced visual analytics
- Synchronized colors with backend definitions

#### ComplaintService.ts
- Added `getCategoryInsights()` function
- Fetches AI-powered insights from backend
- Returns categorized statistics with colors
- Integrated with authentication

### 3. DeepSeek AI Integration

**API Key**: `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`

**Features**:
- Analyzes complaint patterns by category
- Identifies problematic areas
- Provides actionable recommendations
- Generates insights based on recent complaints
- Keeps analysis concise (under 150 words)

**AI Analysis Includes**:
1. Most problematic category identification
2. Trend and pattern detection
3. Recommended actions for improvement

### 4. Visual Improvements

**Chart Enhancements**:
- Each category bar has unique color
- Improved tooltip styling
- Better color contrast for accessibility
- Consistent color scheme across all dashboards

**Color Palette Design**:
- Blue tones for technical issues
- Green for billing (positive/financial)
- Purple for product-related
- Red for general (urgent)
- Warm colors (amber, orange) for service/quality
- Cool colors (cyan, teal) for support/delivery

## Usage

### Accessing Category Analytics
```typescript
// Frontend - Get standard category data
const response = await fetch('/api/analytics/category', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Get AI-powered insights
import { getCategoryInsights } from './services/complaintService';
const insights = await getCategoryInsights();
console.log(insights.aiInsights);
```

### Backend Configuration
Ensure `.env` contains:
```env
DEEPSEEK_API_KEY=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
DEEPSEEK_API_URL=https://openrouter.ai/api/v1
USE_DEEPSEEK=true
```

## Benefits

1. **Visual Clarity**: Easier to distinguish between categories at a glance
2. **AI Insights**: Intelligent analysis helps identify trends
3. **Actionable Data**: DeepSeek provides recommendations
4. **Consistency**: Same colors across all dashboards
5. **Accessibility**: Better color contrast for readability

## Testing

To test the new features:

1. **Start Backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **View Analytics**:
   - Navigate to Dashboard
   - Look for "By Category" chart
   - Each bar should display in different colors
   - Colors match the category type

4. **Test AI Insights** (Admin/Agent only):
   ```bash
   curl -X GET http://localhost:5001/api/analytics/category-insights \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Next Steps

Optional enhancements:
1. Add category insights panel to User Dashboard
2. Create real-time category monitoring
3. Add category color legend
4. Implement category-based filtering with colors
5. Export color-coded reports

## Notes

- DeepSeek API key is configured in backend `.env`
- Colors are defined consistently across frontend and backend
- AI insights require authentication (agent/admin roles)
- Category colors are customizable in the code
- All changes are backward compatible
