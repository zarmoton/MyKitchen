# 🥘 MyKitchen - "Qu'est-ce qu'on mange ?"

Application mobile **React Native (iOS & Android)** avec support Web, spécialement conçue pour résoudre le dilemme quotidien des repas en famille.

---

## ✨ Fonctionnalités Clés

### 1. 📅 Semaine vs 🕯️ Chabbat (Détection Automatique)
- **Détection intelligente du jour** :
  - **Mercredi, Jeudi, Vendredi** : bascule **automatiquement en mode Chabbat** par défaut pour anticiper les préparatifs du festin du vendredi soir et samedi midi.
  - **Samedi à Mardi** : mode **Semaine** par défaut.
  - Un sélecteur en haut permet de basculer manuellement entre Semaine et Chabbat à tout moment.

### 2. 🍲 Mode de Saisie Ultra-Simple & Intuitif
Pour ajouter un plat sans friction :
- **Plat complet** (Tout-en-un, ex : *Hachis Parmentier, Spaghetti Bolognaise, Pâtes aux fromages, Lasagnes*).
- **Plat à accompagner** (Ex : *Steak façon bouchère, Escalope panée, Saumon*). Si sélectionné, l'application vous invite automatiquement à choisir un accompagnement.
- **Accompagnement** (Ex : *Frites maison, Purée à la muscade, Haricots verts, Riz basmati*).
- **Dessert** (Ex : *Mousse au chocolat, Tiramisu, Makrouds, Salade d'oranges*).
- Classification par moment : *Semaine*, *Chabbat (Vendredi soir)*, *Chabbat (Samedi midi)*, ou *Les deux*.
- Classification culturelle : *Tunisien*, *Italien*, *Classique familial*.
- **Aucune gestion d'ingrédients ni de recettes fastidieuses** : on va droit au but !

### 3. 👑 Festin de Chabbat & Multi-Plats
- Chabbat permet de composer des tables festives avec **plusieurs plats simultanés** (ex : *Couscous bœuf & légumes + Boulettes au cumin + Poisson Chraïmé + Salade méchouia + Salade d'oranges*).
- Séparation souple entre repas du **Vendredi soir**, **Samedi midi** ou menu pour tout le Chabbat.
- Bouton *« Idée menu »* pour générer automatiquement une table traditionnelle en un clic.

### 4. 💡 Base de 163 Suggestions & Marquage Vert
- Plus de **160 idées authentiques** intégrées :
  - **Grands classiques tunisiens & juifs tunisiens** (*Couscous, Pkaïla, Dafina/Tfina, Mloukhiya, Nikitouche, Chraïmé, Boulettes cumin, Tajine tunisien, Slata Méchouia, Kémia navets roses, Brik, Fricassés, Makrouds...*).
  - **Cuisine italienne simple & savoureuse** (*Spaghetti Bolognaise, Carbonara, Arrabbiata, Lasagnes, Risotto champignons, Escalope milanaise, Parmigiana, Tiramisu...*).
  - **Plats réconforts du quotidien** (*Hachis Parmentier, Poulet rôti, Pavé de saumon, Burgers maison, Omelettes...*).
- **Ligne verte** : Dès qu'une idée est ajoutée à votre liste, sa carte devient **verte avec un badge ✓ Dans mes plats**. Vous pouvez l'ajouter ou la retirer d'un simple toucher.

### 5. 📜 Historique Séparé Semaine & Chabbat
- Dès qu'un repas est validé, il est archivé dans l'historique avec sa date exacte et ses plats.
- Filtre rapide pour consulter l'historique : **Tous | Semaine | Chabbat**.

---

## 🚀 Lancement & Utilisation

### Prérequis
- [Node.js](https://nodejs.org/) (v18+)

### Commandes

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer l'application
npm run start
```

### Tester sur votre smartphone (iPhone ou Android)
1. Installez l'application gratuite **Expo Go** sur votre iPhone (App Store) ou Android (Google Play).
2. Lancez `npm run start` dans le terminal.
3. Scannez le **QR Code** qui s'affiche à l'écran :
   - **Sur iPhone** : Ouvrez l'appareil photo iOS et touchez la bannière Expo Go.
   - **Sur Android** : Scannez le QR Code directement depuis l'application Expo Go.

### Tester sur navigateur Web
```bash
npm run web
```
L'application s'ouvrira directement sur `http://localhost:8081`.

