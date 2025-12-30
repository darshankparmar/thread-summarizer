/**
 * Client-side authentication utilities
 * Safe to use in client components
 */

import { Session } from 'next-auth';

/**
 * Extract user display information from session
 * Client-side utility for components
 */
export function getUserDisplayInfo(session: Session | null) {
  if (!session?.user) {
    return {
      username: 'guest',
      displayName: 'Guest User',
      avatar: undefined,
      primaryRole: 'guest'
    };
  }

  const user = session.user;
  
  return {
    username: user.username || user.email?.split('@')[0] || 'User',
    displayName: user.name || user.username || 'User',
    avatar: user.image || undefined,
    primaryRole: typeof user.roles?.[0] === 'string' 
      ? user.roles[0] 
      : user.roles?.[0]?.name || 'User'
  };
}