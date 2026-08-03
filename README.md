# FormaViva Home

Dashboard visuale installabile come add-on di Home Assistant.

## Funzioni MVP

- panoramica automatica delle entità;
- aree per luci, clima, prese, pulizia, sicurezza ed energia;
- ricerca dispositivi;
- comandi rapidi per luci, switch, prese e aspirapolvere;
- tema chiaro/scuro;
- layout responsive per smartphone, tablet e desktop;
- dati locali, senza cloud esterno.

## Installazione

1. Pubblica il contenuto di questa cartella nella radice di un repository GitHub.
2. In Home Assistant apri **Impostazioni → Applicazioni → Store applicazioni**.
3. Dal menu dei repository aggiungi l'URL GitHub.
4. Installa **FormaViva Home**, avviala e abilita la visualizzazione nella barra laterale.

## Struttura

- `repository.yaml`: descrizione del repository per Home Assistant.
- `formaviva_home/config.yaml`: manifest dell'add-on.
- `formaviva_home/Dockerfile`: immagine multiarchitettura.
- `formaviva_home/server.js`: ponte locale verso Home Assistant.
- `formaviva_home/public/`: dashboard web.

## Stato del progetto

Questa è la versione MVP 0.1.0. I comandi reali devono essere collaudati su un'istanza Home Assistant prima di distribuirla ad altri utenti.

## Sviluppo locale

La dashboard può essere aperta staticamente, ma senza Home Assistant mostra dati dimostrativi. Nell'add-on usa automaticamente `SUPERVISOR_TOKEN`.
