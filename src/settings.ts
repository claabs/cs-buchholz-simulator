export interface MatchupProbability<T extends string> {
  teamA: T;
  teamB: T;
  bo1TeamAWinrate: number;
  bo3TeamAWinrate: number;
}

export type MasterTeamName =
  | 'NAVI'
  | 'fnatic'
  | 'Into the Breach'
  | 'BNE'
  | 'Heroic'
  | '9INE'
  | 'Vitality'
  | 'FURIA'
  | 'G2'
  | 'ENCE'
  | 'FaZe'
  | 'Apeks'
  | 'NIP'
  | 'GamerLegion'
  | 'Monte'
  | 'Liquid';

export const masterSeedOrder: string[] = [
  'NAVI',
  '9INE',
  'FURIA',
  'fnatic',
  'Heroic',
  'Into the Breach',
  'Vitality',
  'BNE',
  'ENCE',
  'G2',
  'Apeks',
  'FaZe',
  'NIP',
  'Monte',
  'Liquid',
  'GamerLegion',
];

export const masterRating: Record<MasterTeamName, number> = {
  Heroic: 926,
  Vitality: 893,
  NAVI: 806,
  G2: 725,
  FaZe: 700,
  Liquid: 421,
  FURIA: 639,
  ENCE: 318,
  NIP: 221,
  fnatic: 215,
  '9INE': 189,
  BNE: 157,
  Monte: 113,
  Apeks: 120,
  'Into the Breach': 92,
  GamerLegion: 75, // ?
};
