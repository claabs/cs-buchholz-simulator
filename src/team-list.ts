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
import '@vaadin/tooltip/theme/lumo/vaadin-tooltip';
import '@vaadin/icon';
import '@vaadin/icons';
import { presetTeamLists } from './settings.js';
import masterRating from './hltv-team-points.js';

const allTeamNames = Object.entries(masterRating)
  .sort((a, b) => {
    return b[1] - a[1];
  })
  .map(([team]) => team);

/**
 * @event {CustomEvent<string[]>} teamListChanged - Fired when the team list changes
 */
@customElement('team-list')
export class TeamList extends LitElement {
  @property({ type: Array })
  public teamList: string[] = [];

  private draggedItem: string | undefined;

  @state()
  private presetListNames: SelectItem[] = Object.keys(presetTeamLists).map((name) => ({
    label: name,
    value: name,
    disabled: name === 'Custom',
  }));

  @state()
  private presetListValue: string | undefined = this.presetListNames[0]?.value;

  @state()
  private teamListHelpTooltipOpened = false;

  static override styles = css`
    .list-presets {
      width: 30em;
    }
    .team-list {
      max-width: 448px;
      width: 300px;
    }
  `;

  private dispatchTeamListChanged() {
    const options: CustomEventInit<string[]> = {
      detail: this.teamList,
      bubbles: true,
      composed: true,
    };
    this.dispatchEvent(new CustomEvent<string[]>('teamListChanged', options));
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
    const presetList = presetTeamLists[this.presetListValue];
    if (presetList) {
      this.teamList = produce<string[]>(this.teamList, (teamList) => {
        // eslint-disable-next-line no-param-reassign
        teamList = presetList;
        return teamList;
      });
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
    this.dispatchTeamListChanged();
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
      <vaadin-horizontal-layout style="align-items: baseline" theme="spacing-s">
        <h3>Adjust team list or seeding</h3>
        <vaadin-tooltip
          for="rating-help-icon"
          text="Select a preset team list for an event, or customize the names and drag-and-drop to adjust seeding."
          manual
          .opened="${this.teamListHelpTooltipOpened}"
        ></vaadin-tooltip>
        <vaadin-icon
          id="rating-help-icon"
          icon="vaadin:question-circle"
          @click="${() => {
            this.teamListHelpTooltipOpened = !this.teamListHelpTooltipOpened;
          }}"
        ></vaadin-icon>
      </vaadin-horizontal-layout>
      <vaadin-select
        class="list-presets"
        label="Team list presets"
        .items="${this.presetListNames}"
        .value="${this.presetListValue}"
        @value-changed=${this.onListPresetChange}
      ></vaadin-select>
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
