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
  G2: 697,
  FaZe: 680,
  Liquid: 418,
  ENCE: 290,
  MOUZ: 239,
  OG: 239,
  NIP: 216,
  forZe: 195,
  paiN: 178,
  CoL: 161,
  Monte: 113,
  MongolZ: 111,
  Grayhound: 101,
  GamerLegion: 78,
  Apeks: 75,
  Fluxo: 45,
};
