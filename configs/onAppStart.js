// App.onAppStart wird beim Start der App aufgerufen und initialisiert verschiedene Variablen und Objekte.
App.onAppStart = function() {
    App.log("App wird gestartet...");

    try {
        // Initialisierung verschiedener Standardobjekte und Variablen
        
        // Datenbank-Objekt für persistente Speicherung
        var db = KnuddelsServer.getPersistence(),
            
            // Standard-Logger-Objekt für das Schreiben von Log-Nachrichten
            logger = KnuddelsServer.getDefaultLogger(),
            
            // Zugriff auf Benutzerdaten
            userAccess = KnuddelsServer.getUserAccess(),
            
            // Channel-Objekt für den aktuellen Channel
            channel = KnuddelsServer.getChannel(),
            
            // Konfiguration des Channels
            channelConfiguration = channel.getChannelConfiguration(),
            
            // Channel-Rechte (Moderatorrechte, Channelbesitzer, etc.)
            channelRights = channelConfiguration.getChannelRights(),
            
            // Array mit den Channel-Moderatoren
            channelmoderatoren = channelRights.getChannelModerators(),
            
            // Channel-Design (z.B. Hintergrundfarbe, Schriftfarbe)
            channelDesign = channel.getChannelDesign(),
            
            // Name des Channels
            channelname = channel.getRootChannelName(),
            
            // Pfad für Bilder in der App
            pfad = KnuddelsServer.getFullImagePath(''),
            
            // Hintergrundfarbe des Channels
            backgroundColor = channelDesign.getBackgroundColor(),
            
            // Standard-Schriftfarbe des Channels
            defaultFontColor = channelDesign.getDefaultFontColor(),
            
            // Bot-Objekt (Standard-Bot, der als offizieller Bot-Nutzer auftritt)
            bot = KnuddelsServer.getDefaultBotUser(),
            
            // Boolean-Wert, der angibt, ob das System ein Testsystem ist
            testSystem = KnuddelsServer.getChatServerInfo().isTestSystem();
      
        App.log("Variablen und Objekte wurden erfolgreich initialisiert.");

        // Event-Status beim App-Start prüfen
        if (App.modules.Persistence && typeof App.modules.Persistence.getEventStatus === 'function') {
            App.eventStatus = App.modules.Persistence.getEventStatus();

            if (App.eventStatus && App.eventStatus.isActive) {
                App.log("Ein laufendes Event wurde erkannt. Event wird fortgesetzt...");
                // Hier die Logik zum Wiederaufnehmen des Events einfügen
            } else {
                App.log("Kein laufendes Event gefunden.");
            }
        } else {
            App.log("Warnung: Persistence-Modul ist nicht verfügbar. Event-Status kann nicht geprüft werden.");
        }

        // Array mit allen derzeit im Channel online befindlichen menschlichen Nutzern
        var humanOnlineUsers = KnuddelsServer.getChannel().getOnlineUsers(UserType.Human);
      
        // Schleife durch alle menschlichen Benutzer, die derzeit im Channel online sind
        for (var i in humanOnlineUsers) {
            var user = humanOnlineUsers[i];
            
            // Überprüfen, ob der Benutzer App-Entwickler oder App-Manager ist
            if (user.isAppDeveloper() || user.isAppManager()) {
                
                // Benutzer-spezifisches Persistenz-Objekt, falls nötig
                var uPers = user.getPersistence();
                
                // Beispiel für Daten, die an Entwickler oder App-Manager gesendet werden könnten
                var DATEN = {
                    testsystem: testSystem, // Information, ob es sich um ein Testsystem handelt
                    background: {
                        R: backgroundColor.getRed(),   // Rot-Wert der Hintergrundfarbe
                        G: backgroundColor.getGreen(), // Grün-Wert der Hintergrundfarbe
                        B: backgroundColor.getBlue()   // Blau-Wert der Hintergrundfarbe
                    }
                };
                
                // Hier könnte weiterer Code für Entwickler oder App-Manager eingefügt werden.
                // Beispiel: Informationen anzeigen, spezielle Hinweise oder Begrüßungen für diese Benutzergruppe.
            }
        }

        App.log("App-Start erfolgreich abgeschlossen.");
      
    } catch (error) {
        App.log("Fehler beim Start der App: " + error.message);
    }
};
