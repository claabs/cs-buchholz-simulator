import type { MatchupProbability } from './settings.js';

enum BestOfNumber {
  BO1 = 1,
  BO3 = 3,
}

interface Matchup<T extends string> {
  teamA: TeamStandingWithDifficulty<T>;
  teamB: TeamStandingWithDifficulty<T>;
}

interface PastOpponentDetail {
  teamName: string;
  bestOf: BestOfNumber;
  won: boolean;
}

interface TeamStanding<T extends string> {
  name: T;
  seed: number;
  wins: number;
  losses: number;
  pastOpponents: PastOpponentDetail[];
}

interface TeamStandingWithDifficulty<T extends string> extends TeamStanding<T> {
  difficulty: number;
}

interface QualElimOutput<T extends string> {
  qualified: TeamStanding<T>[];
  eliminated: TeamStanding<T>[];
  competitors: TeamStanding<T>[];
}

interface OpponentCounts {
  bo1: number;
  bo3: number;
  total: number;
}

interface TeamResultCounts {
  qualified: number;
  allWins: number;
  allLosses: number;
  opponents: Map<string, OpponentCounts>;
}

export interface OpponentRate {
  teamName: string;
  totalRate: number;
  bo1Rate: number;
  bo3Rate: number;
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

export interface SimulationSettings {
  qualWins: number;
  elimLosses: number;
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
    const difficulty = team.pastOpponents.reduce((differentialSum, opponentDetail) => {
      const opponentStanding = teamsStandings.find(
        (standing) => standing.name === opponentDetail.teamName
      );
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
  qualWins: number,
  elimLosses: number,
  allTeamResults: Map<string, TeamResultCounts>
): Map<string, TeamResultCounts> => {
  results.forEach((teamStanding) => {
    const teamResult: TeamResultCounts = allTeamResults.get(teamStanding.name) || {
      qualified: 0,
      allWins: 0,
      allLosses: 0,
      opponents: new Map(),
    };
    if (teamStanding.wins === qualWins) {
      teamResult.qualified += 1;
      if (teamStanding.losses === 0) {
        teamResult.allWins += 1;
      }
    } else if (teamStanding.losses === elimLosses && teamStanding.wins === 0) {
      teamResult.allLosses += 1;
    }
    teamStanding.pastOpponents.forEach((opponent) => {
      const opponentCounts: OpponentCounts = teamResult.opponents.get(opponent.teamName) || {
        bo1: 0,
        bo3: 0,
        total: 0,
      };
      opponentCounts.total += 1;
      if (opponent.bestOf === BestOfNumber.BO1) {
        opponentCounts.bo1 += 1;
      } else {
        opponentCounts.bo3 += 1;
      }
      teamResult.opponents.set(opponent.teamName, opponentCounts);
    });

    allTeamResults.set(teamStanding.name, teamResult);
  });
  return allTeamResults;
};

export const getSeedOrder = <T extends string>(seeding: Record<string, T>) =>
  Object.entries(seeding)
    .sort(([seedA], [seedB]) => parseInt(seedA, 10) - parseInt(seedB, 10))
    .map(([, teamName]) => teamName);

const sixTeamMatchupPriority: [[number, number], [number, number], [number, number]][] = [
  [
    [1, 6],
    [2, 5],
    [3, 4],
  ],
  [
    [1, 6],
    [2, 4],
    [3, 5],
  ],
  [
    [1, 5],
    [2, 6],
    [3, 4],
  ],
  [
    [1, 5],
    [2, 4],
    [3, 6],
  ],
  [
    [1, 4],
    [2, 6],
    [3, 5],
  ],
  [
    [1, 4],
    [2, 5],
    [3, 6],
  ],
  [
    [1, 6],
    [2, 3],
    [4, 5],
  ],
  [
    [1, 5],
    [2, 3],
    [4, 6],
  ],
  [
    [1, 3],
    [2, 6],
    [4, 5],
  ],
  [
    [1, 3],
    [2, 5],
    [4, 6],
  ],
  [
    [1, 4],
    [2, 3],
    [5, 6],
  ],
  [
    [1, 3],
    [2, 4],
    [5, 6],
  ],
  [
    [1, 2],
    [3, 6],
    [4, 5],
  ],
  [
    [1, 2],
    [3, 5],
    [4, 6],
  ],
  [
    [1, 2],
    [3, 4],
    [5, 6],
  ],
];

const matchRecordGroup = <T extends string>(
  recordGroup: TeamStandingWithDifficulty<T>[]
): Matchup<T>[] => {
  const sortedGroup = sortRecordGroup(recordGroup);
  const matchups: Matchup<T>[] = [];
  if (sortedGroup.length === 6) {
    // In other rounds, refer to the following table and select the top-most row that does not result in a rematch:
    let validMatchups: Matchup<T>[] = [];
    sixTeamMatchupPriority.some((seedMatchups) => {
      validMatchups = [];
      return seedMatchups.every((seedMatchup) => {
        const highTeam = sortedGroup[seedMatchup[0] - 1];
        const lowTeam = sortedGroup[seedMatchup[1] - 1];
        if (!(highTeam && lowTeam)) throw new Error('No team matching seed matchup');
        if (!highTeam.pastOpponents.find((opp) => opp.teamName === lowTeam.name)) {
          validMatchups.push({ teamA: highTeam, teamB: lowTeam });
          return true;
        }
        return false;
      });
    });
    matchups.push(...validMatchups);
  } else {
    // Matchups shall be determined by seed. In round 3, the highest seeded team faces the lowest seeded team available that does not result in a rematch within the stage.
    while (sortedGroup.length) {
      const highTeam = sortedGroup.shift();
      if (!highTeam) throw new Error('Missing high seed team');
      const skippedTeams = [];
      let validLowTeam = false;
      let lowTeam: TeamStandingWithDifficulty<T> | undefined;

      while (!validLowTeam) {
        lowTeam = sortedGroup.pop();
        if (!lowTeam) throw new Error('Missing low seed team');
        const lowTeamName = lowTeam.name;
        if (!highTeam.pastOpponents.some((opp) => opp.teamName === lowTeamName)) {
          validLowTeam = true;
        } else {
          skippedTeams.unshift(lowTeam);
        }
      }
      sortedGroup.push(...skippedTeams); // Re-add skipped low seed teams to end of the array

      if (highTeam && lowTeam) {
        matchups.push({
          teamA: highTeam,
          teamB: lowTeam,
        });
      }
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
  simSettings: SimulationSettings
): TeamStanding<T>[] => {
  const probabilityListing = matchupProbabilities.find(
    (probListing) =>
      (probListing.teamA === matchup.teamA.name && probListing.teamB === matchup.teamB.name) ||
      (probListing.teamA === matchup.teamB.name && probListing.teamB === matchup.teamA.name)
  );
  const isQualElim =
    matchup.teamA.wins === simSettings.qualWins - 1 ||
    matchup.teamA.losses === simSettings.elimLosses - 1;
  const teamAWinrate =
    (isQualElim ? probabilityListing?.bo3TeamAWinrate : probabilityListing?.bo1TeamAWinrate) || 0.5;
  const swapTeams = probabilityListing ? probabilityListing.teamA !== matchup.teamA.name : false;

  const teamAWins = Math.random() <= teamAWinrate;
  const { teamA, teamB } = matchup;
  const bestOf = isQualElim ? BestOfNumber.BO3 : BestOfNumber.BO1;
  teamA.pastOpponents.push({ teamName: teamB.name, bestOf, won: teamAWins });
  teamB.pastOpponents.push({ teamName: teamA.name, bestOf, won: !teamAWins });
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
  matchupProbabilities: MatchupProbability<T>[],
  simSettings: SimulationSettings
): TeamStanding<T>[] =>
  matchups.flatMap((matchup) => simulateMatchup(matchup, matchupProbabilities, simSettings));

const extractQualElims = <T extends string>(
  teamsStandings: TeamStanding<T>[],
  simSettings: SimulationSettings
): QualElimOutput<T> =>
  teamsStandings.reduce(
    (acc, team) => {
      if (team.wins >= simSettings.qualWins) acc.qualified.push(team);
      else if (team.losses >= simSettings.elimLosses) acc.eliminated.push(team);
      else acc.competitors.push(team);
      return acc;
    },
    {
      qualified: [] as TeamStanding<T>[],
      eliminated: [] as TeamStanding<T>[],
      competitors: [] as TeamStanding<T>[],
    }
  );

const simulateEvent = (
  seedOrder: string[],
  probabilities: MatchupProbability<string>[],
  simSettings: SimulationSettings
): QualElimOutput<string> => {
  let competitors: TeamStanding<string>[] = seedOrder.map((teamName, index) => ({
    name: teamName,
    seed: index + 1,
    wins: 0,
    losses: 0,
    pastOpponents: [],
  }));
  const qualified: TeamStanding<string>[] = [];
  const eliminated: TeamStanding<string>[] = [];
  while (competitors.length) {
    const matchups = calculateMatchups(competitors);
    const standings = simulateMatchups(matchups, probabilities, simSettings);
    const qualElimResult = extractQualElims(standings, simSettings);
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

export const formatResultsCounts = (
  categorizedResults: Map<string, TeamResultCounts>,
  simSettings: SimulationSettings,
  iterations: number
): SimulationResults => {
  const { qualified, allWins, allLosses } = Array.from(categorizedResults.entries()).reduce(
    (acc, [teamName, resultCounts]) => {
      const formattedOpponents: OpponentRate[] = Array.from(
        resultCounts.opponents.entries(),
        ([oppTeam, oppCounts]) => ({
          teamName: oppTeam,
          totalRate: oppCounts.total / iterations,
          bo1Rate: oppCounts.bo1 / iterations,
          bo3Rate: oppCounts.bo3 / iterations,
        })
      ).sort((a, b) => b.totalRate - a.totalRate);
      if (resultCounts.qualified) {
        acc.qualified.push({
          teamName,
          rate: resultCounts.qualified / iterations,
          opponents: formattedOpponents,
        });
      }
      if (resultCounts.allWins) {
        acc.allWins.push({
          teamName,
          rate: resultCounts.allWins / iterations,
          opponents: formattedOpponents,
        });
      }
      if (resultCounts.allLosses) {
        acc.allLosses.push({
          teamName,
          rate: resultCounts.allLosses / iterations,
          opponents: formattedOpponents,
        });
      }

      return acc;
    },
    { qualified: [] as TeamResults[], allWins: [] as TeamResults[], allLosses: [] as TeamResults[] }
  );

  return {
    qualified: qualified.sort((a, b) => b.rate - a.rate),
    allWins: allWins.sort((a, b) => b.rate - a.rate),
    allLosses: allLosses.sort((a, b) => b.rate - a.rate),
    iterations,
    ...simSettings,
  };
};

export const simulateEvents = (
  seedOrder: string[],
  probabilities: MatchupProbability<string>[],
  simSettings: SimulationSettings,
  iterations = 10000
): SimulationResults => {
  let allTeamResults = new Map<string, TeamResultCounts>();
  for (let i = 0; i < iterations; i += 1) {
    const { qualified, eliminated } = simulateEvent(seedOrder, probabilities, simSettings);
    const results = [...qualified, ...eliminated];
    allTeamResults = categorizeResults(
      results,
      simSettings.qualWins,
      simSettings.elimLosses,
      allTeamResults
    );
  }
  return formatResultsCounts(allTeamResults, simSettings, iterations);
};
