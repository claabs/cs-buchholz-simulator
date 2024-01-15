import { LitElement, html, PropertyValueMap, css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import '@google-web-components/google-chart';
import type { GoogleChart } from '@google-web-components/google-chart';
import '@vaadin/horizontal-layout/theme/lumo/vaadin-horizontal-layout.js';

const teamRatingToChartData = (
  teamRating: Record<string, number>
): [[string, string], ...[string, number][]] => {
  const sortedRatings = Object.entries<number>(teamRating).sort(
    ([, ratingA], [, ratingB]) => ratingB - ratingA
  );
  return [['Team', 'Rating'], ...sortedRatings];
};

@customElement('team-ratings-chart')
export class TeamRatingsChart extends LitElement {
  @property({
    type: Object,
  })
  public teamRating: Record<string, number>;

  @state()
  private chartData: [[string, string], ...[string, number][]] = [['Team', 'Rating']];

  @query('google-chart')
  public chart: GoogleChart;

  private chartOptions = {
    hAxis: {
      minTextSpacing: 0,
      showTextEvery: 1,
    },
    legend: 'none',
    chartArea: { width: '100%', height: '80%' },
  };

  protected override updated(changedProperties: PropertyValueMap<this>): void {
    if (changedProperties.has('teamRating') && this.teamRating) {
      this.chartData = teamRatingToChartData(this.teamRating);
    }
  }

  static override styles = css`
    google-chart {
      width: 100%;
      max-width: 1000px;
    }
  `;

  override connectedCallback(): void {
    // eslint-disable-next-line wc/guard-super-call
    super.connectedCallback();
    window.addEventListener('resize', () => this.chart.redraw());
  }

  override render() {
    return html`<vaadin-horizontal-layout theme="spacing" style="justify-content: left">
      <google-chart
        type="column"
        .data=${this.chartData}
        .options=${this.chartOptions}
      ></google-chart>
    </vaadin-horizontal-layout>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'team-ratings-chart': TeamRatingsChart;
  }
}
