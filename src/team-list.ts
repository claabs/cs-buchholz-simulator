import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { produce } from 'immer';
import { columnBodyRenderer, GridColumnBodyLitRenderer } from '@vaadin/grid/lit.js';
import type { GridDragStartEvent, GridDropEvent } from '@vaadin/grid';
import type { TextFieldChangeEvent } from '@vaadin/text-field';
import type { SelectItem, SelectValueChangedEvent } from '@vaadin/select';
import '@vaadin/grid/theme/lumo/vaadin-grid.js';
import '@vaadin/select/theme/lumo/vaadin-select.js';
import '@vaadin/text-field/theme/lumo/vaadin-text-field.js';
import { presetTeamLists } from './settings.js';

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

  static override styles = css``;

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

  private onTeamNameChange(e: TextFieldChangeEvent) {
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
    return html`<vaadin-text-field
      aria-label="Team Name ${model.index + 1}"
      value="${item}"
      index="${model.index}"
      @change=${this.onTeamNameChange}
    >
    </vaadin-text-field>`;
  };

  override render() {
    return html`
      <vaadin-select
        label="Team List"
        .items="${this.presetListNames}"
        .value="${this.presetListValue}"
        @value-changed=${this.onListPresetChange}
      ></vaadin-select>
      <vaadin-horizontal-layout style="align-items: baseline" theme="spacing-s">
        <vaadin-grid
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
            ${columnBodyRenderer(this.seedColumnRenderer)}
          ></vaadin-grid-column>
          <vaadin-grid-column
            path="teamName"
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
