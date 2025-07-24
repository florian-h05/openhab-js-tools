export = AlertManager;
/**
 * Callback for sending an alert.
 *
 * @callback SendAlertCallback
 * @param {string} id the unique identifier for the alert
 * @param {string} message the message to be displayed in the alert
 */
/**
 * Callback for revoking an alert.
 *
 * @callback RevokeAlertCallback
 * @param {string} id the unique identifier of the alert to be revoked
 */
/**
 * The AlertManager class is responsible for managing alerts.
 * It allows sending alerts immediately, scheduling them for later, and revoking them.
 *
 * @memberOf rulesx
 */
declare class AlertManager {
    /**
     * Creates a new AlertManager instance.
     *
     * @param {string} id the identifier for this AlertManager instance, used for logging
     * @param {SendAlertCallback} sendAlert the function to call when an alert should be sent
     * @param {RevokeAlertCallback} revokeAlert the function to call when an alert should be revoked
     */
    constructor(id: string, sendAlert: SendAlertCallback, revokeAlert: RevokeAlertCallback);
    /**
     * Issues an alert immediately.
     *
     * If the alert is already active, do nothing by default.
     * If `reissue` is set to `true`, issue the alert again.
     *
     * @param {string} id the unique identifier for the alert
     * @param {string} message the message to be displayed in the alert
     * @param {boolean} [reissue=false] whether to re-issue the alert if it already has been issued
     */
    issueAlert(id: string, message: string, reissue?: boolean): void;
    /**
     * Schedules an alert to be issued after the specified delay.
     *
     * If an alert with the same ID is already scheduled, do nothing by default.
     * If `reschedule` is `true`, reschedule the alert.
     *
     * @param {string} id the unique identifier for the alert
     * @param {string} message the message to be displayed in the alert
     * @param {number} delay the delay in minutes before the alert should become active
     * @param {boolean} [reschedule=false] whether to reschedule an already scheduled alert
     * @param {*} [revalidate] function to revalidate if the alert should be sent once the delay is over
     */
    scheduleAlert(id: string, message: string, delay: number, reschedule?: boolean, revalidate?: any): void;
    /**
     * Revokes an alert, no matter it has only been scheduled or already become active.
     *
     * @param {string} id the unique identifier of the alert
     */
    revokeAlert(id: string): void;
    /**
     * Revokes all alerts that have been scheduled or already become active.
     */
    revokeAllAlerts(): void;
    #private;
}
declare namespace AlertManager {
    export { SendAlertCallback, RevokeAlertCallback };
}
/**
 * Callback for sending an alert.
 */
type SendAlertCallback = (id: string, message: string) => any;
/**
 * Callback for revoking an alert.
 */
type RevokeAlertCallback = (id: string) => any;
//# sourceMappingURL=alertManager.d.ts.map