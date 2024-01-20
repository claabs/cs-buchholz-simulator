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
  failedSimulations: number;
}

export interface SimulationEventMessage {
  seedOrder: string[];
  probabilities: MatchupProbability[];
  simSettings: SimulationSettings;
  iterations: number;
}

export interface MessageFromWorkerFinish {
  data: Map<string, TeamResultCounts>;
  errors: number;
  type: 'finish';
}

export interface MessageFromWorkerProgress {
  data: number;
  type: 'progress';
}

export type MessageFromWorker = MessageFromWorkerFinish | MessageFromWorkerProgress;

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
  iterations: number,
  failedSimulations: number
): SimulationResults => {
  const successfulIterations = iterations - failedSimulations;
  const { qualified, allWins, allLosses } = Array.from(categorizedResults.entries()).reduce(
    (acc, [teamName, resultCounts]) => {
      const formattedOpponents: OpponentRate[] = Array.from(
        resultCounts.opponents.entries(),
        ([oppTeam, oppCounts]) => ({
          teamName: oppTeam,
          totalRate: oppCounts.total / successfulIterations,
          bo1Rate: oppCounts.bo1 / successfulIterations,
          bo3Rate: oppCounts.bo3 / successfulIterations,
          winRate: oppCounts.won / oppCounts.total,
        })
      ).sort((a, b) => b.totalRate - a.totalRate);
      const winRate = resultCounts.wins / (resultCounts.wins + resultCounts.losses);
      if (resultCounts.qualified) {
        acc.qualified.push({
          teamName,
          rate: resultCounts.qualified / successfulIterations,
          opponents: formattedOpponents,
          winRate,
        });
      }
      if (resultCounts.allWins) {
        acc.allWins.push({
          teamName,
          rate: resultCounts.allWins / successfulIterations,
          opponents: formattedOpponents,
          winRate,
        });
      }
      if (resultCounts.allLosses) {
        acc.allLosses.push({
          teamName,
          rate: resultCounts.allLosses / successfulIterations,
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
    failedSimulations,
  };
};

export const simulateEvents = async (
  seedOrder: string[],
  probabilities: MatchupProbability[],
  simSettings: SimulationSettings,
  progress: (pct: number) => void,
  iterations = 10000
): Promise<SimulationResults> => {
  const workerCount = window.navigator.hardwareConcurrency;
  const iterationsPerWorker = Math.floor(iterations / workerCount);
  const runningWorkers: Promise<MessageFromWorkerFinish>[] = [];
  let progressTotal = 0;
  for (let i = 0; i < workerCount; i += 1) {
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    const promise = new Promise<MessageFromWorkerFinish>((resolve, reject) => {
      const worker = new Worker(new URL('./worker/simulation-worker.js', import.meta.url), {
        type: 'module',
      });
      worker.addEventListener('message', (evt: MessageEvent<MessageFromWorker>) => {
        if (evt.data.type === 'finish') {
          resolve(evt.data);
        } else {
          progressTotal += evt.data.data;
          progress(progressTotal / iterations);
        }
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
  let failedSimulations = 0;
  const workerResults = await Promise.all(runningWorkers);
  workerResults.forEach((workerResult) => {
    failedSimulations += workerResult.errors;
    workerResult.data.forEach((teamCounts, teamName) => {
      const prevTotal = allTeamResults.get(teamName);
      if (!prevTotal) {
        allTeamResults.set(teamName, teamCounts);
      } else {
        const newOpponents = new Map<string, OpponentCounts>();
        teamCounts.opponents.forEach((opponentCounts, opponentName) => {
          const prevOpponent = prevTotal.opponents.get(opponentName);
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

  return formatResultsCounts(allTeamResults, simSettings, iterations, failedSimulations);
};
