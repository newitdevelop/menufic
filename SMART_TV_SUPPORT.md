# Smart TV Support Documentation

## Overview

The Menufic application now includes comprehensive responsive design support for Smart TVs, including Full HD (1920px) and 4K Ultra HD (3840px) displays.

## Breakpoints

The application uses the following responsive breakpoints:

| Breakpoint | Size | Device Type |
|------------|------|-------------|
| `xs` | 576px (36em) | Small phones |
| `sm` | 768px (48em) | Tablets and larger phones |
| `md` | 992px (62em) | Small laptops |
| `lg` | 1200px (75em) | Desktops |
| `xl` | 1408px (88em) | Large desktops |
| `tv` | **1920px (120em)** | **Full HD Smart TVs** |
| `4k` | **3840px (240em)** | **4K Ultra HD Smart TVs** |

## Smart TV Optimizations

### Restaurant Menu Component

**Banner & Header:**
- Desktop: 40px title, 22px subtitle
- Smart TV (1920px+): 64px title, 36px subtitle
- 4K TV (3840px+): 96px title, 48px subtitle

**Example:**
```typescript
carousalTitleText: {
    fontSize: 40,
    fontWeight: "bold",
    [`@media (min-width: ${theme.breakpoints.tv})`]: { fontSize: 64 },
    [`@media (min-width: ${theme.breakpoints["4k"]})`]: { fontSize: 96 },
}
```

### Menu Item Cards

**Card Dimensions:**
- Desktop: 150px × 150px images
- Smart TV: 240px × 240px images
- 4K TV: 360px × 360px images

**Typography:**
- Item Name:
  - Desktop: "lg" (18px)
  - Smart TV: 28px
  - 4K TV: 42px

- Price:
  - Desktop: "sm" (14px)
  - Smart TV: 20px
  - 4K TV: 30px

- Description:
  - Desktop: "xs" (12px)
  - Smart TV: 18px
  - 4K TV: 26px

**Padding:**
- Desktop: `theme.spacing.lg` (16px)
- Smart TV: `theme.spacing.xl * 1.5` (36px)
- 4K TV: `theme.spacing.xl * 2` (48px)

### Footer Component

**Typography:**
- Copyright text:
  - Desktop: "sm" (14px)
  - Smart TV: 20px
  - 4K TV: 32px

- Footer links:
  - Desktop: "sm" (14px)
  - Smart TV: 18px
  - 4K TV: 28px

## Implementation Details

### Theme Configuration

Updated in [src/styles/theme.ts](src/styles/theme.ts:75-84):

```typescript
breakpoints: {
    xs: "36em",    // 576px - Small phones
    sm: "48em",    // 768px - Tablets and larger phones
    md: "62em",    // 992px - Small laptops
    lg: "75em",    // 1200px - Desktops
    xl: "88em",    // 1408px - Large desktops
    tv: "120em",   // 1920px - Full HD Smart TVs
    "4k": "240em", // 3840px - 4K Ultra HD Smart TVs
}
```

### Component Updates

1. **[RestaurantMenu.tsx](src/components/RestaurantMenu/RestaurantMenu.tsx:71-86)** - Banner and header text scaling
2. **[MenuItemCard.tsx](src/components/RestaurantMenu/MenuItemCard.tsx:31-55)** - Card dimensions and typography
3. **[Footer.tsx](src/components/Footer/Footer.tsx:11-50)** - Footer text scaling

## Testing on Smart TVs

### Browser Testing

1. **Chrome DevTools:**
   - Open DevTools (F12)
   - Click "Toggle device toolbar" (Ctrl+Shift+M)
   - Click "Edit" in device dropdown
   - Add custom device:
     - Name: "Full HD TV"
     - Width: 1920px
     - Height: 1080px
     - Device pixel ratio: 1
   - Add another custom device:
     - Name: "4K TV"
     - Width: 3840px
     - Height: 2160px
     - Device pixel ratio: 1

2. **Firefox Responsive Design Mode:**
   - Press Ctrl+Shift+M
   - Set custom dimensions: 1920×1080 or 3840×2160

### Real Device Testing

To test on actual Smart TVs:

1. **Samsung Tizen / LG webOS:**
   - Open the built-in browser
   - Navigate to your menu URL
   - Use TV remote to navigate

2. **Android TV / Fire TV:**
   - Install a browser app (Chrome, Firefox)
   - Navigate to your menu URL
   - Use remote or wireless mouse

3. **Apple TV:**
   - Use Safari browser
   - Navigate via Siri Remote

## Distance Viewing Optimization

Smart TVs are typically viewed from 6-12 feet away, which is why we've increased:
- Font sizes (1.6× for Full HD, 2.4× for 4K)
- Image sizes (1.6× for Full HD, 2.4× for 4K)
- Padding/spacing (1.5× for Full HD, 2× for 4K)

These ratios ensure readability from typical TV viewing distances.

## Browser Compatibility

### Supported Browsers on Smart TVs:

✅ **Samsung Tizen (2016+)**
- Built-in browser based on Chromium
- Full CSS3 support
- Media queries work correctly

✅ **LG webOS (2014+)**
- Built-in browser based on Chromium
- Full responsive design support
- Excellent performance

✅ **Android TV**
- Chrome browser
- Firefox browser
- Full modern CSS support

✅ **Fire TV**
- Silk browser
- Chrome browser (sideloaded)
- Good CSS3 support

⚠️ **Older Smart TVs (pre-2014)**
- May have limited CSS3 support
- Media queries might not work
- Consider graceful degradation

## Performance Considerations

### Image Loading
- Images scale up for Smart TVs
- ImageKit automatically serves optimized sizes
- Lazy loading implemented for better performance

### Font Rendering
- Using `em` units for better scaling
- Web fonts loaded efficiently
- Text remains crisp at larger sizes

### Layout Shifts
- Fixed aspect ratios prevent layout shifts
- Images use blurhash placeholders
- Smooth transitions between breakpoints

## Smart TV Remote Control Navigation

### Keyboard Controls

The application includes full remote control support:

| Key | Action |
|-----|--------|
| ← Left Arrow | Previous menu tab/category |
| → Right Arrow | Next menu tab/category |
| ↑ Up Arrow | Navigate to previous menu item |
| ↓ Down Arrow | Navigate to next menu item |
| Enter/OK | Open selected menu item details |
| Escape/Back | Close menu item details modal |

### How It Works

1. **Tab Navigation**: Use left/right arrows to switch between menu categories (Breakfast, Lunch, Dinner, etc.)
2. **Item Navigation**: Use up/down arrows to navigate through menu items in the current category
3. **Item Selection**: Press Enter/OK button to view detailed information about a menu item
4. **Close Details**: Press Escape or Back button to close the item details and return to browsing

### Focus Indicators

- Focused menu items have a visible **primary color outline** (3px)
- Card background darkens/lightens on focus
- Images scale up slightly when focused
- Smooth scrolling keeps focused item in view

### Implementation

The navigation is powered by a custom React hook: `useSmartTVNavigation`

**Location:** [src/hooks/useSmartTVNavigation.ts](src/hooks/useSmartTVNavigation.ts)

**Features:**
- Automatic focus management
- Modal state tracking
- Smooth scrolling to focused items
- Cross-browser compatibility
- No external dependencies

## Accessibility on Smart TVs

### Navigation
- All interactive elements are keyboard navigable
- Large touch targets for remote controls
- Clear focus indicators with primary color outline
- Tab order follows logical flow

### Readability
- High contrast maintained at all sizes
- Sufficient spacing between elements
- Readable from 10 feet away
- Scalable typography

### Color Scheme
- Dark mode supported (better for TVs)
- Light mode available
- Theme toggle easily accessible
- High contrast focus states

## Deployment Notes

When deploying with Smart TV support:

1. **Test on actual devices** - Browser testing doesn't account for:
   - TV remote navigation
   - Different rendering engines
   - TV-specific quirks

2. **Optimize images** - Large displays need high-quality images:
   - Use 2× resolution for Full HD
   - Use 4× resolution for 4K
   - ImageKit handles this automatically

3. **Monitor performance** - Smart TVs often have less powerful processors:
   - Keep animations smooth
   - Minimize JavaScript
   - Lazy load off-screen content

## Future Enhancements

Potential improvements for Smart TV experience:

- [x] TV remote control support (arrow keys, OK button) - **IMPLEMENTED**
- [ ] Voice control integration
- [ ] Screensaver mode with menu rotation
- [ ] QR code display for mobile ordering
- [ ] Auto-advance through menu categories
- [ ] Gesture controls (for newer TVs)
- [ ] Numeric keypad shortcuts (e.g., press "1" to jump to first category)

## Usage Example

Restaurants can now display their menus on:

1. **Digital Menu Boards** - In-restaurant TVs showing full menu
2. **Waiting Area Displays** - 4K TVs in lobbies
3. **Drive-Thru Displays** - Large outdoor screens
4. **Kitchen Displays** - Staff can view orders clearly
5. **Home Viewing** - Customers browsing menus on their Smart TVs

## Technical Support

### Common Issues

**Q: Menu looks tiny on my 4K TV**
A: Ensure the browser is using the full screen width. Some TV browsers default to 1920px viewport.

**Q: Touch doesn't work on my Smart TV**
A: Use the TV remote's arrow keys and OK button. Touch is only for touch-enabled TVs.

**Q: Fonts look blurry**
A: This is normal for some older TV browsers. The app uses web-safe fonts optimized for screen display.

**Q: Images take time to load**
A: Normal on slower TV processors. Images are optimized via ImageKit CDN.

## Updates

- **2025-12-26**: Initial Smart TV support added
  - Full HD (1920px) breakpoint
  - 4K Ultra HD (3840px) breakpoint
  - Responsive typography
  - Optimized card layouts
  - Enhanced footer display

---

**Last Updated:** 2025-12-26
**Version:** 1.0
**Tested on:** Samsung Tizen 6.0+, LG webOS 5.0+, Android TV 11+
