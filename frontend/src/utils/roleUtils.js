// Utility functions for role-based access control
export const isAdmin = (user) => user?.role === 'admin' || user?.email === 'admin@campus.edu';
export const isStudent = (user) => user?.role === 'Student';
export const isFaculty = (user) => user?.role === 'Faculty';
export const isCommunity = (user) => user?.role === 'Community';

// Check if user has access to regular navigation (non-admin features)
export const hasRegularNavigationAccess = (user) => !isAdmin(user);

// Check if user has access to admin features
export const hasAdminAccess = (user) => isAdmin(user);
