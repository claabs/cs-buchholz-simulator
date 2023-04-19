/* eslint-disable @typescript-eslint/unbound-method */
import { LitElement, PropertyValueMap, html, css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import '@vaadin/vertical-layout/theme/lumo/vaadin-vertical-layout.js';
import '@vaadin/horizontal-layout/theme/lumo/vaadin-horizontal-layout.js';
import type { DialogOpenedChangedEvent } from '@vaadin/dialog';
import { dialogRenderer, DialogLitRenderer, dialogFooterRenderer } from '@vaadin/dialog/lit.js';
import '@vaadin/dialog/theme/lumo/vaadin-dialog.js';
import '@vaadin/button/theme/lumo/vaadin-button.js';
import '@vaadin-component-factory/vcf-slider';
import type { ValueChangedEvent } from '@vaadin-component-factory/vcf-slider/out-tsc/src/vcf-slider';
import ColorScale from 'color-scales';
import type { IndexedMatchupProbability } from './matchup-table';

export type MatchupCellData = Omit<IndexedMatchupProbability<string>, 'teamA' | 'teamB'>;

// 'lightcoral', 'white', 'lightskyblue'
const gradient = new ColorScale(0, 100, ['#F08080', '#FFFFFF', '#87CEFA']);

const percentToColor = (perc: number): string => {
  return gradient.getColor(perc).toHexString();
};

/**
 * @event {CustomEvent<MatchupCellData>} matchupValueChanged - Fired when the matchup winrate(s) change
 */
@customElement('matchup-cell')
export class MatchupCell extends LitElement {
  @property({ type: String })
  public teamA: string;

  @property({ type: String })
  public teamB: string;

  @property({ type: Number })
  public bo1TeamAWinrate: number;

  @property({ type: Number })
  public bo3TeamAWinrate: number;

  @property({ type: Number })
  public matchupIndex: number;

  @query('#bo1')
  private bo1: HTMLDivElement | undefined;

  @query('#bo3')
  private bo3: HTMLDivElement | undefined;

  @state()
  private dialogOpened: boolean;

  private dialogData: Partial<MatchupCellData> = {};

  static override styles = css`
    /* :host {
      min-height: 100vh;
    } */
    .winrate {
      height: 50%;
    }
  `;

  override updated(changedProperties: PropertyValueMap<this>): void {
    if (changedProperties.has('bo1TeamAWinrate') && this.bo1)
      this.bo1.style.backgroundColor = percentToColor(this.bo1TeamAWinrate);
    if (changedProperties.has('bo3TeamAWinrate') && this.bo3)
      this.bo3.style.backgroundColor = percentToColor(this.bo3TeamAWinrate);
  }

  private renderDialog: DialogLitRenderer = () => {
    return html`
      <vaadin-horizontal-layout
        theme="spacing"
        style="justify-content: space-between; align-items: baseline;"
      >
        <h2>${this.teamA}</h2>
        defeats
        <h2>${this.teamB}</h2>
      </vaadin-horizontal-layout>
      <vaadin-vertical-layout style="align-items: stretch; width: 18rem; max-width: 100%;">
        <vcf-slider
          id="bo3-slider"
          title="Best of 1"
          min="0"
          max="100"
          tooltips-always-visible
          value=${this.bo1TeamAWinrate}
          @value-changed=${(e: ValueChangedEvent) => {
            this.dialogData.bo1TeamAWinrate = e.detail.value;
          }}
        ></vcf-slider>
        <vcf-slider
          id="bo3-slider"
          title="Best of 3"
          min="0"
          max="100"
          tooltips-always-visible
          value=${this.bo3TeamAWinrate}
          @value-changed=${(e: ValueChangedEvent) => {
            this.dialogData.bo3TeamAWinrate = e.detail.value;
          }}
        ></vcf-slider>
      </vaadin-vertical-layout>
    `;
  };

  private openDialog() {
    this.dialogOpened = true;
  }

  private saveDialog() {
    if (this.dialogData.bo1TeamAWinrate !== undefined) {
      this.bo1TeamAWinrate = this.dialogData.bo1TeamAWinrate;
    }
    if (this.dialogData.bo3TeamAWinrate !== undefined) {
      this.bo3TeamAWinrate = this.dialogData.bo3TeamAWinrate;
    }
    this.closeDialog();
    this.dispatchMatchupValueChanged();
  }

  private closeDialog() {
    this.dialogOpened = false;
    this.dialogData = {};
  }

  private renderDialogFooter: DialogLitRenderer = () => {
    return html`
      <vaadin-button theme="primary" @click=${this.saveDialog} style="margin-right: auto;">
        Save
      </vaadin-button>
      <vaadin-button theme="tertiary" @click="${this.closeDialog}">Cancel</vaadin-button>
    `;
  };

  private dispatchMatchupValueChanged() {
    if (this.bo1TeamAWinrate || this.bo3TeamAWinrate) {
      const options: CustomEventInit<MatchupCellData> = {
        detail: {
          bo1TeamAWinrate: this.bo1TeamAWinrate,
          bo3TeamAWinrate: this.bo3TeamAWinrate,
          index: this.matchupIndex,
        },
        bubbles: true,
        composed: true,
      };
      this.dispatchEvent(new CustomEvent<MatchupCellData>('matchupValueChanged', options));
    }
  }

  override render() {
    return html` <vaadin-dialog
        header-title="Matchup Outcome"
        .opened="${this.dialogOpened}"
        @opened-changed="${(event: DialogOpenedChangedEvent) => {
          this.dialogOpened = event.detail.value;
        }}"
        ${dialogRenderer(this.renderDialog, [])}
        ${dialogFooterRenderer(this.renderDialogFooter, [])}
      ></vaadin-dialog>

      <vaadin-vertical-layout
        theme="spacing-xs"
        style="align-items: stretch"
        @click=${this.openDialog}
      >
        <div class="winrate" id="bo1">${this.bo1TeamAWinrate.toFixed(0)}</div>
        <div class="winrate" id="bo3">${this.bo3TeamAWinrate.toFixed(0)}</div>
      </vaadin-vertical-layout>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'matchup-cell': MatchupCell;
  }
}
