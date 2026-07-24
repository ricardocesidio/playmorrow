export interface GameAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  totalWishlists: number;
  totalFollowers: number;
  totalComments: number;
  viewsGrowth: number;
  wishlistsGrowth: number;
  followersGrowth: number;
  dailyViews: { date: string; count: number }[];
  trafficSources: { source: string; count: number; percentage: number }[];
  countries: { country: string; count: number }[];
  topGames: { gameId: string; title: string; slug: string; views: number; wishlists: number; followers: number }[];
}

export interface StudioAnalytics extends GameAnalytics {
  totalGames: number;
  gamesGrowth: number;
  studioViews: number;
}
