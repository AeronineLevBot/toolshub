/* ═══════════════════════════════════════════
   DOCS.JS — ToolsHub Documentation Engine
   ═══════════════════════════════════════════ */

/* ── DONNÉES ── */
const DOC_DATA = [
  {
    id: "getting-started",
    icon: "🚀",
    title: "Démarrage rapide",
    articles: [
      {
        id: "introduction",
        title: "Introduction",
        desc: "Qu'est-ce que ToolsHub ?",
        content: () => `
          <div class="doc-breadcrumb">🚀 Démarrage rapide <span>›</span> Introduction</div>
          <h1>Introduction à ToolsHub</h1>
          <p class="doc-intro">
            ToolsHub est une plateforme tout-en-un regroupant les meilleurs outils pour gérer,
            animer et faire grandir votre communauté Discord. Choisissez uniquement ce dont
            vous avez besoin et payez au mois, sans engagement.
          </p>

          <h2 id="pourquoi">Pourquoi ToolsHub ?</h2>
          <p>La plupart des bots Discord sont complexes à configurer, peu fiables ou trop chers.
          ToolsHub vous donne accès à des outils professionnels, maintenus par notre équipe,
          prêts à l'emploi en quelques secondes.</p>

          <div class="doc-callout info">
            <span class="doc-callout-icon">💡</span>
            <span>Tous nos outils sont hébergés sur notre infrastructure. Aucune installation
            serveur requise de votre côté.</span>
          </div>

          <h2 id="fonctionnement">Comment ça fonctionne ?</h2>
          <div class="doc-steps">
            <div class="doc-step">
              <div class="step-num">1</div>
              <div class="step-body">
                <div class="step-title">Choisissez vos outils</div>
                <div class="step-desc">Parcourez le catalogue et ajoutez les outils dont vous avez besoin à votre panier.</div>
              </div>
            </div>
            <div class="doc-step">
              <div class="step-num">2</div>
              <div class="step-body">
                <div class="step-title">Souscrivez</div>
                <div class="step-desc">Payez en toute sécurité. Votre abonnement est actif immédiatement après paiement.</div>
              </div>
            </div>
            <div class="doc-step">
              <div class="step-num">3</div>
              <div class="step-body">
                <div class="step-title">Configurez</div>
                <div class="step-desc">Accédez au dashboard de chaque outil et personnalisez-le selon vos besoins.</div>
              </div>
            </div>
            <div class="doc-step">
              <div class="step-num">4</div>
              <div class="step-body">
                <div class="step-title">Profitez</div>
                <div class="step-desc">Vos outils tournent 24h/24. Surveillez les stats depuis votre espace membre.</div>
              </div>
            </div>
          </div>

          <h2 id="tarifs">Tarification</h2>
          <p>Chaque outil a son propre prix mensuel. Vous ne payez que ce que vous utilisez.
          Certains outils sont <strong>entièrement gratuits</strong>.</p>
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr><th>Plan</th><th>Prix</th><th>Inclus</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="doc-tag free">Gratuit</span></td>
                  <td>0€ / mois</td>
                  <td>Outils de base, support communautaire</td>
                </tr>
                <tr>
                  <td><span class="doc-tag pro">Pro</span></td>
                  <td>À partir de 3.99€ / mois</td>
                  <td>Outils avancés, support prioritaire, analytics</td>
                </tr>
              </tbody>
            </table>
          </div>`
      },
      {
        id: "installation",
        title: "Installation",
        desc: "Ajouter le bot à votre serveur",
        content: () => `
          <div class="doc-breadcrumb">🚀 Démarrage rapide <span>›</span> Installation</div>
          <h1>Installation</h1>
          <p class="doc-intro">
            Ajouter ToolsHub à votre serveur Discord prend moins de 2 minutes.
            Suivez ce guide étape par étape.
          </p>

          <h2 id="pre-requis">Prérequis</h2>
          <ul>
            <li>Être administrateur du serveur Discord cible</li>
            <li>Avoir souscrit à au moins un outil sur ToolsHub</li>
            <li>Discord v2.0 ou supérieur</li>
          </ul>

          <div class="doc-callout warn">
            <span class="doc-callout-icon">⚠️</span>
            <span>Sans les permissions <code>Administrateur</code> ou <code>Gérer le serveur</code>,
            vous ne pourrez pas autoriser le bot.</span>
          </div>

          <h2 id="ajouter-bot">Ajouter le bot</h2>
          <div class="doc-steps">
            <div class="doc-step">
              <div class="step-num">1</div>
              <div class="step-body">
                <div class="step-title">Connectez-vous à votre espace ToolsHub</div>
                <div class="step-desc">Rendez-vous sur <code>app.toolshub.io</code> et connectez-vous avec votre compte Discord.</div>
              </div>
            </div>
            <div class="doc-step">
              <div class="step-num">2</div>
              <div class="step-body">
                <div class="step-title">Accédez à "Mes Serveurs"</div>
                <div class="step-desc">Dans le dashboard, cliquez sur <code>Ajouter un serveur</code>.</div>
              </div>
            </div>
            <div class="doc-step">
              <div class="step-num">3</div>
              <div class="step-body">
                <div class="step-title">Autorisez les permissions</div>
                <div class="step-desc">Discord vous demandera de confirmer les permissions nécessaires au bot.</div>
              </div>
            </div>
            <div class="doc-step">
              <div class="step-num">4</div>
              <div class="step-body">
                <div class="step-title">Vérifiez l'installation</div>
                <div class="step-desc">Le bot <strong>ToolsHub#0001</strong> apparaît dans la liste des membres de votre serveur.</div>
              </div>
            </div>
          </div>

          <h2 id="verifier">Vérifier que ça fonctionne</h2>
          <p>Dans n'importe quel salon Discord, tapez :</p>
          <pre><code>/toolshub ping</code></pre>
          <p>Le bot doit répondre avec <code>Pong! 🏓 Latence : XXms</code>.</p>

          <div class="doc-callout tip">
            <span class="doc-callout-icon">✅</span>
            <span>Si le bot ne répond pas, vérifiez qu'il a bien la permission
            <code>Envoyer des messages</code> dans le salon concerné.</span>
          </div>`
      },
      {
        id: "configuration",
        title: "Configuration initiale",
        desc: "Paramètres de base du dashboard",
        content: () => `
          <div class="doc-breadcrumb">🚀 Démarrage rapide <span>›</span> Configuration initiale</div>
          <h1>Configuration initiale</h1>
          <p class="doc-intro">
            Une fois le bot installé, configurez les paramètres globaux de votre espace ToolsHub
            avant d'activer vos outils.
          </p>

          <h2 id="dashboard">Le Dashboard</h2>
          <p>Le dashboard ToolsHub est divisé en 3 zones :</p>
          <ul>
            <li><strong>Sidebar gauche</strong> — navigation entre les outils</li>
            <li><strong>Zone centrale</strong> — configuration de l'outil sélectionné</li>
            <li><strong>Sidebar droite</strong> — logs en temps réel et alertes</li>
          </ul>

          <h2 id="parametres-globaux">Paramètres globaux</h2>
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr><th>Paramètre</th><th>Description</th><th>Défaut</th></tr>
              </thead>
              <tbody>
                <tr><td><code>langue</code></td><td>Langue des réponses du bot</td><td>fr</td></tr>
                <tr><td><code>prefix</code></td><td>Préfixe des commandes texte</td><td>/</td></tr>
                <tr><td><code>log_channel</code></td><td>Salon pour les logs système</td><td>Aucun</td></tr>
                <tr><td><code>admin_roles</code></td><td>Rôles ayant accès au dashboard</td><td>Administrateur</td></tr>
              </tbody>
            </table>
          </div>

          <div class="doc-callout info">
            <span class="doc-callout-icon">💡</span>
            <span>Nous recommandons de créer un salon <code>#toolshub-logs</code> dédié
            pour ne pas polluer vos autres salons.</span>
          </div>

          <h2 id="notifications">Notifications</h2>
          <p>Activez les notifications pour recevoir des alertes par email ou Discord
          lors d'événements importants (erreurs, mises à jour, etc.).</p>
          <pre><code>/toolshub notify email on
/toolshub notify discord #alerts</code></pre>`
      }
    ]
  },
  {
    id: "analytics",
    icon: "📈",
    title: "Analytics",
    articles: [
      {
        id: "vocal-rank-tracker",
        title: "Vocal Rank Tracker",
        desc: "Suivre l'activité vocale",
        content: () => `
          <div class="doc-breadcrumb">📈 Analytics <span>›</span> Vocal Rank Tracker</div>
          <h1>Vocal Rank Tracker</h1>
          <p class="doc-intro">
            Suivez en temps réel l'activité vocale de vos membres et générez des classements
            automatiques sur votre serveur Discord.
          </p>

          <h2 id="activation">Activation</h2>
          <p>Depuis le dashboard, activez <strong>Vocal Rank Tracker</strong> puis sélectionnez
          le serveur cible. L'outil commence à collecter les données immédiatement.</p>

          <h2 id="commandes">Commandes disponibles</h2>
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr><th>Commande</th><th>Description</th><th>Permission</th></tr>
              </thead>
              <tbody>
                <tr><td><code>/rank</code></td><td>Voir votre classement vocal personnel</td><td>Tous</td></tr>
                <tr><td><code>/rank top</code></td><td>Voir le top 10 du serveur</td><td>Tous</td></tr>
                <tr><td><code>/rank reset @user</code></td><td>Remettre à zéro un membre</td><td>Admin</td></tr>
                <tr><td><code>/rank config</code></td><td>Ouvrir la configuration</td><td>Admin</td></tr>
              </tbody>
            </table>
          </div>

          <h2 id="configuration">Configuration</h2>
          <div class="doc-steps">
            <div class="doc-step">
              <div class="step-num">1</div>
              <div class="step-body">
                <div class="step-title">Définir les salons trackés</div>
                <div class="step-desc">Par défaut, tous les salons vocaux sont trackés. Excluez-en certains avec <code>/rank config exclude #salon</code>.</div>
              </div>
            </div>
            <div class="doc-step">
              <div class="step-num">2</div>
              <div class="step-body">
                <div class="step-title">Configurer les récompenses</div>
                <div class="step-desc">Attribuez automatiquement des rôles à partir d'un certain nombre d'heures vocales.</div>
              </div>
            </div>
            <div class="doc-step">
              <div class="step-num">3</div>
              <div class="step-body">
                <div class="step-title">Activer le classement automatique</div>
                <div class="step-desc">Choisissez un salon où le bot publie le classement mis à jour toutes les heures.</div>
              </div>
            </div>
          </div>

          <h2 id="export">Export des données</h2>
          <p>Exportez toutes vos données en CSV depuis le dashboard :</p>
          <pre><code>/rank export csv
/rank export json</code></pre>

          <div class="doc-callout tip">
            <span class="doc-callout-icon">✅</span>
            <span>Les données sont conservées 12 mois. Au-delà, elles sont archivées
            et disponibles sur demande.</span>
          </div>`
      },
      {
        id: "stats-dashboard",
        title: "Stats Dashboard",
        desc: "Tableau de bord analytique",
        content: () => `
          <div class="doc-breadcrumb">📈 Analytics <span>›</span> Stats Dashboard</div>
          <h1>Stats Dashboard</h1>
          <p class="doc-intro">
            Visualisez la croissance de votre serveur avec des graphiques détaillés :
            membres, messages, activité, et bien plus.
          </p>

          <h2 id="metriques">Métriques disponibles</h2>
          <ul>
            <li>Nombre de membres (total, gains, pertes)</li>
            <li>Messages envoyés par salon et par membre</li>
            <li>Activité vocale cumulée</li>
            <li>Taux de rétention des nouveaux membres</li>
            <li>Heures de pointe d'activité</li>
          </ul>

          <h2 id="rapports">Rapports automatiques</h2>
          <p>Le bot envoie un rapport hebdomadaire dans le salon de votre choix :</p>
          <pre><code>/stats report set #channel
/stats report frequency weekly</code></pre>

          <div class="doc-callout info">
            <span class="doc-callout-icon">💡</span>
            <span>La version gratuite inclut 10 métriques. Passez en Pro pour accéder
            à l'ensemble des 40+ métriques disponibles.</span>
          </div>`
      }
    ]
  },
  {
    id: "moderation",
    icon: "🛡️",
    title: "Modération",
    articles: [
      {
        id: "automod-pro",
        title: "Bot AutoMod Pro",
        desc: "Modération automatique par IA",
        content: () => `
          <div class="doc-breadcrumb">🛡️ Modération <span>›</span> Bot AutoMod Pro</div>
          <h1>Bot AutoMod Pro</h1>
          <p class="doc-intro">
            AutoMod Pro utilise l'intelligence artificielle pour détecter et bloquer
            automatiquement les messages toxiques, spam et contenus indésirables.
          </p>

          <h2 id="filtres">Filtres disponibles</h2>
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr><th>Filtre</th><th>Description</th><th>Plan</th></tr>
              </thead>
              <tbody>
                <tr><td>Anti-spam</td><td>Limite les messages répétitifs</td><td><span class="doc-tag free">Gratuit</span></td></tr>
                <tr><td>Anti-liens</td><td>Bloque les URLs non autorisées</td><td><span class="doc-tag free">Gratuit</span></td></tr>
                <tr><td>IA Toxicité</td><td>Détection de messages toxiques par IA</td><td><span class="doc-tag pro">Pro</span></td></tr>
                <tr><td>Anti-NSFW</td><td>Analyse des images envoyées</td><td><span class="doc-tag pro">Pro</span></td></tr>
                <tr><td>Anti-raid</td><td>Détection d'attaques en masse</td><td><span class="doc-tag pro">Pro</span></td></tr>
              </tbody>
            </table>
          </div>

          <h2 id="configuration">Configuration rapide</h2>
          <pre><code>/automod enable
/automod filter spam on
/automod filter links whitelist discord.gg
/automod action warn → mute 10m → ban</code></pre>

          <h2 id="actions">Actions automatiques</h2>
          <p>Définissez une escalade d'actions selon le nombre d'infractions :</p>
          <div class="doc-steps">
            <div class="doc-step">
              <div class="step-num">1</div>
              <div class="step-body">
                <div class="step-title">1ère infraction — Avertissement</div>
                <div class="step-desc">Le membre reçoit un avertissement en DM avec la raison.</div>
              </div>
            </div>
            <div class="doc-step">
              <div class="step-num">2</div>
              <div class="step-body">
                <div class="step-title">2ème infraction — Mute temporaire</div>
                <div class="step-desc">Mute automatique de 10 minutes configurable.</div>
              </div>
            </div>
            <div class="doc-step">
              <div class="step-num">3</div>
              <div class="step-body">
                <div class="step-title">3ème infraction — Bannissement</div>
                <div class="step-desc">Bannissement définitif ou temporaire selon votre configuration.</div>
              </div>
            </div>
          </div>

          <div class="doc-callout danger">
            <span class="doc-callout-icon">🚨</span>
            <span>Testez toujours votre configuration AutoMod dans un salon privé avant
            de l'activer sur l'ensemble du serveur.</span>
          </div>`
      },
      {
        id: "role-manager",
        title: "Role Manager",
        desc: "Gestion automatique des rôles",
        content: () => `
          <div class="doc-breadcrumb">🛡️ Modération <span>›</span> Role Manager</div>
          <h1>Role Manager</h1>
          <p class="doc-intro">
            Automatisez l'attribution et la gestion des rôles selon des conditions
            personnalisables : ancienneté, niveau, réactions, et plus encore.
          </p>

          <h2 id="types">Types d'attribution</h2>
          <ul>
            <li><strong>Auto-role</strong> — rôle attribué à l'arrivée d'un membre</li>
            <li><strong>Reaction role</strong> — rôle attribué via une réaction emoji</li>
            <li><strong>Level role</strong> — rôle attribué à un niveau donné</li>
            <li><strong>Time role</strong> — rôle attribué après X jours sur le serveur</li>
          </ul>

          <h2 id="commandes">Commandes</h2>
          <pre><code>/roles autorole set @Membre
/roles reaction add #salon 🎮 @Gamer
/roles level set 10 @VétéranX
/roles time set 30days @Fidèle</code></pre>

          <div class="doc-callout tip">
            <span class="doc-callout-icon">✅</span>
            <span>Role Manager est entièrement gratuit. Pas de limite sur le nombre
            de règles d'attribution.</span>
          </div>`
      }
    ]
  },
  {
    id: "engagement",
    icon: "🎯",
    title: "Engagement",
    articles: [
      {
        id: "giveaway-manager",
        title: "Giveaway Manager",
        desc: "Organiser des concours",
        content: () => `
          <div class="doc-breadcrumb">🎯 Engagement <span>›</span> Giveaway Manager</div>
          <h1>Giveaway Manager</h1>
          <p class="doc-intro">
            Créez et gérez des giveaways engageants en quelques commandes.
            Définissez les conditions d'entrée, la durée et le nombre de gagnants.
          </p>

          <h2 id="creer">Créer un giveaway</h2>
          <pre><code>/giveaway create
  --prize "Abonnement Discord Nitro"
  --duration 24h
  --winners 3
  --channel #giveaways</code></pre>

          <h2 id="conditions">Conditions d'entrée</h2>
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr><th>Condition</th><th>Commande</th></tr>
              </thead>
              <tbody>
                <tr><td>Rôle requis</td><td><code>--require-role @Abonné</code></td></tr>
                <tr><td>Compte minimum</td><td><code>--min-account-age 30d</code></td></tr>
                <tr><td>Ancienneté serveur</td><td><code>--min-server-age 7d</code></td></tr>
                <tr><td>Boost requis</td><td><code>--require-boost</code></td></tr>
              </tbody>
            </table>
          </div>

          <h2 id="gestion">Gestion en cours</h2>
          <pre><code>/giveaway pause [id]
/giveaway reroll [id]
/giveaway end [id]
/giveaway list</code></pre>

          <div class="doc-callout info">
            <span class="doc-callout-icon">💡</span>
            <span>Après la fin d'un giveaway, utilisez <code>/giveaway reroll</code>
            pour sélectionner un nouveau gagnant si le précédent ne répond pas.</span>
          </div>`
      },
      {
        id: "economy-bot",
        title: "Economy Bot",
        desc: "Économie virtuelle",
        content: () => `
          <div class="doc-breadcrumb">🎯 Engagement <span>›</span> Economy Bot</div>
          <h1>Economy Bot</h1>
          <p class="doc-intro">
            Créez une économie virtuelle complète sur votre serveur : monnaie, boutique,
            missions quotidiennes et classements.
          </p>

          <h2 id="monnaie">Configurer la monnaie</h2>
          <pre><code>/economy currency name "GoldCoins"
/economy currency symbol "🪙"
/economy currency start 100</code></pre>

          <h2 id="gains">Sources de gains</h2>
          <ul>
            <li>Messages envoyés (configurable)</li>
            <li>Temps en vocal</li>
            <li>Missions quotidiennes</li>
            <li>Récompenses manuelles admin</li>
            <li>Vote pour le serveur</li>
          </ul>

          <h2 id="boutique">La boutique</h2>
          <pre><code>/shop add
  --name "Rôle VIP"
  --price 500
  --type role
  --item @VIP</code></pre>

          <div class="doc-callout warn">
            <span class="doc-callout-icon">⚠️</span>
            <span>Les données de l'économie sont liées à votre abonnement.
            En cas de résiliation, les données sont conservées 30 jours.</span>
          </div>`
      }
    ]
  },
  {
    id: "support",
    icon: "🎫",
    title: "Support",
    articles: [
      {
        id: "ticket-system",
        title: "Ticket System",
        desc: "Gérer les demandes d'aide",
        content: () => `
          <div class="doc-breadcrumb">🎫 Support <span>›</span> Ticket System</div>
          <h1>Ticket System</h1>
          <p class="doc-intro">
            Gérez professionnellement les demandes d'aide de votre communauté grâce à
            un système de tickets complet avec catégories et assignations.
          </p>

          <h2 id="setup">Mise en place</h2>
          <div class="doc-steps">
            <div class="doc-step">
              <div class="step-num">1</div>
              <div class="step-body">
                <div class="step-title">Créer les catégories</div>
                <div class="step-desc">Définissez les types de tickets : Support, Bug, Partenariat, etc.</div>
              </div>
            </div>
            <div class="doc-step">
              <div class="step-num">2</div>
              <div class="step-body">
                <div class="step-title">Configurer le panel</div>
                <div class="step-desc">Envoyez le message d'ouverture de ticket dans votre salon dédié.</div>
              </div>
            </div>
            <div class="doc-step">
              <div class="step-num">3</div>
              <div class="step-body">
                <div class="step-title">Assigner l'équipe</div>
                <div class="step-desc">Définissez quels rôles ont accès aux tickets de chaque catégorie.</div>
              </div>
            </div>
          </div>

          <h2 id="commandes">Commandes</h2>
          <pre><code>/ticket panel create #support
/ticket category add "Bug Report" 🐛 @Développeurs
/ticket category add "Support" ❓ @Modérateurs
/ticket auto-close inactive 48h</code></pre>

          <h2 id="transcripts">Transcriptions</h2>
          <p>À la fermeture, chaque ticket génère une transcription HTML envoyée
          dans votre salon de logs :</p>
          <pre><code>/ticket transcript channel #ticket-logs
/ticket transcript format html</code></pre>`
      }
    ]
  },
  {
    id: "media",
    icon: "🎵",
    title: "Média",
    articles: [
      {
        id: "music-bot",
        title: "Music Bot HD",
        desc: "Musique haute qualité",
        content: () => `
          <div class="doc-breadcrumb">🎵 Média <span>›</span> Music Bot HD</div>
          <h1>Music Bot HD</h1>
          <p class="doc-intro">
            Profitez de la musique en haute qualité directement dans vos salons vocaux.
            Support YouTube, Spotify, SoundCloud et plus.
          </p>

          <h2 id="commandes-base">Commandes de base</h2>
          <div class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr><th>Commande</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr><td><code>/play [url ou titre]</code></td><td>Jouer une musique</td></tr>
                <tr><td><code>/skip</code></td><td>Passer à la suivante</td></tr>
                <tr><td><code>/queue</code></td><td>Voir la file d'attente</td></tr>
                <tr><td><code>/pause</code></td><td>Mettre en pause</td></tr>
                <tr><td><code>/volume [0-100]</code></td><td>Régler le volume</td></tr>
                <tr><td><code>/stop</code></td><td>Arrêter et quitter</td></tr>
              </tbody>
            </table>
          </div>

          <h2 id="sources">Sources supportées</h2>
          <ul>
            <li>YouTube & YouTube Music</li>
            <li>Spotify (titres, albums, playlists)</li>
            <li>SoundCloud</li>
            <li>Deezer</li>
            <li>Liens directs MP3/FLAC</li>
          </ul>

          <h2 id="egaliseur">Égaliseur</h2>
          <pre><code>/eq bass 5
/eq treble -2
/eq preset bassboost
/eq preset nightcore
/eq reset</code></pre>

          <div class="doc-callout info">
            <span class="doc-callout-icon">💡</span>
            <span>Pour Spotify, connectez votre compte depuis le dashboard
            pour un accès complet aux playlists et recommandations.</span>
          </div>`
      }
    ]
  }
];

/* ── STATE ── */
let currentCatId     = DOC_DATA[0].id;
let currentArticleId = DOC_DATA[0].articles[0].id;

/* ── INIT ── */
function init() {
  buildSidebar();
  loadArticle(currentCatId, currentArticleId);
  setupSearch();
}

/* ── SIDEBAR ── */
function buildSidebar() {
  const nav = document.getElementById("sidebarNav");
  nav.innerHTML = DOC_DATA.map(cat => `
    <div class="sidebar-category ${cat.id === currentCatId ? "open" : ""}" id="cat-${cat.id}">
      <button class="sidebar-cat-btn" onclick="toggleCategory('${cat.id}')">
        <span class="sidebar-cat-icon">${cat.icon}</span>
        <span>${cat.title}</span>
        <span class="sidebar-cat-arrow">›</span>
      </button>
      <div class="sidebar-articles">
        ${cat.articles.map(a => `
          <button
            class="sidebar-article-btn ${a.id === currentArticleId ? "active" : ""}"
            id="art-btn-${a.id}"
            onclick="loadArticle('${cat.id}', '${a.id}')">
            ${a.title}
          </button>`).join("")}
      </div>
    </div>`).join("");
}

function toggleCategory(catId) {
  const el = document.getElementById(`cat-${catId}`);
  el.classList.toggle("open");
}

/* ── LOAD ARTICLE ── */
function loadArticle(catId, articleId) {
  const cat     = DOC_DATA.find(c => c.id === catId);
  const article = cat.articles.find(a => a.id === articleId);
  if (!article) return;

  currentCatId     = catId;
  currentArticleId = articleId;

  /* Render article */
  document.getElementById("docArticle").innerHTML = article.content();

  /* Update sidebar active state */
  document.querySelectorAll(".sidebar-article-btn").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.getElementById(`art-btn-${articleId}`);
  if (activeBtn) activeBtn.classList.add("active");

  /* Open parent category */
  document.querySelectorAll(".sidebar-category").forEach(el => {
    if (el.id !== `cat-${catId}`) el.classList.remove("open");
  });
  document.getElementById(`cat-${catId}`).classList.add("open");

  /* Build TOC */
  buildTOC();

  /* Pagination */
  buildPagination(catId, articleId);

  /* Scroll to top */
  document.querySelector(".doc-main").scrollTo({ top: 0, behavior: "smooth" });

  /* Reset feedback */
  document.getElementById("feedbackThanks").textContent = "";
}

/* ── TOC ── */
function buildTOC() {
  const headings = document.querySelectorAll("#docArticle h2, #docArticle h3");
  const tocNav   = document.getElementById("tocNav");

  if (headings.length === 0) {
    tocNav.innerHTML = "";
    return;
  }

  tocNav.innerHTML = Array.from(headings).map(h => `
    <a class="toc-link ${h.tagName === "H3" ? "toc-h3" : ""}"
      href="#${h.id}" onclick="scrollToHeading('${h.id}')">
      ${h.textContent}
    </a>`).join("");
}

function scrollToHeading(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── PAGINATION ── */
function buildPagination(catId, articleId) {
  const allArticles = [];
  DOC_DATA.forEach(cat => cat.articles.forEach(a => allArticles.push({ catId: cat.id, ...a })));

  const idx  = allArticles.findIndex(a => a.id === articleId);
  const prev = allArticles[idx - 1];
  const next = allArticles[idx + 1];

  document.getElementById("docPagination").innerHTML = `
    ${prev ? `
      <button class="doc-page-btn prev" onclick="loadArticle('${prev.catId}','${prev.id}')">
        <span class="doc-page-label">← Précédent</span>
        <span class="doc-page-title">${prev.title}</span>
      </button>` : `<div></div>`}
    ${next ? `
      <button class="doc-page-btn next" onclick="loadArticle('${next.catId}','${next.id}')">
        <span class="doc-page-label">Suivant →</span>
        <span class="doc-page-title">${next.title}</span>
      </button>` : `<div></div>`}`;
}

/* ── SEARCH ── */
function setupSearch() {
  const input = document.getElementById("docSearch");
  const wrap  = input.parentElement;
  let resultsEl = null;

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (resultsEl) { resultsEl.remove(); resultsEl = null; }
    if (!q || q.length < 2) return;

    const matches = [];
    DOC_DATA.forEach(cat => {
      cat.articles.forEach(a => {
        if (a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)) {
          matches.push({ catId: cat.id, catTitle: cat.title, ...a });
        }
      });
    });

    if (matches.length === 0) return;

    resultsEl = document.createElement("div");
    resultsEl.className = "search-results";
    resultsEl.innerHTML = matches.map(m => `
      <div class="search-result-item"
        onclick="loadArticle('${m.catId}','${m.id}'); this.closest('.search-results').remove(); document.getElementById('docSearch').value=''">
        <div class="search-result-cat">${m.catTitle}</div>
        <div class="search-result-title">${m.title}</div>
        <div class="search-result-desc">${m.desc}</div>
      </div>`).join("");

    wrap.style.position = "relative";
    wrap.appendChild(resultsEl);
  });

  document.addEventListener("click", e => {
    if (!wrap.contains(e.target) && resultsEl) {
      resultsEl.remove();
      resultsEl = null;
    }
  });
}

/* ── FEEDBACK ── */
function sendFeedback(positive) {
  document.getElementById("feedbackThanks").textContent =
    positive ? "Merci ! 🎉 Contenu utile." : "Merci ! Nous allons améliorer cet article.";
}

/* ── START ── */
init();