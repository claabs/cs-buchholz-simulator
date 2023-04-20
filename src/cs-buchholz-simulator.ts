import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import '@vaadin/grid/theme/material/vaadin-grid.js';
import { rmrEuARating, rmrEuASeeding } from './settings.js';
import { generateEasyProbabilities, getSeedOrder } from '.';
import './matchup-table.js';
import './team-ratings.js';

@customElement('cs-buchholz-simulator')
export class CsBuchholzSimulator extends LitElement {
  @property({ type: String }) header = 'My app';

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

  private matchupProbabilities = generateEasyProbabilities(rmrEuARating);

  override render() {
    return html`
      <main>
        <h1>${this.header}</h1>

        <team-ratings .seedOrder=${this.seedOrder} .teamRating=${rmrEuARating}></team-ratings>
        <matchup-table
          .seedOrder=${this.seedOrder}
          .matchupProbabilities=${this.matchupProbabilities}
        ></matchup-table>
      </main>
    `;
  }
}
