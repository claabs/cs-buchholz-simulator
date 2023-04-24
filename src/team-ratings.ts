import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@vaadin-component-factory/vcf-slider';
import '@vaadin/vertical-layout/theme/lumo/vaadin-vertical-layout.js';
import '@vaadin/horizontal-layout/theme/lumo/vaadin-horizontal-layout.js';
import '@vaadin/number-field/theme/lumo/vaadin-number-field';
import './matchup-cell.js';
import type { NumberFieldValueChangedEvent, NumberField } from '@vaadin/number-field';
import '@vaadin/form-layout';
import type { FormLayoutResponsiveStep } from '@vaadin/form-layout';
import { produce } from 'immer';
import type { ValueChangedEvent } from '@vaadin-component-factory/vcf-slider/out-tsc/src/vcf-slider.js';
import type { MatchupProbability } from './settings.js';

export interface IndexedMatchupProbability<T extends string> extends MatchupProbability<T> {
  index: number;
}

export interface TeamRatingDetails {
  teamRating: Record<string, number>;
  bo1Skew: number;
}

/**
 * @event {CustomEvent<Record<T, number>>} teamRatingValueChanged - Fired when the team rating value changes
 */
@customElement('team-ratings')
export class TeamRatings<T extends string> extends LitElement {
  @property({ type: Array })
  public seedOrder: T[] = [];

  @property({ type: Object })
  public teamRating: Record<T, number>;

  @property({ type: Number })
  public bo1Skew = 0.5;

  static override styles = css``;

  private onTeamRatingChanged(e: NumberFieldValueChangedEvent) {
    const teamName = (e.target as NumberField).getAttribute('teamName') as T;
    this.teamRating = produce<Record<string, number>>(this.teamRating, (teamRating) => {
      // eslint-disable-next-line no-param-reassign
      teamRating[teamName] = parseFloat(e.detail.value);
    });
    this.dispatchTeamRatingValueChanged();
  }

  private onBo1SkewValueChanged(e: ValueChangedEvent) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    this.bo1Skew = e.detail.value;
    this.dispatchTeamRatingValueChanged();
  }

  private dispatchTeamRatingValueChanged() {
    const options: CustomEventInit<TeamRatingDetails> = {
      detail: { teamRating: this.teamRating, bo1Skew: this.bo1Skew },
      bubbles: true,
      composed: true,
    };
    this.dispatchEvent(new CustomEvent<TeamRatingDetails>('teamRatingValueChanged', options));
  }

  private responsiveSteps: FormLayoutResponsiveStep[] = [
    // Use one column by default
    { minWidth: 0, columns: 2 },
    // Use two columns, if layout's width exceeds 500px
    { minWidth: '625px', columns: 4 },
    { minWidth: '1400px', columns: 8 },
  ];

  override render() {
    return html`
      <vaadin-form-layout .responsiveSteps=${this.responsiveSteps}>
        ${this.seedOrder.map(
          (teamName, index) => html` <vaadin-number-field
            id="rating-input-${index}"
            teamName="${teamName as string}"
            label="${index + 1}: ${teamName as string}"
            step-buttons-visible
            .value=${this.teamRating[teamName]}
            @value-changed=${this.onTeamRatingChanged}
            .min=${0}
          ></vaadin-number-field>`
        )}
      </vaadin-form-layout>
      <h3>Best of 1 skew toward 50/50</h3>
      <vcf-slider
        id="bo1-skew"
        min="0"
        max="1"
        step="0.05"
        tooltips-always-visible
        value="${this.bo1Skew}"
        @value-changed=${this.onBo1SkewValueChanged}
      ></vcf-slider>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'team-ratings': TeamRatings<string>;
  }
}
