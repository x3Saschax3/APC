// Sicherstellen, dass App und App.modules existieren
var App = App || {};
App.modules = App.modules || {};

// Definition des Persistence-Moduls
App.modules.Persistence = {
  /**
   * Funktion: getEventStatus
   * Beschreibung: Holt den aktuellen Event-Status aus der Persistenz.
   * Rückgabewert: Objekt mit Eigenschaften des Event-Status.
   */
  getEventStatus: function() {
    var status = KnuddelsServer.getPersistence().getObject('eventStatus', {
      isActive: false,
      // Weitere Eigenschaften können hier hinzugefügt werden
    });
    return status;
  },

  /**
   * Funktion: setEventStatus
   * Beschreibung: Speichert den aktuellen Event-Status in der Persistenz.
   * Parameter:
   *   - status: Objekt mit den Eigenschaften des Event-Status.
   */
  setEventStatus: function(status) {
    KnuddelsServer.getPersistence().setObject('eventStatus', status);
  },

  /**
   * Funktion: clearEventStatus
   * Beschreibung: Löscht den gespeicherten Event-Status aus der Persistenz.
   */
  clearEventStatus: function() {
    KnuddelsServer.getPersistence().delete('eventStatus');
  },

  /**
   * Funktion: getAllowedUsers
   * Beschreibung: Holt die Liste der erlaubten Benutzer für /botsay aus der Persistenz.
   * Rückgabewert: Array der erlaubten Benutzer.
   */
  getAllowedUsers: function() {
    return KnuddelsServer.getPersistence().getObject('botsayAllowedUsers', []);
  },

  /**
   * Funktion: setAllowedUsers
   * Beschreibung: Speichert die Liste der erlaubten Benutzer für /botsay in der Persistenz.
   * Parameter:
   *   - allowedUsers: Array der erlaubten Benutzer.
   */
  setAllowedUsers: function(allowedUsers) {
    KnuddelsServer.getPersistence().setObject('botsayAllowedUsers', allowedUsers);
  }
};
