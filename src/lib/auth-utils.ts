import { Session } from 'next-auth';
import { ForumsRole } from '@/types';

/**
 * Utility functions for authentication and authorization
 */

/**
 * Check if user has a specific role
 */
export function hasRole(session: Session | null, role: string): boolean {
  if (!session?.user) return false;
  
  const userRoles = (session.user as { roles?: (string | ForumsRole)[] }).roles;
  if (!userRoles) return false;
  
  return userRoles.some(userRole => 
    typeof userRole === 'string' ? userRole === role : userRole.name === role
  );
}

/**
 * Check if user is an admin
 */
export function isAdmin(session: Session | null): boolean {
  return hasRole(session, 'admin');
}

/**
 * Check if user is a moderator
 */
export function isModerator(session: Session | null): boolean {
  return hasRole(session, 'moderator') || isAdmin(session);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(session: Session | null, roles: string[]): boolean {
  if (!session?.user) return false;
  
  const userRoles = (session.user as { roles?: (string | ForumsRole)[] }).roles;
  if (!userRoles) return false;
  
  return roles.some(role => 
    userRoles.some(userRole => 
      typeof userRole === 'string' ? userRole === role : userRole.name === role
    )
  );
}

/**
 * Get user's primary role (highest priority role)
 */
export function getPrimaryRole(session: Session | null): string {
  if (!session?.user) return 'guest';
  
  const userRoles = (session.user as { roles?: (string | ForumsRole)[] }).roles;
  if (!userRoles || userRoles.length === 0) return 'user';
  
  // Convert role objects to strings
  const roleNames = userRoles.map(role => 
    typeof role === 'string' ? role : role.name
  );
  
  // Role hierarchy (highest to lowest priority)
  const roleHierarchy = ['admin', 'moderator', 'premium', 'user'];
  
  for (const role of roleHierarchy) {
    if (roleNames.includes(role)) {
      return role;
    }
  }
  
  return roleNames[0]; // Return first role if none match hierarchy
}

/**
 * Check if user can access a resource based on roles
 */
export function canAccess(session: Session | null, requiredRoles: string[]): boolean {
  if (requiredRoles.length === 0) return true; // No roles required
  if (!session?.user) return false;
  
  return hasAnyRole(session, requiredRoles);
}

/**
 * Get user display information
 */
export function getUserDisplayInfo(session: Session | null): {
  displayName: string;
  username: string;
  avatar?: string;
  primaryRole: string;
} {
  if (!session?.user) {
    return {
      displayName: 'Guest',
      username: 'guest',
      primaryRole: 'guest'
    };
  }
  
  const user = session.user as { username?: string; image?: string };
  
  return {
    displayName: user.username || session.user.name || 'User',
    username: user.username || session.user.name || 'user',
    avatar: user.image,
    primaryRole: getPrimaryRole(session)
  };
}

/**
 * Check if user can perform AI operations (requires authentication)
 */
export function canUseAI(session: Session | null): boolean {
  return !!session?.user;
}

/**
 * Check if user can moderate content
 */
export function canModerate(session: Session | null): boolean {
  return isModerator(session);
}

/**
 * Check if user can access admin features
 */
export function canAdmin(session: Session | null): boolean {
  return isAdmin(session);
}

/**
 * Get Foru.ms token from session (server-side only)
 * This should only be used in API routes or server components
 */
export function getForumsToken(session: Session | null): string | null {
  if (!session?.user) return null;
  
  // Note: forumsToken is stored in JWT but not exposed to client
  // This function would need to be used in server-side contexts
  // where the full JWT token is available
  return (session as { forumsToken?: string }).forumsToken || null;
}

/**
 * Format user roles for display
 */
export function formatRoles(roles: (string | ForumsRole)[] | undefined): string {
  if (!roles || roles.length === 0) return 'User';
  
  // Convert role objects to strings
  const roleNames = roles.map(role => 
    typeof role === 'string' ? role : role.name
  );
  
  const roleDisplayNames: Record<string, string> = {
    admin: 'Administrator',
    moderator: 'Moderator',
    premium: 'Premium User',
    user: 'User'
  };
  
  const displayRoles = roleNames.map(role => roleDisplayNames[role] || role);
  
  if (displayRoles.length === 1) {
    return displayRoles[0];
  }
  
  if (displayRoles.length === 2) {
    return displayRoles.join(' & ');
  }
  
  return displayRoles.slice(0, -1).join(', ') + ' & ' + displayRoles.slice(-1);
}

/**
 * Check if user owns a resource (by user ID)
 */
export function ownsResource(session: Session | null, resourceUserId: string): boolean {
  if (!session?.user) return false;
  const userId = (session.user as { id?: string }).id;
  if (!userId) return false;
  return userId === resourceUserId;
}

/**
 * Check if user can edit a resource (owns it or has moderation rights)
 */
export function canEdit(session: Session | null, resourceUserId: string): boolean {
  return ownsResource(session, resourceUserId) || canModerate(session);
}

/**
 * Check if user can delete a resource (owns it or has admin rights)
 */
export function canDelete(session: Session | null, resourceUserId: string): boolean {
  return ownsResource(session, resourceUserId) || isAdmin(session);
}