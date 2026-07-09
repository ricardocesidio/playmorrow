const API = process.env.API_URL || 'https://playmorrow-api-production.up.railway.app/api';

async function getGame(slug: string) {
  try {
    const res = await fetch(`${API}/games/${slug}`, { next: { revalidate: 3600 } });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

export default async function EmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) return <div style={{ color: '#8c969b', padding: 20, fontFamily: 'monospace', background: '#02070b' }}>Game not found</div>;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #02070b; color: #f2f5f4; font-family: system-ui, sans-serif; overflow: hidden; }
          .card { display: flex; gap: 12px; padding: 14px; border: 1px solid #1b3038; background: linear-gradient(135deg, rgba(62,231,255,0.04), rgba(166,92,255,0.03)); max-width: 400px; border-radius: 2px; clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px); }
          .cover { width: 80px; height: 80px; object-fit: cover; border: 1px solid #1b3038; flex-shrink: 0; }
          .info { min-width: 0; flex: 1; }
          .title { font-size: 16px; font-weight: 900; text-transform: uppercase; color: #f2f5f4; line-height: 1.1; margin-bottom: 4px; }
          .studio { font-size: 10px; color: #8c969b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; font-family: monospace; }
          .status { display: inline-block; border: 1px solid #3ee7ff; color: #3ee7ff; padding: 2px 6px; font-size: 8px; text-transform: uppercase; letter-spacing: 0.15em; font-family: monospace; margin-bottom: 6px; }
          .tags { font-size: 9px; color: #8c969b; margin-bottom: 4px; font-family: monospace; }
          .followers { font-size: 10px; color: #3ee7ff; font-family: monospace; }
          .powered { font-size: 8px; color: #51666d; text-align: right; margin-top: 8px; font-family: monospace; }
          a { color: #3ee7ff; text-decoration: none; }
        `}</style>
      </head>
      <body>
        <a href={`https://playmorrow.vercel.app/games/${slug}`} target="_blank" rel="noopener">
          <div className="card">
            {game.coverUrl && <img src={game.coverUrl} alt="" className="cover" />}
            <div className="info">
              <div className="title">{game.title}</div>
              <div className="studio">{game.studio?.name || ''}</div>
              <div className="status">{game.status.replace(/_/g, ' ')}</div>
              {game.tags?.length > 0 && <div className="tags">{game.tags.slice(0, 3).join(' · ')}</div>}
              <div className="followers">{game.followersCount?.toLocaleString() || 0} followers</div>
            </div>
          </div>
        </a>
        <div className="powered">via Playmorrow</div>
      </body>
    </html>
  );
}
