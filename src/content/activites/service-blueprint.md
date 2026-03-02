---
title: "Service blueprint"
image: "https://images.unsplash.com/photo-1532102235608-dc8fc689c9ab?ixlib=rb-1.2.1&q=85&fm=jpg&crop=entropy&cs=srgb&ixid=eyJhcHBfaWQiOjYzOTIxfQ"
icon: "/activites/service-blueprint-icon.jpg"
baseline: "Décrire le fonctionnement d'un service de manière schématique"
objectifs: ["Concevoir"]
outils: ["miro","mural"]
exemples: ["/activites/exemples/service-blueprint-0.png","/activites/exemples/service-blueprint-1.png","/activites/exemples/service-blueprint-2.png"]
---

En Design de Service, le Service Blueprint décrit l’expérience client et les processus internes qui correspondent. Les Blueprints montrent ainsi la zone cachée du parcours client (Customer Journey), invisible pour l’utilisateur. Cet outil de cartographie révèle donc les interactions entre les acteurs de l’entreprise et le client, en surface et en profondeur. 


[Parcours utilisateur](/activite/parcours-utilisateur)


Le mot « Blueprint » (plan bleu en français) désigne, en architecture, un plan technique d’un bâtiment. Le Blueprint service est donc, littéralement, un plan du service. Le Service Blueprint s’apparente à un parcours utilisateur (Customer journey) étendu aux interactions et processus permettant de délivrer un service au client. C’est l’un des principaux outils du design de service. L’objectif final est donc de concevoir un service à la fois adapté aux attentes des utilisateurs et positif pour l’entreprise. 


> 💡 On peut l’utiliser aussi bien comme outil de diagnostic sur un projet existant que comme un outil ‘théorique’ pour réfléchir lors de la conception d’un projet. 


### Outils


Les outils comme Miro et Mural permettent de dessiner à plusieurs comme sur un 'tableau blanc numérique'. Ils proposent de plus des _templates_ (modèles) de Service Blueprints.    


# Étapes 


### **1. Identifier le service ou la partie du service qui doit être analysé** 


→ Par exemple, le service d’un déplacement avec un chauffeur “Uber”. 


### **2. Ajouter les évidences physiques à chaque étape de l’interaction entre le consommateur et le service** (points de contact) 


Les évidences physiques sont les évidence tangibles auxquels le consommateurs est exposé.


→ Dans le cas de notre course Uber, il s’agirait de la voiture. Pour d’autres services / produits, il pourrait s’agir des magasins, de la réception d’un email, de points de fidélité…


### **3. Définir les actions des utilisateurs** 


Appelées également “Customer actions”, elles décrivent le parcours client / utilisateur en imaginant la meilleure expérience possible. 


→ Dans notre exemple de course en Uber, notre utilisateur pourrait commencer par se connecter à l’application sur son téléphone (définir l’heure de prise en charge et son trajet, estimer sa course, …), monter en voiture, échanger avec le chauffeur, payer son achat, recevoir la facture, puis donner une évaluation à sa course ou son chauffeur.


### **4. Identifier les points de contact** _**frontstage**_ (avant-scène) 


C’est à dire les actions visibles des utilisateurs / clients.


→ Dans notre exemple, les points de contacts frontstage seraient : l’application Uber, l’accueil du chauffeur, la présentation de la voiture, la course… Dans un autre exemple, il pourrait également s’agir d’une interface produit, d’une publicité ou une d’interaction face à face avec un vendeur dans un magasin.


### **5. Identifier les actions des employés** _**backstage**_ (coulisses) 


C’est l’ensemble des tâches invisibles de l’employé, celles qui sont nécessaires pour réaliser les actions “Frontstage”. 
→ Par exemple : nettoyer la voiture pour qu’elle soit présentable pour le client, avoir un costume élégant pour notre chauffeur, disposer des petites bouteilles d’eau et des bonbons à l’intérieure de la voiture, prendre de l’essence avant de recevoir un client, mettre à jour son GPS.


### **6. Lister les processus de soutien** 


Il s’agit des activités internes à l’entreprise nécessaires pour offrir la meilleur expérience au client sur les différents points de contact.


---


Le service blueprint est représenté sous une forme graphique, reprenant les _touchpoints_ sur la première ligne et chaque étape de l’interaction avec le client en colonne. Les lignes suivantes représentent le client et ses actions, les actions des employés _back_ et _frontstage_ et enfin les technologies telles que le site web. 


## Conseils 

- **Commencez par le client :** Ne remplissez jamais le "Backstage" avant d'avoir fini la ligne du "Parcours Client". C'est le client qui dicte le reste, pas votre organisation interne.
- **Soyez honnêtes sur les failles :** Si une étape Backstage est lente ou manuelle, notez-le. Le Blueprint est un outil de diagnostic, pas une brochure publicitaire.
- **Invitez les "gens du terrain" :** Si vous faites le blueprint d'un magasin, invitez un vendeur. Le manager croit savoir ce qui se passe en coulisses, le vendeur _sait_ ce qui s'y passe vraiment.
- **L'importance du timing :** Si vous le pouvez, notez le temps moyen de chaque étape. Cela permet de voir où le service "bouchonne".
- **Soyez précis** : Si votre produit s’adresse à différents personas, il peut être utile de réaliser un service blueprint par cible

# Grille d’analyse 


Lorsqu’il est utilisé comme un outil d’audit, il faut ensuite chercher des points d’améliorations. Ces questions peuvent y aider : 

- Est-ce que chaque action du client déclenche bien une action spécifique en coulisses (Backstage) ? S'il y a un vide, c'est que le processus est mal défini.
- L'image renvoyée par les "évidences physiques" (design de l'appli, propreté de la voiture, ton des emails) est-elle la même à chaque étape ?
- Où se situent les temps d'attente pour le client ? Que se passe-t-il en coulisses pendant ce temps ?
- Peut-on supprimer une étape "Backstage" pour accélérer l'expérience "Frontstage" ?
- Quelle est l'étape la plus critique du parcours (celle où l'on risque le plus de perdre le client) ?
- **"Et si ça rate ?"** : Pour chaque étape, avez-vous prévu un processus de soutien si l'action principale échoue ? (Ex: Si le GPS du chauffeur tombe en panne, quel est le processus de secours ?).
- L'employé (ou l'outil technique) a-t-il toutes les informations nécessaires pour passer à l'étape suivante ?
- Y a-t-il une étape qui demande un effort trop important aux équipes par rapport à la valeur perçue par le client ?
- Y a-t-il des actions manuelles répétitives qui pourraient être automatisées par un processus de soutien technique ?
- Où pourrait-on ajouter une "évidence physique" pour rassurer le client sur ce qui se passe en coulisses ? (Ex : une barre de progression "votre commande est en préparation", voiture en train d’arriver, etc.).

---


### Sources 

- [Blueprint service, outil majeur du Design de service](https://www.usabilis.com/blueprint-service-outil-majeur-design-de-service/)
- [Le service blueprint](https://www.ux-republic.com/le-service-blueprint/)