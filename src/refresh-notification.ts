import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@vaadin/horizontal-layout/theme/lumo/vaadin-horizontal-layout.js';
import '@vaadin/button/theme/lumo/vaadin-button.js';
import '@vaadin/notification/theme/lumo/vaadin-notification.js';
import '@vaadin/icon';
import '@vaadin/icons';
import { notificationRenderer, NotificationLitRenderer } from '@vaadin/notification/lit.js';
import type { NotificationOpenedChangedEvent } from '@vaadin/notification';
import { Workbox, messageSW } from 'workbox-window';

@customElement('refresh-notification')
export class RefreshNotification extends LitElement {
  private workbox: Workbox | undefined;

  private registration: ServiceWorkerRegistration | undefined;

  @property({ type: Boolean })
  private notificationOpened = false;

  public open(workbox?: Workbox, registration?: ServiceWorkerRegistration) {
    console.log('opening notification', workbox, registration);
    this.notificationOpened = true;
    this.workbox = workbox;
    this.registration = registration;
  }

  public close() {
    this.notificationOpened = false;
    this.workbox = undefined;
    this.registration = undefined;
  }

  private async refreshPage() {
    console.log('Refreshing page');
    // reload the page as soon as the previously waiting service worker has taken control.
    if (this.workbox) {
      this.workbox.addEventListener('controlling', () => {
        window.location.reload();
      });

      if (this.registration?.waiting) {
        await messageSW(this.registration.waiting, { type: 'SKIP_WAITING' });
      }
    }
  }

  private renderNotification: NotificationLitRenderer = () =>
    html`
      <vaadin-horizontal-layout theme="spacing" style="align-items: center;">
        <div>New version available! OK to reload?</div>
        <vaadin-button
          theme="primary"
          style="margin-left: var(--lumo-space-xl);"
          @click=${this.refreshPage}
        >
          Reload
        </vaadin-button>
        <vaadin-button theme="secondary-inline icon" @click=${this.close} aria-label="Close">
          <vaadin-icon icon="vaadin:close" style="color: white"></vaadin-icon>
        </vaadin-button>
      </vaadin-horizontal-layout>
    `;

  override render() {
    return html`<vaadin-notification
      theme="contrast"
      duration="0"
      position="bottom-center"
      .opened="${this.notificationOpened}"
      @opened-changed="${(e: NotificationOpenedChangedEvent) => {
        this.notificationOpened = e.detail.value;
      }}"
      ${notificationRenderer(this.renderNotification, [])}
    ></vaadin-notification>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'refresh-notification': RefreshNotification;
  }
}
