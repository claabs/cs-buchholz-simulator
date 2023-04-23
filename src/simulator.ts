import type { MatchupProbability } from './settings.js';

interface Matchup<T extends string> {
  teamA: TeamStandingWithDifficulty<T>;
  teamB: TeamStandingWithDifficulty<T>;
}

interface TeamStanding<T extends string> {
  name: T;
  seed: number;
  wins: number;
  losses: number;
  pastOpponents: T[];
}

interface TeamStandingWithDifficulty<T extends string> extends TeamStanding<T> {
  difficulty: number;
}

interface QualElimOutput<T extends string> {
  qualified: TeamStanding<T>[];
  eliminated: TeamStanding<T>[];
  competitors: TeamStanding<T>[];
}

interface TeamResultsCounts<T extends string> {
  qualified: Map<T, number>;
  allWins: Map<T, number>;
  allLosses: Map<T, number>;
}

export interface OpponentRate {
  teamName: string;
  ratePlayed: string;
}

export interface TeamResults {
  teamName: string;
  rate: number;
  opponents?: OpponentRate[];
}

export interface SimulationResults {
  iterations: number;
  qualWins: number;
  elimLosses: number;
  qualified: TeamResults[];
  allWins: TeamResults[];
  allLosses: TeamResults[];
}

export const generateEasyProbabilities = <T extends string>(
  ratings: Record<T, number>
): MatchupProbability<T>[] =>
  Object.entries<number>(ratings).reduce((acc, [team, rating], index, ratingEntries) => {
    const opposingTeams = ratingEntries.slice(index + 1);
    const teamMatchupProbs: MatchupProbability<T>[] = opposingTeams.map(([oppTeam, oppRating]) => {
      const differenceFactor = rating / oppRating;
      const winRate = differenceFactor / (differenceFactor + 1);
      return {
        teamA: team as T,
        teamB: oppTeam as T,
        bo1TeamAWinrate: winRate,
        bo3TeamAWinrate: winRate,
      };
    });
    return acc.concat(teamMatchupProbs);
  }, [] as MatchupProbability<T>[]);

const splitStandingsToRecordGroups = <T extends string>(
  teamsStandings: TeamStandingWithDifficulty<T>[]
): Map<number, TeamStandingWithDifficulty<T>[]> =>
  teamsStandings.reduce((groups, teamStanding) => {
    const winDifferential = teamStanding.wins - teamStanding.losses;
    const recordGroup = groups.get(winDifferential);
    if (recordGroup) {
      recordGroup.push(teamStanding);
    } else {
      groups.set(winDifferential, [teamStanding]);
    }
    return groups;
  }, new Map<number, TeamStandingWithDifficulty<T>[]>());

const calculateDifficulties = <T extends string>(
  teamsStandings: TeamStanding<T>[]
): TeamStandingWithDifficulty<T>[] =>
  teamsStandings.map((team) => {
    const difficulty = team.pastOpponents.reduce((differentialSum, opponentName) => {
      const opponentStanding = teamsStandings.find((standing) => standing.name === opponentName);
      if (!opponentStanding) return differentialSum;
      const winDifferential = opponentStanding.wins - opponentStanding.losses;
      return differentialSum + winDifferential;
    }, 0);
    return {
      ...team,
      difficulty,
    };
  });

const sortRecordGroup = <T extends string>(
  recordGroup: TeamStandingWithDifficulty<T>[]
): TeamStandingWithDifficulty<T>[] =>
  recordGroup.sort((teamA, teamB) => {
    const difficultyDiff = teamA.difficulty - teamB.difficulty;
    if (difficultyDiff !== 0) return difficultyDiff;
    return teamA.seed - teamB.seed;
  });

const categorizeResults = <T extends string>(
  results: TeamStanding<T>[],
  resultCounts?: TeamResultsCounts<T>,
  qualElimMax = 3
): TeamResultsCounts<T> => {
  const teamResultsCounts: TeamResultsCounts<T> = resultCounts || {
    allLosses: new Map(),
    allWins: new Map(),
    qualified: new Map(),
  };
  results.forEach((teamStanding) => {
    if (teamStanding.wins === qualElimMax) {
      const qualCount = teamResultsCounts.qualified.get(teamStanding.name) || 0;
      teamResultsCounts.qualified.set(teamStanding.name, qualCount + 1);
      if (teamStanding.losses === 0) {
        const allWinsCount = teamResultsCounts.allWins.get(teamStanding.name) || 0;
        teamResultsCounts.allWins.set(teamStanding.name, allWinsCount + 1);
      }
    } else if (teamStanding.losses === qualElimMax && teamStanding.wins === 0) {
      const allLossesCount = teamResultsCounts.allLosses.get(teamStanding.name) || 0;
      teamResultsCounts.allLosses.set(teamStanding.name, allLossesCount + 1);
    }
  });
  return teamResultsCounts;
};

export const getSeedOrder = <T extends string>(seeding: Record<string, T>) =>
  Object.entries(seeding)
    .sort(([seedA], [seedB]) => parseInt(seedA, 10) - parseInt(seedB, 10))
    .map(([, teamName]) => teamName);

const matchRecordGroup = <T extends string>(
  recordGroup: TeamStandingWithDifficulty<T>[]
): Matchup<T>[] => {
  const sortedGroup = sortRecordGroup(recordGroup);
  const matchups: Matchup<T>[] = [];
  while (sortedGroup.length) {
    const teamA = sortedGroup.shift();
    const teamB = sortedGroup.pop();
    if (teamA && teamB) {
      matchups.push({
        teamA,
        teamB,
      });
    }
  }
  return matchups;
};

/**
 * https://github.com/ValveSoftware/csgo/blob/main/major-supplemental-rulebook.md#mid-stage-seed-calculation
 * @param teamsStandings
 */
const calculateMatchups = <T extends string>(teamsStandings: TeamStanding<T>[]): Matchup<T>[] => {
  // 1. Current W-L record in the stage
  // 2. Difficulty Score in the current stage
  // 3. Initial seeding of the current stage
  const teamsStandingsWithDifficulty = calculateDifficulties(teamsStandings);
  const recordGroups = splitStandingsToRecordGroups(teamsStandingsWithDifficulty);
  const matchups: Matchup<T>[] = Array.from(recordGroups.values()).reduce(
    (acc: Matchup<T>[], recordGroup) => acc.concat(matchRecordGroup(recordGroup)),
    []
  );
  return matchups;
};

const simulateMatchup = <T extends string>(
  matchup: Matchup<T>,
  matchupProbabilities: MatchupProbability<T>[],
  qualElimMax = 3
): TeamStanding<T>[] => {
  const probabilityListing = matchupProbabilities.find(
    (probListing) =>
      (probListing.teamA === matchup.teamA.name && probListing.teamB === matchup.teamB.name) ||
      (probListing.teamA === matchup.teamB.name && probListing.teamB === matchup.teamA.name)
  );
  const isQualElim =
    matchup.teamA.wins === qualElimMax - 1 || matchup.teamA.losses === qualElimMax - 1;
  const teamAWinrate =
    (isQualElim ? probabilityListing?.bo3TeamAWinrate : probabilityListing?.bo1TeamAWinrate) || 0.5;
  const swapTeams = probabilityListing ? probabilityListing.teamA !== matchup.teamA.name : false;

  const teamAWins = Math.random() <= teamAWinrate;
  const { teamA, teamB } = matchup;
  teamA.pastOpponents.push(teamB.name);
  teamB.pastOpponents.push(teamA.name);
  if (teamAWins && !swapTeams) {
    teamA.wins += 1;
    teamB.losses += 1;
  } else {
    teamA.losses += 1;
    teamB.wins += 1;
  }
  return [teamA, teamB];
};

const simulateMatchups = <T extends string>(
  matchups: Matchup<T>[],
  matchupProbabilities: MatchupProbability<T>[]
): TeamStanding<T>[] =>
  matchups.flatMap((matchup) => simulateMatchup(matchup, matchupProbabilities));

const extractQualElims = <T extends string>(
  teamsStandings: TeamStanding<T>[],
  qualElimMax: number
): QualElimOutput<T> =>
  teamsStandings.reduce(
    (acc, team) => {
      if (team.wins >= qualElimMax) acc.qualified.push(team);
      else if (team.losses >= qualElimMax) acc.eliminated.push(team);
      else acc.competitors.push(team);
      return acc;
    },
    {
      qualified: [] as TeamStanding<T>[],
      eliminated: [] as TeamStanding<T>[],
      competitors: [] as TeamStanding<T>[],
    }
  );

const simulateEvent = <T extends string>(
  seeding: Record<string, T>,
  probabilities: MatchupProbability<T>[],
  qualElimMax = 3
): QualElimOutput<T> => {
  let competitors: TeamStanding<T>[] = Object.entries(seeding).map(([seed, name]) => ({
    name,
    seed: parseInt(seed, 10),
    wins: 0,
    losses: 0,
    pastOpponents: [],
  }));
  const qualified: TeamStanding<T>[] = [];
  const eliminated: TeamStanding<T>[] = [];
  while (competitors.length) {
    const matchups = calculateMatchups(competitors);
    const standings = simulateMatchups(matchups, probabilities);
    const qualElimResult = extractQualElims(standings, qualElimMax);
    competitors = qualElimResult.competitors;
    qualified.push(...qualElimResult.qualified);
    eliminated.push(...qualElimResult.eliminated);
  }
  return {
    qualified,
    eliminated,
    competitors,
  };
};

const formatResultMap = (resultMap: Map<string, number>, iterations: number): TeamResults[] =>
  Array.from(resultMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([teamName, count]) => ({ teamName, rate: count / iterations }));

export const formatResultsCounts = <T extends string>(
  categorizedResults: TeamResultsCounts<T>,
  qualElimMax: number,
  iterations: number
): SimulationResults => {
  const qualified = formatResultMap(categorizedResults.qualified, iterations);
  const allWins = formatResultMap(categorizedResults.allWins, iterations);
  const allLosses = formatResultMap(categorizedResults.allLosses, iterations);
  return {
    qualified,
    allWins,
    allLosses,
    iterations,
    qualWins: qualElimMax,
    elimLosses: qualElimMax,
  };
};

export const simulateEvents = <T extends string>(
  seeding: Record<string, T>,
  probabilities: MatchupProbability<T>[],
  qualElimMax = 3,
  iterations = 1000
): SimulationResults => {
  let categorizedResults: TeamResultsCounts<T> = {
    allLosses: new Map(),
    allWins: new Map(),
    qualified: new Map(),
  };
  for (let i = 0; i < iterations; i += 1) {
    const { qualified, eliminated } = simulateEvent(seeding, probabilities, qualElimMax);
    const results = [...qualified, ...eliminated];
    categorizedResults = categorizeResults(results, categorizedResults);
  }
  return formatResultsCounts(categorizedResults, qualElimMax, iterations);
};
