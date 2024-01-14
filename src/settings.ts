export interface MatchupProbability {
  teamA: string;
  teamB: string;
  bo1TeamAWinrate: number;
  bo3TeamAWinrate: number;
}

export const presetTeamLists: Record<string, string[]> = {
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
