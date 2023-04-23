import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@vaadin/accordion/theme/lumo/vaadin-accordion';
import type { FormLayoutResponsiveStep } from '@vaadin/form-layout';
import '@vaadin/form-layout';
import { simulateEvents, SimulationResults, TeamResults } from './simulator.js';
import type { MatchupProbability } from './settings.js';

@customElement('simulation-result-viewer')
export class SimulationResultViewer extends LitElement {
  @property({ type: Object, noAccessor: true })
  public seeding: Record<string, string>;

  @property({ type: Array, noAccessor: true })
  public matchupProbabilities: MatchupProbability<string>[];

  @state()
  private simulationResults: SimulationResults;

  public simulate(): void {
    this.simulationResults = simulateEvents(this.seeding, this.matchupProbabilities);
  }

  private responsiveSteps: FormLayoutResponsiveStep[] = [
    // Use one column by default
    { minWidth: 0, columns: 1 },
    { minWidth: '800px', columns: 3 },
  ];

  private renderTeamResults(teamResults: TeamResults) {
    return html`
      <vaadin-accordion-panel
        summary="${`${(teamResults.rate * 100).toFixed(1)}% - ${teamResults.teamName}`}"
        theme="filled small"
      >
        ${teamResults.opponents &&
        html`<vaadin-vertical-layout>
          ${teamResults.opponents.map((opponent) => html` <span>${opponent.teamName}</span> `)}
        </vaadin-vertical-layout>`}
      </vaadin-accordion-panel>
    `;
  }

  static override styles = css``;

  override render() {
    return html`
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
      </vaadin-form-layout>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'simulation-result-viewer': SimulationResultViewer;
  }
}
