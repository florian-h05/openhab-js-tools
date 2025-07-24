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
    it('sends an alert immediately', () => {
      const alertId = 'alert1';
      const message = 'Test alert message';
      alertManager.issueAlert(alertId, message);

      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
    });

    it('does not send an alert if already active', () => {
      const alertId = 'alert1';
      const message = 'Test alert message';
      alertManager.issueAlert(alertId, message);
      alertManager.issueAlert(alertId, message);

      expect(mockSendAlert).toHaveBeenCalledTimes(1);
    });

    it('sends an alert immediately and cancels scheduling if alert was scheduled before', () => {
      const alertId = 'alert1';
      const message = 'Test alert message';
      alertManager.scheduleAlert(alertId, message, 5);
      alertManager.issueAlert(alertId, message);

      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
    });

    it('sends an active alert again if reissue is set to true', () => {
      jest.useFakeTimers();
      const alertId = 'alert1';
      const message = 'Test alert message';
      const delay = 5; // minutes

      alertManager.scheduleAlert(alertId, message);
      alertManager.issueAlert(alertId, message, true);

      jest.advanceTimersByTime(delay * 60 * 1000);

      expect(mockSendAlert).toHaveBeenCalledTimes(1);
    });
  });

  describe('scheduleAlert', () => {
    it('schedules an alert to be sent after a delay', () => {
      jest.useFakeTimers();
      const alertId = 'alert2';
      const message = 'Scheduled alert message';
      const delay = 5; // minutes

      alertManager.scheduleAlert(alertId, message, delay);

      jest.advanceTimersByTime(delay * 60 * 1000);

      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
    });

    it('does nothing if an alert is already scheduled', () => {
      jest.useFakeTimers();
      const alertId = 'alert2';
      const message = 'Scheduled alert message';
      const delay = 5; // minutes

      alertManager.scheduleAlert(alertId, message, delay);

      jest.advanceTimersByTime((delay / 2) * 60 * 1000);

      alertManager.scheduleAlert(alertId, message, delay);

      jest.advanceTimersByTime((delay / 2) * 60 * 1000);
      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
      mockSendAlert.mockClear();
      jest.advanceTimersByTime((delay / 2) * 60 * 1000);
      expect(mockSendAlert).not.toHaveBeenCalled();
    });

    it('does nothing if an alert is already active', () => {
      jest.useFakeTimers();
      const alertId = 'alert2';
      const message = 'Scheduled alert message';
      const delay = 5; // minutes

      alertManager.issueAlert(alertId, message, delay);
      mockSendAlert.mockClear();

      alertManager.scheduleAlert(alertId, message, delay);
      jest.advanceTimersByTime(delay * 60 * 1000);

      expect(mockSendAlert).not.toHaveBeenCalled();
    });

    it('reschedules an alert if it is already scheduled and reschedule is set to true', () => {
      jest.useFakeTimers();
      const alertId = 'alert2';
      const message = 'Scheduled alert message';
      const delay = 5; // minutes

      alertManager.scheduleAlert(alertId, message, delay);

      jest.advanceTimersByTime((delay / 2) * 60 * 1000);

      alertManager.scheduleAlert(alertId, message, delay, true);

      jest.advanceTimersByTime((delay / 2) * 60 * 1000);
      expect(mockSendAlert).not.toHaveBeenCalled();
      jest.advanceTimersByTime((delay / 2) * 60 * 1000);
      expect(mockSendAlert).toHaveBeenCalledWith(alertId, message);
    });

    it('does not send a scheduled alert if revalidation fails', () => {
      jest.useFakeTimers();
      const alertId = 'alert3';
      const message = 'Scheduled alert with revalidation';
      const delay = 5; // minutes
      const revalidate = jest.fn(() => false);

      alertManager.scheduleAlert(alertId, message, delay, false, revalidate);

      jest.advanceTimersByTime(delay * 60 * 1000);

      expect(mockSendAlert).not.toHaveBeenCalled();
    });
  });

  describe('revokeAlert', () => {
    it('revokes a scheduled alert', () => {
      jest.useFakeTimers();
      const alertId = 'alert4';
      const message = 'Alert to be revoked';
      const delay = 5; // minutes

      alertManager.scheduleAlert(alertId, message, delay);
      alertManager.revokeAlert(alertId);

      jest.advanceTimersByTime(delay * 60 * 1000);

      expect(mockSendAlert).not.toHaveBeenCalled();
    });

    it('revokes a scheduled alert that has already become active', () => {
      jest.useFakeTimers();
      const alertId = 'alert4';
      const message = 'Alert to be revoked';
      const delay = 5; // minutes

      alertManager.scheduleAlert(alertId, message, delay);

      jest.advanceTimersByTime((delay + 1) * 60 * 1000);

      alertManager.revokeAlert(alertId);

      expect(mockRevokeAlert).toHaveBeenCalledWith(alertId);
    });

    it('revokes a sent alert', () => {
      const alertId = 'alert5';
      const message = 'Active alert to be revoked';

      alertManager.issueAlert(alertId, message);
      alertManager.revokeAlert(alertId);

      expect(mockRevokeAlert).toHaveBeenCalledWith(alertId);
    });

    it('does nothing if no alert with the given ID is scheduled or active', () => {
      alertManager.revokeAlert('nonExistentAlert');

      expect(mockRevokeAlert).not.toHaveBeenCalled();
    });
  });

  describe('revokeAllAlerts', () => {
    it('revokes all alerts', () => {
      const alertId1 = 'alert6';
      const message1 = 'First alert';
      const alertId2 = 'alert7';
      const message2 = 'Second alert';

      const revokeAlertSpy = jest.spyOn(alertManager, 'revokeAlert');

      alertManager.issueAlert(alertId1, message1);
      alertManager.scheduleAlert(alertId2, message2, 5);

      alertManager.revokeAllAlerts();

      expect(revokeAlertSpy).toHaveBeenCalledWith(alertId1);
      expect(revokeAlertSpy).toHaveBeenCalledWith(alertId2);
    });
  });
});
