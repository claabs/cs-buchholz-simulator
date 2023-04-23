import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import type { TabSheetSelectedChangedEvent } from '@vaadin/tabsheet';
import { MatchupProbability, rmrEuARating, rmrEuASeeding } from './settings.js';
import { generateEasyProbabilities, getSeedOrder } from './simulator.js';
import './matchup-table.js';
import './team-ratings.js';
import './team-ratings-chart.js';
import './simulation-result-viewer.js';
import '@vaadin/tabs/theme/lumo/vaadin-tabs';
import '@vaadin/tabsheet/theme/lumo/vaadin-tabsheet';
import type { SimulationResultViewer } from './simulation-result-viewer.js';

@customElement('cs-buchholz-simulator')
export class CsBuchholzSimulato extends LitElement {
  @state()
  private teamRating: Record<string, number> = rmrEuARating as Record<string, number>;

  @state()
  private matchupProbabilities: MatchupProbability<string>[] = generateEasyProbabilities(
    this.teamRating
  );

  private seeding: Record<string, string> = rmrEuASeeding as Record<string, string>;

  private seedOrder = getSeedOrder(this.seeding);

  @query('simulation-result-viewer')
  private simulationResults: SimulationResultViewer;

  static override styles = css`
    /* :host {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      font-size: calc(10px + 2vmin);
      color: #1a2b42;
      max-width: 960px;
      margin: 0 auto;
      text-align: center;
      background-color: var(--cs-buchholz-simulator-background-color);
    } */

    main {
      flex-grow: 1;
    }
  `;

  private teamRatingValueChanged(event: CustomEvent<Record<string, number>>) {
    this.teamRating = event.detail;
    this.matchupProbabilities = generateEasyProbabilities(this.teamRating);
  }

  private matchupValueChanged(event: CustomEvent<MatchupProbability<string>[]>) {
    this.matchupProbabilities = event.detail;
  }

  private selectedTabChanged(event: TabSheetSelectedChangedEvent) {
    if (event.detail.value === 2) {
      this.simulationResults.simulate();
    }
  }

  override render() {
    return html`
      <main>
        <vaadin-tabsheet @selected-changed=${this.selectedTabChanged}>
          <vaadin-tabs slot="tabs">
            <vaadin-tab id="ratings-tab">Ratings</vaadin-tab>
            <vaadin-tab id="matchups-tab">Matchups</vaadin-tab>
            <vaadin-tab id="results-tab">Results</vaadin-tab>
          </vaadin-tabs>

          <div tab="ratings-tab">
            <team-ratings
              .seedOrder=${this.seedOrder}
              .teamRating=${this.teamRating}
              @teamRatingValueChanged=${this.teamRatingValueChanged}
            ></team-ratings>
            <team-ratings-chart .teamRating=${this.teamRating}></team-ratings-chart>
          </div>
          <div tab="matchups-tab">
            <matchup-table
              .seedOrder=${this.seedOrder}
              .matchupProbabilities=${this.matchupProbabilities}
              @matchupValueChanged=${this.matchupValueChanged}
            ></matchup-table>
          </div>
          <div tab="results-tab">
            <simulation-result-viewer
              .seeding=${this.seeding}
              .matchupProbabilities=${this.matchupProbabilities}
            ></simulation-result-viewer>
          </div>
        </vaadin-tabsheet>
      </main>
    `;
  }
}
