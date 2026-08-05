export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  scores: Record<string, number>;
  model: string;
}

export interface ModerationProvider {
  readonly name: string;
  moderate(text: string): Promise<ModerationResult>;
}
