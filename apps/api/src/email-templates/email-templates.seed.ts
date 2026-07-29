import { PrismaClient } from '@playmorrow/database';

const DEFAULT_TEMPLATES = [
  {
    slug: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to Playmorrow, {{username}}!',
    category: 'transactional',
    variables: ['username', 'siteUrl'],
    bodyHtml: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#02070b;color:#f2f5f4;padding:40px">
  <h1 style="color:#3ee7ff;font-size:24px;text-transform:uppercase">Welcome to Playmorrow</h1>
  <p>Hi {{username}},</p>
  <p>Welcome to Playmorrow — the social discovery layer for indie games.</p>
  <p>Start exploring games, follow studios, and be part of the journey before the game ships.</p>
  <a href="{{siteUrl}}/discover" style="display:inline-block;border:1px solid #3ee7ff;color:#3ee7ff;padding:12px 24px;text-decoration:none;margin-top:20px">Discover Games</a>
</div>`,
  },
  {
    slug: 'email-verification',
    name: 'Email Verification',
    subject: 'Verify your email address',
    category: 'transactional',
    variables: ['username', 'verifyUrl'],
    bodyHtml: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#02070b;color:#f2f5f4;padding:40px">
  <h1 style="color:#3ee7ff;font-size:24px;text-transform:uppercase">Verify Your Email</h1>
  <p>Hi {{username}},</p>
  <p>Please verify your email address by clicking the link below:</p>
  <a href="{{verifyUrl}}" style="display:inline-block;border:1px solid #3ee7ff;color:#3ee7ff;padding:12px 24px;text-decoration:none;margin-top:20px">Verify Email</a>
  <p style="margin-top:30px;font-size:12px;color:#8c969b">If you didn't create an account, you can ignore this email.</p>
</div>`,
  },
  {
    slug: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset your Playmorrow password',
    category: 'transactional',
    variables: ['username', 'resetUrl'],
    bodyHtml: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#02070b;color:#f2f5f4;padding:40px">
  <h1 style="color:#ff574d;font-size:24px;text-transform:uppercase">Password Reset</h1>
  <p>Hi {{username}},</p>
  <p>Click the link below to reset your password. This link expires in 1 hour.</p>
  <a href="{{resetUrl}}" style="display:inline-block;border:1px solid #ff574d;color:#ff574d;padding:12px 24px;text-decoration:none;margin-top:20px">Reset Password</a>
  <p style="margin-top:30px;font-size:12px;color:#8c969b">If you didn't request this, you can safely ignore this email.</p>
</div>`,
  },
  {
    slug: 'weekly-digest',
    name: 'Weekly Digest',
    subject: 'Your Playmorrow Weekly Digest — {{date}}',
    category: 'digest',
    variables: ['username', 'date', 'activityCount', 'siteUrl'],
    bodyHtml: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#02070b;color:#f2f5f4;padding:40px">
  <h1 style="color:#3ee7ff;font-size:24px;text-transform:uppercase">Weekly Digest</h1>
  <p>Hi {{username}},</p>
  <p>Here's what happened on Playmorrow this week:</p>
  <p style="font-size:36px;color:#3ee7ff;text-align:center;margin:30px 0">{{activityCount}} updates</p>
  <a href="{{siteUrl}}/feed" style="display:inline-block;border:1px solid #3ee7ff;color:#3ee7ff;padding:12px 24px;text-decoration:none">View Feed</a>
</div>`,
  },
  {
    slug: 'devlog-notification',
    name: 'Devlog Notification',
    subject: '{{studioName}} posted a new devlog: {{devlogTitle}}',
    category: 'notification',
    variables: ['username', 'studioName', 'devlogTitle', 'devlogUrl'],
    bodyHtml: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#02070b;color:#f2f5f4;padding:40px">
  <h1 style="color:#3ee7ff;font-size:20px;text-transform:uppercase">New Devlog</h1>
  <p>{{studioName}} just published a new devlog:</p>
  <h2 style="color:#f2f5f4;margin:20px 0">{{devlogTitle}}</h2>
  <a href="{{devlogUrl}}" style="display:inline-block;border:1px solid #3ee7ff;color:#3ee7ff;padding:12px 24px;text-decoration:none">Read Devlog</a>
</div>`,
  },
  {
    slug: 'wishlist-notification',
    name: 'Wishlist Update',
    subject: '{{gameTitle}} has news!',
    category: 'notification',
    variables: ['username', 'gameTitle', 'gameUrl'],
    bodyHtml: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#02070b;color:#f2f5f4;padding:40px">
  <h1 style="color:#3ee7ff;font-size:20px;text-transform:uppercase">Wishlist Update</h1>
  <p>{{gameTitle}}, one of your wishlisted games, has new updates!</p>
  <a href="{{gameUrl}}" style="display:inline-block;border:1px solid #3ee7ff;color:#3ee7ff;padding:12px 24px;text-decoration:none">View Game</a>
</div>`,
  },
  {
    slug: 'release-notification',
    name: 'Release Notification',
    subject: '{{gameTitle}} has been released!',
    category: 'notification',
    variables: ['username', 'gameTitle', 'gameUrl'],
    bodyHtml: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#02070b;color:#f2f5f4;padding:40px">
  <h1 style="color:#ff574d;font-size:20px;text-transform:uppercase">Released!</h1>
  <p>{{gameTitle}} has officially launched!</p>
  <a href="{{gameUrl}}" style="display:inline-block;border:1px solid #ff574d;color:#ff574d;padding:12px 24px;text-decoration:none">Check it out</a>
</div>`,
  },
];

export async function seedEmailTemplates(prisma: PrismaClient) {
  for (const tmpl of DEFAULT_TEMPLATES) {
    const existing = await prisma.emailTemplate.findUnique({ where: { slug: tmpl.slug } });
    if (!existing) {
      await prisma.emailTemplate.create({ data: tmpl });
    }
  }
  console.log(`✅ Seeded ${DEFAULT_TEMPLATES.length} email templates`);
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedEmailTemplates(prisma).then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });
}
