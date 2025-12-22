# Branding Customization

This application supports full branding customization through environment variables.

## Configuration

Add the following variables to your `.env` file:

```env
# Branding Configuration
NEXT_PUBLIC_APP_NAME=Menufic
NEXT_PUBLIC_APP_URL=https://menufic.com
NEXT_PUBLIC_LOGO_PATH=/menufic_logo.svg
```

## Variables

### `NEXT_PUBLIC_APP_NAME`
- **Default**: `Menufic`
- **Description**: The name of your application
- **Used in**:
  - Page titles (browser tab)
  - SEO meta tags
  - Footer copyright text (via translation file)

### `NEXT_PUBLIC_APP_URL`
- **Default**: `https://menufic.com`
- **Description**: The main URL of your application
- **Used in**:
  - OpenGraph meta tags
  - SEO site name

### `NEXT_PUBLIC_LOGO_PATH`
- **Default**: `/menufic_logo.svg`
- **Description**: Path to your logo file
- **Supported formats**:
  - **Local path** (relative to `public` folder): `/my-logo.png`
  - **Absolute URL**: `https://example.com/logo.png` or `http://example.com/logo.png`
- **Validation**: Must start with `/`, `http://`, or `https://`
- **Used in**:
  - Header navigation
  - Logo component throughout the app
- **Image formats**: SVG, PNG, JPG, WEBP, GIF

## Customization Steps

### 1. Prepare Your Logo

Place your logo file in the `public` folder:
```
public/
  └── my-custom-logo.svg  (or .png, .jpg, etc.)
```

### 2. Update Environment Variables

Edit your `.env` file:
```env
NEXT_PUBLIC_APP_NAME=My Restaurant App
NEXT_PUBLIC_APP_URL=https://myrestaurantapp.com
NEXT_PUBLIC_LOGO_PATH=/my-custom-logo.svg
```

### 3. Update Translations (Optional)

Edit `src/lang/en.json` to customize the footer copyright:
```json
{
  "common": {
    "footerCopyright": "© {year} Copyright: My Restaurant App"
  }
}
```

### 4. Rebuild the Application

```bash
# For Docker
docker-compose down
docker build --build-arg CACHEBUST=$(date +%s) -t your-image-name:latest .
docker-compose up -d

# For local development
npm run build
npm start
```

## Examples

### Example 1: White-label for a specific client
```env
NEXT_PUBLIC_APP_NAME=Bistro Manager
NEXT_PUBLIC_APP_URL=https://bistromanager.io
NEXT_PUBLIC_LOGO_PATH=/bistro-logo.png
```

### Example 2: Using external CDN logo
```env
NEXT_PUBLIC_APP_NAME=FoodMenu Pro
NEXT_PUBLIC_APP_URL=https://foodmenupro.com
NEXT_PUBLIC_LOGO_PATH=https://cdn.foodmenupro.com/assets/logo.svg
```

### Example 3: Using ImageKit or cloud storage
```env
NEXT_PUBLIC_APP_NAME=VenueHub
NEXT_PUBLIC_APP_URL=https://venuehub.app
NEXT_PUBLIC_LOGO_PATH=https://ik.imagekit.io/yourcompany/logo.png
```

## Notes

- Logo image dimensions: Recommended 200x50 pixels
- Supported formats: SVG, PNG, JPG, WEBP
- All `NEXT_PUBLIC_*` variables are bundled at build time
- Changes require a rebuild to take effect
