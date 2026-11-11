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
- Trafic, piétons, police avec niveau de recherche (5 étoiles) : sème-la ou te fais **arrêter** (amende) — sirène et gyrophares quand elle est sur toi.
- **Cycle jour/nuit complet** : soleil et lune visibles, nuages animés, fenêtres et néons qui s'allument la nuit, phares de voiture de nuit.
- Marqueurs colorés : armurerie, animalerie, dealer d'artefacts, arène, rift, courses, business.

## 🔫 Armures… euh, arsenal

**19 armes** : poings, batte, P-9, Spectre SMG, Brise-Nez, AK-Neon, Longvue, Guerrier RPG, Katana Néon, lance-grenades GL-6,
**Machette Biker**, **Minigun Béhémoth** (150 cartouches), **Lance-Flammes Inferno** (enflamme les ennemis)
et **6 armes exclusives** :

- ★ **Faucheuse Écarlate** — capture les 5 territoires
- ★ **Rail-X** — canon électromagnétique (niveau 10)
- ★ **AK Dorée** — 1 million d'abonnés YouTube
- ★ **Souffle du Dragon** — à acheter au casino (250 000 $)
- ★ **Canon du Vide** — vaincs le Golem du Rift
- ★ **Fusil Plasma** — technologie du Rift (niveau 15, 300 000 $)

## 🐾 Animaux & 🔮 Artefacts

**12 animaux** avec bonus : chien aimant à billets, faucon radar, panthère combattante, bébé dragon cracheur de feu, loup alpha, chouette sage (+20% XP), chat-robot, **licorne** (+15% revenus + régén), **ours** (-25% dégâts subis), **cobra** (attaque empoisonnée), **chauve-souris** (radar total), **tortue** (+régénération, +10% XP).

**14 artefacts** à équiper (3 max) avec de vrais **pouvoirs** :
- ☥ **Ankh** — *résurrection* : tu te releves une fois toutes les 5 minutes avec 50% de PV
- ⚡ **Colère de Zeus** — foudroie l'ennemi le plus proche (45 dégâts toutes les 5s)
- ⏱ **Chronos** — cultures et labo +30% plus rapides, +15% revenus
- ❄ **Gel Éternel** — ralentit les ennemis proches de 40%
- 🧛 **Sang de Vampire** — vole 10% des dégâts infligés en PV
- 🥷 **Ombre Ninja** — +15% vitesse et saut boosté
- Plus : dégâts, vitesse, régénération, revenus, discrétion, Œil du Faucon, Cœur de Titan, Void...

## 📦 Empire « Schedule » (Cartel)

Inspiré de Schedule 1 & 2, un cycle complet de narco-empire (fictif et stylisé) :

- **Propriétés** : Grow House (6 pots), Grow Deluxe (12 pots), Labo clandestin, Planque (+stockage, raids réduits).
- **Culture** : 5 variétés (Amnésia, OG Kush, Purp Néon, Néon Haze, Frost Bleu) — plante, arrose (sinon croissance ÷7 et qualité en chute), récolte. Les plants poussent en 3D devant ta propriété !
- **Labo** : 6 recettes (Crystal Néon, Poudre Étoile, Néon Juice, Néon Pur, Élixir Fantôme, Nova Cristal) — réactifs + récolte → produits premium.
- **Vente** : clients dans la rue (blips 💰 sur la minimap), prix = base × qualité × demande du quartier. Chaque vente génère du **heat** — à 85%+, raides et saisies.
- **Argent sale** : les ventes paient en argent sale → **blanchiment** via tes business (85%, 2 000$/min par business).
- **Dealers** : recrute un dealer par quartier (vente auto), fournis-leur du stock et **améliore-les niveau 1→3** (2, 4 puis 6 unités/min).
- 💜 **Clients fidèles** : vends 3 fois au même client et il devient fidèle — il rachète tout seul ton meilleur produit à prix premium (+30%) quand tu passes près de lui.
- **Contrats** : commandes groupées chronométrées → bonus + réputation (débloque variétés et recettes).
- **Convois** : envoie 15 unités en ville pour +50% de valeur… avec risque de contrôle policier.
- **Raids rivaux** : toutes les ~8 minutes, un cartel rival attaque ta grow house — défends-la en 90s (+10 réputation) ou perds 30% de tes produits.
- 🥬 **Potager (100% légal)** : achète le potager de Green Heights (6 pots), plante carottes, tomates, maïs doré ou citrouilles, récolte 3 légumes/pot et vends en **argent propre**. Les quêtes d'habitants peuvent en demander !

## 💼 Business & 📺 Carrière de YouTubeur

- 6 entreprises achetables (lavage, station-service, pizzeria, garage, club, casino) avec revenus passifs à encaisser et **3 niveaux d'amélioration** (+50% de revenu/niveau, onglet Business > 🔧 Améliorer).
- Chaîne **ShadowTV** : filme tes exploits (🔥 REC), publie, gagne abonnés, vues et argent publicitaire. Paliers : sponsoring, chat-robot, AK Dorée, bouton de diamant.
- 🔴 **Live streaming** : lance un direct depuis l'onglet YouTube — dons d'abonnés en temps réel, et tes exploits (courses, guerres, raids, jobs) boostent l'audience du live.

## 🎲 Modes de jeu

Histoire (10 contrats) • Free Roam • Guerre des gangs (capture de territoires) • Survie par vagues à l'Arène des Bêtes • 3 Courses de rue • Boss du Rift.

## 💼 Jobs, métiers & véhicules

- **5 métiers** (onglet 💼 Jobs) : Livreur de Pizza (3 livraisons), Coursier Express (4 colis), Éboueur Municipal (5 collectes en camion), Chauffeur de Bus (4 arrêts), Paramédical (3 blessés à soigner en ambulance). Paie + bonus de niveau, marqueur jaune guidant chaque étape.
- **Shifts d'entreprise** : travaille 20s dans chacun de tes business pour un salaire basé sur son revenu.
- ❓ **Quêtes de PNJ** : des habitants (point violet sur la minimap) te demandent livraisons, règlements de comptes, **améliorations de bâtiments**, récoltes au potager ou secours de blessés — argent + XP à la clé.
- **Missions taxi** : au volant d'un taxi, récupère des clients et dépose-les — tarif = 100$ + 0,5$/m.
- **16 véhicules** : berlines, sportives, taxi, moto Foudre, **Hyperion X** (supercar 150 000 $), SUV, pickup, **limousine**, bus urbain, camion poubelles et ambulance de service.
- **SWAT** déployé dès 4 étoiles de recherche, arrestations si tu restes au sol face à la police.
- 📻 **Radio embarquée** : 4 stations synthétisées en temps réel (Shadow FM synthwave, Boom Bap 103 hip-hop, Nuit Étoilée lo-fi, Voltage Rock électro) — touche **M** ou Réglages pour zapper, en voiture !

## 🎰 Casino & météo

- **Casino** (onglet dédié) : machines à sous — mises 100/500/1000$, gains jusqu'à ×20.
- **Pluie dynamique** : le ciel s'assombrit, le brouillard se resserre et la route glisse (grippage réduit, dérapages).
- **Tenues** : change la couleur de ta tenue dans Réglages.
- **16 succès** avec récompenses en argent (liste dans l'onglet Contrats) : dont Travailleur (5 jobs), Bon samaritain (5 quêtes), Marâcher (50 légumes) et Mélomane (toutes les stations de radio).

## 💰 Publicité & Premium

- Une **publicité toutes les 10 minutes** de jeu (passable après 5 secondes).
- **Shadow City Premium — 5,00 €** (paiement unique, démo simulée) : supprime définitivement toutes les pubs.

## ⚙️ Optimisation mobile

- Résolution adaptative automatique (si les chutes de FPS, la résolution baisse) + 3 presets qualité jusqu'au rendu 4K (DPR ×3).
- Brouillard de distance réglé par preset, ombres désactivables, audio synthétisé WebAudio (zéro asset à charger).
- **Sauvegarde automatique** (localStorage) : à chaque contrat réussi, toutes les 2 minutes, et quand l'app passe en arrière-plan.
- **Nouvelle partie propre** : « Nouvelle partie » réinitialise tout (argent, armes, business, cartel, abonnés, territoires).
- Testé par un harnais Node de 27 scénarios joués réellement (`node test/harness.js`).

## 🧪 Tests

```bash
node test/harness.js
```
Harnais Node qui simule DOM + entrées et joue réellement au jeu : marche, tir, conduite, guerre des gangs, survie, course, YouTube, économie, boss, sauvegarde, arrestations, casino, taxi, moto, pluie, raids rivaux, pubs, succès, jobs, shifts, quêtes de PNJ, amélioration de business, potager, live streaming, armes nouvelles, pouvoirs (Zeus, Ankh, burn), radio et remise à zéro complète.
