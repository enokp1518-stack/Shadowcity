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

- **Textures PBR raccordables** incluses dans `textures/` (kit 1024×1024, générées par `tools/genTextures.js`) : **mur en briques rouges patinées avec mousse** (diffuse + normal map) et **béton sombre rugueux mat** (diffuse + normal map). Les murs des bâtiments de la ville utilisent ces deux matières (briques patinées / béton brut) derrière les fenêtres allumées.
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
- **Shadow City Premium — 5,00 €** : supprime définitivement toutes les pubs.

### 💳 Portefeuille créateur (PayPal)

Le joueur peut payer le Premium (5 €) ou faire un don via **PayPal.me** — l'argent arrive directement sur ton compte PayPal.

**Configuration (2 minutes)** :
1. Crée ton lien sur https://paypal.me/create (ou récupère ton nom d'utilisateur paypal.me)
2. Ouvre `js/core.js` et remplace la ligne `DEV_PAYPAL: ''` par `DEV_PAYPAL: 'ton-nom'` (le nom dans `paypal.me/ton-nom`)
3. Publie — les boutons « Payer 5€ » et « Donner » (Réglages > Portefeuille créateur) ouvrent ton PayPal

**Rester anonyme** : PayPal ne permet plus de renommer son lien paypal.me. Deux options :
- `DEV_DONATE_URL` (dans `js/core.js`) : mets une URL complète de page de don sous pseudonyme (ex : page Ko-fi `https://ko-fi.com/tonpseudo`, Liberapay, etc.). Si cette variable est remplie, elle est utilisée en priorité pour les boutons « Payer 5€ » et « Donner » — ton vrai nom n'apparaît jamais.
- Compte PayPal **Business** gratuit avec un nom d'entreprise (ex : « Shadow City Studio ») : les acheteurs voient le nom de l'entreprise au lieu du tien.

**Important** : le jeu étant 100% statique (sans serveur), l'activation du Premium après paiement se fait via le bouton « J'ai payé » (système d'honneur). Pour une validation automatique du paiement, il faudrait un serveur + un compte PayPal Business avec webhook — hors périmètre d'un site statique.

## 🌆 Mises à jour continues — plus de 50 nouveautés

**Ville vivante**
1. Fumée animée sortant des 5 cheminées d'usines
2. 10 feux tricolores avec cycle vert/rouge réel
3. Fontaines avec eau animée et jet
4. Arrêts de bus
5. Conteneurs colorés aux docks
6. Boîtes aux lettres dans les quartiers résidentiels
7. Climatiseurs sur les toits des grands immeubles
8. Lignes de bord de chaussée peintes
9. 4 panneaux publicitaires géants (Shadow Cola, Neon FM, Arseme's Guns, City Race GP)

**Personnages vivants**
10. Casquettes + visières pour les flics et le SWAT
11. Sacs à dos sur 30% des piétons
12. Les têtes observent autour d'elles au repos
13. Chute morte animée (plus de disparition instantanée)
14. Atterrissage amorti (flexion des genoux après une grande chute)
15. Bruits de pas (marche et course)
16. Boucle sonore de pluie

**Véhicules**
17. Gyrophares de police rouges/bleus clignotants
18. Patrouilles de police dans le trafic (davantage si tu es recherché)
19. Phares projecteurs allumés la nuit
20. Fumée d'échappement à l'accélération
21. Klaxons du trafic embouteillé

**Combat**
22. Dégâts flottants projetés en 3D
23. Headshots affichés en doré
24. Séries d'éliminations avec toasts 🔥
25. Colonnes de fumée sur chaque explosion
26. Medkits lâchés par les ennemis (soignent 40 PV)

**Ambiance nocturne**
27. Halo lumineux autour de la lune
28. Étoiles scintillantes
29. 42 lucioles dans Green Heights la nuit
30. Néons qui grésillent comme de vrais enseignes

**HUD & interface**
31. Compteur FPS (réglage dans les options)
32. Voitures affichées sur la minimap
33. Tes businesses affichés en vert sur la minimap
34. Mode photo (touche P) : interface masquée pour de belles captures
35. Version du jeu affichée dans le menu
36. 10 astuces rotatives sur l'écran d'accueil

**Beauté Ultime v1.1** (ciel shader + oiseaux, coudes/genoux/mains/chaussures, coups de poing réels avec particules, voitures laquées, halos de lampadaires, ombres 2048) et **Beauté Ultra** (visages détaillés, 5 expressions, dialogues avec voix et lip sync, sol détaillé, rendu cinéma ACES, SC-Upscale type DLSS, mobilier urbain) complètent le tableau : **plus de 60 nouveautés** au total.

## 🛠 Corrections de bugs (audit complet)

- **CRASH critique corrigé** : se faire arrêter (ou éliminer) par la police gelait le jeu — la liste des PNJ était vidée pendant sa propre boucle de mise à jour. Garde ajoutée + test de régression dédié (arrestation et mort déclenchées en pleine boucle)
- **Job terminé** : garde null sur la validation d'un job déjà annulé
- **Dealers** : messages de recrutement/fourniture sécurisés si le territoire est inconnu
- **Tests robustifiés** : hitscan sur route dégagée, marques de skid détectées par durée de vie, avion de ligne réinitialisé avant vérification
- **Audit statique complet** : toutes les références G.*/U.*/W.* vérifiées, tous les ids HTML confirmés, toutes les classes CSS utilisées par le JS existent, toutes les actions du téléphone testées, stress test 2000 frames avec événements aléatoires (pluie, nuit, wanted, explosions, klaxon, kills) — 0 erreur

## 🎨 Design continu — série 4 (updates 46-56)

- **Parapluies** : les passants (35%) ouvrent leur parapluie coloré dès qu'il pleut
- **Feux d'artifice** : explosions colorées régulières dans le ciel du Neon Strip la nuit
- **Food trucks** : camions-restaurants colorés avec enseignes lumineuses et auvents à Downtown
- **Asphalte mouillé** : le sol devient brillant et sombre sous la pluie
- **Chiens et chats errants** : 8 animaux qui se promènent, queues animées, fuient le joueur
- **Feux de détresse** : clignotants orange sur toutes les épaves
- **Bus Cityliner** : circulation dans le trafic avec livrée SHADOW TRANSIT et destination lumineuse
- **Feux arrière automatiques** : toutes les voitures allument leurs feux rouges dès la nuit
- **Étals du Neon Strip** : stands de rue avec enseignes néon et braseros vacillants
- **Éclats de vitre** : débris bleutés qui voltigent à chaque explosion

## 🎨 Design continu — série 3 (updates 32-44)

- **NITRO** (Maj) : surpuissance temporaire, flammes à l'échappement, FOV boosté
- **Feux de freinage** qui s'allument en rouge vif + feu blanc de marche arrière
- **Hélicoptère de police** à 4 étoiles : rotors animés, projecteur puissant qui balaie les rues
- **Dirigeable publicitaire** "SHADOW CITY" en orbite lente au-dessus de la ville
- **Avion de ligne** qui traverse le ciel à haute altitude avec ses traînées blanches
- **Vapeur** qui s'échappe des bouches d'égout
- **Onde de choc annulaire** + flash lumineux orange à chaque explosion
- **Grillons** la nuit à Green Heights (ambiance sonore dynamique)
- **Klaxon** du joueur (touche G) qui fait fuir les passants
- **Menu néon** animé + bandes ciné (letterbox) en mode photo
- **Pickups** (argent, medkits) visibles sur la minimap
- **Fumée de dégâts** : la voiture très endommagée fume noir
- **Bannières publicitaires** pendantes sur les murs de Downtown
- **Pigeons** qui picorent et s'envolent au passage du joueur

## 🎨 Design continu — série 2 (updates 14-30)

- **Marquage routier** : lignes centrales jaunes pointillées sur toutes les routes
- **Véhicules** : jantes chromées, enseigne de taxi lumineuse, livrée POLICE blanche, ailerons sur les sportives, épaves qui fument longtemps
- **Ombres de contact** sous tous les personnages (mieux ancrés au sol)
- **Orage** : éclairs qui illuminent la ville + grondements de tonnerre
- **Armes** : lumière de bouche à chaque tir, douilles éjectées avec gravité
- **Végétation** : arbres à étages de feuillage (4 teintes), touffes d'herbe à Green Heights
- **Neon Strip** : reflets colorés au sol et cônes de lumière néon sous les enseignes
- **Piétons stylés** : chapeaux colorés et lunettes de soleil
- **Caméra cinématique** : le champ de vision s'élargit à haute vitesse ; alerte rouge pulsante quand les PV sont bas
- **Traces de pneus** au freinage appuyé
- **Toits vivants** : antennes à balises rouges clignotantes, châteaux d'eau
- **Flaques de pluie** brillantes sur les routes
- **Grues portuaires animées** (bras pivotant, crochet suspendu)
- **Monument de Shadow City** : obélisque éclairé par un faisceau lumineux la nuit
- **Panneaux de rues nommés** (Rue Neon, Av. Crimson…) et cônes de chantier
- **Vitrines de commerces** lumineuses en pied d'immeuble à Downtown
- **Étoiles filantes** qui traversent le ciel nocturne

## 🌈 Beauté Ultime v1.1 — ciel, articulations, combat

- **Ciel dégradé temps réel** : dôme shader qui suit la caméra — horizon lumineux le jour, coucher de soleil orangé, nuit profonde. 7 oiseaux planent au-dessus de la ville en battant des ailes.
- **Articulations complètes** : bras en 2 segments avec **coudes**, jambes en 2 segments avec **genoux**, **mains** couleur peau et **chaussures** — flexion naturelle à la marche, à la course et en idle.
- **Coups de poing réels** : animation de punch (bras alternés + rotation du torse), **recul des ennemis** à l'impact, gerbe de particules rouges, secousse de caméra ; flash de particules à la bouche des armes à feu ; gravité sur toutes les particules d'impact.
- **Voitures laquées** : carrosserie brillante (Phong), vitres réfléchissantes bleutées, pare-chocs avant/arrière, toit, pneus brillants.
- **Halos lumineux** : chaque lampadaire brille d'un halo chaud la nuit.
- **Ombres HD 2048** en qualité Ultra.

## 🌈 Beauté Ultra — visages, dialogues, voix, SC-Upscale

- **Visages détaillés** : yeux, pupilles, sourcils, bouche, cheveux — 6 tons de peau, 7 couleurs de cheveux, textures faciales générées en canvas (cache partagé, coût GPU quasi nul).
- **Expressions** : neutre, content, **en colère** (sourcils froncés + dents serrées), **terrifié** (grands yeux), **lunettes noires** (dealers calmes). Les policiers et gangs passent en colère quand ils te chassent, les passants sont terrifiés quand ils fuient.
- **Dialogues + voix + synchronisation labiale** : bulles de dialogue projetées en 3D au-dessus des têtes, bouche qui s'ouvre/se ferme en rythme, et **voix synthétisées** WebAudio (pitch par type : flic grave, passant aigu, monstres gutturaux). Répliques françaises contextuelles par type et par humeur.
- **Sol amélioré** : asphalte granuleux, taches d'huile, plaques d'égout, trottoirs pavés, **pelouse texturée dans Green Heights**.
- **Rendu cinéma** : tone mapping ACES filmique, exposition calibrée, halo autour du soleil, anisotropie ×8.
- **SC-Upscale (type DLSS)** : rendu interne adaptatif (jusqu'à ×0.45) + amélioration contraste/saturation — fluide à 60 FPS même sur mobile, activable dans Réglages > Graphismes.
- **Props urbains** : arbres, bancs, poubelles, bornes incendie, caisses et barils par quartier (avec collisions).

## ⚙️ Optimisation mobile

- Résolution adaptative automatique (si les chutes de FPS, la résolution baisse) + 3 presets qualité jusqu'au rendu 4K (DPR ×3).
- Brouillard de distance réglé par preset, ombres désactivables, audio synthétisé WebAudio (zéro asset à charger).
- **Sauvegarde automatique** (localStorage) : à chaque contrat réussi, toutes les 2 minutes, et quand l'app passe en arrière-plan.
- **Nouvelle partie propre** : « Nouvelle partie » réinitialise tout (argent, armes, business, cartel, abonnés, territoires).
- Testé par un harnais Node de 28 scénarios joués réellement (`node test/harness.js`).

## 🧪 Tests

```bash
node test/harness.js
```
Harnais Node qui simule DOM + entrées et joue réellement au jeu : marche, tir, conduite, guerre des gangs, survie, course, YouTube, économie, boss, sauvegarde, arrestations, casino, taxi, moto, pluie, raids rivaux, pubs, succès, jobs, shifts, quêtes de PNJ, amélioration de business, potager, live streaming, armes nouvelles, pouvoirs (Zeus, Ankh, burn), radio et remise à zéro complète.
