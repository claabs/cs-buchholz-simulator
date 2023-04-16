/* eslint-disable no-param-reassign */
import { LitElement, PropertyValueMap, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@vaadin/grid/theme/lumo/vaadin-grid.js';
import type { GridCellPartNameGenerator } from '@vaadin/grid';
import { columnBodyRenderer, GridColumnBodyLitRenderer } from '@vaadin/grid/lit.js';
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

  private matchupRowRenderer: GridColumnBodyLitRenderer<MatchupGridRowCell[]> = (
    item,
    _model,
    column
  ) => {
    const matchup = item[parseInt(column.getAttribute('index') || '-1', 10)];
    if (!matchup) return html``;

    return html`<span>${(matchup.bo1TeamAWinrate * 100).toFixed(0)}</span>
      <br />
      <span> ${(matchup.bo3TeamAWinrate * 100).toFixed(0)}</span>`;
  };

  private headerColumnRenderer: GridColumnBodyLitRenderer<MatchupGridRowCell[]> = (
    _items,
    model
  ) => {
    return html`${this.seedOrder[model.index] || 'error'}`;
  };

  private cellPartNameGenerator: GridCellPartNameGenerator<MatchupGridRowCell[]> = (column) => {
    if (column.id === 'col-header') return 'header-cell';
    return '';
  };

  override render() {
    return html` <vaadin-grid
      theme="wrap-cell-content column-borders"
      .items=${this.gridItems}
      .cellPartNameGenerator=${this.cellPartNameGenerator}
    >
      <vaadin-grid-column
        id="col-header"
        width="2rem"
        flex-grow="2"
        header="Team Name"
        frozen
        ${columnBodyRenderer(this.headerColumnRenderer)}
      ></vaadin-grid-column>
      ${this.seedOrder.map(
        (teamName, index) =>
          html`<vaadin-grid-column
            id=${`col-${teamName}`}
            width="2rem"
            flex-grow="2"
            header=${teamName as string}
            index=${index}
            text-align="center"
            ${columnBodyRenderer(this.matchupRowRenderer)}
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
