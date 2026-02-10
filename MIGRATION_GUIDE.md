# Next.js Best Practice Structure Migration Guide

## 🎯 Completed Tasks

### 1. Route Groups Applied
```
app/
├── (auth)/              # Authentication pages group
│   ├── layout.tsx      # Centered layout
│   ├── login/
│   └── signup/
└── (dashboard)/         # Dashboard pages group
    ├── layout.tsx      # MainLayout applied
    ├── trenches/
    ├── trending/
    └── [other pages]/
```

### 2. Component Structure Improvement
```
components/
├── ui/                  # shadcn/ui components
├── common/             # Common components
│   ├── layout/        # Layout related
│   └── debug/         # Debug tools
└── features/          # Feature-specific components
    ├── token/         # Token related
    └── trench/        # Trench related
```

### 3. Flex Layout Applied
- Converted from absolute positioning to flex-based
- Improved responsiveness and maintainability

## 📝 Import Path Change Guide

### Layout Components
```typescript
// Before
import MainLayout from '@/components/layout/main-layout';
import TopBar from '@/components/layout/top-bar';

// After
import MainLayout from '@/components/common/layout/main-layout';
import TopBar from '@/components/common/layout/top-bar';
```

### Token Components
```typescript
// Before
import TokenCard from '@/components/layout/token-card';
import TokenGrid from '@/components/layout/token-grid';

// After
import TokenCard from '@/components/features/token/token-card';
import TokenGrid from '@/components/features/token/token-grid';
```

### Trench Components
```typescript
// Before
import TrenchTokenCard from '@/components/features/trench/trench-token-card';

// After
import TrenchTokenCard from '@/components/features/trench/trench-token-card';
```

### Debug Components
```typescript
// Before
import { WebSocketStatus } from '@/components/debug/websocket-status';

// After
import { WebSocketStatus } from '@/components/common/debug/websocket-status';
```

## 🔄 Page Routing Changes

### URLs Remain the Same
```
/login          → app/(auth)/login/page.tsx
/signup         → app/(auth)/signup/page.tsx
/trenches       → app/(dashboard)/trenches/page.tsx
/trending       → app/(dashboard)/trending/page.tsx
```

Route Groups do not appear in URLs!

## 🏗️ Benefits of New Structure

### 1. Clear Separation of Concerns
- **ui/**: Reusable pure UI components
- **common/**: Common components used across multiple pages
- **features/**: Domain-specific components with business logic

### 2. Scalability
When adding new features:
```
components/features/new-feature/
├── new-feature-card.tsx
├── new-feature-list.tsx
└── new-feature-detail.tsx
```

### 3. Colocation
Related files located nearby:
```
app/(dashboard)/trenches/
├── page.tsx
├── layout.tsx
├── loading.tsx
└── _components/          # Used only in this page
    └── trenches-client.tsx
```

### 4. Layout Hierarchy
```
Root Layout (app/layout.tsx)
├── Auth Layout (app/(auth)/layout.tsx)
│   └── Login/Signup Pages
└── Dashboard Layout (app/(dashboard)/layout.tsx)
    ├── Trenches Layout (app/(dashboard)/trenches/layout.tsx)
    │   └── Trenches Page
    └── Trending Layout (app/(dashboard)/trending/layout.tsx)
        └── Trending Pages
```

## 🚀 Next Steps Suggestions

### 1. Separate Type Definitions
```
types/
├── token.ts
├── trench.ts
└── user.ts
```

### 2. Add _components Per Page
```
app/(dashboard)/trending/
├── _components/
│   ├── trending-filters.tsx
│   └── trending-sort.tsx
└── page.tsx
```

### 3. Organize API Routes
```
app/api/
├── tokens/
│   └── route.ts
├── trenches/
│   └── route.ts
└── auth/
    └── [...nextauth]/
```

### 4. Optimize Server/Client Components
- Use Server Components whenever possible
- Use Client Components only for interactive parts

### 5. Add Tests
```
__tests__/
├── components/
│   ├── features/
│   └── common/
└── app/
    ├── (auth)/
    └── (dashboard)/
```

## ✅ Checklist

- [x] Route Groups applied
- [x] Component restructuring
- [x] Import paths updated
- [x] Layout hierarchy organized
- [x] Flex layout applied
- [x] Colocation applied
- [ ] Type definitions separated
- [ ] Test code added
- [ ] API Routes organized

## 📚 References

- [Next.js App Router](https://nextjs.org/docs/app)
- [Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Project Organization](https://nextjs.org/docs/app/building-your-application/routing/colocation)
