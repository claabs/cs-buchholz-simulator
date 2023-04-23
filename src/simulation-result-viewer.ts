import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@vaadin/accordion/theme/lumo/vaadin-accordion';
import type { FormLayoutResponsiveStep } from '@vaadin/form-layout';
import '@vaadin/form-layout';
import { simulateEvents, SimulationResults, TeamResults } from './simulator.js';
import type { MatchupProbability } from './settings.js';
import { rateToPctString } from './util.js';

@customElement('simulation-result-viewer')
export class SimulationResultViewer extends LitElement {
  @property({ type: Object, noAccessor: true })
  public seeding: Record<string, string>;

  @property({ type: Array, noAccessor: true })
  public matchupProbabilities: MatchupProbability<string>[];

  @state()
  private simulationResults: SimulationResults;

  public simulate(iterations: number): void {
    this.simulationResults = simulateEvents(
      this.seeding,
      this.matchupProbabilities,
      {
        qualWins: 3,
        elimLosses: 3,
      },
      iterations
    );
  }

  private responsiveSteps: FormLayoutResponsiveStep[] = [
    // Use one column by default
    { minWidth: 0, columns: 1 },
    { minWidth: '800px', columns: 3 },
  ];

  private renderTeamResults(teamResults: TeamResults) {
    return html`
      <vaadin-accordion-panel
        summary="${rateToPctString(teamResults.rate, 1)} - ${teamResults.teamName}"
        theme="filled small"
      >
        ${teamResults.opponents &&
        html`<vaadin-vertical-layout>
          ${teamResults.opponents.map(
            (opponent) =>
              html`<span
                >${rateToPctString(opponent.totalRate, 1)} vs ${opponent.teamName} (BO1:
                ${rateToPctString(opponent.bo1Rate)}; BO3:
                ${rateToPctString(opponent.bo3Rate)})</span
              >`
          )}
        </vaadin-vertical-layout>`}
      </vaadin-accordion-panel>
    `;
  }

  static override styles = css``;

  override render() {
    return html`
      ${this.simulationResults
        ? html`<h3>Simulated ${this.simulationResults.iterations} events</h3>
            <vaadin-form-layout .responsiveSteps=${this.responsiveSteps}>
              <vaadin-accordion>
                <h2>${this.simulationResults.qualWins}-0 Teams</h2>
                ${this.simulationResults.allWins.map((teamResults) =>
                  this.renderTeamResults(teamResults)
                )}
              </vaadin-accordion>
              <vaadin-accordion>
                <h2>Qualified Teams</h2>
                ${this.simulationResults.qualified.map((teamResults) =>
                  this.renderTeamResults(teamResults)
                )}
              </vaadin-accordion>
              <vaadin-accordion>
                <h2>0-${this.simulationResults.elimLosses} Teams</h2>
                ${this.simulationResults.allLosses.map((teamResults) =>
                  this.renderTeamResults(teamResults)
                )}
              </vaadin-accordion>
            </vaadin-form-layout>`
        : html`<h3>Run simulation to view results</h3>`}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'simulation-result-viewer': SimulationResultViewer;
  }
}
