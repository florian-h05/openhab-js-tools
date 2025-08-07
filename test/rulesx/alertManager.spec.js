const AlertManager = require('../../src/rulesx/alertManager');

jest.mock('openhab');

describe('AlertManager', () => {
  let alertManager;
  let mockSendAlert;
  let mockRevokeAlert;

  beforeEach(() => {
    mockSendAlert = jest.fn();
    mockRevokeAlert = jest.fn();
    alertManager = new AlertManager('test', mockSendAlert, mockRevokeAlert);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates an AlertManager instance with valid callbacks', () => {
    expect(alertManager).toBeInstanceOf(AlertManager);
  });

  it('throws an error if sendAlert is not a function', () => {
    expect(() => new AlertManager('test', null, mockRevokeAlert)).toThrow('sendAlert must be a function');
  });

  it('throws an error if revokeAlert is not a function', () => {
    expect(() => new AlertManager('test', mockSendAlert, null)).toThrow('revokeAlert must be a function');
  });

  describe('issueAlert', () => {
    const alertId = 'issueAlertTest';
    const message = 'Alert message';

    it('sends an alert immediately', () => {
      const res = alertManager.issueAlert(alertId, message);

      expect(res).toBe(true);
      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
    });

    it('does not send an alert if already active', () => {
      alertManager.issueAlert(alertId, message);
      const res = alertManager.issueAlert(alertId, message);

      expect(res).toBe(false);
      expect(mockSendAlert).toHaveBeenCalledTimes(1);
    });

    it('sends an alert immediately and cancels scheduling if alert was scheduled before', () => {
      alertManager.scheduleAlert(alertId, message, 5);

      const res = alertManager.issueAlert(alertId, message);

      expect(res).toBe(true);
      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
    });

    it('sends an active alert again if reissue is set to true', () => {
      const res1 = alertManager.issueAlert(alertId, message);
      const res2 = alertManager.issueAlert(alertId, message, true);

      expect(res1).toBe(true);
      expect(res2).toBe(true);
      expect(mockSendAlert).toHaveBeenCalledTimes(2);
    });

    it('ignores mute state when important is set to true', () => {
      jest.useFakeTimers();

      alertManager.muteAlert(alertId, 5); // Mute the alert for 5 minutes
      const res = alertManager.issueAlert(alertId, message, false, true);

      expect(res).toBe(true);
      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
    });
  });

  describe('scheduleAlert', () => {
    const alertId = 'scheduleAlertTest';
    const message = 'Scheduled alert message';
    const delay = 5; // minutes

    it('schedules an alert to be sent after a delay', () => {
      jest.useFakeTimers();

      const res = alertManager.scheduleAlert(alertId, message, delay);

      jest.advanceTimersByTime(delay * 60 * 1000);
      expect(res).toBe(true);
      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
    });

    it('does nothing if an alert is already scheduled', () => {
      jest.useFakeTimers();

      alertManager.scheduleAlert(alertId, message, delay);

      jest.advanceTimersByTime((delay / 2) * 60 * 1000);

      const res = alertManager.scheduleAlert(alertId, message, delay);

      expect(res).toBe(false);
      jest.advanceTimersByTime((delay / 2) * 60 * 1000);
      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
      mockSendAlert.mockClear();
      jest.advanceTimersByTime((delay / 2) * 60 * 1000);
      expect(mockSendAlert).not.toHaveBeenCalled();
    });

    it('does nothing if an alert is already active', () => {
      jest.useFakeTimers();

      alertManager.issueAlert(alertId, message, delay);
      mockSendAlert.mockClear();

      const res = alertManager.scheduleAlert(alertId, message, delay);

      expect(res).toBe(false);
      jest.advanceTimersByTime(delay * 60 * 1000);
      expect(mockSendAlert).not.toHaveBeenCalled();
    });

    it('periodically sends an alert if repeat is true', () => {
      jest.useFakeTimers();

      alertManager.scheduleAlert(alertId, message, delay, true);

      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(delay * 60 * 1000);
      }
      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
      expect(mockSendAlert).toHaveBeenCalledTimes(3);
      jest.clearAllTimers();
    });

    it('reschedules an alert if reschedule = RESCHEDULE', () => {
      jest.useFakeTimers();

      alertManager.scheduleAlert(alertId, message, delay);

      jest.advanceTimersByTime((delay / 2) * 60 * 1000);

      const res = alertManager.scheduleAlert(alertId, message, delay, false, AlertManager.RESCHEDULE_MODE.RESCHEDULE);

      expect(res).toBe(true);
      jest.advanceTimersByTime((delay / 2) * 60 * 1000);
      expect(mockSendAlert).not.toHaveBeenCalled();
      jest.advanceTimersByTime((delay / 2) * 60 * 1000);
      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
    });

    it('reschedules an alert if the delay has changed if reschedule = RESCHEDULE_IF_DELAY_CHANGED', () => {
      jest.useFakeTimers();
      const newDelay = 10; // minutes

      alertManager.scheduleAlert(alertId, message, delay);

      jest.advanceTimersByTime((delay / 2) * 60 * 1000);

      const res = alertManager.scheduleAlert(alertId, message, newDelay, false, AlertManager.RESCHEDULE_MODE.RESCHEDULE_IF_DELAY_CHANGED);

      expect(res).toBe(true);
      jest.advanceTimersByTime((delay / 2) * 60 * 1000);
      expect(mockSendAlert).not.toHaveBeenCalled();
      jest.advanceTimersByTime((newDelay - delay / 2) * 60 * 1000);
      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
    });

    it('does not reschedule an alert if the delay has not changed if reschedule = RESCHEDULE_IF_DELAY_CHANGED', () => {
      jest.useFakeTimers();

      alertManager.scheduleAlert(alertId, message, delay);

      jest.advanceTimersByTime((delay / 2) * 60 * 1000);

      const res = alertManager.scheduleAlert(alertId, message, delay, false, AlertManager.RESCHEDULE_MODE.RESCHEDULE_IF_DELAY_CHANGED);

      expect(res).toBe(false);
      jest.advanceTimersByTime((delay / 2) * 60 * 1000);
      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
      mockSendAlert.mockClear();
      jest.advanceTimersByTime((delay / 2) * 60 * 1000);
      expect(mockSendAlert).not.toHaveBeenCalled();
    });

    it('does not send a scheduled alert if revalidation fails', () => {
      jest.useFakeTimers();
      const revalidate = jest.fn(() => false);

      alertManager.scheduleAlert(alertId, message, delay, false, false, revalidate);

      jest.advanceTimersByTime(delay * 60 * 1000);

      expect(mockSendAlert).not.toHaveBeenCalled();
    });
  });

  describe('changeDelay', () => {
    const alertId = 'changeDelayTest';
    const message = 'Alert message';
    const initialDelay = 5; // minutes
    const newDelay = 10; // minutes

    it('reschedules an alert with a new delay', () => {
      jest.useFakeTimers();

      alertManager.scheduleAlert(alertId, message, initialDelay);
      const res = alertManager.changeDelayForScheduledAlert(alertId, newDelay);

      expect(res).toBe(true);
      jest.advanceTimersByTime(initialDelay * 60 * 1000);
      expect(mockSendAlert).not.toHaveBeenCalled();

      jest.advanceTimersByTime((newDelay - initialDelay) * 60 * 1000);
      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
    });

    it('returns fast if the new delay is the same as the current one', () => {
      jest.useFakeTimers();

      const scheduleAlertSpy = jest.spyOn(alertManager, 'scheduleAlert');

      alertManager.scheduleAlert(alertId, message, initialDelay);
      scheduleAlertSpy.mockClear();

      const res = alertManager.changeDelayForScheduledAlert(alertId, initialDelay);

      expect(res).toBe(false);
      expect(scheduleAlertSpy).not.toHaveBeenCalled();
    });

    it('does nothing if no alert with the given ID is scheduled', () => {
      jest.useFakeTimers();

      const res = alertManager.changeDelayForScheduledAlert(alertId, newDelay);

      expect(res).toBe(false);
      jest.advanceTimersByTime(newDelay * 60 * 1000);
      expect(mockSendAlert).not.toHaveBeenCalled();
      expect(mockRevokeAlert).not.toHaveBeenCalled();
    });
  });

  describe('muteAlert', () => {
    const alertId = 'muteAlertTest';
    const message = 'Alert message';
    const duration = 5; // minutes

    it('mutes an alert for the given duration', () => {
      jest.useFakeTimers();

      alertManager.muteAlert(alertId, duration);
      alertManager.issueAlert(alertId, message);

      expect(mockSendAlert).not.toHaveBeenCalled();
      jest.advanceTimersByTime(duration * 60 * 1000);

      alertManager.issueAlert(alertId, message);

      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
    });

    it('mutes a scheduled alert for the given duration', () => {
      jest.useFakeTimers();

      alertManager.muteAlert(alertId, duration);
      // mute is active, alert should not be sent
      alertManager.scheduleAlert(alertId, message, duration / 2);

      expect(mockSendAlert).not.toHaveBeenCalled();
      jest.advanceTimersByTime(duration * 60 * 1000);

      // mute duration is over, alert should be sent
      alertManager.scheduleAlert(alertId, message, duration / 2);

      jest.advanceTimersByTime(duration * 60 * 1000);
      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
    });

    it('resets mute duration if muted again', () => {
      jest.useFakeTimers();

      alertManager.muteAlert(alertId, duration);

      jest.advanceTimersByTime(duration * 60 * 1000 / 2);

      alertManager.muteAlert(alertId, duration);

      jest.advanceTimersByTime(duration * 60 * 1000 / 2);

      alertManager.issueAlert(alertId, message);
      expect(mockSendAlert).not.toHaveBeenCalled();
    });
  });

  describe('revokeAlert', () => {
    const alertId = 'revokeAlertTest';
    const message = 'Alert message';
    const delay = 5; // minutes

    it('revokes a scheduled alert', () => {
      jest.useFakeTimers();

      alertManager.scheduleAlert(alertId, message, delay);
      const res = alertManager.revokeAlert(alertId);

      expect(res).toBe(true);
      jest.advanceTimersByTime(delay * 60 * 1000);
      expect(mockSendAlert).not.toHaveBeenCalled();
    });

    it('revokes a scheduled repeating alert', () => {
      jest.useFakeTimers();

      alertManager.scheduleAlert(alertId, message, delay, true);

      jest.advanceTimersByTime(delay * 60 * 1000);
      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
      mockSendAlert.mockClear();

      const res = alertManager.revokeAlert(alertId);
      expect(res).toBe(true);

      jest.advanceTimersByTime(delay * 60 * 1000);
      expect(mockSendAlert).not.toHaveBeenCalled();
    });

    it('revokes a scheduled alert that has already become active', () => {
      jest.useFakeTimers();

      alertManager.scheduleAlert(alertId, message, delay);

      jest.advanceTimersByTime((delay + 1) * 60 * 1000);

      const res = alertManager.revokeAlert(alertId);

      expect(res).toBe(true);
      expect(mockRevokeAlert).toHaveBeenCalledWith(alertId);
    });

    it('revokes a sent alert', () => {
      alertManager.issueAlert(alertId, message);
      const res = alertManager.revokeAlert(alertId);

      expect(res).toBe(true);
      expect(mockRevokeAlert).toHaveBeenCalledWith(alertId);
    });

    it('does nothing if no alert with the given ID is scheduled or active', () => {
      const res = alertManager.revokeAlert('nonExistentAlert');

      expect(res).toBe(false);
      expect(mockRevokeAlert).not.toHaveBeenCalled();
    });
  });

  describe('revokeAllAlerts', () => {
    const alertId1 = 'revokeAllAlertsTest1';
    const message1 = 'First alert';
    const alertId2 = 'revokeAllAlertsTest2';
    const message2 = 'Second alert';

    it('revokes all alerts', () => {
      const revokeAlertSpy = jest.spyOn(alertManager, 'revokeAlert');

      alertManager.issueAlert(alertId1, message1);
      alertManager.scheduleAlert(alertId2, message2, 5);

      alertManager.revokeAllAlerts();

      expect(revokeAlertSpy).toHaveBeenCalledWith(alertId1);
      expect(revokeAlertSpy).toHaveBeenCalledWith(alertId2);
    });

    it('returns the correct number of revoker alerts', () => {
      const revokeAlertSpy = jest.spyOn(alertManager, 'revokeAlert');

      alertManager.issueAlert(alertId1, message1);
      alertManager.scheduleAlert(alertId2, message2, 5);

      let res = alertManager.revokeAllAlerts();

      expect(res).toBe(2);
      res = alertManager.revokeAllAlerts();
      
      expect(res).toBe(0);
    });
  });
});
