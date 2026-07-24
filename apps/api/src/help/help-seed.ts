import { PrismaClient } from '@playmorrow/database';

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: 'getting-started', title: 'Getting Started', description: 'New to Playmorrow? Start here.', icon: 'rocket', position: 1 },
  { slug: 'player-guide', title: 'Player Guide', description: 'Everything about playing and exploring games.', icon: 'gamepad', position: 2 },
  { slug: 'studio-guide', title: 'Studio Guide', description: 'Manage your studio and publish games.', icon: 'building', position: 3 },
  { slug: 'account-security', title: 'Account & Security', description: 'Managing your account and keeping it safe.', icon: 'lock', position: 4 },
  { slug: 'publishing', title: 'Publishing', description: 'Create and publish your games on Playmorrow.', icon: 'upload', position: 5 },
  { slug: 'devlogs', title: 'Devlogs', description: 'Writing and managing development logs.', icon: 'pen', position: 6 },
  { slug: 'community', title: 'Community', description: 'Comments, reactions, and moderation.', icon: 'users', position: 7 },
  { slug: 'faq', title: 'FAQ', description: 'Frequently asked questions.', icon: 'help-circle', position: 8 },
] as const;

const ARTICLES: Array<{
  slug: string;
  title: string;
  description: string;
  categorySlug: string;
  tags: string[];
  isFeatured: boolean;
  body: string;
  readingTimeMin: number;
}> = [
  // ── Getting Started ──────────────────────────────────────────────────────
  {
    slug: 'what-is-playmorrow',
    title: 'What is Playmorrow?',
    description: 'An overview of the Playmorrow platform and what you can do here.',
    categorySlug: 'getting-started',
    tags: ['platform', 'overview'],
    isFeatured: true,
    readingTimeMin: 2,
    body: `Playmorrow is a community-driven platform where game developers and players connect. Developers can create studio pages, publish games, write development logs (devlogs), and share roadmaps. Players can discover new games, follow their favorite studios, wishlist games, and engage with the community through comments and reactions.

Key features include:
- Studio pages with member management
- Game listing with screenshots, trailers, and press kits
- Devlog system for sharing development progress
- Roadmap planning with public visibility
- Community engagement through comments and reactions
- Notification system for updates and interactions
- XP and achievement system for gamification

Whether you are an indie developer or a passionate gamer, Playmorrow provides the tools you need to share and discover great games.`,
  },
  {
    slug: 'creating-your-account',
    title: 'Creating Your Account',
    description: 'Step-by-step guide to creating your Playmorrow account.',
    categorySlug: 'getting-started',
    tags: ['account', 'registration'],
    isFeatured: true,
    readingTimeMin: 2,
    body: `Creating a Playmorrow account is quick and easy.

1. Visit the Playmorrow homepage and click "Sign Up".
2. Choose your account type: Player or Studio.
3. Enter your email address, username, and password.
4. Accept the Terms of Service and Privacy Policy.
5. Complete the onboarding wizard to set up your profile.

You can also sign up using Google or GitHub OAuth for faster registration.

After creating your account, you will receive a welcome notification. You can then customize your profile, follow studios, and start exploring games.

Make sure to verify your email address to unlock all features, including posting comments and creating content.`,
  },
  {
    slug: 'navigating-the-platform',
    title: 'Navigating the Platform',
    description: 'Learn how to browse and find your way around Playmorrow.',
    categorySlug: 'getting-started',
    tags: ['navigation', 'basics'],
    isFeatured: false,
    readingTimeMin: 3,
    body: `The Playmorrow interface is organized into several key areas:

Homepage: Discover featured games, trending devlogs, and the latest community activity. The leaderboard shows top studios and players by XP.

Feed: Your personalized feed shows updates from studios you follow, including new devlogs, game updates, and roadmap changes.

Games: Browse all published games. Use search and filters to find exactly what you are looking for.

Studios: Visit studio pages to see their games, members, and activity.

Search: Use the global search bar to find games, studios, and users quickly.

Dashboard: Your personal dashboard where you can manage your profile, settings, and (for studio members) your studio content.

Notifications: Click the bell icon to see your latest notifications about follows, comments, and other interactions.`,
  },

  // ── Player Guide ─────────────────────────────────────────────────────────
  {
    slug: 'wishlisting-games',
    title: 'Wishlisting Games',
    description: 'How to wishlist games and track their progress.',
    categorySlug: 'player-guide',
    tags: ['wishlist', 'games'],
    isFeatured: false,
    readingTimeMin: 2,
    body: `Wishlisting a game lets you save it for later and show developers that you are interested.

To wishlist a game:
1. Navigate to the game's detail page.
2. Click the "Wishlist" button (heart icon).
3. The game will be added to your wishlist, accessible from your profile.

Wishlisting helps developers understand demand for their games. You can remove games from your wishlist at any time by clicking the button again.

Your wishlist is private and only visible to you.`,
  },
  {
    slug: 'following-studios',
    title: 'Following Studios',
    description: 'Stay updated by following your favorite studios.',
    categorySlug: 'player-guide',
    tags: ['follow', 'studios'],
    isFeatured: false,
    readingTimeMin: 2,
    body: `Following a studio allows you to receive updates about their games and devlogs in your feed.

To follow a studio:
1. Visit the studio's page.
2. Click the "Follow" button.
3. The studio's activity will now appear in your personalized feed.

You can see how many followers a studio has on their profile page. Unfollow at any time by clicking the button again.

Your feed on the homepage shows the latest activity from all studios you follow, including new devlogs, game status changes, and roadmap updates.`,
  },
  {
    slug: 'notifications-overview',
    title: 'Notifications Overview',
    description: 'Understanding your notifications and how to manage them.',
    categorySlug: 'player-guide',
    tags: ['notifications', 'settings'],
    isFeatured: false,
    readingTimeMin: 2,
    body: `Playmorrow keeps you informed with various notification types:

- New Follower: Someone followed your studio.
- New Comment: Someone commented on your content.
- New Reply: Someone replied to your comment.
- New Reaction: Someone reacted to your content.
- Studio Invitation: You have been invited to join a studio.
- Role Changed: Your role in a studio has been updated.

Notifications appear in the bell icon dropdown at the top of the page. You can mark individual notifications as read or mark all as read.

Push notifications are available if you enable them in your browser settings via the toggle in the notification panel.`,
  },
  {
    slug: 'xp-and-levels',
    title: 'XP and Levels',
    description: 'How the XP system works and how to earn achievements.',
    categorySlug: 'player-guide',
    tags: ['xp', 'levels', 'achievements'],
    isFeatured: false,
    readingTimeMin: 3,
    body: `Playmorrow features an XP (experience points) system to reward community participation.

You earn XP by:
- Publishing devlogs
- Receiving reactions on your content
- Participating in community discussions
- Completing your profile

As you earn XP, your level increases. Higher levels unlock additional features and showcase your experience on your profile.

Achievements are special badges you can earn for reaching specific milestones, such as writing your first devlog, getting 100 followers, or having a game published.

Your current XP and level are displayed on your profile page and next to your username in community interactions.`,
  },

  // ── Studio Guide ─────────────────────────────────────────────────────────
  {
    slug: 'creating-a-studio',
    title: 'Creating a Studio',
    description: 'Set up your game development studio on Playmorrow.',
    categorySlug: 'studio-guide',
    tags: ['studio', 'creation'],
    isFeatured: true,
    readingTimeMin: 2,
    body: `Creating a studio is the first step to publishing games on Playmorrow.

To create a studio:
1. Go to your dashboard and click "Create Studio".
2. Choose a unique studio name and slug.
3. Add a tagline and description.
4. Upload a logo and banner image.
5. Set your location and founding year.

After creation, you will be the studio OWNER. You can invite other members and assign roles (ADMIN, MODERATOR, MEMBER).

Each studio has its own page where you can showcase your games, team members, and activity. You can also earn studio XP by publishing games and engaging with the community.`,
  },
  {
    slug: 'managing-studio-members',
    title: 'Managing Studio Members',
    description: 'Invite members and manage roles in your studio.',
    categorySlug: 'studio-guide',
    tags: ['studio', 'members', 'roles'],
    isFeatured: false,
    readingTimeMin: 3,
    body: `Studio owners can invite members and assign roles with different permissions.

Roles:
- OWNER: Full control over the studio. Can delete the studio, manage all members, and all content.
- ADMIN: Can manage members (invite, remove, change roles) and all content.
- MODERATOR: Can moderate comments and manage content but cannot change member roles.
- MEMBER: Can create content (games, devlogs) but cannot manage other members.

To invite a member:
1. Go to your studio dashboard.
2. Click "Members" and then "Invite Member".
3. Enter their email or username.
4. Select the role and set an expiration for the invitation.
5. The member will receive a notification to accept.

To change a member's role, click the edit button next to their name in the members list.`,
  },
  {
    slug: 'publishing-a-game',
    title: 'Publishing a Game',
    description: 'How to create and publish a game on your studio page.',
    categorySlug: 'studio-guide',
    tags: ['game', 'publishing'],
    isFeatured: true,
    readingTimeMin: 3,
    body: `To publish a game on Playmorrow:

1. Navigate to your studio dashboard and click "New Game".
2. Enter your game's title and create a unique slug.
3. Write a compelling tagline and full description.
4. Select the game's current development status.
5. Upload a cover image and optional banner.
6. Add screenshots, trailers, and other media.
7. Set platform links (Steam, Itch.io, etc.).
8. Configure pricing (free or paid with price in cents).
9. Add tags for genres and features.
10. Click "Save" — the game will be saved as unpublished.
11. When ready, click "Publish" to make it visible to everyone.

Published games appear in search results and on your studio page. You can edit game details anytime.`,
  },
  {
    slug: 'writing-devlogs',
    title: 'Writing Devlogs',
    description: 'Share development progress with your audience.',
    categorySlug: 'studio-guide',
    tags: ['devlogs', 'content'],
    isFeatured: false,
    readingTimeMin: 3,
    body: `Devlogs are a great way to share your development journey with your community.

To write a devlog:
1. Go to your game's page and click "New Devlog".
2. Enter a title and optional subtitle.
3. Use the Markdown editor to write your content.
4. Add screenshots to illustrate your progress.
5. Select a category (e.g., Development, Art, Design).
6. Add tags to help with discoverability.
7. Choose a status: Draft, Publish Now, or Schedule for later.
8. Click "Save" or "Publish".

Devlogs support full Markdown with image embedding. The reading time is automatically calculated based on content length.

Scheduled devlogs will be automatically published at the specified time.`,
  },

  // ── Account & Security ───────────────────────────────────────────────────
  {
    slug: 'changing-your-password',
    title: 'Changing Your Password',
    description: 'How to update your password and keep your account secure.',
    categorySlug: 'account-security',
    tags: ['password', 'security'],
    isFeatured: false,
    readingTimeMin: 2,
    body: `To change your password:
1. Go to your account settings.
2. Click "Change Password".
3. Enter your current password.
4. Enter your new password (at least 8 characters).
5. Confirm the new password.
6. Click "Save".

Your new password will take effect immediately. You will be logged out of all other sessions for security.

If you forget your password, use the "Forgot Password" link on the login page to reset it via email.`,
  },
  {
    slug: 'oauth-and-social-login',
    title: 'OAuth and Social Login',
    description: 'Using Google or GitHub to sign in to Playmorrow.',
    categorySlug: 'account-security',
    tags: ['oauth', 'login', 'google', 'github'],
    isFeatured: false,
    readingTimeMin: 2,
    body: `Playmorrow supports signing in with Google and GitHub for convenience.

To link an OAuth provider:
1. Go to your account settings.
2. Click "Connected Accounts".
3. Choose Google or GitHub and follow the authorization flow.

You can use OAuth to sign in even if you originally registered with email and password. Multiple OAuth providers can be linked to the same account.

OAuth accounts still have full access to all features. You can add a password later if you want to use email login as well.`,
  },
  {
    slug: 'privacy-and-data',
    title: 'Privacy and Data',
    description: 'How Playmorrow handles your personal data and privacy.',
    categorySlug: 'account-security',
    tags: ['privacy', 'data', 'gdpr'],
    isFeatured: false,
    readingTimeMin: 3,
    body: `Playmorrow takes your privacy seriously. Here is how we handle your data:

- Account information: We store only what is necessary for the platform to function.
- Cookies: We use essential cookies for authentication and optional analytics cookies.
- Data sharing: We do not sell your personal data to third parties.
- Content: Your public content (comments, devlogs) is visible to other users as intended.
- Deletion: You can delete your account at any time from settings.

For complete details, please review our Privacy Policy. You can also export your data from the settings page.

Your cookie preferences can be managed at any time using the cookie consent banner.`,
  },

  // ── Publishing ───────────────────────────────────────────────────────────
  {
    slug: 'game-media-and-screenshots',
    title: 'Game Media and Screenshots',
    description: 'Adding screenshots, trailers, and other media to your game.',
    categorySlug: 'publishing',
    tags: ['media', 'screenshots', 'trailers'],
    isFeatured: false,
    readingTimeMin: 2,
    body: `Enhance your game page with rich media.

Supported media types:
- Screenshots: PNG, JPG, WebP (max 4096px width/height)
- Trailers: YouTube or direct video URLs
- Logo: Your game's logo image
- Banner: Wide banner image for your game page

To add media:
1. Go to your game's edit page.
2. Scroll to the Media section.
3. Upload or add URLs for each media type.
4. Rearrange screenshots by dragging them.
5. Add optional captions.

High-quality screenshots and a compelling trailer significantly improve your game's appeal to potential players.`,
  },
  {
    slug: 'platform-links',
    title: 'Platform Links',
    description: 'Add store links and social pages for your game.',
    categorySlug: 'publishing',
    tags: ['platform', 'links', 'stores'],
    isFeatured: false,
    readingTimeMin: 2,
    body: `Platform links let players find your game on storefronts and social platforms.

Supported platforms:
- Steam, Itch.io, Epic Games Store, GOG
- PlayStation, Xbox, Nintendo
- Web, Android, iOS
- Discord, Website
- Demo (for playable demos)

To add links:
1. Go to your game's edit page.
2. Find the "Platform Links" section.
3. Select the platform from the dropdown.
4. Enter the full URL.
5. Add an optional label (e.g., "Wishlist on Steam").

Links are displayed as clickable chips on your game page.`,
  },
  {
    slug: 'press-kit',
    title: 'Press Kit',
    description: 'Create a press kit for your game.',
    categorySlug: 'publishing',
    tags: ['press', 'marketing'],
    isFeatured: false,
    readingTimeMin: 2,
    body: `Press kits help journalists and content creators cover your game.

Your press kit can include:
- Headline and description
- Fact sheet (developer, release date, platforms, etc.)
- Contact email for press inquiries
- Download links for assets

To create a press kit:
1. Go to your game's edit page.
2. Click "Press Kit".
3. Fill in the information.
4. Toggle between auto-generated and custom mode.

Press kits are accessible from your game page.`,
  },

  // ── Devlogs ──────────────────────────────────────────────────────────────
  {
    slug: 'devlog-markdown-guide',
    title: 'Devlog Markdown Guide',
    description: 'How to use Markdown formatting in your devlogs.',
    categorySlug: 'devlogs',
    tags: ['markdown', 'formatting'],
    isFeatured: false,
    readingTimeMin: 3,
    body: `Devlogs support full Markdown formatting. Here is a quick reference:

Headings: # H1, ## H2, ### H3
Bold: **text**
Italic: *text*
Lists: - item or 1. item
Links: [text](url)
Images: ![alt](url)
Code: \`inline\` or \`\`\`block\`\`\`
Blockquotes: > text

The editor provides a preview toggle so you can see how your content will look before publishing. You can switch between Edit, Preview, and Split modes.

All Markdown is sanitized to prevent XSS attacks. HTML tags are stripped for security.`,
  },
  {
    slug: 'scheduling-devlogs',
    title: 'Scheduling Devlogs',
    description: 'How to schedule devlogs for automatic publishing.',
    categorySlug: 'devlogs',
    tags: ['scheduling', 'publishing'],
    isFeatured: false,
    readingTimeMin: 2,
    body: `You can schedule devlogs to be published automatically at a future date and time.

To schedule a devlog:
1. Write your devlog as usual.
2. Instead of selecting "Publish Now", select "Schedule".
3. Pick the date and time for automatic publishing.
4. Save the devlog.

The platform will automatically publish your devlog at the scheduled time. You can edit or cancel a scheduled devlog before it goes live.

Scheduled devlogs are visible in your drafts section with a clock icon indicating they are waiting to be published.`,
  },

  // ── Community ────────────────────────────────────────────────────────────
  {
    slug: 'comments-and-replies',
    title: 'Comments and Replies',
    description: 'How to comment on games and devlogs.',
    categorySlug: 'community',
    tags: ['comments', 'discussion'],
    isFeatured: false,
    readingTimeMin: 2,
    body: `Comments are a great way to engage with the community.

You can comment on:
- Game pages
- Devlogs

To post a comment:
1. Scroll to the comments section.
2. Type your message in the text area.
3. Click "Post Comment".

You can reply to existing comments to create threaded discussions. All comments are moderated according to our Community Guidelines.

You can edit or delete your own comments. Studio moderators and administrators can moderate comments on their content.`,
  },
  {
    slug: 'reactions',
    title: 'Reactions',
    description: 'Using reactions to show appreciation for content.',
    categorySlug: 'community',
    tags: ['reactions', 'likes'],
    isFeatured: false,
    readingTimeMin: 2,
    body: `Reactions let you quickly show how you feel about content.

Available reaction types:
- LIKE: Show general appreciation
- LOVE: Express strong positive feeling
- HYPE: Show excitement
- INSIGHTFUL: Acknowledge valuable content

You can react to devlogs and comments. Each user can have one reaction of each type per piece of content. Click a reaction again to remove it.

Reactions are displayed with counts beneath the content.`,
  },
  {
    slug: 'moderation-and-reporting',
    title: 'Moderation and Reporting',
    description: 'How to report inappropriate content and how moderation works.',
    categorySlug: 'community',
    tags: ['moderation', 'reporting', 'safety'],
    isFeatured: false,
    readingTimeMin: 3,
    body: `Playmorrow is committed to maintaining a safe and respectful community.

To report content:
1. Click the "Report" button on the content you want to report.
2. Select the reason for your report.
3. Add optional details.
4. Submit the report.

Report reasons include: Spam, Harassment, Hate Speech, Sexual Content, Violence, Copyright Infringement, Misleading Information, and Other.

Reports are reviewed by our moderation team. You can check the status of your reports in your dashboard.

Studio moderators can also moderate comments on their own content.`,
  },

  // ── FAQ ──────────────────────────────────────────────────────────────────
  {
    slug: 'frequently-asked-questions',
    title: 'Frequently Asked Questions',
    description: 'Common questions and answers about using Playmorrow.',
    categorySlug: 'faq',
    tags: ['faq', 'help'],
    isFeatured: true,
    readingTimeMin: 4,
    body: `Q: Is Playmorrow free?
A: Yes, Playmorrow is free to use for both players and studios.

Q: Can I publish multiple games?
A: Yes, studios can publish unlimited games.

Q: How do I delete my account?
A: Go to Settings → Account → Delete Account. This is permanent.

Q: How do I change my username?
A: Currently, usernames cannot be changed after registration. Contact support if you have a special case.

Q: What image formats are supported?
A: PNG, JPG, and WebP are supported for all uploads.

Q: Is there a mobile app?
A: Not yet, but the website is fully responsive and works on mobile browsers.

Q: How do I contact support?
A: Use the Support system from your dashboard to create a ticket.

Q: Can I collaborate with other developers?
A: Yes! You can invite them to your studio as members.

Q: How are devlogs different from comments?
A: Devlogs are longer-form content published by studios to share development progress. Comments are shorter reactions on existing content.

Q: Can I schedule multiple devlogs at once?
A: Yes, each devlog can have its own schedule independently.`,
  },
];

async function seed() {
  console.log('Seeding Help Center...');

  // Create categories
  const categoryMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const existing = await prisma.helpCategory.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      categoryMap.set(cat.slug, existing.id);
      console.log(`  Category "${cat.title}" already exists, skipping.`);
      continue;
    }
    const created = await prisma.helpCategory.create({ data: cat });
    categoryMap.set(cat.slug, created.id);
    console.log(`  Created category: ${created.title}`);
  }

  // Find an admin user for authorId
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.warn('  No admin user found. Please create an admin user first.');
  }

  // Create articles
  for (const article of ARTICLES) {
    const existing = await prisma.helpArticle.findUnique({ where: { slug: article.slug } });
    if (existing) {
      console.log(`  Article "${article.title}" already exists, skipping.`);
      continue;
    }

    const categoryId = categoryMap.get(article.categorySlug);
    await prisma.helpArticle.create({
      data: {
        title: article.title,
        slug: article.slug,
        description: article.description,
        body: article.body,
        categoryId: categoryId ?? null,
        tags: article.tags,
        authorId: admin?.id ?? 'unknown',
        isPublished: true,
        isFeatured: article.isFeatured,
        publishedAt: new Date(),
        readingTimeMin: article.readingTimeMin,
      },
    });
    console.log(`  Created article: ${article.title}`);
  }

  console.log('Help Center seeding complete!');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
