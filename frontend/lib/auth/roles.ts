/**
 * User Role Constants
 * Single source of truth for all role definitions across the application
 */

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

export enum AdminRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
}

// Role display names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: 'Buyer',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.OWNER]: 'Founder',
};

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.CUSTOMER]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.OWNER]: 3,
};

// Check if user has required role or higher
export function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Check if user is admin (ADMIN or OWNER)
export function isAdmin(userRole?: UserRole): boolean {
  if (!userRole) return false;
  return userRole === UserRole.ADMIN || userRole === UserRole.OWNER;
}

// Check if user is founder/owner
export function isOwner(userRole?: UserRole): boolean {
  if (!userRole) return false;
  return userRole === UserRole.OWNER;
}

// Check if user is seller (has store access - any role that can create/manage stores)
// Currently CUSTOMER with a store becomes a seller
export function isSeller(userRole?: UserRole): boolean {
  if (!userRole) return false;
  return true; // All authenticated users can potentially be sellers (have a store)
}
