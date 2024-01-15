import type { MatchupProbability } from './settings.js';

export interface Matchup {
  teamA: TeamStandingWithDifficulty;
  teamB: TeamStandingWithDifficulty;
}

export interface PastOpponentDetail {
  teamName: string;
  bestOf: 1 | 3;
  won: boolean;
}

export interface TeamStanding {
  name: string;
  seed: number;
  wins: number;
  losses: number;
  pastOpponents: PastOpponentDetail[];
}

export interface TeamStandingWithDifficulty extends TeamStanding {
  difficulty: number;
}

export interface QualElimOutput {
  qualified: TeamStanding[];
  eliminated: TeamStanding[];
  competitors: TeamStanding[];
}

export interface OpponentCounts {
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

export interface SimulationSettings {
  qualWins: number;
  elimLosses: number;
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

export interface SimulationEventMessage {
  seedOrder: string[];
  probabilities: MatchupProbability[];
  simSettings: SimulationSettings;
  iterations: number;
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
