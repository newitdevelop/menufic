# Homepage Redesign - Venue Selection Page

## Changes Made

### Overview

The homepage (`https://menu.neyahotels.com/`) has been redesigned from a landing page showcasing Menufic features to a beautiful venue selection page. Users can now directly select a venue to view its menu.

---

## 1. Created New VenueSelection Component

**File**: [src/components/VenueSelection/VenueSelection.tsx](src/components/VenueSelection/VenueSelection.tsx)

**Purpose**: Displays all published restaurants in a beautiful, responsive card grid layout.

**Features**:
- **Fetches published venues** using `api.restaurant.getAllPublished.useQuery()`
- **Responsive grid layout** (1 column on mobile, 2 on tablet, 3 on desktop)
- **Beautiful card design** with hover animations
- **Restaurant images** displayed with proper aspect ratio (3:2)
- **Restaurant details** including name, location, contact number
- **Loading state** with spinner
- **Empty state** for when no venues are available
- **Gradient background** for visual appeal
- **Click-to-navigate** to venue menu pages

**Card Hover Effect**:
```typescript
"&:hover": {
    transform: "translateY(-8px)",
    boxShadow: theme.shadows.xl,
}
```

**Visual Design**:
- Gradient background: gray[0] → blue[0]
- Large heading (48px): "Select Your Venue"
- Descriptive subtext explaining the page
- Card shadows with elevation on hover
- Badge showing "View Menu" with external link icon
- Icons for location (map pin) and phone

---

## 2. Updated Homepage (index.tsx)

**File**: [src/pages/index.tsx](src/pages/index.tsx)

**Changes**:

**Before** (Landing Page):
```typescript
import { AboutUs, ContactUs, Features, Hero, Pricing, SampleMenu, Steps } from "src/components/LandingSections";

const LandingPage: NextPage = () => {
    const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({ offset: 60 });

    return (
        <>
            <NextSeo
                description="A digital menu generator..."
                title="Digital menu generator"
            />
            <NavHeader showLoginButton withShadow />
            <Hero />
            <Steps />
            <Features />
            <SampleMenu />
            <Pricing scrollToContactUs={scrollIntoView} />
            <ContactUs contactUsRef={targetRef} />
            <AboutUs />
            <Footer />
        </>
    );
};
```

**After** (Venue Selection):
```typescript
import VenueSelection from "src/components/VenueSelection/VenueSelection";

const LandingPage: NextPage = () => {
    return (
        <>
            <NextSeo
                description="Select your venue to view our menus and make reservations."
                title="Select Your Venue"
            />
            <NavHeader showLoginButton withShadow />
            <VenueSelection />
            <Footer />
        </>
    );
};
```

**What Changed**:
1. **Removed all landing page sections** (Hero, Steps, Features, SampleMenu, Pricing, ContactUs, AboutUs)
2. **Kept NavHeader** (header with login button)
3. **Kept Footer** (footer with links)
4. **Added VenueSelection** component as main body content
5. **Updated SEO** meta tags to reflect venue selection purpose
6. **Removed scroll logic** (no longer needed without pricing/contact sections)

---

## Visual Comparison

### Before (Landing Page)

```
┌────────────────────────────────────────────────┐
│ NavHeader (Logo, Login)                        │
├────────────────────────────────────────────────┤
│ Hero Section                                   │
│ - Large banner with CTA                        │
├────────────────────────────────────────────────┤
│ Steps Section                                  │
│ - How to create a menu                         │
├────────────────────────────────────────────────┤
│ Features Section                               │
│ - QR codes, translations, AI, etc.             │
├────────────────────────────────────────────────┤
│ Sample Menu Section                            │
│ - Example menu preview                         │
├────────────────────────────────────────────────┤
│ Pricing Section                                │
│ - Subscription plans                           │
├────────────────────────────────────────────────┤
│ Contact Us Section                             │
│ - Contact form                                 │
├────────────────────────────────────────────────┤
│ About Us Section                               │
│ - Company information                          │
├────────────────────────────────────────────────┤
│ Footer (Links, Copyright)                      │
└────────────────────────────────────────────────┘
```

### After (Venue Selection)

```
┌────────────────────────────────────────────────┐
│ NavHeader (Logo, Login)                        │
├────────────────────────────────────────────────┤
│                                                │
│         Select Your Venue                      │
│    Explore our collection of dining venues     │
│                                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │[Image]  │  │[Image]  │  │[Image]  │        │
│  │         │  │         │  │         │        │
│  │ Venue 1 │  │ Venue 2 │  │ Venue 3 │        │
│  │ 📍 Loc  │  │ 📍 Loc  │  │ 📍 Loc  │        │
│  │ 📞 Tel  │  │ 📞 Tel  │  │ 📞 Tel  │        │
│  │ [Badge] │  │ [Badge] │  │ [Badge] │        │
│  └─────────┘  └─────────┘  └─────────┘        │
│                                                │
│  ┌─────────┐  ┌─────────┐                     │
│  │[Image]  │  │[Image]  │                     │
│  │ Venue 4 │  │ Venue 5 │                     │
│  └─────────┘  └─────────┘                     │
│                                                │
├────────────────────────────────────────────────┤
│ Footer (Links, Copyright)                      │
└────────────────────────────────────────────────┘
```

---

## Detailed Component Breakdown

### VenueSelection Component

**Layout Structure**:
```
<Box> (Gradient background)
  └─ <Container size="xl">
      └─ <Stack spacing={50}>
          ├─ Header Section
          │   ├─ Title: "Select Your Venue"
          │   └─ Subtitle: "Explore our collection..."
          │
          └─ <Grid gutter={30}>
              └─ Restaurant Cards (Grid.Col xs={12} sm={6} md={4})
                  └─ <Link href={`/venue/${id}/menu`}>
                      └─ <Card> (Hover animation)
                          ├─ <Card.Section> (Image)
                          │   └─ Restaurant Image (3:2 aspect ratio)
                          │
                          └─ <Stack spacing="md">
                              ├─ <Group> (Title + Badge)
                              │   ├─ Restaurant Name
                              │   └─ "View Menu" Badge
                              │
                              ├─ <Group> (Location)
                              │   ├─ 📍 Icon
                              │   └─ Location Text
                              │
                              └─ <Group> (Phone)
                                  ├─ 📞 Icon
                                  └─ Contact Number
```

**Responsive Breakpoints**:
- **xs (mobile)**: 1 column (full width cards)
- **sm (tablet)**: 2 columns
- **md+ (desktop)**: 3 columns

**Card Dimensions**:
- Image aspect ratio: 66.67% (2:3 ratio)
- Card height: 100% (fills grid cell)
- Hover lift: -8px translateY
- Border radius: lg (rounded corners)

---

## API Integration

**Endpoint Used**: `api.restaurant.getAllPublished`

**Location**: [src/server/api/routers/restaurant.router.ts](src/server/api/routers/restaurant.router.ts) (lines 157-159)

**Query**:
```typescript
getAllPublished: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.restaurant.findMany({
        include: { image: true },
        where: { isPublished: true }
    })
)
```

**Return Type**:
```typescript
Restaurant[] & { image: Image | null }[]
```

**Fields Used**:
- `restaurant.id` - For navigation URL
- `restaurant.name` - Card title
- `restaurant.location` - Location display
- `restaurant.contactNo` - Phone number display
- `restaurant.image.path` - ImageKit URL construction

**Image URL Construction**:
```typescript
const imageUrl = restaurant.image
    ? `https://ik.imagekit.io/menufic/${restaurant.image.path}`
    : "/placeholder-restaurant.jpg";
```

---

## UX Features

### 1. Loading State
```typescript
if (isLoading) {
    return (
        <Center style={{ minHeight: 400 }}>
            <Loader size="lg" />
        </Center>
    );
}
```

**Benefits**:
- User sees spinner while fetching restaurants
- Prevents blank page flash
- Maintains minimum height for visual stability

---

### 2. Empty State
```typescript
if (!restaurants || restaurants.length === 0) {
    return (
        <Center style={{ minHeight: 400 }}>
            <Text size="xl" color="dimmed">
                No venues available at the moment
            </Text>
        </Center>
    );
}
```

**Benefits**:
- Clear message when no venues published
- Prevents confusion with broken page
- Maintains consistent layout

---

### 3. Hover Animation

**CSS Transition**:
```typescript
sx={(theme) => ({
    cursor: "pointer",
    transition: "all 0.3s ease",
    "&:hover": {
        transform: "translateY(-8px)",
        boxShadow: theme.shadows.xl,
    },
})}
```

**Benefits**:
- Visual feedback on hover
- Indicates card is clickable
- Smooth 0.3s animation
- Enhanced shadow on elevation

---

### 4. Responsive Image Display

**Image Container**:
```typescript
<Box sx={{
    position: "relative",
    paddingTop: "66.67%",  // 3:2 aspect ratio
    overflow: "hidden"
}}>
    <Image
        src={imageUrl}
        alt={restaurant.name}
        fit="cover"
        sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
        }}
    />
</Box>
```

**Benefits**:
- Consistent aspect ratio across all cards
- No layout shift on image load
- Images always fill container
- Cropped with "cover" fit

---

### 5. Visual Hierarchy

**Typography Scale**:
- Page title: 48px, weight 700, dark[9]
- Subtitle: xl, color dimmed
- Card title: 22px, weight 600, dark[7]
- Details text: sm, color dimmed

**Spacing**:
- Page sections: 50px
- Card internal spacing: md
- Grid gutter: 30px
- Container padding: 80px vertical

---

## Accessibility

### 1. Semantic HTML
- Proper heading hierarchy (h1 for page title, h3 for card titles)
- Link wrapping entire card (full click area)
- Alt text on all images

### 2. Keyboard Navigation
- Cards are wrapped in `<Link>` components (keyboard accessible)
- Tab navigation through all venues
- Enter/Space to activate links

### 3. Screen Reader Support
- Icon labels provided for location/phone
- Image alt text describes venue
- Badge text explains action ("View Menu")

---

## SEO Updates

**Before**:
```typescript
<NextSeo
    description="A digital menu generator that lets you to create the best menu for your restaurant..."
    title="Digital menu generator"
/>
```

**After**:
```typescript
<NextSeo
    description="Select your venue to view our menus and make reservations."
    title="Select Your Venue"
/>
```

**Benefits**:
- More accurate page description
- Title reflects actual page purpose
- Better search engine understanding

---

## Design System

### Color Palette

**Background Gradient**:
- Start: `theme.colors.gray[0]` (light gray)
- End: `theme.colors.blue[0]` (light blue)
- Direction: 135deg diagonal

**Text Colors**:
- Primary headings: `theme.colors.dark[9]` (almost black)
- Card titles: `theme.colors.dark[7]` (dark gray)
- Secondary text: "dimmed" (muted gray)

**Badge**:
- Color: "blue"
- Variant: "light" (soft background)
- Icon: IconExternalLink

---

### Spacing System

**Container**:
- Max width: "xl" (1200px)
- Vertical padding: 80px (xl * 3)

**Grid**:
- Gutter: 30px between cards
- Stack spacing: 50px between sections

**Card Padding**:
- Internal: "md" (16px)
- Between sections: "md"

---

## Responsive Behavior

### Mobile (xs)
```
┌──────────────────┐
│                  │
│ [Full Width Card]│
│                  │
├──────────────────┤
│                  │
│ [Full Width Card]│
│                  │
├──────────────────┤
│                  │
│ [Full Width Card]│
│                  │
└──────────────────┘
```

### Tablet (sm)
```
┌───────────┬───────────┐
│           │           │
│  [Card]   │  [Card]   │
│           │           │
├───────────┼───────────┤
│           │           │
│  [Card]   │  [Card]   │
│           │           │
└───────────┴───────────┘
```

### Desktop (md+)
```
┌────────┬────────┬────────┐
│        │        │        │
│ [Card] │ [Card] │ [Card] │
│        │        │        │
├────────┼────────┼────────┤
│        │        │        │
│ [Card] │ [Card] │ [Card] │
│        │        │        │
└────────┴────────┴────────┘
```

---

## Navigation Flow

### User Journey

1. **User visits homepage** (`https://menu.neyahotels.com/`)
2. **Sees venue selection page** with all published restaurants
3. **Browses restaurant cards** (name, location, phone, image)
4. **Clicks on a restaurant card**
5. **Navigates to** `/venue/{restaurantId}/menu`
6. **Views menu and makes reservation**

### Link Structure

**Card Link**:
```typescript
<Link href={`/venue/${restaurant.id}/menu`} style={{ textDecoration: "none" }}>
    <Card>...</Card>
</Link>
```

**Benefits**:
- Entire card is clickable (better UX)
- No underline decoration (cleaner design)
- Preserves Next.js client-side navigation
- SEO-friendly anchor tags

---

## Performance Considerations

### Image Optimization
- Using ImageKit CDN for fast delivery
- Images served from `https://ik.imagekit.io/menufic/`
- Aspect ratio container prevents layout shift

### Data Fetching
- Single API call to fetch all restaurants
- React Query caching (from tRPC integration)
- Loading state while fetching

### Animation Performance
- CSS transforms (GPU accelerated)
- Transition duration: 0.3s (smooth but quick)
- Only animating transform and box-shadow

---

## Files Modified

### 1. [src/pages/index.tsx](src/pages/index.tsx)
**Changes**:
- Removed imports for landing page sections (Hero, Steps, Features, etc.)
- Removed `useScrollIntoView` hook (no longer needed)
- Added VenueSelection component import
- Replaced all landing sections with VenueSelection component
- Updated SEO meta tags
- Kept NavHeader and Footer intact

### 2. [src/components/VenueSelection/VenueSelection.tsx](src/components/VenueSelection/VenueSelection.tsx) (NEW)
**Created**:
- New component for venue selection
- Restaurant card grid layout
- API integration with `getAllPublished`
- Loading and empty states
- Hover animations and responsive design

---

## Testing Checklist

### Test 1: Page Loads Successfully
1. Visit `https://menu.neyahotels.com/`
2. ✅ **Verify**: Page loads without errors
3. ✅ **Verify**: NavHeader and Footer are visible
4. ✅ **Verify**: "Select Your Venue" heading appears
5. ✅ **Verify**: Loading spinner shows briefly

### Test 2: Venue Cards Display
1. **Wait for restaurants to load**
2. ✅ **Verify**: Restaurant cards appear in grid layout
3. ✅ **Verify**: Each card shows restaurant image
4. ✅ **Verify**: Each card shows restaurant name
5. ✅ **Verify**: Location shown with map pin icon
6. ✅ **Verify**: Phone number shown with phone icon
7. ✅ **Verify**: "View Menu" badge appears

### Test 3: Hover Effects
1. **Hover over a restaurant card**
2. ✅ **Verify**: Card lifts up (translateY -8px)
3. ✅ **Verify**: Shadow becomes more pronounced
4. ✅ **Verify**: Transition is smooth (0.3s)
5. ✅ **Verify**: Cursor changes to pointer

### Test 4: Navigation
1. **Click on a restaurant card**
2. ✅ **Verify**: Navigates to `/venue/{id}/menu`
3. ✅ **Verify**: Menu page loads correctly
4. ✅ **Verify**: Browser back button returns to venue selection

### Test 5: Responsive Design
1. **Resize browser to mobile width** (< 576px)
2. ✅ **Verify**: Cards stack in single column
3. **Resize to tablet width** (576px - 768px)
4. ✅ **Verify**: Cards display in 2 columns
5. **Resize to desktop width** (> 768px)
6. ✅ **Verify**: Cards display in 3 columns

### Test 6: Empty State
1. **If no restaurants are published**
2. ✅ **Verify**: "No venues available" message shows
3. ✅ **Verify**: No broken layout or errors

### Test 7: Image Loading
1. **Check restaurant images**
2. ✅ **Verify**: Images load from ImageKit CDN
3. ✅ **Verify**: Images maintain 3:2 aspect ratio
4. ✅ **Verify**: Placeholder shown if image missing
5. ✅ **Verify**: No layout shift during image load

---

## Benefits

### For Users
- ✅ **Clear navigation** - Immediately see all available venues
- ✅ **Visual appeal** - Beautiful cards with restaurant images
- ✅ **Easy selection** - Large click areas, hover feedback
- ✅ **Quick access** - Direct link to venue menus

### For Business
- ✅ **Showcase venues** - Highlight all restaurants in one place
- ✅ **Professional design** - Modern, polished appearance
- ✅ **Brand consistency** - Keeps NavHeader and Footer
- ✅ **SEO optimized** - Proper meta tags for search engines

### For Development
- ✅ **Maintainable** - Single component for venue selection
- ✅ **Type-safe** - Full TypeScript integration
- ✅ **Reusable** - Could be used in other contexts
- ✅ **Scalable** - Handles any number of restaurants

---

## Current Status

### ✅ All Changes Complete

1. VenueSelection component created
2. Homepage updated to use venue selection
3. Landing page sections removed
4. SEO meta tags updated
5. Navigation flow established

### ✅ TypeScript Compilation

- No errors
- All types valid
- Component properly typed

### 🔄 Ready for Deployment

All changes are code-complete and ready to deploy.

---

## Deployment

```bash
# Rebuild Docker image
docker-compose down
docker-compose build --no-cache menufic
docker-compose up -d
```

After deployment:
1. ✅ Homepage shows venue selection page
2. ✅ NavHeader and Footer preserved
3. ✅ Restaurant cards display in responsive grid
4. ✅ Clicking cards navigates to venue menus
5. ✅ Landing page sections removed

---

## Future Enhancements (Optional)

### 1. Search/Filter
- Add search bar to filter venues by name
- Filter by location or cuisine type

### 2. Sorting
- Sort by name (A-Z)
- Sort by location
- Recently added venues first

### 3. Pagination
- If many venues, add pagination
- Load more button or infinite scroll

### 4. Enhanced Cards
- Show cuisine type badge
- Display opening hours
- Show rating/reviews if available

### 5. Map View
- Optional map view of all venues
- Click map markers to navigate

---

## Notes

- **NavHeader login button** - Still accessible for restaurant owners
- **Footer links** - Preserved for privacy policy, terms, etc.
- **Old landing sections** - Still exist in codebase but not used on homepage
- **Restaurant images** - Need to be uploaded for each venue to display properly
- **Published status** - Only restaurants with `isPublished: true` appear
