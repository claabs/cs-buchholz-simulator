export interface MatchupProbability<T extends string> {
  teamA: T;
  teamB: T;
  bo1TeamAWinrate: number;
  bo3TeamAWinrate: number;
}

export type MasterTeamName =
  | 'Monte'
  | 'paiN'
  | 'G2'
  | 'GamerLegion'
  | 'forZe'
  | 'Apeks'
  | 'NIP'
  | 'OG'
  | 'ENCE'
  | 'MOUZ'
  | 'Liquid'
  | 'Grayhound'
  | 'CoL'
  | 'MongolZ'
  | 'Fluxo'
  | 'FaZe';

export const masterSeedOrder: string[] = [
  'Monte',
  'paiN',
  'G2',
  'GamerLegion',
  'forZe',
  'Apeks',
  'NIP',
  'OG',
  'ENCE',
  'MOUZ',
  'Liquid',
  'Grayhound',
  'CoL',
  'MongolZ',
  'Fluxo',
  'FaZe',
];

export const masterRating: Record<MasterTeamName, number> = {
  G2: 714,
  FaZe: 697,
  Liquid: 411,
  ENCE: 308,
  MOUZ: 260,
  OG: 233,
  NIP: 215,
  forZe: 191,
  paiN: 182,
  CoL: 167,
  Monte: 113,
  MongolZ: 110,
  Grayhound: 87,
  GamerLegion: 81,
  Apeks: 80, // ?
  Fluxo: 45,
};
