export interface MatchupProbability {
  teamA: string;
  teamB: string;
  bo1TeamAWinrate: number;
  bo3TeamAWinrate: number;
}

export const presetTeamLists: Record<string, string[]> = {
  '2024 Copenhagen EU RMR Closed Qual A': [
    'Natus Vincere',
    'Virtus.pro',
    'Cloud9',
    'BIG',
    'BetBoom',
    '9 Pandas',
    '3DMAX',
    'SAW',
    'TBD1',
    'TBD2',
    'TBD3',
    'TBD4',
    'TBD5',
    'TBD6',
    'TBD7',
    'TBD8',
  ],
  '2024 Copenhagen EU RMR Closed Qual B': [
    'MOUZ',
    'Spirit',
    'Eternal Fire',
    'Astralis',
    'Aurora',
    'FORZE',
    'Preasy',
    'AMKAL',
    'TBD1',
    'TBD2',
    'TBD3',
    'TBD4',
    'TBD5',
    'TBD6',
    'TBD7',
    'TBD8',
  ],
  '2023 Paris Major Legends': [
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
  '2023 Paris Major Challengers': [
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
  Custom: [],
};
