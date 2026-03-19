export interface Sport {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  positions: string[];
  visualDemands: { dva: number; cs: number; pa: number; dp: number; at: number };
}

export const SPORTS: Sport[] = [
  {
    id: 'tennis',
    name: 'Tennis',
    slug: 'tennis',
    color: '#84cc16',
    icon: '🎾',
    positions: ['Baseline Player', 'Net Rusher', 'Serve-and-Volley Specialist'],
    visualDemands: { dva: 5, cs: 4, pa: 4, dp: 4, at: 5 },
  },
  {
    id: 'soccer',
    name: 'Soccer',
    slug: 'soccer',
    color: '#22c55e',
    icon: '⚽',
    positions: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Wide Winger'],
    visualDemands: { dva: 4, cs: 3, pa: 5, dp: 3, at: 5 },
  },
  {
    id: 'rugby',
    name: 'Rugby',
    slug: 'rugby',
    color: '#f97316',
    icon: '🏉',
    positions: ['Prop / Hooker', 'Backrow', 'Halfback', 'Centre', 'Wing / Fullback'],
    visualDemands: { dva: 4, cs: 3, pa: 5, dp: 3, at: 4 },
  },
  {
    id: 'hockey',
    name: 'Field Hockey',
    slug: 'hockey',
    color: '#a855f7',
    icon: '🏑',
    positions: ['Goalkeeper', 'Defender', 'Midfielder', 'Striker'],
    visualDemands: { dva: 4, cs: 4, pa: 4, dp: 4, at: 4 },
  },
  {
    id: 'cricket',
    name: 'Cricket',
    slug: 'cricket',
    color: '#eab308',
    icon: '🏏',
    positions: [
      'Opener',
      'Middle-Order Batter',
      'All-Rounder',
      'Wicketkeeper',
      'Pace Bowler',
      'Spin Bowler',
    ],
    visualDemands: { dva: 5, cs: 4, pa: 3, dp: 4, at: 5 },
  },
  {
    id: 'basketball',
    name: 'Basketball',
    slug: 'basketball',
    color: '#ef4444',
    icon: '🏀',
    positions: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Centre'],
    visualDemands: { dva: 3, cs: 3, pa: 5, dp: 3, at: 4 },
  },
  {
    id: 'padel',
    name: 'Padel',
    slug: 'padel',
    color: '#06b6d4',
    icon: '🏓',
    positions: ['Server / Back Court', 'Net Player', 'All-Court Player'],
    visualDemands: { dva: 5, cs: 3, pa: 4, dp: 5, at: 5 },
  },
];
