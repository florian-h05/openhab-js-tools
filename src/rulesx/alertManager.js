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

const logger = log('org.openhab.automation.js.openhab-tools.rulesx.alerting.AlertManager');

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
class AlertManager {
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
   * Stores the scheduled alerts by their ID along with their timeout ID.
   * @type {Map<string, NodeJS.Timeout>}
   */
  #scheduledAlerts = new Map();

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
   * If the alert is already active, do nothing by default.
   * If `reissue` is set to `true`, issue the alert again.
   *
   * @param {string} id the unique identifier for the alert
   * @param {string} message the message to be displayed in the alert
   * @param {boolean} [reissue=false] whether to re-issue the alert if it already has been issued
   */
  issueAlert (id, message, reissue = false) {
    if (this.#activeAlerts.has(id) && !reissue) {
      logger.debug(`${this.#id}: Alert ${id} already active, not sending again.`);
      return;
    }
    logger.debug(`${this.#id}: (Re-)Issuing alert ${id} ...`);
    this.#activeAlerts.add(id);
    this.#sendAlert(id, message);
  }

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
  scheduleAlert (id, message, delay, reschedule = false, revalidate) {
    if (this.#scheduledAlerts.has(id) || this.#activeAlerts.has(id)) {
      if (!reschedule) {
        logger.debug(`${this.#id}: Skipping scheduling alert ${id}, already scheduled.`);
        return;
      }
      if (this.#scheduledAlerts.has(id)) {
        clearTimeout(this.#scheduledAlerts.get(id));
        this.#scheduledAlerts.delete(id);
      }
      logger.debug(`${this.#id}: Rescheduling alert ${id} ...`);
    }

    const timeout = setTimeout(() => {
      this.#scheduledAlerts.delete(id);
      if (typeof revalidate === 'function' && !revalidate()) {
        logger.debug(`${this.#id}: Alert ${id} was not revalidated, not sending alert.`);
        return;
      }
      this.issueAlert(id, message);
      this.#activeAlerts.add(id);
    }, delay * 60 * 1000);
    this.#scheduledAlerts.set(id, timeout);
  }

  /**
   * Revokes an alert, no matter it has only been scheduled or already become active.
   *
   * @param {string} id the unique identifier of the alert
   */
  revokeAlert (id) {
    if (this.#scheduledAlerts.has(id)) {
      clearTimeout(this.#scheduledAlerts.get(id));
      this.#scheduledAlerts.delete(id);
      logger.debug(`${this.#id}: Schedules alert ${id} has been cancelled.`);
    } else if (this.#activeAlerts.has(id)) {
      this.#revokeAlert(id);
      this.#activeAlerts.delete(id);
      logger.debug(`${this.#id}: Alert ${id} has been revoked from active alerts.`);
    } else {
      logger.warn(`${this.#id}: Attempted to revoke alert ${id}, but it was not found in scheduled or active alerts.`);
    }
  }

  /**
   * Revokes all alerts that have been scheduled or already become active.
   */
  revokeAllAlerts () {
    for (const id of this.#activeAlerts) {
      this.revokeAlert(id);
    }
    for (const id of this.#scheduledAlerts.keys()) {
      this.revokeAlert(id);
    }
  }
}

module.exports = AlertManager;
