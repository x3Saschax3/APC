// Sicherstellen, dass App.chatCommands existiert
App.chatCommands = App.chatCommands || {};

// /botsay Befehl registrieren (unverändert)
App.chatCommands.botsay = function(user, params, command) {
  // Überprüfen, ob das Botsay-Modul aktiviert ist
  if (!App.modules.Botsay || !App.modules.Botsay.enabled) {
    user.sendPrivateMessage("Der /botsay-Befehl ist derzeit nicht verfügbar.");
    return;
  }

  // Nachricht verarbeiten
  var message = params;

  // Botsay-Funktion aufrufen
  App.modules.Botsay.sendBotMessage(user, message);
};

// /botsayadmin_h Befehl für das Öffnen des HTML-UI registrieren
App.chatCommands.botsayadmin_h = function(user, params, command) {
  // Nur der Channelbesitzer kann diesen Befehl verwenden
  if (!user.isChannelOwner()) {
    user.sendPrivateMessage("Nur der Channel-Besitzer kann diesen Befehl verwenden.");
    return;
  }

  // HTML-Datei öffnen
  var adminFile = new HTMLFile('botsayadmin.html'); // Pfad zur HTML-Datei
  var appContent = AppContent.popupContent(adminFile, 800, 600); // Größe des Popups festlegen
  user.sendAppContent(appContent);
};

// API-Endpunkte für das HTML-UI registrieren
App.chatCommands.botsayadmin_api = function(user, params, command) {
  // Parameter verarbeiten
  var args = params.trim().split(" ");
  var action = args[0];
  var arg = args.slice(1).join(" "); // Falls der Nickname Leerzeichen enthält

  switch (action) {
    case "allow":
      App.modules.Botsay.addUser(user, arg);
      user.sendPrivateMessage(`Benutzer ${arg} wurde für /botsay freigeschaltet.`);
      break;

    case "disallow":
      App.modules.Botsay.removeUser(user, arg);
      user.sendPrivateMessage(`Benutzer ${arg} wurde für /botsay gesperrt.`);
      break;

    case "clearMessages":
      KnuddelsServer.getPersistence().delete('botsayMessages');
      user.sendPrivateMessage("Alle gespeicherten Nachrichten wurden gelöscht.");
      break;

    case "messages":
      var messages = App.modules.Botsay.getStoredMessages();
      var messageList = messages.map(msg => {
        var date = getBerlinTime(msg.timestamp);
        var dateString = 
          ("0" + date.getDate()).slice(-2) + "." +
          ("0" + (date.getMonth() + 1)).slice(-2) + "." +
          date.getFullYear() + " " +
          ("0" + date.getHours()).slice(-2) + ":" +
          ("0" + date.getMinutes()).slice(-2) + ":" +
          ("0" + date.getSeconds()).slice(-2);
        return `[${dateString}] ${msg.user}: ${msg.message}`;
      }).join("\n");
      user.sendAppContent(AppContent.overlayContent(messageList));
      break;

    case "list":
      var allowedUsers = App.modules.Botsay.allowedUsers;
      var userList = allowedUsers.length === 0 ? "Es sind keine Benutzer für /botsay freigeschaltet." : "Freigeschaltete Benutzer für /botsay:\n" + allowedUsers.join("\n");
      user.sendAppContent(AppContent.overlayContent(userList));
      break;

    case "clean":
      var cleanedCount = 0;
      var allowedUsersCopy = App.modules.Botsay.allowedUsers.slice(); // Kopie der Liste erstellen
      allowedUsersCopy.forEach(function(nick) {
        var userId = KnuddelsServer.getUserId(nick);
        if (userId === null) {
          App.modules.Botsay.allowedUsers.splice(App.modules.Botsay.allowedUsers.indexOf(nick), 1);
          cleanedCount++;
        }
      });
      App.modules.Botsay.saveAllowedUsers();
      user.sendPrivateMessage(`Bereinigung abgeschlossen. ${cleanedCount} ungültige Benutzer wurden entfernt.`);
      break;

    case "clearUsers":
      if (arg === "confirm") {
        App.modules.Botsay.allowedUsers = [];
        App.modules.Botsay.saveAllowedUsers();
        user.sendPrivateMessage("Alle Benutzer wurden aus der /botsay-Liste entfernt.");
      } else {
        user.sendPrivateMessage("Bitte bestätige das Löschen aller Benutzer mit '/botsayadmin_api clearUsers confirm'.");
      }
      break;

    default:
      user.sendPrivateMessage("Unbekannte Aktion.");
      break;
  }
};

// Funktion zur Berechnung der Berliner Zeit mit Sommerzeitkorrektur
function getBerlinTime(timestamp) {
  var date = new Date(timestamp);
  var year = date.getUTCFullYear();

  // Berechne den letzten Sonntag im März (Beginn der Sommerzeit)
  var startDST = new Date(Date.UTC(year, 2, 31));
  while (startDST.getUTCDay() !== 0) {
    startDST.setUTCDate(startDST.getUTCDate() - 1);
  }
  startDST.setUTCHours(1, 0, 0, 0); // 1:00 UTC (2:00 lokale Zeit)

  // Berechne den letzten Sonntag im Oktober (Ende der Sommerzeit)
  var endDST = new Date(Date.UTC(year, 9, 31));
  while (endDST.getUTCDay() !== 0) {
    endDST.setUTCDate(endDST.getUTCDate() - 1);
  }
  endDST.setUTCHours(1, 0, 0, 0); // 1:00 UTC (2:00 lokale Zeit)

  // Überprüfen, ob die angegebene Zeit in der Sommerzeit liegt
  var isDST = (date.getTime() >= startDST.getTime()) && (date.getTime() < endDST.getTime());

  // Zeitverschiebung bestimmen
  var offset = isDST ? 3600000 : 0; // 1 Stunde für Sommerzeit, 0 Stunden für Winterzeit

  // Berliner Zeit berechnen
  var berlinTime = new Date(date.getTime() + offset);

  return berlinTime;
}

// /botsayadmin Befehl für den Channelbesitzer registrieren
App.chatCommands.botsayadmin = function(user, params, command) {
  // Nur der Channelbesitzer kann diesen Befehl verwenden
  if (!user.isChannelOwner()) {
    user.sendPrivateMessage("Nur der Channel-Besitzer kann diesen Befehl verwenden.");
    return;
  }

  // Parameter verarbeiten
  var args = params.trim().split(" ");
  var subCommand = args[0];
  var arg = args.slice(1).join(" "); // Falls der Nickname Leerzeichen enthält

  switch (subCommand) {
    case "allow":
      if (!arg) {
        user.sendPrivateMessage("Bitte gib den Nickname des Benutzers an, den du freischalten möchtest.");
        return;
      }
      App.modules.Botsay.addUser(user, arg);
      break;

    case "disallow":
      if (!arg) {
        user.sendPrivateMessage("Bitte gib den Nickname des Benutzers an, den du sperren möchtest.");
        return;
      }
      App.modules.Botsay.removeUser(user, arg);
      break;

    case "messages":
      var messages = App.modules.Botsay.getStoredMessages();
      if (messages.length === 0) {
        user.sendPrivateMessage("Es sind keine gespeicherten Nachrichten vorhanden.");
      } else {
        user.sendPrivateMessage("Gespeicherte Nachrichten:");
        messages.forEach(function(msg) {
          var date = getBerlinTime(msg.timestamp);
          var dateString =
            ("0" + date.getDate()).slice(-2) + "." +
            ("0" + (date.getMonth() + 1)).slice(-2) + "." +
            date.getFullYear() + " " +
            ("0" + date.getHours()).slice(-2) + ":" +
            ("0" + date.getMinutes()).slice(-2) + ":" +
            ("0" + date.getSeconds()).slice(-2);

          user.sendPrivateMessage(
            `[${dateString}] ${msg.user}: ${msg.message}`
          );
        });
      }
      break;

    case "clearMessages":
      KnuddelsServer.getPersistence().delete('botsayMessages');
      user.sendPrivateMessage("Alle gespeicherten Nachrichten wurden gelöscht.");
      break;

    case "list":
      var allowedUsers = App.modules.Botsay.allowedUsers;
      if (allowedUsers.length === 0) {
        user.sendPrivateMessage("Es sind keine Benutzer für /botsay freigeschaltet.");
      } else {
        user.sendPrivateMessage("Freigeschaltete Benutzer für /botsay:");
        allowedUsers.forEach(function(nick) {
          user.sendPrivateMessage("- " + nick);
        });
      }
      break;

    case "clean":
      // Bereinigt die allowedUsers-Liste von ungültigen Benutzern
      var cleanedCount = 0;
      var allowedUsersCopy = App.modules.Botsay.allowedUsers.slice(); // Kopie der Liste erstellen
      allowedUsersCopy.forEach(function(nick) {
        var userId = KnuddelsServer.getUserId(nick);
        if (userId === null) {
          // Benutzer existiert nicht, entfernen
          App.modules.Botsay.allowedUsers.splice(App.modules.Botsay.allowedUsers.indexOf(nick), 1);
          cleanedCount++;
        }
      });
      App.modules.Botsay.saveAllowedUsers();
      user.sendPrivateMessage(`Bereinigung abgeschlossen. ${cleanedCount} ungültige Benutzer wurden entfernt.`);
      break;

    case "clearUsers":
      if (arg === "confirm") {
        // Alle Benutzer entfernen
        App.modules.Botsay.allowedUsers = [];
        App.modules.Botsay.saveAllowedUsers();
        user.sendPrivateMessage("Alle Benutzer wurden aus der /botsay-Liste entfernt.");
      } else {
        user.sendPrivateMessage("Bist du sicher, dass du **alle** Benutzer entfernen möchtest?");
        user.sendPrivateMessage("Gib '/botsayadmin clearUsers confirm' ein, um dies zu bestätigen.");
      }
      break;

    default:
      user.sendPrivateMessage("Verfügbare Befehle:");
      user.sendPrivateMessage("/botsay [Text] - Gibt öffentliche Nachrichten aus");
      user.sendPrivateMessage("/botsayadmin allow [NICK] - Benutzer freischalten");
      user.sendPrivateMessage("/botsayadmin disallow [NICK] - Benutzer sperren");
      user.sendPrivateMessage("/botsayadmin messages - Gespeicherte Nachrichten anzeigen");
      user.sendPrivateMessage("/botsayadmin clearMessages - Gespeicherte Nachrichten löschen");
      user.sendPrivateMessage("/botsayadmin list - Freigeschaltete Benutzer anzeigen");
      user.sendPrivateMessage("/botsayadmin clean - Ungültige Benutzer aus der Liste entfernen");
      user.sendPrivateMessage("/botsayadmin clearUsers - Alle Benutzer aus der Liste entfernen");
      break;
  }
};
