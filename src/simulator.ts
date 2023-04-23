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

interface TeamResultCounts {
  qualified: number;
  allWins: number;
  allLosses: number;
  opponents: Map<string, number>;
}

export interface OpponentRate {
  teamName: string;
  ratePlayed: number;
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
      const opponentCount = teamResult.opponents.get(opponent) || 0;
      teamResult.opponents.set(opponent, opponentCount + 1);
    });

    allTeamResults.set(teamStanding.name, teamResult);
  });
  return allTeamResults;
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
  seeding: Record<string, string>,
  probabilities: MatchupProbability<string>[],
  simSettings: SimulationSettings
): QualElimOutput<string> => {
  let competitors: TeamStanding<string>[] = Object.entries(seeding).map(([seed, name]) => ({
    name,
    seed: parseInt(seed, 10),
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
        ([oppTeam, timesPlayed]) => ({ teamName: oppTeam, ratePlayed: timesPlayed / iterations })
      ).sort((a, b) => b.ratePlayed - a.ratePlayed);
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
  seeding: Record<string, string>,
  probabilities: MatchupProbability<string>[],
  simSettings: SimulationSettings,
  iterations = 10000
): SimulationResults => {
  let allTeamResults = new Map<string, TeamResultCounts>();
  for (let i = 0; i < iterations; i += 1) {
    const { qualified, eliminated } = simulateEvent(seeding, probabilities, simSettings);
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
