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
import '@vaadin/split-layout/theme/lumo/vaadin-split-layout';
import '@vaadin/button/theme/lumo/vaadin-button.js';
import '@vaadin/horizontal-layout/theme/lumo/vaadin-horizontal-layout.js';
import type { SimulationResultViewer } from './simulation-result-viewer.js';
import type { TeamRatingsChart } from './team-ratings-chart.js';

@customElement('cs-buchholz-simulator')
export class CsBuchholzSimulato extends LitElement {
  @state()
  private teamRating: Record<string, number> = rmrEuARating as Record<string, number>;

  @state()
  private matchupProbabilities: MatchupProbability<string>[] = generateEasyProbabilities(
    this.teamRating
  );

  @state()
  private isMobileView: boolean;

  private seeding: Record<string, string> = rmrEuASeeding as Record<string, string>;

  private seedOrder = getSeedOrder(this.seeding);

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

  private teamRatingValueChanged(event: CustomEvent<Record<string, number>>) {
    this.teamRating = event.detail;
    this.matchupProbabilities = generateEasyProbabilities(this.teamRating);
  }

  private probabilityValueChanged(event: CustomEvent<MatchupProbability<string>[]>) {
    this.matchupProbabilities = event.detail;
  }

  private selectedTabChanged(event: TabSheetSelectedChangedEvent) {
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
    const teamRatingsTemplate = html`<team-ratings
        .seedOrder=${this.seedOrder}
        .teamRating=${this.teamRating}
        @teamRatingValueChanged=${this.teamRatingValueChanged}
      ></team-ratings>
      <team-ratings-chart .teamRating=${this.teamRating}></team-ratings-chart>`;

    const matchupTableTemplate = html` <matchup-table
      .seedOrder=${this.seedOrder}
      .matchupProbabilities=${this.matchupProbabilities}
      @probabilityValueChanged=${this.probabilityValueChanged}
    ></matchup-table>`;

    const simulationResultViewerTemplate = html`<simulation-result-viewer
      .seeding=${this.seeding}
      .matchupProbabilities=${this.matchupProbabilities}
    ></simulation-result-viewer>`;

    const mobileLayoutTemplate = html`<vaadin-tabsheet @selected-changed=${this.selectedTabChanged}>
      <vaadin-tabs slot="tabs">
        <vaadin-tab id="ratings-tab">Ratings</vaadin-tab>
        <vaadin-tab id="matchups-tab">Matchups</vaadin-tab>
        <vaadin-tab id="results-tab">Results</vaadin-tab>
      </vaadin-tabs>

      <div tab="ratings-tab">${teamRatingsTemplate}</div>
      <div tab="matchups-tab">${matchupTableTemplate}</div>
      <div tab="results-tab">${simulationResultViewerTemplate}</div>
    </vaadin-tabsheet>`;

    const desktopLayoutTemplate = html`<vaadin-split-layout
      @splitter-dragend=${this.splitterDragEnd}
    >
      <master-content style="width: 70%;">
        ${teamRatingsTemplate} ${matchupTableTemplate}
      </master-content>
      <detail-content style="width: 30%;">
        <vaadin-horizontal-layout theme="padding" style="justify-content: space-evenly">
          <vaadin-button theme="primary" @click=${this.simulateButtonClicked}
            >Simulate</vaadin-button
          >
          <vaadin-button theme="primary" @click=${this.simulateLongButtonClicked}
            >Simulate (Long)</vaadin-button
          >
        </vaadin-horizontal-layout>
        ${simulationResultViewerTemplate}
      </detail-content>
    </vaadin-split-layout>`;

    return html` <main>${this.isMobileView ? mobileLayoutTemplate : desktopLayoutTemplate}</main> `;
  }
}
