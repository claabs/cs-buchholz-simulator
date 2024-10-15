import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FormLayoutResponsiveStep } from '@vaadin/form-layout';
import '@vaadin/accordion/theme/lumo/vaadin-accordion';
import '@vaadin/form-layout';
import '@vaadin/progress-bar/theme/lumo/vaadin-progress-bar';
import '@vaadin/details/theme/lumo/vaadin-details';
import '@vaadin/icon';
import '@vaadin/icons';
import '@vaadin/progress-bar';
import { simulateEvents, SimulationResults, SimulationSettings, TeamResults } from './simulator.js';
import { rateToPctString } from './util.js';
import type { MatchupProbability } from './settings.js';

@customElement('simulation-result-viewer')
export class SimulationResultViewer extends LitElement {
  @property({ type: Array, noAccessor: true })
  public seedOrder: string[];

  @property({ type: Array, noAccessor: true })
  public matchupProbabilities: MatchupProbability[];

  @state()
  private simulationResults: SimulationResults;

  @state()
  private percentCompleted = 0;

  private updateProgress(pct: number) {
    this.percentCompleted = pct;
  }

  public async simulate(iterations: number, simSettings: SimulationSettings): Promise<void> {
    this.percentCompleted = 0;
    this.simulationResults = await simulateEvents(
      this.seedOrder,
      this.matchupProbabilities,
      simSettings,
      this.updateProgress.bind(this),
      iterations
    );
    this.percentCompleted = 1;
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

  static override styles = css`
    .trim-header {
      margin-block-end: 0;
    }

    vaadin-accordion-heading {
      color: black;
      font-weight: bold;
    }

    .help {
      background-color: var(--lumo-contrast-5pct);
      border-radius: var(--lumo-border-radius-m);
      padding: var(--lumo-space-xs) var(--lumo-space-s);
    }
  `;

  override render() {
    return html`
      <vaadin-progress-bar value="${this.percentCompleted}"></vaadin-progress-bar>
      ${this.simulationResults
        ? html`<h3 class="trim-header">
              Simulated ${this.simulationResults.iterations.toLocaleString()} events
            </h3>
            <vaadin-details>
              <vaadin-details-summary slot="summary">
                <vaadin-icon id="sim-help-icon" icon="vaadin:question-circle"></vaadin-icon>
              </vaadin-details-summary>
              <div class="help">
                The percentage next to the team name in the dropdown title is how often out of all
                the simulations that the team achieved that result. You can open the dropdown for
                each team to see how often they play each opponent in an event, and within that, how
                often they play as a best-of-1 or best-of-3.
              </div>
            </vaadin-details>
            <h4 class="sim-error-header">
              ${this.simulationResults.failedSimulations.toLocaleString()} simulations failed due to
              <a
                href="https://github.com/ValveSoftware/counter-strike_rules_and_regs/pull/26"
                target="_blank"
                >rules issues</a
              >
            </h4>
            <vaadin-form-layout .responsiveSteps=${this.responsiveSteps}>
              <vaadin-accordion>
                <h3 class="sim-header">${this.simulationResults.qualWins}-0 Teams</h3>
                ${this.simulationResults.allWins.map((teamResults) =>
                  this.renderTeamResults(teamResults)
                )}
              </vaadin-accordion>
              <vaadin-accordion>
                <h3 class="sim-header">Qualified Teams</h3>
                ${this.simulationResults.qualified.map((teamResults) =>
                  this.renderTeamResults(teamResults)
                )}
              </vaadin-accordion>
              <vaadin-accordion>
                <h3 class="sim-header">0-${this.simulationResults.elimLosses} Teams</h3>
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
