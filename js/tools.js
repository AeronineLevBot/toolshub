/* ═══════════════════════════════════════
   TOOLS.JS — Données des outils
═══════════════════════════════════════ */

const TOOLS_DATA = [
  {
    id: 1,
    name: "Vocal Rank Tracker",
    icon: "🎙️",
    category: "analytics",
    desc: "Suivez le classement vocal de vos serveurs Discord en temps réel.",
    longDesc: "Vocal Rank Tracker est l'outil de référence pour analyser et valoriser l'activité vocale de votre communauté. Grâce à un système de points configurable, chaque minute passée en vocal est comptabilisée et affichée sur un leaderboard dynamique. Idéal pour encourager la participation et récompenser les membres les plus actifs.",
    price: 0, period: "mois",
    badges: ["popular"],
    features: ["Temps réel", "Multi-serveurs", "Export CSV"],
    fullFeatures: [
      "Classement vocal en temps réel mis à jour toutes les 30s",
      "Support multi-serveurs depuis un seul tableau de bord",
      "Export des données en CSV, JSON ou PDF",
      "Système de points et multiplicateurs configurables",
      "Récompenses automatiques par palier de rang",
      "Historique sur 90 jours",
      "Webhook Discord natif pour les notifications"
    ],
    rating: 4.8, users: 3200, uptime: 99.9, version: "v2.4.1", support: "24/7",
    screenshots: [
      { icon: "📊", label: "Leaderboard live",  bg: "linear-gradient(135deg,#1e1b4b,#312e81)" },
      { icon: "⚙️", label: "Configuration",     bg: "linear-gradient(135deg,#064e3b,#065f46)" },
      { icon: "📤", label: "Export données",    bg: "linear-gradient(135deg,#1e3a5f,#1e40af)" },
    ],
    reviews: [
      { avatar: "🧑", name: "Nexou",     rating: 5, text: "Parfait pour motiver ma communauté ! Le leaderboard en temps réel est impressionnant." },
      { avatar: "👩", name: "userapo",   rating: 5, text: "Installation en 2 minutes, fonctionne parfaitement sur mes 3 serveurs." },
      { avatar: "🧔", name: "iqpa",      rating: 4, text: "Très bon outil, j'aurais aimé plus d'options de personnalisation visuelle." },
    ]
  },
  {
    id: 2,
    name: "DMall",
    icon: "📨",
    category: "media",
    desc: "Envoyez automatiquement des messages privés à tous les membres de votre serveur Discord.",
    longDesc: "DMall est un système d'envoi automatique de messages privés à l'ensemble des membres d'un serveur Discord. Ciblez vos membres via leurs amis, un bot ou un serveur entier pour diffuser vos annonces, promotions ou informations importantes en un seul clic.",
    price: 4.99, period: "mois",
    badges: ["hot", "pro"],
    features: ["Envoi de masse", "Multi-cibles", "Logs"],
    fullFeatures: [
      "Envoi de DM à tous les membres d'un serveur en masse",
      "Ciblage via amis, bot ou serveur entier",
      "Personnalisation du message avec variables dynamiques",
      "Logs complets avec horodatage et statut d'envoi",
      "Délai configurable entre chaque envoi pour éviter les bans",
      "Filtrage par rôle ou ancienneté des membres",
      "Rapport de livraison détaillé après chaque campagne"
    ],
    rating: 4.9, users: 8700, uptime: 99.95, version: "v3.1.0", support: "24/7",
    screenshots: [
      { icon: "📨", label: "Envoi en masse",       bg: "linear-gradient(135deg,#3b0764,#4c1d95)" },
      { icon: "📋", label: "Logs détaillés",        bg: "linear-gradient(135deg,#1e3a5f,#1e40af)" },
      { icon: "📊", label: "Rapport de livraison",  bg: "linear-gradient(135deg,#431407,#7c2d12)" },
    ],
    reviews: [
      { avatar: "👨", name: "Alex T.",    rating: 5, text: "Incroyable, j'ai pu contacter tous mes membres en quelques minutes seulement." },
      { avatar: "👩", name: "Clara M.",   rating: 5, text: "Très pratique pour annoncer nos événements directement en DM." },
      { avatar: "🧑", name: "Youssef K.", rating: 5, text: "Le meilleur outil pour les campagnes de communication sur Discord." },
    ]
  },
  {
    id: 3,
    name: "Stats Dashboard",
    icon: "📊",
    category: "analytics",
    desc: "Tableau de bord complet pour analyser la croissance de votre communauté.",
    longDesc: "Stats Dashboard centralise toutes les métriques de votre serveur Discord en un seul endroit. Nouveaux membres, messages envoyés, heures de pointe, taux de rétention... Toutes les données sont visualisées sous forme de graphiques clairs et exportables.",
    price: 0, period: "mois",
    badges: ["new"],
    features: ["Gratuit", "10 métriques", "Rapports hebdo"],
    fullFeatures: [
      "10 métriques clés disponibles gratuitement",
      "Graphiques d'évolution sur 30, 60 et 90 jours",
      "Rapport hebdomadaire automatique par email",
      "Identification des heures de pointe",
      "Taux de rétention et de départ des membres",
      "Comparaison semaine sur semaine",
      "Aucune configuration requise"
    ],
    rating: 4.2, users: 12500, uptime: 99.8, version: "v1.2.0", support: "Email",
    screenshots: [
      { icon: "📈", label: "Graphiques croissance", bg: "linear-gradient(135deg,#064e3b,#065f46)" },
      { icon: "📅", label: "Rapport hebdo",         bg: "linear-gradient(135deg,#1e3a5f,#1e40af)" },
      { icon: "🕐", label: "Heures de pointe",      bg: "linear-gradient(135deg,#1e1b4b,#312e81)" },
    ],
    reviews: [
      { avatar: "👩", name: "Léa D.",   rating: 4, text: "Super pour commencer, gratuit et déjà très complet." },
      { avatar: "🧔", name: "Pierre V.", rating: 4, text: "Les rapports hebdo sont vraiment utiles pour suivre la progression." },
      { avatar: "👨", name: "Tom B.",   rating: 5, text: "Incroyable que ce soit gratuit, meilleur que certains outils payants !" },
    ]
  },
  {
    id: 4,
    name: "AI-Analyze",
    icon: "🤖",
    category: "support",
    desc: "Analysez et modérez votre serveur intelligemment grâce à l'intelligence artificielle.",
    longDesc: "AI-Analyze exploite la puissance de l'intelligence artificielle pour surveiller, analyser et modérer votre serveur Discord en temps réel. Détection de toxicité, analyse des comportements suspects, rapports automatiques et suggestions de modération : tout est géré de façon intelligente et autonome.",
    price: 7.99, period: "mois",
    badges: ["popular"],
    features: ["IA intégrée", "Modération auto", "Rapports"],
    fullFeatures: [
      "Détection IA de toxicité, insultes et hate speech",
      "Analyse comportementale des membres suspects",
      "Suggestions de modération basées sur l'historique",
      "Rapports automatiques quotidiens et hebdomadaires",
      "Sanctions automatiques graduelles (warn → mute → ban)",
      "Tableau de bord d'analyse centralisé",
      "Alertes en temps réel vers un channel de modération"
    ],
    rating: 4.6, users: 5400, uptime: 99.9, version: "v2.0.3", support: "24/7",
    screenshots: [
      { icon: "🤖", label: "IA en action",      bg: "linear-gradient(135deg,#1e3a5f,#1e40af)" },
      { icon: "📊", label: "Tableau d'analyse", bg: "linear-gradient(135deg,#064e3b,#065f46)" },
      { icon: "📁", label: "Rapports",          bg: "linear-gradient(135deg,#3b0764,#4c1d95)" },
    ],
    reviews: [
      { avatar: "🧑", name: "Nico F.",   rating: 5, text: "L'IA détecte des choses que je n'aurais jamais repérées manuellement." },
      { avatar: "👩", name: "Emma S.",   rating: 4, text: "Les rapports automatiques me font gagner un temps précieux." },
      { avatar: "👨", name: "Julien M.", rating: 5, text: "Parfait pour gérer un grand serveur sans une équipe de modo immense." },
    ]
  },
  {
    id: 5,
    name: "RoleGuard",
    icon: "🛡️",
    category: "engagement",
    desc: "Protégez et sécurisez les rôles de votre serveur Discord contre les abus.",
    longDesc: "RoleGuard est un système de sécurité avancé dédié à la protection des rôles de votre serveur Discord. Il surveille en permanence les attributions, suppressions et modifications de rôles, et bloque toute action suspecte ou non autorisée.",
    price: 4.99, period: "mois",
    badges: ["new"],
    features: ["Protection rôles", "Alertes", "Logs"],
    fullFeatures: [
      "Surveillance en temps réel des attributions et suppressions de rôles",
      "Blocage automatique des modifications non autorisées",
      "Alertes instantanées en cas d'action suspecte",
      "Logs détaillés de toutes les modifications de rôles",
      "Whitelist de membres et bots de confiance",
      "Restauration automatique d'un rôle supprimé par erreur",
      "Rapport quotidien des activités liées aux rôles"
    ],
    rating: 4.4, users: 2100, uptime: 99.7, version: "v1.5.2", support: "Email",
    screenshots: [
      { icon: "🛡️", label: "Protection active", bg: "linear-gradient(135deg,#431407,#7c2d12)" },
      { icon: "⚠️", label: "Alertes sécurité",  bg: "linear-gradient(135deg,#064e3b,#065f46)" },
      { icon: "📋", label: "Logs des rôles",    bg: "linear-gradient(135deg,#1e1b4b,#312e81)" },
    ],
    reviews: [
      { avatar: "👨", name: "Lucas P.",    rating: 4, text: "Très rassurant, plus personne ne peut modifier les rôles sans que je le sache." },
      { avatar: "👩", name: "Inès R.",     rating: 5, text: "A évité plusieurs tentatives de raid sur mon serveur, indispensable !" },
      { avatar: "🧔", name: "Sébastien L.", rating: 4, text: "Bon outil de sécurité, les alertes en temps réel sont très réactives." },
    ]
  },
  {
    id: 6,
    name: "BlacklistGuard",
    icon: "🚫",
    category: "engagement",
    desc: "Système de blacklist puissant pour bannir et bloquer automatiquement les membres indésirables.",
    longDesc: "BlacklistGuard est un système de blacklist centralisé permettant de bannir et bloquer automatiquement les membres indésirables sur votre serveur Discord.",
    price: 12.99, period: "mois",
    badges: ["hot"],
    features: ["Blacklist", "Multi-serveurs", "Détection auto"],
    fullFeatures: [
      "Ajout rapide d'un membre à la blacklist via commande ou interface",
      "Synchronisation de la blacklist sur plusieurs serveurs simultanément",
      "Détection automatique et bannissement à l'arrivée d'un membre blacklisté",
      "Motif de bannissement personnalisable et archivé",
      "Partage de blacklist entre serveurs partenaires",
      "Historique complet des membres bannis avec dates et raisons",
      "Alertes en temps réel lorsqu'un membre blacklisté tente de rejoindre"
    ],
    rating: 4.7, users: 6300, uptime: 99.85, version: "v4.2.0", support: "24/7",
    screenshots: [
      { icon: "🚫", label: "Gestion blacklist",  bg: "linear-gradient(135deg,#064e3b,#065f46)" },
      { icon: "🔗", label: "Sync multi-serveurs", bg: "linear-gradient(135deg,#1e3a5f,#1e40af)" },
      { icon: "📋", label: "Historique des bans", bg: "linear-gradient(135deg,#3b0764,#4c1d95)" },
    ],
    reviews: [
      { avatar: "🧑", name: "Antoine G.", rating: 5, text: "Fini les membres toxiques qui reviennent avec un nouveau compte." },
      { avatar: "👩", name: "Camille T.", rating: 5, text: "La synchronisation entre mes serveurs est une fonctionnalité absolument essentielle." },
      { avatar: "👨", name: "Romain B.",  rating: 4, text: "Très efficace, le partage de blacklist entre serveurs partenaires est un vrai plus." },
    ]
  },
];

const CATEGORIES = [
  { id: "all",        label: "Tous" },
  { id: "analytics",  label: "📈 Analytics" },
  { id: "moderation", label: "🛡️ Modération" },
  { id: "engagement", label: "🎯 Engagement" },
  { id: "support",    label: "🎫 Support" },
  { id: "design",     label: "🎨 Design" },
  { id: "media",      label: "⚙️ Tools" },
];

async function initToolsFromApi() {
  try {
    const res = await fetch("/api/tools");
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !Array.isArray(data.tools)) return;
    TOOLS_DATA.length = 0;
    TOOLS_DATA.push(...data.tools);
  } catch {
    // Garde les données locales en cas d'erreur
  }
}

window.initToolsFromApi = initToolsFromApi;