import { LitElement, html, PropertyValueMap } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@google-web-components/google-chart';
// import { produce } from 'immer';

const teamRatingToChartData = <T extends string>(
  teamRating: Record<T, number>
): [[string, string], ...[T, number][]] => {
  const sortedRatings = (Object.entries<number>(teamRating) as [T, number][]).sort(
    ([, ratingA], [, ratingB]) => ratingB - ratingA
  );
  return [['Team', 'Rating'], ...sortedRatings];
};

@customElement('team-ratings-chart')
export class TeamRatingsChart<T extends string> extends LitElement {
  @property({
    type: Object,
  })
  public teamRating: Record<T, number>;

  @state()
  private chartData: [[string, string], ...[T, number][]] = [['Team', 'Rating']];

  protected override updated(changedProperties: PropertyValueMap<this>): void {
    if (changedProperties.has('teamRating') && this.teamRating) {
      this.chartData = teamRatingToChartData(this.teamRating);
    }
  }

  override render() {
    return html`<google-chart type="column" .data=${this.chartData}></google-chart>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'team-ratings-chart': TeamRatingsChart<string>;
  }
}
