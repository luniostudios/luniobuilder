export const getProjectLimitForRole = (role?: string) => {
  switch (String(role || 'free').toLowerCase()) {
    case 'admin':
    case 'owner':
      return 1000000;
    case 'pro':
    case 'premium':
    case 'team':
      return 20;
    case 'business':
      return 50;
    case 'free':
    case 'basic':
    default:
      return 3;
  }
};

export const getAIDailyLimitForRole = (role?: string) => {
  switch (String(role || 'free').toLowerCase()) {
    case 'admin':
    case 'owner':
      return 1000000;
    case 'business':
      return 100;
    case 'pro':
    case 'premium':
    case 'team':
      return 25;
    case 'free':
    case 'basic':
    default:
      return 5;
  }
};