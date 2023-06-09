import { LitElement, PropertyValueMap, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { columnBodyRenderer, GridColumnBodyLitRenderer } from '@vaadin/grid/lit.js';
import type { GridCellPartNameGenerator } from '@vaadin/grid';
import '@vaadin/grid/theme/lumo/vaadin-grid.js';
import '@vaadin/horizontal-layout/theme/lumo/vaadin-horizontal-layout.js';
import '@vaadin/tooltip/theme/lumo/vaadin-tooltip';
import '@vaadin/icon';
import '@vaadin/icons';
import type { MatchupProbability } from './settings.js';
import type { MatchupCellData } from './matchup-cell.js';
import './matchup-cell.js';

export interface IndexedMatchupProbability<T extends string> extends MatchupProbability<T> {
  index: number;
}

const matchupProbabilitiesToGridItems = <T extends string>(
  matchupProbabilities: MatchupProbability<T>[],
  seedOrder: T[]
): (IndexedMatchupProbability<T> | undefined)[][] => {
  // Index matchups so we can quickly update them when cells are updated
  const indexedMatchupProbabilities: IndexedMatchupProbability<T>[] = matchupProbabilities.map(
    (prob, index) => ({ ...prob, index })
  );
  return seedOrder.map((rowTeamName, rowIndex) => {
    // Get all the matchups associated with the team (for performance?)
    const teamMatchupsProbabilities = indexedMatchupProbabilities.filter((prob) =>
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
        teamA: matchup?.teamA || ('Team A' as T),
        teamB: matchup?.teamB || ('Team B' as T),
        bo1TeamAWinrate: matchup?.bo1TeamAWinrate || 0,
        bo3TeamAWinrate: matchup?.bo3TeamAWinrate || 0,
        index: matchup?.index || -1,
      };
    });
  });
};

@customElement('matchup-table')
export class MatchupTable<T extends string> extends LitElement {
  @property({
    type: Array,
  })
  public seedOrder: T[] = [];

  @property({
    type: Array,
  })
  public matchupProbabilities: MatchupProbability<T>[] = [];

  @state()
  private gridItems: (MatchupCellData | undefined)[][] = [];

  @state()
  private tableHelpTooltipOpened = false;

  static override styles = css`
    vaadin-grid-cell-content {
      padding: var(--lumo-space-xs);
      text-overflow: clip;
    }

    @media (max-width: 640px) {
      vaadin-grid::part(header-cell) {
        writing-mode: vertical-rl;
        text-orientation: mixed;
      }
    }

    vaadin-grid::part(first-column-cell) {
      writing-mode: horizontal-tb;
      text-orientation: mixed;
    }
  `;

  protected override updated(changedProperties: PropertyValueMap<this>): void {
    if (changedProperties.has('matchupProbabilities') || changedProperties.has('seedOrder')) {
      this.gridItems = matchupProbabilitiesToGridItems(this.matchupProbabilities, this.seedOrder);
    }
  }

  private matchupRowRenderer: GridColumnBodyLitRenderer<IndexedMatchupProbability<T>[]> = (
    item,
    _model,
    column
  ) => {
    const matchup = item[parseInt(column.getAttribute('index') || '-1', 10)];
    if (!matchup) return html``;

    return html`<matchup-cell
      .bo1TeamAWinrate=${matchup.bo1TeamAWinrate}
      .bo3TeamAWinrate=${matchup.bo3TeamAWinrate}
      .matchupIndex=${matchup.index}
      teamA="${matchup.teamA as string}"
      teamB="${matchup.teamB as string}"
    ></matchup-cell>`;
  };

  private headerColumnRenderer: GridColumnBodyLitRenderer<IndexedMatchupProbability<T>[]> = (
    _items,
    model
  ) => {
    return html`${this.seedOrder[model.index] || 'error'}`;
  };

  private cellPartNameGenerator: GridCellPartNameGenerator<IndexedMatchupProbability<T>[]> = (
    column
  ) => {
    if (column.id === 'col-header') return 'header-cell';
    return '';
  };

  private onMatchupValueChanged(e: CustomEvent<MatchupCellData>) {
    const prob = this.matchupProbabilities[e.detail.index];
    if (prob) {
      prob.bo1TeamAWinrate = e.detail.bo1TeamAWinrate;
      prob.bo3TeamAWinrate = e.detail.bo3TeamAWinrate;
    }
    this.dispatchProbabilityValueChanged();
  }

  private dispatchProbabilityValueChanged() {
    const options: CustomEventInit<MatchupProbability<T>[]> = {
      detail: this.matchupProbabilities,
      bubbles: true,
      composed: true,
    };
    this.dispatchEvent(
      new CustomEvent<MatchupProbability<T>[]>('probabilityValueChanged', options)
    );
  }

  override render() {
    return html`<vaadin-horizontal-layout style="align-items: baseline" theme="spacing-s">
        <h3>Adjust matchup odds</h3>
        <vaadin-tooltip
          for="table-help-icon"
          text="The table cells can be edited to fine tune any matchup odds. The values are the win percentage for the team in the row; with the top being best-of-1 and bottom being best-of-3. After editing any cells, careful adjusting the rating scores as your custom cell data can be overwritten."
          manual
          .opened="${this.tableHelpTooltipOpened}"
        ></vaadin-tooltip>
        <vaadin-icon
          id="table-help-icon"
          icon="vaadin:question-circle"
          @click="${() => {
            this.tableHelpTooltipOpened = !this.tableHelpTooltipOpened;
          }}"
        ></vaadin-icon>
      </vaadin-horizontal-layout>
      <vaadin-grid
        all-rows-visible
        theme="wrap-cell-content column-borders"
        .items=${this.gridItems}
        .cellPartNameGenerator=${this.cellPartNameGenerator}
        @matchupValueChanged=${this.onMatchupValueChanged}
      >
        <vaadin-grid-column
          id="col-header"
          width="2rem"
          flex-grow="2"
          header="BO1 / BO3"
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
