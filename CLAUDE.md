# Time Booking Application

A time booking UI prototype for a digital agency, built with Next.js 16, TypeScript, and Tailwind CSS 4.

## Overview

This application allows users to book time against projects and phases. It features a week-based calendar view with inline booking entry.

## Tech Stack

- **Next.js 16** with App Router
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4** (uses `@import "tailwindcss"` syntax)

## Key Files

- `app/page.tsx` - Main application component with all UI logic
- `app/types.ts` - TypeScript interfaces for Booking, Project, Phase
- `app/data/mock.ts` - Mock data for projects and phases

## Data Model

### Booking
```typescript
interface Booking {
  id: string;
  date: string;        // ISO date YYYY-MM-DD
  projectId: string;
  phaseId: string;
  duration: number;    // minutes
  description: string;
}
```

### Project & Phase
- Projects have an id and name
- Phases belong to a project (linked by projectId)
- Currently mocked with 5 projects, ~3 phases each

## Important Considerations

### Future Scale
The real system will have **1000+ projects** with **5+ phases each** (potentially 10,000+ entries). The current implementation uses client-side filtering, but this will need to be replaced with:
- Server-side search/filtering
- Debounced API calls
- Pagination or virtual scrolling

### Time Input
The time input accepts multiple formats:
- `30` or `30m` → 30 minutes
- `1h` or `1.5h` → hours
- `2:30` → 2 hours 30 minutes
- `0.5` → interpreted as hours

All inputs are rounded to 15-minute increments. Minimum booking is 15 minutes.

### Week View
- Weeks start on Monday
- Workday target is 8 hours (480 minutes)
- Days with < 8h show hours in blue (needs attention)
- Days with >= 8h show hours in gray (complete)
- Weekends are visually dimmed
- "Today" has a subtle ring indicator

## UI Patterns

### SearchSelect Component
A fuzzy-search dropdown with:
- Inline autocomplete suggestion (grayed out completion)
- Tab/Enter to accept suggestion
- Click or type to open dropdown
- Blur to close
- Keyboard navigation support

### Inline Table Editing
Bookings are displayed in a table format with an always-visible "add row" at the bottom. This provides:
- Stable UI when switching between days
- No modal/popup interruption
- Spreadsheet-like familiarity

## Styling Notes

- Dark mode supported via Tailwind's `dark:` prefix
- Uses zinc color palette for neutral tones
- Blue accent for selection and incomplete indicators
- Some styles use inline `style` attribute due to Tailwind 4 JIT issues with dynamic classes (padding, border-radius, position)
- Safari may have rendering quirks with certain Tailwind classes

## Running the App

```bash
pnpm dev
```

Opens at http://localhost:3000
