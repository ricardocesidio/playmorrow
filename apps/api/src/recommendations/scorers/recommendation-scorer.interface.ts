export interface RecommendationScorer {
  name: string;
  score(userId: string, candidateGameIds: string[]): Promise<Map<string, number>>;
}
