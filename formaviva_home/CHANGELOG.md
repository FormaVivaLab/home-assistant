# Changelog

## 0.1.3

- Corretto il processo Docker includendo `package-lock.json` prima di `npm ci`.
- Evitato il riutilizzo della build non riuscita della versione 0.1.2.

## 0.1.2

- Importazione automatica della dashboard `dashboard-alessandro`.
- Lettura della vista `home` tramite WebSocket Home Assistant.
- Nuova sezione HOME con le entità già presenti nella dashboard originale.
- Indicazione del numero di entità importate nello stato di connessione.

## 0.1.1

- Aggiunta la sezione Tutti senza limite di nove dispositivi.
- Aggiunte sezioni Tapparelle, Media e Sensori.
- Supporto esteso a cover, media player, fan, input boolean, tracker e meteo.
- La Panoramica ora mostra tutti i principali dispositivi controllabili.

## 0.1.0

- Prima dashboard responsive.
- Lettura automatica degli stati Home Assistant.
- Comandi rapidi per luci, switch, serrature e aspirapolvere.
- Sezioni dedicate a clima, sicurezza, energia e pulizia.
- Tema chiaro e scuro.
- Modalità dimostrativa fuori da Home Assistant.
