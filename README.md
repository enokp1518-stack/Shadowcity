# 🌃 SHADOW CITY — Neon Legends

Un jeu open-world 3D type GTA, **optimisé mobile**, en un seul projet statique (HTML/JS + Three.js).
Rendu 3D temps réel avec qualité **Perf / HD / Ultra 4K** adaptative, cycle jour/nuit, néons, ombres dynamiques.

## 🚀 Lancer le jeu

Aucune installation nécessaire — ce sont des fichiers statiques :

```bash
cd shadow-city
npx serve .            # ou : python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080` sur ton PC… ou ton téléphone (même réseau Wi-Fi).
Sur mobile : « Ajouter à l'écran d'accueil » pour un rendu plein écran type app.

## 🎮 Contrôles

| Mobile | PC |
|---|---|
| Joystick gauche : se déplacer / conduire | ZQSD / WASD / flèches |
| Glisser à droite : caméra | Souris (clic pour capturer) |
| 🔥 Tir (maintenir) | Clic gauche |
| 🎯 Viser (maintenir) | Clic droit |
| ⬆ Saut / frein à main | Espace |
| 🚗 Entrer / sortir d'un véhicule, interagir | E |
| 🔁 Changer d'arme | Q ou molette |
| 📱 Téléphone (tout le jeu est dedans) | TAB |
| 🎥 Démarrer/arrêter l'enregistrement | T |
| 🧪 Medkit | H |
| Pause | Échap |

## 🗺️ Le monde

- **5 quartiers** avec gangs à conquérir : Downtown (Les Fantômes), Les Docks (Crimson), Zone Industrielle (Iron Wolves), Green Heights (Les Vipères), Neon Strip (Neon Kings).
- Trafic, piétons, police avec niveau de recherche (5 étoiles), jour/nuit, étoiles, néons.
- Marqueurs colorés : armurerie, animalerie, dealer d'artefacts, arène, rift, courses, business.

## 🔫 Armures… euh, arsenal

8 armes de base (poings, batte, P-9, Spectre SMG, Brise-Nez, AK-Neon, Longvue, Guerrier RPG)
et **5 armes exclusives** :

- ★ **Faucheuse Écarlate** — capture les 5 territoires
- ★ **Rail-X** — canon électromagnétique (niveau 10)
- ★ **AK Dorée** — 1 million d'abonnés YouTube
- ★ **Souffle du Dragon** — à acheter au casino (250 000 $)
- ★ **Canon du Vide** — vaincs le Golem du Rift

## 🐾 Animaux & 🔮 Artefacts

5 animaux avec bonus (chien aimant à billets, faucon radar, panthère combattante, bébé dragon cracheur de feu, chat-robot +10% revenus) et 6 artefacts à équiper (3 max) : dégâts, vitesse, régénération, revenus, discrétion…

## 📦 Empire « Schedule » (Cartel)

Inspiré de Schedule 1 & 2, un cycle complet de narco-empire (fictif et stylisé) :

- **Propriétés** : Grow House (6 pots), Grow Deluxe (12 pots), Labo clandestin, Planque (+stockage, raids réduits).
- **Culture** : 3 variétés (Amnésia, OG Kush, Purp Néon) — plante, arrose (sinon croissance ÷7 et qualité en chute), récolte. Les plants poussent en 3D devant ta propriété !
- **Labo** : 4 recettes (Crystal Néon, Poudre Étoile, Néon Juice, Néon Pur) — réactifs + récolte → produits premium.
- **Vente** : clients dans la rue (blips 💰 sur la minimap), prix = base × qualité × demande du quartier. Chaque vente génère du **heat** — à 85%+, raides et saisies.
- **Argent sale** : les ventes paient en argent sale → **blanchiment** via tes business (85%, 2 000$/min par business).
- **Dealers** : recrute un dealer par quartier (vente auto), fournis-leur du stock.
- **Contrats** : commandes groupées chronométrées → bonus + réputation (débloque variétés et recettes).
- **Convois** : envoie 15 unités en ville pour +50% de valeur… avec risque de contrôle policier.

## 💼 Business & 📺 Carrière de YouTubeur

- 6 entreprises achetables (lavage, station-service, pizzeria, garage, club, casino) avec revenus passifs à encaisser.
- Chaîne **ShadowTV** : filme tes exploits (🔥 REC), publie, gagne abonnés, vues et argent publicitaire. Paliers : sponsoring, chat-robot, AK Dorée, bouton de diamant.

## 🎲 Modes de jeu

Histoire (10 contrats) • Free Roam • Guerre des gangs (capture de territoires) • Survie par vagues à l'Arène des Bêtes • 3 Courses de rue • Boss du Rift.

## ⚙️ Optimisation mobile

- Résolution adaptative automatique (si les chutes de FPS, la résolution baisse) + 3 presets qualité jusqu'au rendu 4K (DPR ×3).
- Brouillard de distance réglé par preset, ombres désactivables, audio synthétisé WebAudio (zéro asset à charger).
- Sauvegarde automatique locale (localStorage) à chaque contrat réussi.

## 🧪 Tests

```bash
node test/harness.js
```
Harnais Node qui simule DOM + entrées et joue réellement au jeu : marche, tir, conduite, guerre des gangs, survie, course, YouTube, économie, boss, sauvegarde.
