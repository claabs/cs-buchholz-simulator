import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { produce } from 'immer';
import type { NumberFieldValueChangedEvent, NumberField } from '@vaadin/number-field';
import type { FormLayoutResponsiveStep } from '@vaadin/form-layout';
import type { ValueChangedEvent } from '@vaadin-component-factory/vcf-slider/out-tsc/src/vcf-slider.js';
import '@vaadin-component-factory/vcf-slider';
import '@vaadin/horizontal-layout/theme/lumo/vaadin-horizontal-layout.js';
import '@vaadin/number-field/theme/lumo/vaadin-number-field';
import '@vaadin/tooltip/theme/lumo/vaadin-tooltip';
import '@vaadin/icon';
import '@vaadin/icons';
import './matchup-cell.js';
import '@vaadin/form-layout';
import type { MatchupProbability } from './settings.js';

export interface IndexedMatchupProbability extends MatchupProbability {
  index: number;
}

export interface TeamRatingDetails {
  teamRating: Record<string, number>;
  bo1Skew: number;
}

/**
 * @event {CustomEvent<Record<string, number>>} teamRatingValueChanged - Fired when the team rating value changes
 */
@customElement('team-ratings')
export class TeamRatings extends LitElement {
  @property({ type: Array })
  public seedOrder: string[] = [];

  @property({ type: Object })
  public teamRating: Record<string, number>;

  @property({ type: Number })
  public bo1Skew = 0.5;

  @property({ type: Boolean })
  public matchupTableCustomized = false;

  @state()
  private ratingHelpTooltipOpened = false;

  @state()
  private skewHelpTooltipOpened = false;

  static override styles = css`
    vcf-slider {
      /* align-self: center; */
      width: 100%;
      max-width: 1000px;
    }

    .slider-label {
      margin-block-end: 0;
    }

    .alert {
      color: var(--lumo-error-color);
    }
  `;

  private onTeamRatingChanged(e: NumberFieldValueChangedEvent) {
    const teamName = (e.target as NumberField).getAttribute('teamName') as string;
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
      <vaadin-horizontal-layout style="align-items: baseline" theme="spacing-s">
        <h3>Set rating scores for each team</h3>
        <vaadin-tooltip
          for="rating-help-icon"
          text="This section helps quickly populate the matchup table by calculating odds using points. The points are pre-populated with HLTV ranking points."
          manual
          .opened="${this.ratingHelpTooltipOpened}"
        ></vaadin-tooltip>
        <vaadin-icon
          id="rating-help-icon"
          icon="vaadin:question-circle"
          @click="${() => {
            this.ratingHelpTooltipOpened = !this.ratingHelpTooltipOpened;
          }}"
        ></vaadin-icon>
      </vaadin-horizontal-layout>
      ${this.matchupTableCustomized
        ? html`<h4 class="alert">Any changes here will undo your matchup table customizations!</h4>`
        : ''}
      <vaadin-form-layout .responsiveSteps=${this.responsiveSteps}>
        ${this.seedOrder.map(
          (teamName, index) => html` <vaadin-number-field
            id="rating-input-${index}"
            teamName="${teamName}"
            label="${index + 1}: ${teamName}"
            step-buttons-visible
            .value=${this.teamRating[teamName] ?? 1}
            @value-changed=${this.onTeamRatingChanged}
            .min=${1}
          ></vaadin-number-field>`
        )}
      </vaadin-form-layout>
      <vaadin-horizontal-layout style="align-items: baseline" theme="spacing-s">
        <h3 class="slider-label">Best of 1 skew</h3>
        <vaadin-tooltip
          for="skew-help-icon"
          text="Use this slider to adjust how much best-of-1 matches skew toward 50/50 compared to the best-of-3 odds, since BO1's tend to upset more. 0.0 means the BO1 are the same as the BO3 odds. 1.0 means the BO1 odds are 50/50."
          manual
          .opened="${this.skewHelpTooltipOpened}"
        ></vaadin-tooltip>
        <vaadin-icon
          id="skew-help-icon"
          icon="vaadin:question-circle"
          @click="${() => {
            this.skewHelpTooltipOpened = !this.skewHelpTooltipOpened;
          }}"
        ></vaadin-icon>
      </vaadin-horizontal-layout>
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
    'team-ratings': TeamRatings;
  }
}
