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
  '2024 Copenhagen EU RMR A': {
    teamList: [
      'FaZe',
      'Virtus.pro',
      'Natus Vincere',
      'G2',
      'Eternal Fire',
      'AMKAL',
      'BetBoom',
      '3DMAX',
      '9 Pandas',
      'SAW',
      'KOI',
      'Into the Breach',
      'Ninjas in Pyjamas',
      'Enterprise',
      'fnatic',
      'Falcons',
    ],
  },
  '2024 Copenhagen EU RMR B': {
    teamList: [
      'Vitality',
      'MOUZ',
      'Spirit',
      'Monte',
      'Cloud9',
      'Apeks',
      'Astralis',
      'Preasy',
      'GamerLegion',
      'Guild Eagles',
      'ENCE',
      'ECSTATIC',
      'PERA',
      'OG',
      'Nexus',
      'Heroic',
    ],
  },
  '2024 Copenhagen Americas RMR': {
    lossesForElim: 2,
    teamList: [
      'FURIA',
      'Complexity',
      'MIBR',
      'M80',
      'paiN',
      'RED Canids',
      'BESTIA',
      'Imperial',
      'Nouns',
      'ELEVATE',
      'BOSS',
      'ODDIK',
      'Legacy',
      'Wildcard',
      'Liquid',
      'NRG',
    ],
  },
  '2024 Copenhagen EU RMR Closed Qual A': {
    teamList: [
      'Virtus.pro',
      'Natus Vincere',
      'Cloud9',
      'BIG',
      'SAW',
      'BetBoom',
      '3DMAX',
      '9 Pandas',
      'SINNERS',
      'ECSTATIC',
      'OG',
      'Permitta',
      'Zero Tenacity',
      'JANO',
      'Nexus',
      'fnatic',
    ],
  },
  '2024 Copenhagen EU RMR Closed Qual B': {
    teamList: [
      'MOUZ',
      'Spirit',
      'Eternal Fire',
      'AMKAL',
      'Astralis',
      'Preasy',
      'Aurora',
      'FORZE',
      'EYEBALLERS',
      'KOI',
      'PERA',
      'sYnck',
      'Entropiq',
      'IKLA',
      'Heroic',
      'ex-ThunderFlash',
    ],
  },
  '2024 Copenhagen SA RMR Closed Qual': {
    teamList: [
      'MIBR',
      '9z',
      'paiN',
      'RED Canids',
      'BESTIA',
      'Imperial',
      'Sharks',
      'Fluxo',
      'Legacy',
      'ODDIK',
      'Flamengo',
      'W7M',
      'Case',
      'adalYamigos',
      'TIMACETA',
      'Filhos de D10S',
    ],
  },
  '2023 Paris Major Legends': {
    teamList: [
      'Natus Vincere',
      '9INE',
      'FURIA',
      'fnatic',
      'Heroic',
      'Into the Breach',
      'Vitality',
      'Bad News Eagles',
      'ENCE',
      'G2',
      'Apeks',
      'FaZe',
      'NIP',
      'Monte',
      'Liquid',
      'GamerLegion',
    ],
  },
  '2023 Paris Major Challengers': {
    teamList: [
      'Monte',
      'paiN',
      'G2',
      'GamerLegion',
      'FORZE',
      'Apeks',
      'Ninjas in Pyjamas',
      'OG',
      'ENCE',
      'MOUZ',
      'Liquid',
      'Grayhound',
      'Complexity',
      'TheMongolz',
      'Fluxo',
      'FaZe',
    ],
  },
  Custom: { teamList: [] },
};
