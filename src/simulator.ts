import type { MatchupProbability } from './settings.js';

enum BestOfNumber {
  BO1 = 1,
  BO3 = 3,
}

interface Matchup {
  teamA: TeamStandingWithDifficulty;
  teamB: TeamStandingWithDifficulty;
}

interface PastOpponentDetail {
  teamName: string;
  bestOf: BestOfNumber;
  won: boolean;
}

interface TeamStanding {
  name: string;
  seed: number;
  wins: number;
  losses: number;
  pastOpponents: PastOpponentDetail[];
}

interface TeamStandingWithDifficulty extends TeamStanding {
  difficulty: number;
}

interface QualElimOutput {
  qualified: TeamStanding[];
  eliminated: TeamStanding[];
  competitors: TeamStanding[];
}

interface OpponentCounts {
  bo1: number;
  bo3: number;
  total: number;
  won: number;
}

export interface TeamResultCounts {
  qualified: number;
  allWins: number;
  allLosses: number;
  wins: number;
  losses: number;
  opponents: Map<string, OpponentCounts>;
}

export interface OpponentRate {
  teamName: string;
  totalRate: number;
  bo1Rate: number;
  bo3Rate: number;
  winRate: number;
}

export interface TeamResults {
  teamName: string;
  rate: number;
  winRate: number;
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

export const generateEasyProbabilities = (
  seedOrder: string[],
  ratings: Record<string, number>,
  bo1Skew: number
): MatchupProbability[] => {
  const orderedRatings = seedOrder.map((teamName) => ({
    teamName,
    rating: ratings[teamName] ?? 1,
  }));
  return orderedRatings.reduce((acc, team, index) => {
    const opposingTeams = orderedRatings.slice(index + 1);
    const teamMatchupProbs: MatchupProbability[] = opposingTeams.map((opp) => {
      const differenceFactor = team.rating / opp.rating;
      const bo3Winrate = differenceFactor / (differenceFactor + 1);
      const bo1Winrate = (0.5 - bo3Winrate) * bo1Skew + bo3Winrate;
      return {
        teamA: team.teamName,
        teamB: opp.teamName,
        bo1TeamAWinrate: bo1Winrate,
        bo3TeamAWinrate: bo3Winrate,
      };
    });
    return acc.concat(teamMatchupProbs);
  }, [] as MatchupProbability[]);
};

const splitStandingsToRecordGroups = (
  teamsStandings: TeamStandingWithDifficulty[]
): Map<number, TeamStandingWithDifficulty[]> =>
  teamsStandings.reduce((groups, teamStanding) => {
    const winDifferential = teamStanding.wins - teamStanding.losses;
    const recordGroup = groups.get(winDifferential);
    if (recordGroup) {
      recordGroup.push(teamStanding);
    } else {
      groups.set(winDifferential, [teamStanding]);
    }
    return groups;
  }, new Map<number, TeamStandingWithDifficulty[]>());

const calculateDifficulties = (teamsStandings: TeamStanding[]): TeamStandingWithDifficulty[] =>
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

const sortRecordGroup = (recordGroup: TeamStandingWithDifficulty[]): TeamStandingWithDifficulty[] =>
  recordGroup.sort((teamA, teamB) => {
    const difficultyDiff = teamB.difficulty - teamA.difficulty;
    if (difficultyDiff !== 0) return difficultyDiff;
    return teamA.seed - teamB.seed;
  });

export const categorizeResults = (
  results: TeamStanding[],
  qualWins: number,
  elimLosses: number,
  allTeamResults: Map<string, TeamResultCounts>
): Map<string, TeamResultCounts> => {
  results.forEach((teamStanding) => {
    const teamResult: TeamResultCounts = allTeamResults.get(teamStanding.name) || {
      qualified: 0,
      allWins: 0,
      allLosses: 0,
      wins: 0,
      losses: 0,
      opponents: new Map(),
    };
    teamResult.wins += teamStanding.wins;
    teamResult.losses += teamStanding.losses;
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
        won: 0,
      };
      opponentCounts.total += 1;
      if (opponent.bestOf === BestOfNumber.BO1) {
        opponentCounts.bo1 += 1;
      } else {
        opponentCounts.bo3 += 1;
      }
      if (opponent.won) opponentCounts.won += 1;
      teamResult.opponents.set(opponent.teamName, opponentCounts);
    });

    allTeamResults.set(teamStanding.name, teamResult);
  });
  return allTeamResults;
};

export const getSeedOrder = (seeding: Record<string, string>) =>
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

const matchRecordGroup = (recordGroup: TeamStandingWithDifficulty[]): Matchup[] => {
  const sortedGroup = sortRecordGroup(recordGroup);
  const matchups: Matchup[] = [];
  if (sortedGroup.length === 6) {
    // In other rounds, refer to the following table and select the top-most row that does not result in a rematch:
    let validMatchups: Matchup[] = [];
    const foundValid = sixTeamMatchupPriority.some((seedMatchups) => {
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
    if (!foundValid) throw new Error('No valid matchups without rematches!');
    matchups.push(...validMatchups);
  } else {
    // Matchups shall be determined by seed. In round 3, the highest seeded team faces the lowest seeded team available that does not result in a rematch within the stage.
    while (sortedGroup.length) {
      const highTeam = sortedGroup.shift();
      if (!highTeam) throw new Error('Missing high seed team');
      const skippedTeams = [];
      let validLowTeam = false;
      let lowTeam: TeamStandingWithDifficulty | undefined;

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
const calculateMatchups = (teamsStandings: TeamStanding[]): Matchup[] => {
  // 1. Current W-L record in the stage
  // 2. Difficulty Score in the current stage
  // 3. Initial seeding of the current stage
  const teamsStandingsWithDifficulty = calculateDifficulties(teamsStandings);
  const recordGroups = splitStandingsToRecordGroups(teamsStandingsWithDifficulty);
  const matchups: Matchup[] = Array.from(recordGroups.values()).reduce(
    (acc: Matchup[], recordGroup) => acc.concat(matchRecordGroup(recordGroup)),
    []
  );
  return matchups;
};

const simulateMatchup = (
  matchup: Matchup,
  matchupProbabilities: MatchupProbability[],
  simSettings: SimulationSettings
): TeamStanding[] => {
  const probabilityListing = matchupProbabilities.find(
    (probListing) =>
      (probListing.teamA === matchup.teamA.name && probListing.teamB === matchup.teamB.name) ||
      (probListing.teamA === matchup.teamB.name && probListing.teamB === matchup.teamA.name)
  );
  const isQualElim =
    matchup.teamA.wins === simSettings.qualWins - 1 ||
    matchup.teamA.losses === simSettings.elimLosses - 1;
  const swapProbability = probabilityListing
    ? probabilityListing.teamA !== matchup.teamA.name
    : false;
  const probTeamAWinrate =
    (isQualElim ? probabilityListing?.bo3TeamAWinrate : probabilityListing?.bo1TeamAWinrate) ?? 0.5;
  const teamAWinrate = swapProbability ? 1 - probTeamAWinrate : probTeamAWinrate;

  const teamAWins = Math.random() <= teamAWinrate;
  const { teamA, teamB } = matchup;
  const bestOf = isQualElim ? BestOfNumber.BO3 : BestOfNumber.BO1;
  teamA.pastOpponents.push({ teamName: teamB.name, bestOf, won: teamAWins });
  teamB.pastOpponents.push({ teamName: teamA.name, bestOf, won: !teamAWins });
  if (teamAWins) {
    teamA.wins += 1;
    teamB.losses += 1;
  } else {
    teamA.losses += 1;
    teamB.wins += 1;
  }
  return [teamA, teamB];
};

const simulateMatchups = (
  matchups: Matchup[],
  matchupProbabilities: MatchupProbability[],
  simSettings: SimulationSettings
): TeamStanding[] =>
  matchups.flatMap((matchup) => simulateMatchup(matchup, matchupProbabilities, simSettings));

const extractQualElims = (
  teamsStandings: TeamStanding[],
  simSettings: SimulationSettings
): QualElimOutput =>
  teamsStandings.reduce(
    (acc, team) => {
      if (team.wins >= simSettings.qualWins) acc.qualified.push(team);
      else if (team.losses >= simSettings.elimLosses) acc.eliminated.push(team);
      else acc.competitors.push(team);
      return acc;
    },
    {
      qualified: [] as TeamStanding[],
      eliminated: [] as TeamStanding[],
      competitors: [] as TeamStanding[],
    }
  );

export const simulateEvent = (
  seedOrder: string[],
  probabilities: MatchupProbability[],
  simSettings: SimulationSettings
): QualElimOutput => {
  let competitors: TeamStanding[] = seedOrder.map((teamName, index) => ({
    name: teamName,
    seed: index + 1,
    wins: 0,
    losses: 0,
    pastOpponents: [],
  }));
  const qualified: TeamStanding[] = [];
  const eliminated: TeamStanding[] = [];
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
          winRate: oppCounts.won / oppCounts.total,
        })
      ).sort((a, b) => b.totalRate - a.totalRate);
      const winRate = resultCounts.wins / (resultCounts.wins + resultCounts.losses);
      if (resultCounts.qualified) {
        acc.qualified.push({
          teamName,
          rate: resultCounts.qualified / iterations,
          opponents: formattedOpponents,
          winRate,
        });
      }
      if (resultCounts.allWins) {
        acc.allWins.push({
          teamName,
          rate: resultCounts.allWins / iterations,
          opponents: formattedOpponents,
          winRate,
        });
      }
      if (resultCounts.allLosses) {
        acc.allLosses.push({
          teamName,
          rate: resultCounts.allLosses / iterations,
          opponents: formattedOpponents,
          winRate,
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

export interface SimulationEventMessage {
  seedOrder: string[];
  probabilities: MatchupProbability[];
  simSettings: SimulationSettings;
  iterations: number;
}

export const simulateEvents = async (
  seedOrder: string[],
  probabilities: MatchupProbability[],
  simSettings: SimulationSettings,
  iterations = 10000
): Promise<SimulationResults> => {
  const workerCount = window.navigator.hardwareConcurrency;
  const iterationsPerWorker = Math.floor(iterations / workerCount);
  const runningWorkers: Promise<Map<string, TeamResultCounts>>[] = [];
  for (let i = 0; i < workerCount; i += 1) {
    const promise = new Promise<Map<string, TeamResultCounts>>((resolve, reject) => {
      const worker = new Worker(new URL('./worker/simulation-worker.js', import.meta.url), {
        type: 'module',
      });
      worker.addEventListener('message', (evt: MessageEvent<Map<string, TeamResultCounts>>) => {
        resolve(evt.data);
      });
      worker.addEventListener('error', (evt: ErrorEvent) => {
        reject(evt.error);
      });
      const message: SimulationEventMessage = {
        seedOrder,
        probabilities,
        simSettings,
        iterations: iterationsPerWorker,
      };
      worker.postMessage(message);
    });
    runningWorkers.push(promise);
  }
  const allTeamResults = new Map<string, TeamResultCounts>();
  const workerResults = await Promise.all(runningWorkers);
  workerResults.forEach((teamResults) => {
    teamResults.forEach((teamCounts, teamName) => {
      const prevTotal = allTeamResults.get(teamName);
      if (!prevTotal) {
        allTeamResults.set(teamName, teamCounts);
      } else {
        const newOpponents = new Map<string, OpponentCounts>();
        teamCounts.opponents.forEach((opponentCounts, opponentName) => {
          const prevOpponent = newOpponents.get(opponentName);
          if (!prevOpponent) {
            newOpponents.set(opponentName, opponentCounts);
          } else {
            const newOpponentCounts: OpponentCounts = {
              total: prevOpponent.total + opponentCounts.total,
              won: prevOpponent.won + opponentCounts.won,
              bo1: prevOpponent.bo1 + opponentCounts.bo1,
              bo3: prevOpponent.bo3 + opponentCounts.bo3,
            };
            newOpponents.set(opponentName, newOpponentCounts);
          }
        });
        const newTotal: TeamResultCounts = {
          qualified: prevTotal.qualified + teamCounts.qualified,
          allWins: prevTotal.allWins + teamCounts.allWins,
          allLosses: prevTotal.allLosses + teamCounts.allLosses,
          wins: prevTotal.wins + teamCounts.wins,
          losses: prevTotal.losses + teamCounts.losses,
          opponents: newOpponents,
        };
        allTeamResults.set(teamName, newTotal);
      }
    });
  });

  return formatResultsCounts(allTeamResults, simSettings, iterations);
};
