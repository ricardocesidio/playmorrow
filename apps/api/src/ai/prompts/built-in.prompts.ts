import type { PromptTemplate } from './prompt.registry';

export const BUILT_IN_PROMPTS: PromptTemplate[] = [
  {
    name: 'game-summary',
    version: 1,
    systemPrompt:
      'You are a game expert. Provide concise, accurate game information based on the provided context.',
    template:
      'Summarize the game "{{title}}" in 2-3 sentences. Context: {{context}}',
    variables: ['title', 'context'],
    description: 'Generate a concise game summary',
  },
  {
    name: 'devlog-draft',
    version: 1,
    systemPrompt:
      "You are a game development writing assistant. Write in the studio's voice.",
    template:
      'Write a devlog update for the game "{{title}}" about: {{topic}}. Studio voice: {{voice}}',
    variables: ['title', 'topic', 'voice'],
    description: 'Draft a devlog post',
  },
  {
    name: 'game-recommendation',
    version: 1,
    systemPrompt:
      'You are a game recommendation expert. Recommend games based on player preferences and game data.',
    template:
      'Based on the player liking {{likedGames}}, recommend 3 similar games from: {{candidates}}',
    variables: ['likedGames', 'candidates'],
    description: 'Personalized game recommendations',
  },
  {
    name: 'store-page-optimize',
    version: 1,
    systemPrompt:
      'You are a game marketing expert. Optimize store page content for discoverability.',
    template:
      'Analyze this store page for the game "{{title}}" and suggest improvements. Description: {{description}}. Tags: {{tags}}. Genre: {{genre}}',
    variables: ['title', 'description', 'tags', 'genre'],
    description: 'Optimize game store page',
  },
  {
    name: 'moderation-review',
    version: 1,
    systemPrompt:
      'You are a content moderation assistant. Review user-generated content for policy violations.',
    template:
      'Review this {{contentType}} and determine if it violates any policies: {{content}}',
    variables: ['contentType', 'content'],
    description: 'Assist with content moderation',
  },
  {
    name: 'game-description-expand',
    version: 1,
    systemPrompt:
      'You are a game narrative designer. Write compelling, professional game descriptions.',
    template:
      'Write a store page description for the game "{{title}}". Genre: {{genre}}. Key features: {{features}}. Target audience: {{audience}}',
    variables: ['title', 'genre', 'features', 'audience'],
    description: 'Expand a game description for store pages',
  },
  {
    name: 'help-search',
    version: 1,
    systemPrompt:
      'You are a helpful support assistant for Playmorrow, a game platform. Answer based on provided documentation.',
    template:
      'User question: {{question}}\n\nRelevant help articles:\n{{articles}}\n\nProvide a concise, accurate answer.',
    variables: ['question', 'articles'],
    description: 'Answer support questions using help articles',
  },
  {
    name: 'roadmap-summary',
    version: 1,
    systemPrompt:
      'You are a project management assistant. Summarize roadmap progress clearly.',
    template:
      'Summarize the roadmap progress for "{{title}}". Items: {{items}}',
    variables: ['title', 'items'],
    description: 'Summarize roadmap item progress',
  },
];
