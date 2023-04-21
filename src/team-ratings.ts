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
import type { MatchupProbability } from './settings.js';

export interface IndexedMatchupProbability<T extends string> extends MatchupProbability<T> {
  index: number;
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

  static override styles = css``;

  private onTeamRatingChanged(e: NumberFieldValueChangedEvent) {
    const teamName = (e.target as NumberField).getAttribute('teamName') as T;
    this.teamRating = produce<Record<string, number>>(this.teamRating, (teamRating) => {
      // eslint-disable-next-line no-param-reassign
      teamRating[teamName] = parseFloat(e.detail.value);
    });
    this.dispatchTeamRatingValueChanged();
  }

  private dispatchTeamRatingValueChanged() {
    const options: CustomEventInit<Record<T, number>> = {
      detail: this.teamRating,
      bubbles: true,
      composed: true,
    };
    this.dispatchEvent(new CustomEvent<Record<T, number>>('teamRatingValueChanged', options));
  }

  private responsiveSteps: FormLayoutResponsiveStep[] = [
    // Use one column by default
    { minWidth: 0, columns: 2 },
    // Use two columns, if layout's width exceeds 500px
    { minWidth: '500px', columns: 4 },
  ];

  override render() {
    return html`
      <vaadin-form-layout .responsiveSteps=${this.responsiveSteps}>
        ${this.seedOrder.map(
          (teamName, index) => html` <vaadin-number-field
            id="rating-slider-${index}"
            teamName="${teamName as string}"
            label="${index + 1}: ${teamName as string}"
            step-buttons-visible
            .value=${this.teamRating[teamName]}
            @value-changed=${this.onTeamRatingChanged}
            .min=${0}
          ></vaadin-number-field>`
        )}
      </vaadin-form-layout>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'team-ratings': TeamRatings<string>;
  }
}
