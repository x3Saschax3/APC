// Variablen definieren
var bot = KnuddelsServer.getDefaultBotUser();

// App-Objekt initialisieren oder erweitern
var App = App || {};
App.chatCommands = App.chatCommands || {};
App.modules = App.modules || {};

// Log-Funktion definieren
App.log = function(message) {
  KnuddelsServer.getDefaultLogger().info(message);
};

// Funktion zum Laden von Modulen mit Fehlerbehandlung
App.loadModules = function() {
  function safeRequire(module) {
    try {
      require(module);
      App.log('Modul erfolgreich geladen: ' + module);
    } catch (error) {
      App.log('Fehler beim Laden des Moduls: ' + module + ' - ' + error);
    }
  }

  // Module laden
  safeRequire('Module/Persistence.js');  // WICHTIG: Persistence-Modul laden
  safeRequire('Module/Botsay.js');
  //safeRequire('Module/help.js');
  //safeRequire('Module/UserManagement.js');
  // Weitere Module bei Bedarf laden
};

// Benutzerbenachrichtigung bei Neustart, Stopp oder Update
App.notifyUsers = function(message) {
  KnuddelsServer.getChannel().sendPublicMessage(message);
};

// Module laden
App.loadModules();

// Ausgelagerte Befehle und Event-Dateien laden
require('commands/commands.js');       // Chat-Befehle nach Modulen laden
require('configs/onAppStart.js');      // App-Start-Konfiguration
require('configs/onEvents.js');        // Event-Handler

// Entferne den manuellen Aufruf von App.onAppStart(), da Knuddels dies automatisch übernimmt
// if (typeof App.onAppStart === 'function') {
//   App.onAppStart();
// } else {
//   App.log('Warnung: App.onAppStart ist nicht definiert.');
// }

// Befehle zum Steuern der App
App.chatCommands.restart = function(user) {
  if (App.eventStatus && App.eventStatus.isActive) {
    user.sendPrivateMessage("Ein Event läuft aktuell. Die App wird neugestartet, das Event wird fortgesetzt.");
  }
  if (user.isChannelOwner() || user.isAppManager()) {
    App.notifyUsers("Die App wird in 10 Sekunden neugestartet. Bitte speichert eure Arbeit.");
    setTimeout(function() {
      App.log("Restarting app...");
      KnuddelsServer.getAppAccess().restartApp();
    }, 10000);
  } else {
    user.sendPrivateMessage("Du hast keine Berechtigung, die App neu zu starten.");
  }
};

App.chatCommands.stop = function(user) {
  if (App.eventStatus && App.eventStatus.isActive) {
    user.sendPrivateMessage("Ein Event läuft aktuell. Möchtest du die App trotzdem stoppen?");
    // Eventuelle Bestätigung des Benutzers einholen
  }
  if (user.isChannelOwner() || user.isAppManager()) {
    App.notifyUsers("Die App wird in 10 Sekunden gestoppt. Bitte speichert eure Arbeit.");
    setTimeout(function() {
      App.log("Stopping app...");
      KnuddelsServer.getAppAccess().stopApp();
    }, 10000);
  } else {
    user.sendPrivateMessage("Du hast keine Berechtigung, die App zu stoppen.");
  }
};

App.chatCommands.toggleModule = function(user, params) {
  if (!user.isChannelOwner()) {
    user.sendPrivateMessage("Nur der Channel-Besitzer kann Module ein- oder ausschalten.");
    return;
  }
  if (!params) {
    user.sendPrivateMessage("Bitte gib den Modulnamen und die Aktion (on/off) an.");
    return;
  }

  var [moduleName, action] = params.split(" ");
  if (!moduleName || !["on", "off"].includes(action)) {
    user.sendPrivateMessage("Bitte verwende das Format '/toggleModule Modulname on/off'.");
    return;
  }

  var module = App.modules[moduleName];
  if (module) {
    module.enabled = action === "on";
    user.sendPrivateMessage(`${moduleName} wurde ${action === "on" ? "aktiviert" : "deaktiviert"}.`);
    App.log(`Modul '${moduleName}' wurde von ${user.getNick()} ${action === "on" ? "aktiviert" : "deaktiviert"}.`);
  } else {
    user.sendPrivateMessage(`Modul '${moduleName}' existiert nicht.`);
  }
};
