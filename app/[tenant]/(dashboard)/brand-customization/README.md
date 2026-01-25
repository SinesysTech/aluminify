# Brand Customization Module

Self-contained module for managing brand/theme customization functionality including logos, color palettes, and font schemes.

## Overview

This module consolidates all tenant-specific brand customization features following the "virtual polyrepo" pattern. It provides a complete solution for managing company branding independently from user theme preferences.

## Directory Structure

```
brand-customization/
├── page.tsx                           # Main branding configuration page
├── layout.tsx                         # Page layout wrapper
├── components/                        # UI components
│   ├── brand-customization-panel.tsx  # Main customization panel
│   ├── color-palette-editor.tsx       # Color palette editor
│   ├── font-scheme-selector.tsx       # Font scheme selector
│   ├── logo-upload-component.tsx      # Logo upload component
│   └── index.ts                       # Component exports
├── services/                          # Business logic & data access
│   ├── brand-customization-manager.ts # Main service manager
│   ├── brand-customization.repository.ts # Database operations
│   ├── brand-customization.types.ts   # Service types
│   ├── color-palette-manager.ts       # Color management
│   ├── font-scheme-manager.ts         # Font management
│   ├── logo-manager.ts                # Logo management
│   └── index.ts                       # Service exports
└── README.md                          # This file
```

## Usage

### Accessing the Module

The brand customization page is available at:
```
/[tenant]/brand-customization
```

### Importing Components

```typescript
// Import components using path alias
import { BrandCustomizationPanel } from '@/brand-customization/components';
import { ColorPaletteEditor } from '@/brand-customization/components';
```

### Importing Services

```typescript
// Import services using path alias
import { BrandCustomizationManager } from '@/brand-customization/services';
import { LogoManagerImpl } from '@/brand-customization/services';
```

## API Routes

The module works with the following API endpoints under `/api/tenant-branding/[empresaId]`:

- **GET** `/api/tenant-branding/[empresaId]` - Load tenant branding
- **POST** `/api/tenant-branding/[empresaId]` - Save tenant branding
- **DELETE** `/api/tenant-branding/[empresaId]` - Reset to defaults

### Specialized Endpoints

- **Color Palettes**: `/api/tenant-branding/[empresaId]/color-palettes/*`
- **Font Schemes**: `/api/tenant-branding/[empresaId]/font-schemes/*`
- **Logos**: `/api/tenant-branding/[empresaId]/logos/*`
- **Public**: `/api/tenant-branding/[empresaId]/public` - Public access endpoint

## Features

### Logo Management
- Upload custom logos for different contexts (login, sidebar, header)
- Support for light and dark mode variants
- Automatic image optimization and storage

### Color Palette Customization
- Create and manage custom color schemes
- Preview colors in real-time
- Validate color contrast and accessibility
- Export/import color palettes

### Font Scheme Management
- Select from Google Fonts library
- Configure font families for different UI elements
- Preview font combinations
- Manage font weights and styles

## Development Guidelines

### Adding New Features

1. **Components**: Add new UI components in `components/` directory
2. **Services**: Add business logic in `services/` directory
3. **Types**: Define types in `services/brand-customization.types.ts`
4. **Exports**: Update `index.ts` files to export new additions

### Module Independence

This module follows the "virtual polyrepo" pattern:
- All related functionality is self-contained
- External dependencies are minimal
- Types are defined within the module
- Services are co-located with components

### Testing

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build
```

## Related Files

### Configuration
- Path alias configured in `tsconfig.json`:
  ```json
  "@/brand-customization/*": ["./app/[tenant]/(dashboard)/brand-customization/*"]
  ```

### Integration Points
- **Settings Integration**: `app/[tenant]/(dashboard)/configuracoes/components/perfil/branding-settings.tsx`
- **Theme Customizer**: `app/shared/components/ui/theme-customizer/panel.tsx`
- **Type Definitions**: `@/brand-customization/services/brand-customization.types.ts`

## Migration Notes

This module was consolidated from:
- `backend/services/brand-customization/` → `services/`
- `app/shared/components/brand-customization/` → `components/`
- `app/[tenant]/(dashboard)/admin/empresa/branding/` → `/` (root)

All imports have been updated to use the new `@/brand-customization/*` path alias.
