import {
  simulateEvent,
  categorizeResults,
  SimulationEventMessage,
  TeamResultCounts,
} from '../simulator.js';

declare let self: DedicatedWorkerGlobalScope;

const onMessage = (evt: MessageEvent<SimulationEventMessage>) => {
  const { iterations, seedOrder, probabilities, simSettings } = evt.data;

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

  self.postMessage(allTeamResults);
  self.close();
};

self.addEventListener('message', onMessage);
