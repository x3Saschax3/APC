// Sicherstellen, dass App und App.modules existieren
var App = App || {};
App.modules = App.modules || {};

// Definition des Botsay-Moduls innerhalb von App.modules
App.modules.Botsay = {
  // Modul ist standardmäßig aktiviert
  enabled: true,

  // Laden der erlaubten Benutzer aus der Persistenz
  allowedUsers: [], // Standardmäßig leeres Array

  // Initialisierung des Moduls
  init: function() {
    // Überprüfen, ob das Persistence-Modul verfügbar ist
    if (App.modules.Persistence && typeof App.modules.Persistence.getAllowedUsers === 'function') {
      this.allowedUsers = App.modules.Persistence.getAllowedUsers();
      App.log('Botsay: Erlaubte Benutzer aus der Persistenz geladen.');
    } else {
      App.log('Botsay: Warnung - Persistence-Modul nicht verfügbar. Verwende lokale allowedUsers-Liste.');
      this.allowedUsers = [];
    }
  },

  /**
   * Funktion: sendBotMessage
   * Beschreibung: Sendet eine öffentliche Nachricht im Namen des Bots und informiert die Channelbesitzer.
   * Parameter:
   *   - user: Das User-Objekt des Benutzers, der den Befehl ausgeführt hat.
   *   - message: Die zu sendende Nachricht.
   */
  sendBotMessage: function(user, message) {
    // Berechtigungsprüfung
    if (!this.isUserAllowed(user)) {
      user.sendPrivateMessage("Du hast keine Berechtigung, diesen Befehl zu verwenden.");
      return;
    }

    // Überprüfen, ob eine Nachricht angegeben wurde
    if (!message) {
      user.sendPrivateMessage("Bitte gib einen Text für die Nachricht an.");
      return;
    }

    // Nachricht im Namen des Bots öffentlich senden
    KnuddelsServer.getDefaultBotUser().sendPublicMessage(message);

    // Nachricht speichern
    this.saveMessage(user, message);

    // Nachricht an die Channelbesitzer senden
    var channelOwners = KnuddelsServer.getChannel().getChannelConfiguration().getChannelRights().getChannelOwners();
    if (channelOwners && channelOwners.length > 0) {
      var notificationMessage = "Benutzer '" + user.getNick() + "' hat /botsay verwendet:\n" + message;
      for (var i = 0; i < channelOwners.length; i++) {
        var ownerNick = channelOwners[i];
        // Nachricht an den Channelbesitzer senden
        KnuddelsServer.getDefaultBotUser().sendPrivateMessage(notificationMessage, ownerNick);
      }
    } else {
      App.log("Konnte die Nicknamen der Channelbesitzer nicht abrufen.");
    }
  },

  /**
   * Funktion: saveMessage
   * Beschreibung: Speichert die Nachricht zusammen mit Zeitstempel und Benutzername.
   * Parameter:
   *   - user: Der Benutzer, der die Nachricht gesendet hat.
   *   - message: Die Nachricht, die gesendet wurde.
   */
  saveMessage: function(user, message) {
    // Aktuelle Zeit in Millisekunden
    var timestamp = new Date().getTime();

    // Neue Nachricht
    var newMessage = {
      user: user.getNick(),
      message: message,
      timestamp: timestamp
    };

    // Nachrichten aus der Persistenz laden
    var persistedMessages = KnuddelsServer.getPersistence().getObject('botsayMessages', []);

    // Neue Nachricht hinzufügen
    persistedMessages.push(newMessage);

    // Persistierte Nachrichten aktualisieren
    KnuddelsServer.getPersistence().setObject('botsayMessages', persistedMessages);

    // Alte Nachrichten löschen
    this.cleanupMessages();
  },

  /**
   * Funktion: getStoredMessages
   * Beschreibung: Gibt die aktuell gespeicherten Nachrichten zurück.
   * Rückgabewert: Array der gespeicherten Nachrichten.
   */
  getStoredMessages: function() {
    return KnuddelsServer.getPersistence().getObject('botsayMessages', []);
  },

  /**
   * Funktion: cleanupMessages
   * Beschreibung: Entfernt Nachrichten, die älter als der definierte Zeitraum sind.
   */
  cleanupMessages: function() {
    // Definiere den Zeitraum in Millisekunden (z.B. 48 Stunden)
    var retentionPeriod = 48 * 60 * 60 * 1000; // 48 Stunden

    // Aktuelle Zeit
    var now = new Date().getTime();

    // Nachrichten aus der Persistenz laden
    var persistedMessages = KnuddelsServer.getPersistence().getObject('botsayMessages', []);

    // Nachrichten filtern
    var recentMessages = persistedMessages.filter(function(msg) {
      return now - msg.timestamp <= retentionPeriod;
    });

    // Aktualisierte Nachrichten speichern
    KnuddelsServer.getPersistence().setObject('botsayMessages', recentMessages);
  },

  /**
   * Funktion: saveAllowedUsers
   * Beschreibung: Speichert die aktuelle Liste der erlaubten Benutzer in der Persistenz.
   */
  saveAllowedUsers: function() {
    if (App.modules.Persistence && typeof App.modules.Persistence.setAllowedUsers === 'function') {
      App.modules.Persistence.setAllowedUsers(this.allowedUsers);
    } else {
      App.log('Botsay: Konnte allowedUsers nicht in der Persistenz speichern. Persistence-Modul nicht verfügbar.');
    }
  },

  /**
   * Funktion: addUser
   * Beschreibung: Fügt einen Benutzer zur Liste der erlaubten Benutzer hinzu.
   * Parameter:
   *   - user: Das User-Objekt des ausführenden Benutzers.
   *   - nick: Der Nickname des hinzuzufügenden Benutzers.
   */
  addUser: function(user, nick) {
    if (!nick) {
      user.sendPrivateMessage("Bitte gib einen gültigen Nicknamen an.");
      return;
    }
    if (!this.allowedUsers.includes(nick)) {
      this.allowedUsers.push(nick);
      this.saveAllowedUsers(); // Speichern nach Änderung
      user.sendPrivateMessage(nick + " wurde für /botsay freigeschaltet.");
    } else {
      user.sendPrivateMessage(nick + " ist bereits für /botsay freigeschaltet.");
    }
  },

  /**
   * Funktion: removeUser
   * Beschreibung: Entfernt einen Benutzer aus der Liste der erlaubten Benutzer.
   * Parameter:
   *   - user: Das User-Objekt des ausführenden Benutzers.
   *   - nick: Der Nickname des zu entfernenden Benutzers.
   */
  removeUser: function(user, nick) {
    if (!nick) {
      user.sendPrivateMessage("Bitte gib einen gültigen Nicknamen an.");
      return;
    }
    var index = this.allowedUsers.indexOf(nick);
    if (index !== -1) {
      this.allowedUsers.splice(index, 1);
      this.saveAllowedUsers(); // Speichern nach Änderung
      user.sendPrivateMessage(nick + " wurde für /botsay gesperrt.");
    } else {
      user.sendPrivateMessage(nick + " war nicht für /botsay freigeschaltet.");
    }
  },

  /**
   * Funktion: isUserAllowed
   * Beschreibung: Überprüft, ob ein Benutzer berechtigt ist, den /botsay-Befehl zu verwenden.
   * Parameter:
   *   - user: Das User-Objekt des zu prüfenden Benutzers.
   * Rückgabewert: true, wenn der Benutzer berechtigt ist; false, andernfalls.
   */
  isUserAllowed: function(user) {
    // Berechtigungslogik:
    // - Channelbesitzer haben immer Zugriff
    // - App-Manager haben Zugriff, es sei denn, sie sind explizit in allowedUsers gesperrt
    // - Jeder andere Benutzer muss explizit in allowedUsers freigeschaltet sein
    return (
      user.isChannelOwner() ||
      (user.isAppManager() && !this.allowedUsers.includes(user.getNick())) ||
      this.allowedUsers.includes(user.getNick())
    );
  }
};

// Modul initialisieren
App.modules.Botsay.init();
