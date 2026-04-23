export const getInitials = (name = '') => {
  return name
    .trim()
    .split(/\s+/)         
    .filter(Boolean)      
    .map(word => word[0]) 
    .join('')
    .toUpperCase()
    .slice(0, 2);
};