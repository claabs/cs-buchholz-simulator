import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { produce } from 'immer';
import { columnBodyRenderer, GridColumnBodyLitRenderer } from '@vaadin/grid/lit.js';
import type { GridDragStartEvent, GridDropEvent } from '@vaadin/grid';
import type { ComboBoxChangeEvent } from '@vaadin/combo-box';
import type { SelectItem, SelectValueChangedEvent } from '@vaadin/select';
import '@vaadin/grid/theme/lumo/vaadin-grid.js';
import '@vaadin/select/theme/lumo/vaadin-select.js';
import '@vaadin/combo-box/theme/lumo/vaadin-combo-box.js';
import '@vaadin/horizontal-layout/theme/lumo/vaadin-horizontal-layout.js';
import '@vaadin/number-field/theme/lumo/vaadin-number-field';
import '@vaadin/icon';
import '@vaadin/icons';
import '@vaadin/form-layout';
import type { NumberFieldValueChangedEvent } from '@vaadin/number-field';
import { eventPresets } from './settings.js';
import masterRating from './hltv-team-points.js';

export interface TeamListSettings {
  teamList: string[];
  winsForQuali: number;
  lossesForElim: number;
}

const allTeamNames = Object.entries(masterRating)
  .sort((a, b) => {
    return b[1] - a[1];
  })
  .map(([team]) => team);

/**
 * @event {CustomEvent<TeamListSettings>} teamListChanged - Fired when the team list changes
 */
@customElement('team-list')
export class TeamList extends LitElement {
  @property({ type: Array })
  public teamList: string[] = [];

  @property({ type: Boolean })
  public matchupTableCustomized = false;

  private draggedItem: string | undefined;

  @state()
  private presetListNames: SelectItem[] = Object.keys(eventPresets).map((name) => ({
    label: name,
    value: name,
    disabled: name === 'Custom',
  }));

  @state()
  private presetListValue: string | undefined = this.presetListNames[0]?.value;

  @state()
  private winsForQuali = 3;

  @state()
  private lossesForElim = 3;

  @state()
  private seedingPending = false;

  static override styles = css`
    .list-presets {
      width: 350px;
    }
    .team-list {
      max-width: 448px;
      width: 300px;
    }
    .alert {
      color: var(--lumo-error-text-color);
    }
    .warning {
      color: #a33c00;
    }
    .count-setting {
      max-width: 300px;
    }
    .help {
      background-color: var(--lumo-contrast-5pct);
      border-radius: var(--lumo-border-radius-m);
      padding: var(--lumo-space-xs) var(--lumo-space-s);
    }
    .trim-header {
      margin-block-end: 0;
    }
  `;

  private dispatchTeamListChanged() {
    const options: CustomEventInit<TeamListSettings> = {
      detail: {
        teamList: this.teamList,
        winsForQuali: this.winsForQuali,
        lossesForElim: this.lossesForElim,
      },
      bubbles: true,
      composed: true,
    };
    this.dispatchEvent(new CustomEvent<TeamListSettings>('teamListChanged', options));
  }

  private onDragStart(e: GridDragStartEvent<string>) {
    [this.draggedItem] = e.detail.draggedItems;
  }

  private onDragEnd() {
    delete this.draggedItem;
  }

  private onDrop(e: GridDropEvent<string>) {
    const { dropTargetItem, dropLocation } = e.detail;
    // Only act when dropping on another item
    if (this.draggedItem && dropTargetItem !== this.draggedItem) {
      this.teamList = produce<string[], [string]>((teamList, draggedItem) => {
        // Remove the item from its previous position
        const draggedItemIndex = teamList.indexOf(draggedItem);
        teamList.splice(draggedItemIndex, 1);
        // Re-insert the item at its new position
        const dropIndex = teamList.indexOf(dropTargetItem) + (dropLocation === 'below' ? 1 : 0);
        teamList.splice(dropIndex, 0, draggedItem);
      })(this.teamList, this.draggedItem);
      this.presetListValue = 'Custom';
      this.dispatchTeamListChanged();
    }
  }

  private onListPresetChange(e: SelectValueChangedEvent) {
    this.presetListValue = e.detail.value;
    if (this.presetListValue === 'Custom') return;
    const eventPreset = eventPresets[this.presetListValue];
    if (eventPreset) {
      this.teamList = produce<string[]>(eventPreset.teamList, (teamList) => teamList);
      this.winsForQuali = eventPreset.winsForQuali ?? 3;
      this.lossesForElim = eventPreset.lossesForElim ?? 3;
      this.seedingPending = eventPreset.seedingPending ?? false;
    }
    this.dispatchTeamListChanged();
  }

  private onTeamNameChange(e: ComboBoxChangeEvent<string>) {
    const indexString = e.target.getAttribute('index');
    if (!indexString) return;
    const index = parseInt(indexString, 10);
    this.teamList = produce<string[]>(this.teamList, (teamList) => {
      // eslint-disable-next-line no-param-reassign
      teamList[index] = e.target.value;
    });
    this.presetListValue = 'Custom';
    this.dispatchTeamListChanged();
  }

  private onWinCountChange(e: NumberFieldValueChangedEvent) {
    const value = parseInt(e.detail.value, 10);
    if (value !== this.winsForQuali) {
      this.winsForQuali = value;
      this.presetListValue = 'Custom';
      this.dispatchTeamListChanged();
    }
  }

  private onLossCountChange(e: NumberFieldValueChangedEvent) {
    const value = parseInt(e.detail.value, 10);
    if (value !== this.lossesForElim) {
      this.lossesForElim = value;
      this.presetListValue = 'Custom';
      this.dispatchTeamListChanged();
    }
  }

  private seedColumnRenderer: GridColumnBodyLitRenderer<string> = (_item, model) => {
    return html`${model.index + 1}`;
  };

  private teamNameColumnRenderer: GridColumnBodyLitRenderer<string> = (item, model) => {
    return html`<vaadin-combo-box
      aria-label="Team Name ${model.index + 1}"
      allow-custom-value
      value="${item}"
      index="${model.index}"
      @change=${this.onTeamNameChange}
      .items="${allTeamNames}"
    >
    </vaadin-combo-box>`;
  };

  override render() {
    return html`
      <h3 class="trim-header">Adjust team list or seeding</h3>
      <vaadin-details>
        <vaadin-details-summary slot="summary">
          <vaadin-icon id="sim-help-icon" icon="vaadin:question-circle"></vaadin-icon>
        </vaadin-details-summary>
        <div class="help">
          Select a preset team list for an event, or customize the names and drag-and-drop to adjust
          seeding. If the event has different number of losses for elimination (e.g. Americas RMR),
          you can adjust that setting.
        </div>
      </vaadin-details>
      ${this.matchupTableCustomized
        ? html`<h4 class="alert trim-header">
            Any changes here will undo your matchup table customizations!
          </h4>`
        : ''}
      <vaadin-form-layout
        .responsiveSteps=${[
          // Use one column by default
          { minWidth: 0, columns: 1 },
          // Use two columns, if layout's width exceeds 500px
          { minWidth: '625px', columns: 3 },
        ]}
      >
        <vaadin-select
          class="list-presets"
          label="Team list presets"
          .items="${this.presetListNames}"
          .value="${this.presetListValue}"
          @value-changed=${this.onListPresetChange}
        ></vaadin-select>
        <vaadin-number-field
          id="qualify-wins"
          class="count-setting"
          label="Wins for qualification"
          step-buttons-visible
          .value=${this.winsForQuali}
          @value-changed=${this.onWinCountChange}
          .min=${1}
          .max=${3}
        ></vaadin-number-field>
        <vaadin-number-field
          id="eliminate-losses"
          class="count-setting"
          label="Losses for elimination"
          step-buttons-visible
          .value=${this.lossesForElim}
          @value-changed=${this.onLossCountChange}
          .min=${1}
          .max=${3}
        ></vaadin-number-field>
      </vaadin-form-layout>
      ${this.seedingPending
        ? html`<h4 class="warning">
            Warning: Official seeding for this event is not available yet!
          </h4>`
        : ''}
      <vaadin-horizontal-layout style="align-items: baseline" theme="spacing-s">
        <vaadin-grid
          class="team-list"
          all-rows-visible
          theme="wrap-cell-content column-borders"
          rows-draggable
          drop-mode="between"
          .items=${this.teamList}
          @grid-dragstart=${this.onDragStart}
          @grid-dragend=${this.onDragEnd}
          @grid-drop=${this.onDrop}
        >
          <vaadin-grid-column
            path="seed"
            auto-width
            flex-grow="0"
            ${columnBodyRenderer(this.seedColumnRenderer)}
          ></vaadin-grid-column>
          <vaadin-grid-column
            path="teamName"
            auto-width
            flex-grow="0"
            ${columnBodyRenderer(this.teamNameColumnRenderer)}
          ></vaadin-grid-column>
        </vaadin-grid>
      </vaadin-horizontal-layout>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'team-list': TeamList;
  }
}
