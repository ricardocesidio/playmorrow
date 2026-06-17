/**
 * Shared enum string-literal unions. These mirror the Prisma enums in
 * `@playmorrow/database` so the web and api layers can speak the same language
 * without importing the generated client. Keep the string values in sync with
 * `packages/database/prisma/schema.prisma`.
 */

/** Global account role. Studio-scoped roles live on `studio_members`. */
export type UserRole = 'PLAYER' | 'PUBLISHER' | 'MODERATOR' | 'ADMIN';
export const USER_ROLES = ['PLAYER', 'PUBLISHER', 'MODERATOR', 'ADMIN'] as const;

/** A member's role within a single studio. */
export type StudioRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export const STUDIO_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const;

/** Where a game is in its lifecycle. Drives the public status badge. */
export type GameStatus =
  | 'CONCEPT'
  | 'IN_DEVELOPMENT'
  | 'ALPHA'
  | 'BETA'
  | 'EARLY_ACCESS'
  | 'RELEASED'
  | 'CANCELLED'
  | 'ON_HOLD';
export const GAME_STATUSES = [
  'CONCEPT',
  'IN_DEVELOPMENT',
  'ALPHA',
  'BETA',
  'EARLY_ACCESS',
  'RELEASED',
  'CANCELLED',
  'ON_HOLD',
] as const;

export type MediaType = 'SCREENSHOT' | 'TRAILER' | 'VIDEO' | 'LOGO' | 'BANNER' | 'IMAGE';
export const MEDIA_TYPES = ['SCREENSHOT', 'TRAILER', 'VIDEO', 'LOGO', 'BANNER', 'IMAGE'] as const;

export type RoadmapStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export const ROADMAP_STATUSES = ['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;

/** Reaction kinds on devlogs/comments (V1 keeps it to LIKE). */
export type ReactionType = 'LIKE' | 'LOVE' | 'HYPE' | 'INSIGHTFUL';
export const REACTION_TYPES = ['LIKE', 'LOVE', 'HYPE', 'INSIGHTFUL'] as const;

/** Polymorphic follow target. */
export type FollowTargetType = 'STUDIO' | 'GAME';
export const FOLLOW_TARGET_TYPES = ['STUDIO', 'GAME'] as const;

/** What a moderation report points at. */
export type ReportTargetType = 'GAME' | 'STUDIO' | 'DEVLOG' | 'COMMENT' | 'USER';
export const REPORT_TARGET_TYPES = ['GAME', 'STUDIO', 'DEVLOG', 'COMMENT', 'USER'] as const;

export type ReportStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
export const REPORT_STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const;

/** Distribution platforms / external link kinds for a game. */
export type PlatformKind =
  | 'STEAM'
  | 'ITCH'
  | 'EPIC'
  | 'GOG'
  | 'PLAYSTATION'
  | 'XBOX'
  | 'NINTENDO'
  | 'WEB'
  | 'ANDROID'
  | 'IOS'
  | 'DEMO'
  | 'DISCORD'
  | 'WEBSITE'
  | 'OTHER';
export const PLATFORM_KINDS = [
  'STEAM',
  'ITCH',
  'EPIC',
  'GOG',
  'PLAYSTATION',
  'XBOX',
  'NINTENDO',
  'WEB',
  'ANDROID',
  'IOS',
  'DEMO',
  'DISCORD',
  'WEBSITE',
  'OTHER',
] as const;

/** In-app notification type. */
export type NotificationType = 'NEW_FOLLOWER' | 'NEW_COMMENT' | 'NEW_REPLY' | 'NEW_REACTION';
export const NOTIFICATION_TYPES = ['NEW_FOLLOWER', 'NEW_COMMENT', 'NEW_REPLY', 'NEW_REACTION'] as const;

/** Polymorphic target of a notification. */
export type NotificationTargetType = 'STUDIO' | 'GAME' | 'DEVLOG' | 'COMMENT';
export const NOTIFICATION_TARGET_TYPES = ['STUDIO', 'GAME', 'DEVLOG', 'COMMENT'] as const;
