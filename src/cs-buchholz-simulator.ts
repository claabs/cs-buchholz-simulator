import { LitElement, html, css } from 'lit';
import { customElement, state, query, property } from 'lit/decorators.js';
import type { TabSheetSelectedChangedEvent } from '@vaadin/tabsheet';
import { Workbox } from 'workbox-window';
import { MatchupProbability, eventPresets } from './settings.js';
import masterRating from './hltv-team-points.js';
import { generateEasyProbabilities, SimulationSettings } from './simulator.js';
import './team-list.js';
import './matchup-table.js';
import './team-ratings.js';
import './team-ratings-chart.js';
import './simulation-result-viewer.js';
import './refresh-notification.js';
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
import type { TeamListSettings } from './team-list.js';
import type { RefreshNotification } from './refresh-notification.js';

const filterTeamRating = (seedOrder: string[]): Record<string, number> => {
  const teamRating: Record<string, number> = {};
  seedOrder.forEach((teamName) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    teamRating[teamName] = masterRating[teamName] ?? 1;
  });
  return teamRating;
};

const matchupProbabilitiesEqual = (a: MatchupProbability[], b: MatchupProbability[]): boolean => {
  return a.every((aProb, index) => {
    const bProb = b[index];
    if (!bProb) return false;
    return (
      aProb.teamA === bProb.teamA &&
      aProb.teamB === bProb.teamB &&
      aProb.bo1TeamAWinrate === bProb.bo1TeamAWinrate &&
      aProb.bo3TeamAWinrate === bProb.bo3TeamAWinrate
    );
  });
};

@customElement('cs-buchholz-simulator')
export class CsBuchholzSimulato extends LitElement {
  @property({ type: Array })
  private seedOrder: string[] = Object.values(eventPresets)[0]?.teamList || [];

  @state()
  private teamRating: Record<string, number> = filterTeamRating(this.seedOrder);

  @state()
  private bo1Skew = 0.5;

  @state()
  private startingMatchupProbabilities: MatchupProbability[] = generateEasyProbabilities(
    this.seedOrder,
    this.teamRating,
    this.bo1Skew
  );

  @state()
  private matchupProbabilities = this.startingMatchupProbabilities;

  @state()
  private isMobileView: boolean;

  @state()
  private selectedTab = 0;

  @query('simulation-result-viewer')
  private simulationResultViewer: SimulationResultViewer;

  @query('team-ratings-chart')
  private teamRatingsChart: TeamRatingsChart;

  @query('refresh-notification')
  private refreshNotification: RefreshNotification;

  private workbox?: Workbox;

  private registration?: ServiceWorkerRegistration;

  private matchupTableCustomized = false;

  private simSettings: SimulationSettings = { qualWins: 3, elimLosses: 3 };

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

  private teamListChanged(event: CustomEvent<TeamListSettings>) {
    this.seedOrder = event.detail.teamList;
    this.simSettings = {
      qualWins: event.detail.winsForQuali,
      elimLosses: event.detail.lossesForElim,
    };
    this.teamRating = filterTeamRating(this.seedOrder);
    this.startingMatchupProbabilities = generateEasyProbabilities(
      this.seedOrder,
      this.teamRating,
      this.bo1Skew
    );
    this.matchupProbabilities = this.startingMatchupProbabilities;
    this.matchupTableCustomized = false;
  }

  private teamRatingValueChanged(event: CustomEvent<TeamRatingDetails>) {
    this.teamRating = event.detail.teamRating;
    this.bo1Skew = event.detail.bo1Skew;
    this.startingMatchupProbabilities = generateEasyProbabilities(
      this.seedOrder,
      this.teamRating,
      this.bo1Skew
    );
    this.matchupProbabilities = this.startingMatchupProbabilities;

    this.matchupTableCustomized = false;
  }

  private probabilityValueChanged(event: CustomEvent<MatchupProbability[]>) {
    this.matchupProbabilities = event.detail;
    this.matchupTableCustomized = !matchupProbabilitiesEqual(
      this.matchupProbabilities,
      this.startingMatchupProbabilities
    );
  }

  private async selectedTabChanged(event: TabSheetSelectedChangedEvent) {
    this.selectedTab = event.detail.value;
    if (event.detail.value === 3) {
      await this.simulationResultViewer.simulate(10000, this.simSettings);
    }
  }

  private async simulateButtonClicked() {
    await this.simulationResultViewer.simulate(10000, this.simSettings);
  }

  private async simulateLongButtonClicked() {
    await this.simulationResultViewer.simulate(100000, this.simSettings);
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

    if ('serviceWorker' in navigator) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      window.addEventListener('load', this.waitForServiceWorkerUpdate.bind(this));
    }
  }

  private openRefreshNotification() {
    this.refreshNotification.open(this.workbox, this.registration);
  }

  private async waitForServiceWorkerUpdate(): Promise<void> {
    this.workbox = new Workbox('./sw.js');
    this.workbox.addEventListener('waiting', this.openRefreshNotification.bind(this));
    this.registration = await this.workbox.register();
  }

  override render() {
    const teamListTemplate = html`<team-list
      .teamList=${this.seedOrder}
      .matchupTableCustomized=${this.matchupTableCustomized}
      @teamListChanged=${this.teamListChanged}
    ></team-list>`;

    const teamRatingsTemplate = html`<team-ratings
        .seedOrder=${this.seedOrder}
        .teamRating=${this.teamRating}
        .bo1Skew=${0.5}
        .matchupTableCustomized=${this.matchupTableCustomized}
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

    return html`
      <main>
        <refresh-notification></refresh-notification>
        ${this.isMobileView ? mobileLayoutTemplate : desktopLayoutTemplate}
      </main>
    `;
  }
}
