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
  '2024 Shanghai Major Opening Stage': {
    teamList: [
      'FURIA',
      'Virtus.pro',
      'Liquid',
      'Complexity',
      'BIG',
      'fnatic',
      'The MongolZ',
      'paiN',
      'GamerLegion',
      'MIBR',
      'Cloud9',
      'FlyQuest',
      'Passion UA',
      'Wildcard',
      'Rare Atom',
      'Imperial',
    ],
  },
  '2024 Shanghai Major EU RMR A': {
    teamList: [
      'Natus Vincere',
      'Vitality',
      'MOUZ',
      'FaZe',
      'SAW',
      'Falcons',
      'Sangal',
      'BetBoom',
      'fnatic',
      'GamerLegion',
      'Nemiga',
      'Cloud9',
      'SINNERS',
      'ECLOT',
      'Rebels',
      'UNiTY',
    ],
  },
  '2024 Shanghai Major EU RMR B': {
    teamList: [
      'G2',
      'Spirit',
      'Eternal Fire',
      'Virtus.pro',
      'HEROIC',
      'Astralis',
      'BIG',
      '3DMAX',
      'Ninjas in Pyjamas',
      'B8',
      'Aurora',
      'Passion UA',
      'PARIVISION',
      '9 Pandas',
      'Sashi',
      'TSM',
    ],
  },
  '2024 Shanghai Major Americas RMR': {
    teamList: [
      'FURIA',
      'Liquid',
      'Complexity',
      'paiN',
      '9z',
      'M80',
      'MIBR',
      'Imperial',
      'Legacy',
      'Wildcard',
      'BESTIA',
      'Nouns',
      'RED Canids',
      'BOSS',
      'KRÜ',
      'Case',
    ],
  },
  '2024 Copenhagen Major Elimination Stage': {
    teamList: [
      'FaZe',
      'Spirit',
      'Vitality',
      'MOUZ',
      'Complexity',
      'Virtus.pro',
      'Natus Vincere',
      'G2',
      'Cloud9',
      'HEROIC',
      'Eternal Fire',
      'ECSTATIC',
      'paiN',
      'Imperial',
      'TheMongolz',
      'FURIA',
    ],
  },
  '2024 Copenhagen Major Opening Stage': {
    teamList: [
      'Cloud9',
      'Eternal Fire',
      'ENCE',
      'Apeks',
      'HEROIC',
      'GamerLegion',
      'SAW',
      'FURIA',
      'ECSTATIC',
      'TheMongolz',
      'Imperial',
      'paiN',
      'Lynn Vision',
      'AMKAL',
      'KOI',
      'Legacy',
    ],
  },
  Custom: { teamList: [] },
};
