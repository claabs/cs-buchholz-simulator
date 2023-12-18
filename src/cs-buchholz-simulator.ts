import { LitElement, html, css } from 'lit';
import { customElement, state, query, property } from 'lit/decorators.js';
import type { TabSheetSelectedChangedEvent } from '@vaadin/tabsheet';
import { MatchupProbability, masterRating, masterSeedOrder } from './settings.js';
import { generateEasyProbabilities } from './simulator.js';
import './team-list.js';
import './matchup-table.js';
import './team-ratings.js';
import './team-ratings-chart.js';
import './simulation-result-viewer.js';
import '@vaadin/tabs/theme/lumo/vaadin-tabs';
import '@vaadin/tabsheet/theme/lumo/vaadin-tabsheet';
import '@vaadin/split-layout/theme/lumo/vaadin-split-layout';
import '@vaadin/button/theme/lumo/vaadin-button.js';
import '@vaadin/horizontal-layout/theme/lumo/vaadin-horizontal-layout.js';
import '@vaadin/vertical-layout/theme/lumo/vaadin-vertical-layout.js';
import '@vaadin/tooltip/theme/lumo/vaadin-tooltip';
import type { SimulationResultViewer } from './simulation-result-viewer.js';
import type { TeamRatingsChart } from './team-ratings-chart.js';
import type { TeamRatingDetails } from './team-ratings.js';

@customElement('cs-buchholz-simulator')
export class CsBuchholzSimulato extends LitElement {
  @property({ type: Array })
  private seedOrder: string[] = masterSeedOrder;

  @state()
  private teamRating: Record<string, number> = masterRating as Record<string, number>;

  @state()
  private matchupProbabilities: MatchupProbability<string>[] = generateEasyProbabilities(
    this.seedOrder,
    this.teamRating,
    0.5
  );

  @state()
  private isMobileView: boolean;

  @state()
  private selectedTab = 0;

  @query('simulation-result-viewer')
  private simulationResultViewer: SimulationResultViewer;

  @query('team-ratings-chart')
  private teamRatingsChart: TeamRatingsChart<string>;

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

  private teamRatingValueChanged(event: CustomEvent<TeamRatingDetails>) {
    this.teamRating = event.detail.teamRating;
    const { bo1Skew } = event.detail;
    this.matchupProbabilities = generateEasyProbabilities(this.seedOrder, this.teamRating, bo1Skew);
  }

  private probabilityValueChanged(event: CustomEvent<MatchupProbability<string>[]>) {
    this.matchupProbabilities = event.detail;
  }

  private selectedTabChanged(event: TabSheetSelectedChangedEvent) {
    this.selectedTab = event.detail.value;
    if (event.detail.value === 2) {
      this.simulationResultViewer.simulate(10000);
    }
  }

  private simulateButtonClicked() {
    this.simulationResultViewer.simulate(10000);
  }

  private simulateLongButtonClicked() {
    this.simulationResultViewer.simulate(100000);
  }

  private updateMobileView() {
    const mql = window.matchMedia('(max-width: 640px)');
    this.isMobileView = mql.matches;
  }

  private splitterDragEnd() {
    this.teamRatingsChart.chart.redraw();
  }

  override connectedCallback(): void {
    // eslint-disable-next-line wc/guard-super-call
    super.connectedCallback();
    window.addEventListener('resize', () => this.updateMobileView());
    this.updateMobileView();
  }

  override render() {
    const teamListTemplate = html`<team-list .teamList=${this.seedOrder}></team-list>`;

    const teamRatingsTemplate = html`<team-ratings
        .seedOrder=${this.seedOrder}
        .teamRating=${this.teamRating}
        .bo1Skew=${0.5}
        @teamRatingValueChanged=${this.teamRatingValueChanged}
      ></team-ratings>
      <team-ratings-chart .teamRating=${this.teamRating}></team-ratings-chart>`;

    const matchupTableTemplate = html` <matchup-table
      .seedOrder=${this.seedOrder}
      .matchupProbabilities=${this.matchupProbabilities}
      @probabilityValueChanged=${this.probabilityValueChanged}
    ></matchup-table>`;

    const simulationResultViewerTemplate = html`<simulation-result-viewer
      .seedOrder=${this.seedOrder}
      .matchupProbabilities=${this.matchupProbabilities}
    ></simulation-result-viewer>`;

    const mobileLayoutTemplate = html`<vaadin-tabsheet
      @selected-changed=${this.selectedTabChanged}
      .selected=${this.selectedTab}
    >
      <vaadin-tabs slot="tabs">
        <vaadin-tab id="team-list-tab">Ratings</vaadin-tab>
        <vaadin-tab id="ratings-tab">Ratings</vaadin-tab>
        <vaadin-tab id="matchups-tab">Matchups</vaadin-tab>
        <vaadin-tab id="results-tab">Results</vaadin-tab>
      </vaadin-tabs>

      <vaadin-vertical-layout tab="team-list-tab" theme="spacing-s" style="align-items: stretch">
        ${teamListTemplate}
        <vaadin-button
          id="to-ratings"
          theme="primary"
          @click=${() => {
            this.selectedTab = 1;
          }}
          >To Ratings...</vaadin-button
        >
      </vaadin-vertical-layout>

      <vaadin-vertical-layout tab="ratings-tab" theme="spacing-s" style="align-items: stretch">
        ${teamRatingsTemplate}
        <vaadin-button
          id="to-matchups"
          theme="primary"
          @click=${() => {
            this.selectedTab = 2;
          }}
          >To Matchups...</vaadin-button
        >
      </vaadin-vertical-layout>

      <vaadin-vertical-layout tab="matchups-tab" theme="spacing-s" style="align-items: stretch">
        ${matchupTableTemplate}
        <vaadin-button
          id="to-results"
          theme="primary"
          @click=${() => {
            this.selectedTab = 3;
          }}
          >To Results...</vaadin-button
        >
      </vaadin-vertical-layout>

      <div tab="results-tab">${simulationResultViewerTemplate}</div>
    </vaadin-tabsheet>`;

    const desktopLayoutTemplate = html`<vaadin-split-layout
      @splitter-dragend=${this.splitterDragEnd}
      style="height: 100vh;"
    >
      <master-content style="width: 70%;">
        <vaadin-vertical-layout theme="padding" style="align-items: stretch">
          ${teamListTemplate} ${teamRatingsTemplate} ${matchupTableTemplate}
        </vaadin-vertical-layout>
      </master-content>
      <detail-content style="width: 30%;">
        <vaadin-vertical-layout theme="padding" style="align-items: stretch">
          <vaadin-horizontal-layout theme="padding" style="justify-content: space-evenly">
            <vaadin-button id="simulate" theme="primary" @click=${this.simulateButtonClicked}
              >Simulate 10k</vaadin-button
            >
            <vaadin-tooltip
              for="simulate"
              text="Runs enough simulations to be consistent about ±2%. Good for seeing quick results."
            ></vaadin-tooltip>
            <vaadin-button
              id="simulate-long"
              theme="primary"
              @click=${this.simulateLongButtonClicked}
              >Simulate 100k</vaadin-button
            >
            <vaadin-tooltip
              for="simulate-long"
              text="Runs more simulations for a more precise result. This can take around 10 seconds."
            ></vaadin-tooltip>
          </vaadin-horizontal-layout>
          ${simulationResultViewerTemplate}
        </vaadin-vertical-layout>
      </detail-content>
    </vaadin-split-layout>`;

    return html` <main>${this.isMobileView ? mobileLayoutTemplate : desktopLayoutTemplate}</main> `;
  }
}
