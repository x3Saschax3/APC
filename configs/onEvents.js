App.onEventReceived = function(user, key, data) {
    // Log-Nachricht, um das empfangene Event zu verfolgen
    App.log('Event empfangen: ' + key + ' von ' + user.getNick());

    try {
        switch (key) {
            case 'commandButton':
                switch (data.command.toString()) {
                    case 'sayHello':
                        sayHello(user);
                        App.log('Befehl "sayHello" ausgeführt für Benutzer: ' + user.getNick());
                        break;
                    case 'sayBye':
                        sayBye(user);
                        App.log('Befehl "sayBye" ausgeführt für Benutzer: ' + user.getNick());
                        break;
                    default:
                        App.log('Unbekannter Befehl: ' + data.command);
                        break;
                }
                break;
            default:
                App.log('Unbekanntes Event: ' + key);
                break;
        }
    } catch (error) {
        App.log('Fehler beim Verarbeiten des Events: ' + error.message);
    }
};
