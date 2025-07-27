/**
 * Copyright (c) 2025 Florian Hotze
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 *
 * SPDX-License-Identifier: EPL-2.0
 */
const { log } = require('openhab');

const logger = log('org.openhab.automation.js.hotzware_openhab_tools.rulesx.AlertManager');

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
class AlertManager {
  /**
   * The modes for rescheduling alerts.
   * @type {{NO_RESCHEDULE: string, RESCHEDULE_IF_DELAY_CHANGED: string, RESCHEDULE: string}}
   */
  static RESCHEDULE_MODE = {
    /**
     * Do not reschedule the alert if it is already scheduled or active.
     */
    NO_RESCHEDULE: 'NO_RESCHEDULE',
    /**
     * Reschedule the alert only if the delay has changed.
     */
    RESCHEDULE_IF_DELAY_CHANGED: 'RESCHEDULE_IF_DELAY_CHANGED',
    /**
     * Reschedule the alert.
     */
    RESCHEDULE: 'RESCHEDULE'
  };

  /**
   * @type {string}
   */
  #id;
  /**
   * @type {SendAlertCallback}
   */
  #sendAlert;
  /**
   * @type {RevokeAlertCallback}
   */
  #revokeAlert;
  /**
   * Stores the IDs of currently active alerts.
   * @type {Set<string>}
   */
  #activeAlerts = new Set();
  /**
   * Stores the scheduled alerts by their ID along with scheduling arguments.
   * @type {Map<string, { delay: number, expiresAt: number, message: string, repeat: boolean, revalidate: RevalidateAlertCallback, id: NodeJS.Timeout }>}
   */
  #scheduledAlerts = new Map();
  /**
   * Stores the muted alerts by their ID along with the timeout ID used for removing the mute.
   * @type {Map<string, NodeJS.Timeout>}
   */
  #mutedAlerts = new Map();

  /**
   * Creates a new AlertManager instance.
   *
   * @param {string} id the identifier for this AlertManager instance, used for logging
   * @param {SendAlertCallback} sendAlert the function to call when an alert should be sent
   * @param {RevokeAlertCallback} revokeAlert the function to call when an alert should be revoked
   */
  constructor (id, sendAlert, revokeAlert) {
    if (typeof sendAlert !== 'function') {
      throw new Error('sendAlert must be a function');
    }
    if (typeof revokeAlert !== 'function') {
      throw new Error('revokeAlert must be a function');
    }

    this.#id = id;
    this.#sendAlert = sendAlert;
    this.#revokeAlert = revokeAlert;
  }

  /**
   * Issues an alert immediately.
   *
   * If the alert is muted, it will not be sent, except if `important` is set to `true`.
   *
   * If the alert is already active, do nothing by default.
   * If `reissue` is set to `true`, issue the alert again.
   *
   * @param {string} id the unique identifier for the alert
   * @param {string} message the message to be displayed in the alert
   * @param {boolean} [reissue=false] whether to re-issue the alert if it already has been issued
   * @param {boolean} [important=false] whether the alert is important and should be sent even if muted
   * @return {boolean} true if the alert was issued, else false
   */
  issueAlert (id, message, reissue = false, important = false) {
    if (this.#activeAlerts.has(id) && !reissue) {
      logger.debug(`${this.#id}: Alert ${id} already active, not sending again.`);
      return false;
    }
    if (this.#scheduledAlerts.has(id) && !this.#scheduledAlerts.get(id).repeat) {
      this.#cancelScheduledAlert(id);
      logger.debug(`${this.#id}: Alert ${id} was scheduled, but now being issued immediately.`);
    }
    if (this.#mutedAlerts.has(id) && !important) {
      logger.debug(`${this.#id}: Alert ${id} is muted, not sending alert.`);
      return false;
    }
    this.#activeAlerts.add(id);
    this.#sendAlert(id, message);
    logger.debug(`${this.#id}: Alert ${id} (re-)issued with message: "${message}"`);
    return true;
  }

  /**
   * Cancels a scheduled alert by its ID.
   * If the alert is repeated, it will be stopped.
   *
   * @param {string} id the unique identifier of the alert to be cancelled
   * @return {boolean} true if the alert was cancelled, else false
   */
  #cancelScheduledAlert (id) {
    const alertData = this.#scheduledAlerts.get(id);
    if (!alertData) return false;
    if (alertData.repeat) {
      clearInterval(alertData.id);
      logger.debug(`${this.#id}: Cancelled scheduled repeating alert ${id}.`);
    } else {
      clearTimeout(alertData.id);
      logger.debug(`${this.#id}: Cancelled scheduled alert ${id}.`);
    }
    return true;
  }

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
   * @param {boolean} [repeat=false] whether to repeat the alert after the delay, defaults to false
   * @param {string} [reschedule] whether to reschedule an already scheduled alert, defaults to NO_RESCHEDULE
   * @param {RevalidateAlertCallback} [revalidate] function to revalidate if the alert should be sent once the delay is over
   * @return {boolean} true if the alert was (re-)scheduled, else false
   */
  scheduleAlert (id, message, delay, repeat = false, reschedule = AlertManager.RESCHEDULE_MODE.NO_RESCHEDULE, revalidate = () => true) {
    if (this.#scheduledAlerts.has(id) || this.#activeAlerts.has(id)) {
      switch (reschedule) {
        case AlertManager.RESCHEDULE_MODE.RESCHEDULE_IF_DELAY_CHANGED:
          logger.debug(`${this.#id}: Rescheduling alert ${id} with new delay of ${delay} minutes ...`);
          if (this.#scheduledAlerts.get(id)?.delay === delay) {
            logger.debug(`${this.#id}: Alert ${id} already scheduled with the same delay, not rescheduling.`);
            return false;
          }
          this.#cancelScheduledAlert(id);
          break;
        case AlertManager.RESCHEDULE_MODE.RESCHEDULE:
          logger.debug(`${this.#id}: Rescheduling alert ${id} ...`);
          this.#cancelScheduledAlert(id);
          break;
        default:
          logger.debug(`${this.#id}: Skipping scheduling alert ${id}, already scheduled or active.`);
          return false;
      }
    }

    const delayMs = delay * 60 * 1000;

    const handler = () => {
      if (!repeat) this.#scheduledAlerts.delete(id);
      if (typeof revalidate === 'function' && !revalidate()) {
        logger.debug(`${this.#id}: Alert ${id} was not revalidated, not sending alert.`);
        return;
      }
      this.issueAlert(id, message, repeat);
    };

    let timeoutId;
    if (repeat) {
      timeoutId = setInterval(handler, delayMs);
    } else {
      timeoutId = setTimeout(handler, delayMs);
    }
    this.#scheduledAlerts.set(id, { delay, expiresAt: Date.now() + delayMs, message, repeat, revalidate, id: timeoutId });
    logger.debug(`${this.#id}: Scheduled alert ${id} with a delay of ${delay} minutes.`);
    return true;
  }

  /**
   * Changes the delay of a scheduled alert.
   *
   * If no alert with the given ID is scheduled, do nothing.
   *
   * @param {string} id the unique identifier for the alert
   * @param {number} newDelay the new delay in minutes before the alert should become active
   * @return {boolean} true if the delay was changed, else false
   */
  changeDelayForScheduledAlert (id, newDelay) {
    if (!this.#scheduledAlerts.has(id)) {
      logger.debug(`${this.#id}: Attempted to change delay for alert ${id}, but it was not scheduled.`);
      return false;
    }
    logger.debug(`${this.#id}: Changing delay for alert ${id} to ${newDelay} minutes ...`);
    const alertData = this.#scheduledAlerts.get(id);
    if (newDelay === alertData.delay) return false;
    const delay = ((alertData.expiresAt - Date.now()) / 60 / 1000) - alertData.delay + newDelay;
    this.scheduleAlert(id, alertData.message, delay, alertData.repeat, AlertManager.RESCHEDULE_MODE.RESCHEDULE, alertData.revalidate);
    return true;
  }

  /**
   * Mutes an alert by its ID for the specified duration.
   * @param {string} id the unique identifier for the alert
   * @param {number} duration the duration in minutes for which the alert should be muted
   */
  muteAlert (id, duration) {
    if (this.#mutedAlerts.has(id)) {
      clearTimeout(this.#mutedAlerts.get(id));
      logger.debug(`${this.#id}: Alert ${id} was already muted, re-muting for ${duration} minutes ...`);
    }
    const timeoutId = setTimeout(() => {
      this.#mutedAlerts.delete(id);
      logger.debug(`${this.#id}: Alert ${id} is no longer muted.`);
    }, duration * 60 * 1000);
    this.#mutedAlerts.set(id, timeoutId);
    logger.debug(`${this.#id}: Alert ${id} has been muted for ${duration} minutes.`);
  }

  /**
   * Revokes an alert, no matter it has only been scheduled or already become active.
   *
   * If no alert with the given ID is scheduled or active, do nothing.
   *
   * @param {string} id the unique identifier of the alert
   * @return {boolean} true if the alert was revoked, else false
   */
  revokeAlert (id) {
    if (this.#scheduledAlerts.has(id)) {
      this.#cancelScheduledAlert(id);
      logger.debug(`${this.#id}: Scheduled alert ${id} has been cancelled.`);
    } else if (this.#activeAlerts.has(id)) {
      this.#revokeAlert(id);
      this.#activeAlerts.delete(id);
      logger.debug(`${this.#id}: Alert ${id} has been revoked from active alerts.`);
    } else {
      logger.debug(`${this.#id}: Attempted to revoke alert ${id}, but it was not found in scheduled or active alerts.`);
      return false;
    }
    return true;
  }

  /**
   * Revokes all alerts that have been scheduled or already become active.
   *
   * @return {number} the number of alerts that have been revoked
   */
  revokeAllAlerts () {
    let count = 0;
    for (const id of this.#activeAlerts) {
      if (this.revokeAlert(id)) count++;
    }
    for (const id of this.#scheduledAlerts.keys()) {
      if (this.revokeAlert(id)) count++;
    }
    return count;
  }
}

module.exports = AlertManager;
