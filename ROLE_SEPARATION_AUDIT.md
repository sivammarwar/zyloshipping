# Role Separation Audit Summary

## Overview
This document summarizes the role-based access control (RBAC) audit and fixes implemented for the Zylo dropshipping platform.

## Role Definitions

### Backend (Database)
- **CUSTOMER** - Regular buyer account
- **ADMIN** - Platform administrator with elevated privileges
- **OWNER** - Founder/Platform owner with full access

### Frontend Mapping
- **Buyer** = CUSTOMER role
- **Seller** = Any authenticated user (can create/manage store)
- **Admin/Founder** = ADMIN or OWNER role

## Changes Implemented

### 1. Created Role Constants (`frontend/lib/auth/roles.ts`)
- Single source of truth for role definitions
- Helper functions: `isAdmin()`, `isOwner()`, `hasRequiredRole()`
- Role hierarchy constants for permission checks

### 2. Updated Route Guards

#### AdminGuard (`frontend/components/auth/AdminGuard.tsx`)
**Before:** Only checked for token presence
**After:** Checks for valid token AND verifies user has ADMIN or OWNER role
- Redirects non-admins to home page
- Redirects unauthenticated users to login

#### SellerGuard (`frontend/components/auth/SellerGuard.tsx`)
**NEW COMPONENT** - Protects seller dashboard routes
- Requires any valid authentication
- Any authenticated user can access (they may/may not have a store)

#### BuyerGuard (`frontend/components/auth/BuyerGuard.tsx`)
**NEW COMPONENT** - Protects buyer-specific routes
- Requires valid authentication
- Used for checkout, profile, orders pages

### 3. Updated Middleware (`frontend/middleware.ts`)
**Before:** Only checked cookie presence, no role verification
**After:** 
- `/adminsiva/*` - Checks for token AND verifies ADMIN/OWNER role
- `/dashboard/*` - Requires authentication (any role)
- `/profile/*`, `/orders/*`, `/settings/*`, `/checkout/*` - Requires authentication

### 4. Updated Layout Files

#### Seller Layout (`frontend/app/(admin)/layout.tsx`)
**Fixed:** Changed from `AdminGuard` to `SellerGuard`
- The `(admin)` folder actually contains the seller dashboard (not admin panel)
- This was a naming issue - folder should ideally be renamed to `(seller)`

#### Admin Layout (`frontend/app/adminsiva/layout.tsx`)
**NEW FILE** - Created proper admin layout
- Wraps all `/adminsiva/*` routes with `AdminGuard`
- Ensures only ADMIN/OWNER roles can access founder panel

### 5. Updated Navigation Components

#### MobileNav (`frontend/components/layout/MobileNav.tsx`)
**Fixed:** Proper role-based link visibility
- Admin Dashboard link only shows for ADMIN/OWNER roles
- Seller Dashboard link shows for all authenticated users
- Uses `isAdmin()` helper from role constants

## Route Access Matrix

| Route | Role Required | Redirect if No Auth | Redirect if Wrong Role |
|-------|--------------|---------------------|----------------------|
| `/` (homepage) | None | - | - |
| `/products` | None | - | - |
| `/store/[slug]` | None (public stores) | - | - |
| `/login`, `/register` | None | - | - |
| `/dashboard` | Any authenticated | `/login` | - |
| `/profile` | Any authenticated | `/login` | - |
| `/orders` | Any authenticated | `/login` | - |
| `/checkout` | Any authenticated | `/login` | - |
| `/adminsiva` | ADMIN or OWNER | `/adminsiva/login` | `/` (home) |

## Backend API Protection Status

### Store Routes (`/api/user/store/*`)
- `GET /` - Requires auth, returns user's own store
- `POST /` - Requires auth, creates store for authenticated user
- `PATCH /` - Requires auth, updates user's own store
- `GET /public/:slug` - Public, no auth required
- `GET /by-slug/:slug` - Requires auth, verifies ownership

### Admin Routes (`/api/admin/*`)
- All routes use `authMiddleware` + `requireAdmin` + `requireMFA`
- Only ADMIN and OWNER roles can access

### Order Routes (`/api/orders/*`)
- `GET /` - Requires auth, shows user's orders (admins see all)
- `GET /stats` - Requires auth + adminMiddleware
- Other routes require auth with ownership verification

### Product Routes (`/api/products/*`)
- `GET /` - Public, no auth required (product browsing)
- Write operations protected with authMiddleware + adminMiddleware

## Files Modified/Created

### Created Files:
1. `frontend/lib/auth/roles.ts` - Role constants and helpers
2. `frontend/components/auth/SellerGuard.tsx` - Seller route protection
3. `frontend/components/auth/BuyerGuard.tsx` - Buyer route protection
4. `frontend/app/adminsiva/layout.tsx` - Admin layout with AdminGuard

### Modified Files:
1. `frontend/components/auth/AdminGuard.tsx` - Added role checking
2. `frontend/middleware.ts` - Added role-based route protection
3. `frontend/app/(admin)/layout.tsx` - Changed to SellerGuard
4. `frontend/components/layout/MobileNav.tsx` - Fixed role-based navigation

## Known Issues / Future Improvements

1. **Folder Naming**: The `(admin)` folder contains seller dashboard - should be renamed to `(seller)`
2. **adminsiva**: Uses separate founder_token system - could be unified with main auth system
3. **Token Keys**: Mix of `token`, `auth_token`, `admin_token` in localStorage - should be standardized
4. **Admin Panel**: The `/adminsiva` route uses hardcoded founder credentials - should use proper role-based auth

## Testing Checklist

- [ ] CUSTOMER can access `/dashboard`, `/profile`, `/orders`
- [ ] CUSTOMER cannot access `/adminsiva` (redirects to home)
- [ ] ADMIN can access `/adminsiva` and all other routes
- [ ] OWNER can access `/adminsiva` and all other routes
- [ ] Unauthenticated users are redirected to login from protected routes
- [ ] MobileNav shows correct links based on role
- [ ] Store creation/management works for authenticated users
