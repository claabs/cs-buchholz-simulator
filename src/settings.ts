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
  G2: 910,
  FaZe: 878,
  Liquid: 510,
  ENCE: 386,
  MOUZ: 331,
  forZe: 240,
  paiN: 223,
  CoL: 206,
  OG: 202,
  NIP: 199,
  Monte: 133,
  Grayhound: 111,
  GamerLegion: 103,
  MongolZ: 102,
  Apeks: 80, // ?
  Fluxo: 57,
};
