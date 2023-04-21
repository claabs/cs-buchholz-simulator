import { LitElement, html, css } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import '@vaadin/grid/theme/material/vaadin-grid.js';
import { MatchupProbability, rmrEuARating, rmrEuASeeding } from './settings.js';
import { generateEasyProbabilities, getSeedOrder } from './index.js';
import './matchup-table.js';
import './team-ratings.js';
import './team-ratings-chart.js';

@customElement('cs-buchholz-simulator')
export class CsBuchholzSimulator<T extends string> extends LitElement {
  @property({ type: String }) header = 'My app';

  @state()
  private teamRating: Record<T, number> = rmrEuARating as Record<T, number>;

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

    .logo {
      margin-top: 36px;
      animation: app-logo-spin infinite 20s linear;
    }

    .app-footer {
      font-size: calc(12px + 0.5vmin);
      align-items: center;
    }

    .app-footer a {
      margin-left: 5px;
    }
  `;

  private seedOrder = getSeedOrder(rmrEuASeeding);

  @state()
  private matchupProbabilities: MatchupProbability<T>[] = generateEasyProbabilities(
    this.teamRating
  );

  private teamRatingValueChanged(event: CustomEvent<Record<T, number>>) {
    this.teamRating = event.detail;
    this.matchupProbabilities = generateEasyProbabilities(this.teamRating);
  }

  override render() {
    return html`
      <main>
        <h1>${this.header}</h1>

        <team-ratings
          .seedOrder=${this.seedOrder}
          .teamRating=${this.teamRating}
          @teamRatingValueChanged=${this.teamRatingValueChanged}
        ></team-ratings>
        <team-ratings-chart .teamRating=${this.teamRating}></team-ratings-chart>
        <matchup-table
          .seedOrder=${this.seedOrder}
          .matchupProbabilities=${this.matchupProbabilities}
        ></matchup-table>
      </main>
    `;
  }
}
