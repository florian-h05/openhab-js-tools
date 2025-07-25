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
 * Callback for revalidating an alert.
 *
 * @callback RevalidateAlertCallback
 * @returns {boolean} true if the alert should be sent, false otherwise
 */
/**
 * The AlertManager class is responsible for managing alerts.
 * It allows sending alerts immediately, scheduling them for later, and revoking them.
 *
 * @memberOf rulesx
 */
declare class AlertManager {
    /**
     * The modes for rescheduling alerts.
     * @type {{NO_RESCHEDULE: string, RESCHEDULE_IF_DELAY_CHANGED: string, RESCHEDULE: string}}
     */
    static RESCHEDULE_MODE: {
        NO_RESCHEDULE: string;
        RESCHEDULE_IF_DELAY_CHANGED: string;
        RESCHEDULE: string;
    };
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
     * @return {boolean} true if the alert was issued, else false
     */
    issueAlert(id: string, message: string, reissue?: boolean): boolean;
    /**
     * Schedules an alert to be issued after the specified delay.
     *
     * If an alert with the same ID is already scheduled, do nothing by default.
     * Rescheduling behaviour can be controlled with the `reschedule` parameter.
     * For values of `reschedule`, see {@link #RESCHEDULE_MODE}.
     *
     * @param {string} id the unique identifier for the alert
     * @param {string} message the message to be displayed in the alert
     * @param {number} delay the delay in minutes before the alert should become active
     * @param {string} [reschedule] whether to reschedule an already scheduled alert, defaults to NO_RESCHEDULE
     * @param {RevalidateAlertCallback} [revalidate] function to revalidate if the alert should be sent once the delay is over
     * @return {boolean} true if the alert was (re-)scheduled, else false
     */
    scheduleAlert(id: string, message: string, delay: number, reschedule?: string, revalidate?: RevalidateAlertCallback): boolean;
    /**
     * Changes the delay of a scheduled alert.
     *
     * If no alert with the given ID is scheduled, do nothing.
     *
     * @param {string} id the unique identifier for the alert
     * @param {number} newDelay the new delay in minutes before the alert should become active
     * @return {boolean} true if the delay was changed, else false
     */
    changeDelayForScheduledAlert(id: string, newDelay: number): boolean;
    /**
     * Revokes an alert, no matter it has only been scheduled or already become active.
     *
     * If no alert with the given ID is scheduled or active, do nothing.
     *
     * @param {string} id the unique identifier of the alert
     * @return {boolean} true if the alert was revoked, else false
     */
    revokeAlert(id: string): boolean;
    /**
     * Revokes all alerts that have been scheduled or already become active.
     *
     * @return {number} the number of alerts that have been revoked
     */
    revokeAllAlerts(): number;
    #private;
}
declare namespace AlertManager {
    export { SendAlertCallback, RevokeAlertCallback, RevalidateAlertCallback };
}
/**
 * Callback for revalidating an alert.
 */
type RevalidateAlertCallback = () => boolean;
/**
 * Callback for sending an alert.
 */
type SendAlertCallback = (id: string, message: string) => any;
/**
 * Callback for revoking an alert.
 */
type RevokeAlertCallback = (id: string) => any;
//# sourceMappingURL=alertManager.d.ts.map