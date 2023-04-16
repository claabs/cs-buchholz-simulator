import { LitElement, PropertyValueMap, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@vaadin/grid/theme/material/vaadin-grid.js';
import type { GridBodyRenderer } from '@vaadin/grid';
import type { MatchupProbability } from './settings.js';

interface MatchupGridRowCell {
  bo1TeamAWinrate: number;
  bo3TeamAWinrate: number;
}

const matchupProbabilitiesToGridItems = <T extends string>(
  matchupProbabilities: MatchupProbability<T>[],
  seedOrder: T[]
): (MatchupGridRowCell | undefined)[][] => {
  return seedOrder.map((rowTeamName, rowIndex) => {
    // Get all the matchups associated with the team (for performance?)
    const teamMatchupsProbabilities = matchupProbabilities.filter((prob) =>
      [prob.teamA, prob.teamB].includes(rowTeamName)
    );
    const opposingTeams = seedOrder.map((opposingTeam, colIndex) =>
      colIndex <= rowIndex ? undefined : opposingTeam
    );
    return opposingTeams.map((opposingTeamName) => {
      if (!opposingTeamName) return undefined;
      const matchup = teamMatchupsProbabilities.find((prob) =>
        [prob.teamA, prob.teamB].includes(opposingTeamName)
      );
      return {
        bo1TeamAWinrate: matchup?.bo1TeamAWinrate || 0,
        bo3TeamAWinrate: matchup?.bo3TeamAWinrate || 0,
      };
    });
  });
};

@customElement('matchup-table')
export class MatchupTable<T extends string> extends LitElement {
  @property({ type: Array, reflect: true })
  public seedOrder: T[] = [];

  @property({ type: Array, reflect: true })
  public matchupProbabilities: MatchupProbability<T>[] = [];

  @state()
  private gridItems: (MatchupGridRowCell | undefined)[][] = [];

  protected override updated(changedProperties: PropertyValueMap<this>): void {
    if (changedProperties.has('matchupProbabilities') || changedProperties.has('seedOrder')) {
      this.gridItems = matchupProbabilitiesToGridItems(this.matchupProbabilities, this.seedOrder);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private matchupRowRenderer: GridBodyRenderer<MatchupGridRowCell[]> = (root, column, model) => {
    // eslint-disable-next-line no-param-reassign
    root.textContent = `${
      model.item[parseInt(column.getAttribute('index') || '-1', 10)]?.bo3TeamAWinrate.toFixed(2) ||
      ''
    }`;
  };

  private headerColumnRenderer: GridBodyRenderer<string[]> = (root, _column, model) => {
    // eslint-disable-next-line no-param-reassign
    root.textContent = `${this.seedOrder[model.index] || 'error'}`;
    root.part.add('header-cell');
  };

  override render() {
    return html` <vaadin-grid .items=${this.gridItems}>
      <vaadin-grid-column
        id="header"
        width="2em"
        flex-grow="2"
        .renderer=${this.headerColumnRenderer}
      ></vaadin-grid-column>
      ${this.seedOrder.map(
        (teamName, index) =>
          html`<vaadin-grid-column
            id=${`col-${teamName}`}
            width="2em"
            flex-grow="2"
            header=${teamName as string}
            index=${index}
            .renderer=${this.matchupRowRenderer}
          ></vaadin-grid-column>`
      )}
    </vaadin-grid>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'matchup-table': MatchupTable<string>;
  }
}
