const EMAIL = 'marwa.arif@prevalent.ai';

const parts = EMAIL.split('@')[0].split('.');
export const USER_INITIALS = parts.map(p => p[0].toUpperCase()).join('');
export const USER_FIRST_NAME = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
export const USER_FULL_NAME = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
