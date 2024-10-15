export interface MatchupProbability {
  teamA: string;
  teamB: string;
  bo1TeamAWinrate: number;
  bo3TeamAWinrate: number;
}

export interface EventPreset {
  teamList: string[];
  seedingPending?: boolean;
  winsForQuali?: number;
  lossesForElim?: number;
}

export const eventPresets: Record<string, EventPreset> = {
  'Sample 32 Teams': {
    teamList: [
      'Natus Vincere',
      'G2',
      'Vitality',
      'MOUZ',
      'Spirit',
      'FaZe',
      'Eternal Fire',
      'Virtus.pro',
      'FURIA',
      'Liquid',
      'HEROIC',
      'Complexity',
      'The MongolZ',
      'paiN',
      'MIBR',
      'SAW',
      'Astralis',
      'M80',
      'Falcons',
      'BIG',
      'Imperial',
      'FlyQuest',
      'Sangal',
      '3DMAX',
      '9z',
      'Wildcard',
      'RED Canids',
      'B8',
      'BetBoom',
      'Monte',
      'Legacy',
      'GamerLegion',
    ],
    lossesForElim: 4,
    winsForQuali: 4,
  },
  Custom: { teamList: [] },
};
