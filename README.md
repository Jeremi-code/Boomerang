# Lost & Found Matcher

A Vue.js application that helps identify potential matches between lost and found item reports at a university.

## Approach

### Problem Analysis
The core challenge is matching free-text descriptions of lost and found items. Since there's no precise definition of a "match," I implemented a multi-factor scoring system that considers:

1. **Category matching** - Same item type (electronics, clothing, etc.)
2. **Location similarity** - How close the locations are
3. **Temporal proximity** - How close in time the events occurred
4. **Description similarity** - Keyword overlap between descriptions
5. **Color matching** - Similar colors
6. **Brand matching** - Same or similar brands

### Technical Decisions

**Frontend: Vue.js 3 + TypeScript**
- Composition API for better logic organization
- TypeScript for type safety and better developer experience
- Vue Router for navigation
- Pinia for state management (prepared for future use)

**Backend: Supabase**
- PostgreSQL database with Row Level Security
- Real-time subscriptions ready (not implemented in MVP)
- Built-in authentication (not required for this scope)

**Matching Algorithm**
- Multi-factor weighted scoring system
- Each factor contributes to a final confidence score
- Adjustable threshold for filtering matches
- Returns ranked results with explanation of why items match

## Assumptions

1. **Location proximity** - I assumed locations with common words (e.g., "library" in both) are similar
2. **Temporal relevance** - Items lost/found within days are more likely to match than weeks apart
3. **Category is primary** - Matching the same item type is most important
4. **Description keywords** - Common words (excluding short words) indicate similarity
5. **Color families** - Colors like "black" and "dark" are considered similar

## How Matching Works

The matching algorithm calculates a score (0-100%) based on weighted factors:

| Factor | Weight | Logic |
|--------|--------|-------|
| Category | 30% | Exact match = 100%, different = 0% |
| Location | 25% | Fuzzy matching with location word detection |
| Time | 20% | Exponential decay over 30 days |
| Description | 15% | Jaccard similarity of keywords |
| Color | 5% | Exact match or color family matching |
| Brand | 5% | String similarity |

A match is considered "potential" if its score exceeds the configurable threshold (default: 30%).

## Setup Instructions

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)

### 1. Clone and install
```bash
git clone <repository-url>
cd lost-found-matcher
npm install
```

### 2. Configure Supabase
1. Create a new Supabase project
2. Go to Settings > API and copy:
   - Project URL
   - Anon/public key
3. Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set up database
1. Go to SQL Editor in Supabase dashboard
2. Run the migration file: `supabase/migrations/001_initial_schema.sql`

### 4. Run the application
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Screenshots

*Coming soon after implementation*

## What I Would Improve With More Time

1. **Semantic search** - Use embeddings (OpenAI/Cohere) for better description matching
2. **Image support** - Allow photo uploads for visual matching
3. **User accounts** - Let users track their reports and matches
4. **Notifications** - Email/push when new matches appear
5. **Advanced filtering** - Filter by date range, location, category
6. **Location mapping** - Interactive map for location selection
7. **Similarity explanations** - More detailed breakdown of why items match
8. **Mobile app** - Native iOS/Android for better photo capture
9. **Admin dashboard** - For university staff to manage reports
10. **Analytics** - Track match success rates and improve algorithm

## AI Usage

I used AI tools in the following ways:

- **Claude**: Generated initial project structure and TypeScript types
- **GitHub Copilot**: Assisted with matching algorithm implementation and form validation
- **Manual review**: Modified generated code to ensure it met specific requirements and followed best practices

The matching algorithm logic was designed manually based on the problem requirements, then refined with AI assistance for edge cases and optimization.