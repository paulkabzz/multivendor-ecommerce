export function formatTimeAgo(timestamp: string): string {
  const now: Date = new Date();
  const date: Date = new Date(timestamp);
  
  const today: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate: Date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffMs: number = today.getTime() - targetDate.getTime();
  const diffDays: number = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Today
  if (diffDays === 0) {
    return 'today';
  }
  
  // Days ago (1-6 days)
  if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  
  // Weeks ago (1-3 weeks)
  if (diffDays < 28) {
    const weeks: number = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  
  // Months ago (up to 6 months)
  const diffMonths: number = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  
  if (diffMonths <= 6) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  }
  
  // Longer than 6 months
  return 'long time ago';
}