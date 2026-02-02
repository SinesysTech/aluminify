# Brand Customization Specification

## ADDED Requirements

### Requirement: Logo Upload with Real-Time Propagation

The system SHALL propagate logo updates to all connected components immediately after a successful upload, without requiring a page refresh.

#### Scenario: Successful logo upload updates sidebar

- **GIVEN** a user is on the brand customization page
- **AND** the sidebar is visible with the current logo (or default)
- **WHEN** the user uploads a new sidebar logo
- **AND** the upload completes successfully
- **THEN** the sidebar logo SHALL update within 1 second
- **AND** no page refresh SHALL be required
- **AND** the user SHALL see a success message

#### Scenario: Logo upload with cache invalidation

- **GIVEN** a user uploads a new logo
- **WHEN** the upload completes successfully
- **THEN** the returned logo URL SHALL include a cache-busting parameter
- **AND** the browser SHALL fetch the new image instead of serving from cache

#### Scenario: Failed upload does not affect current logo

- **GIVEN** a user has a current logo configured
- **WHEN** the user attempts to upload a new logo
- **AND** the upload fails (network error, validation error, etc.)
- **THEN** the current logo SHALL remain displayed
- **AND** no partial update SHALL occur

---

### Requirement: Centralized Branding State Management

The system SHALL manage branding state through a centralized provider that serves as the single source of truth for all branding-related components.

#### Scenario: Components receive branding updates via context

- **GIVEN** multiple components display tenant branding (sidebar, header, etc.)
- **WHEN** the branding configuration is updated
- **THEN** all connected components SHALL receive the update via React context
- **AND** components SHALL NOT need to fetch data individually

#### Scenario: Provider exposes logo URLs

- **GIVEN** a TenantBrandingProvider is active
- **WHEN** a component needs to display a logo
- **THEN** it SHALL be able to access the logo URL via `getLogoUrl(type)` method
- **AND** the URL SHALL include cache-busting parameter when available

#### Scenario: Provider handles missing branding gracefully

- **GIVEN** a tenant has no custom branding configured
- **WHEN** components request branding data
- **THEN** the provider SHALL return null values for logos
- **AND** components SHALL display default fallback content

---

### Requirement: Cross-Tab Synchronization

The system SHALL synchronize branding updates across multiple browser tabs for the same user session.

#### Scenario: Logo update propagates to other tabs

- **GIVEN** a user has the application open in two browser tabs
- **WHEN** the user uploads a new logo in Tab A
- **THEN** Tab B SHALL display the new logo within 2 seconds
- **AND** no manual refresh SHALL be required in Tab B

#### Scenario: Branding reset propagates to other tabs

- **GIVEN** a user has the application open in multiple tabs
- **WHEN** the user resets branding to defaults in one tab
- **THEN** all other tabs SHALL revert to default branding
- **AND** synchronization SHALL complete within 2 seconds

#### Scenario: Cross-tab sync with fallback mechanism

- **GIVEN** the primary sync mechanism (BroadcastChannel) is unavailable
- **WHEN** branding is updated
- **THEN** the system SHALL fall back to localStorage events
- **AND** synchronization SHALL still occur (may have slightly longer delay)

---

### Requirement: Standalone Logo Display Mode

The system SHALL support displaying tenant logos in contexts where the TenantBrandingProvider is not available (e.g., login pages).

#### Scenario: Logo display on login page

- **GIVEN** a user navigates to a tenant-specific login page
- **AND** the TenantBrandingProvider is NOT active (user not authenticated)
- **WHEN** the page loads
- **THEN** the TenantLogo component SHALL fetch the logo via public API
- **AND** the tenant's custom logo SHALL be displayed

#### Scenario: Fallback to default on public pages

- **GIVEN** a user navigates to a login page
- **AND** the tenant has no custom logo configured
- **WHEN** the page loads
- **THEN** a default system logo or fallback text SHALL be displayed
- **AND** no error SHALL be shown to the user

#### Scenario: Component detects provider availability

- **GIVEN** a TenantLogo component is rendered
- **WHEN** the component initializes
- **THEN** it SHALL detect if TenantBrandingProvider context is available
- **AND** choose the appropriate mode (connected or standalone) automatically

---

### Requirement: Upload Triggers Immediate Refresh

The system SHALL trigger an immediate refresh of branding data after any logo upload operation.

#### Scenario: Refresh after successful upload

- **GIVEN** a user uploads a logo via the brand customization panel
- **WHEN** the API returns success
- **THEN** `refreshBranding()` SHALL be called immediately
- **AND** the provider state SHALL be updated with fresh data from the server

#### Scenario: Cross-tab notification after upload

- **GIVEN** a user uploads a logo
- **WHEN** the refresh completes
- **THEN** `triggerCrossTabUpdate()` SHALL be called
- **AND** other tabs SHALL be notified of the change

#### Scenario: Upload state consistency

- **GIVEN** a user uploads a logo
- **WHEN** the upload and refresh complete
- **THEN** the local panel state SHALL match the provider state
- **AND** the displayed logo SHALL match the stored logo

---

## MODIFIED Requirements

### Requirement: TenantLogo Component Behavior

The TenantLogo component SHALL display tenant-specific logos with support for both provider-connected and standalone modes, automatically selecting the appropriate mode based on context availability.

#### Scenario: Connected mode when provider available

- **GIVEN** TenantLogo is rendered inside TenantBrandingProvider
- **WHEN** the component mounts
- **THEN** it SHALL use logo data from the provider context
- **AND** it SHALL NOT make its own API calls
- **AND** it SHALL react to context updates automatically

#### Scenario: Standalone mode when provider unavailable

- **GIVEN** TenantLogo is rendered outside TenantBrandingProvider
- **WHEN** the component mounts
- **THEN** it SHALL fetch logo data via the public API endpoint
- **AND** it SHALL manage its own loading and error states

#### Scenario: Force standalone mode via prop

- **GIVEN** TenantLogo is rendered with `forceStandalone={true}`
- **WHEN** the component mounts
- **THEN** it SHALL use standalone mode even if provider is available
- **AND** this allows preview functionality during upload

#### Scenario: Fallback display when no logo

- **GIVEN** TenantLogo cannot find a logo (context or API)
- **WHEN** rendering completes
- **THEN** it SHALL display the `fallbackText` prop content
- **AND** it SHALL use default styling for the fallback

#### Scenario: Error handling with graceful degradation

- **GIVEN** an error occurs loading the logo image
- **WHEN** the image fails to load
- **THEN** the component SHALL display the fallback content
- **AND** it SHALL NOT show an error message to the user

---

## ADDED Requirements

### Requirement: Logo URL Cache-Busting

The system SHALL append a version parameter to logo URLs to ensure browsers fetch the latest version after updates.

#### Scenario: Upload returns versioned URL

- **GIVEN** a user uploads a new logo
- **WHEN** the API processes the upload
- **THEN** the returned `logoUrl` SHALL include a `?v={timestamp}` parameter
- **AND** the timestamp SHALL represent the upload time

#### Scenario: Provider serves versioned URLs

- **GIVEN** the TenantBrandingProvider has logo data
- **WHEN** `getLogoUrl(type)` is called
- **THEN** the returned URL SHALL include the version parameter
- **AND** the version SHALL update after each upload

#### Scenario: Cache-busting prevents stale images

- **GIVEN** a logo was recently updated
- **WHEN** a component requests the logo URL
- **THEN** the browser SHALL request the image from the server
- **AND** the browser SHALL NOT serve a cached version from before the update
