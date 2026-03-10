import type { Language } from './translations';

export interface HelpSection {
  id: string;
  title: string;
  roles: string[];
  description: string;
  steps: { label: string; items: string[] }[];
  tips: string[];
}

export interface HelpTexts {
  dialogTitle: string;
  dialogDescription: string;
  legendSteps: string;
  legendTips: string;
  legendRoles: string;
  howToUse: string;
  shortcutsTitle: string;
  shortcutSearch: string;
  shortcutNotifications: string;
  shortcutExport: string;
  sections: HelpSection[];
}

const es: HelpTexts = {
  dialogTitle: 'Guía de la aplicación',
  dialogDescription: 'Manual de uso con instrucciones paso a paso para cada sección.',
  legendSteps: 'Pasos interactivos',
  legendTips: 'Consejos',
  legendRoles: 'Roles con acceso',
  howToUse: 'Cómo se usa',
  shortcutsTitle: 'Atajos útiles',
  shortcutSearch: 'Búsqueda global desde cualquier sección',
  shortcutNotifications: 'Las notificaciones te avisan de incidencias, llegadas y tareas pendientes',
  shortcutExport: 'Casi todas las secciones permiten exportar datos en PDF o Excel',
  sections: [
    {
      id: 'dashboard', title: 'Dashboard', roles: ['Admin', 'Gestor', 'Personal'],
      description: 'Panel principal con resumen en tiempo real del estado del albergue.',
      steps: [
        { label: 'El dashboard muestra de un vistazo:', items: [
          'Ocupación actual — camas libres y ocupadas con porcentaje',
          'Llegadas de hoy — huéspedes previstos para hoy',
          'Incidencias abiertas — número de incidencias sin resolver',
          'Accesos rápidos — botones directos a las secciones más usadas',
        ]},
      ],
      tips: ['Pulsa en cualquier tarjeta para ir directamente a esa sección.'],
    },
    {
      id: 'habitaciones', title: 'Habitaciones', roles: ['Admin', 'Gestor', 'Personal'],
      description: 'Gestión visual de habitaciones y camas con vista de mapa interactivo.',
      steps: [
        { label: 'Registrar un check-in:', items: [
          'Localiza la cama libre (color verde) en la habitación deseada.',
          'Pulsa sobre la cama para abrir el formulario de check-in.',
          'Rellena los datos del huésped: nombre, nacionalidad, fechas, etc.',
          'Pulsa "Registrar" para confirmar la entrada.',
        ]},
        { label: 'Realizar un check-out:', items: [
          'Pulsa sobre una cama ocupada (color rojo/naranja).',
          'Confirma la salida del huésped pulsando "Check-out".',
        ]},
        { label: 'Bloquear una cama:', items: [
          'Pulsa sobre una cama libre.',
          'Selecciona "Bloquear" e indica el motivo (mantenimiento, reserva, etc.).',
        ]},
      ],
      tips: [
        'Los colores indican el estado: verde = libre, rojo = ocupada, gris = bloqueada.',
        'Puedes arrastrar huéspedes entre camas para cambiar la asignación.',
      ],
    },
    {
      id: 'historial', title: 'Historial', roles: ['Admin', 'Gestor'],
      description: 'Registro completo de todos los huéspedes que han pasado por el albergue.',
      steps: [
        { label: 'Buscar un huésped:', items: [
          'Usa el campo de búsqueda para filtrar por nombre o nacionalidad.',
          'Filtra por rango de fechas si necesitas un período concreto.',
          'Los resultados se actualizan en tiempo real.',
        ]},
        { label: 'Exportar datos:', items: [
          'Pulsa el botón de exportación (PDF o Excel).',
          'Se descargará un archivo con los registros visibles según los filtros aplicados.',
        ]},
      ],
      tips: [
        'La exportación respeta los filtros activos: si filtras por fechas, solo se exportarán esos registros.',
        'Usa la búsqueda global (Ctrl+K) para encontrar huéspedes desde cualquier sección.',
      ],
    },
    {
      id: 'llegadas', title: 'Llegadas previstas', roles: ['Admin', 'Gestor', 'Personal'],
      description: 'Calendario de reservas y llegadas programadas al albergue.',
      steps: [
        { label: 'Registrar una llegada:', items: [
          'Pulsa "Nueva llegada" o haz clic en el día del calendario.',
          'Introduce los datos: nombre, nacionalidad, fecha de llegada y salida.',
          'Opcionalmente, asigna una cama específica.',
          'Guarda la reserva. Aparecerá en el calendario.',
        ]},
        { label: 'Convertir llegada en check-in:', items: [
          'Cuando el huésped llegue, pulsa sobre su reserva.',
          'Confirma el check-in para moverlo automáticamente a Habitaciones.',
        ]},
      ],
      tips: [
        'Las llegadas de hoy se destacan automáticamente en el dashboard.',
        'Puedes registrar llegadas para fechas futuras para planificar la ocupación.',
      ],
    },
    {
      id: 'comedor', title: 'Comedor', roles: ['Admin', 'Gestor', 'Personal'],
      description: 'Control diario de comidas servidas por turno: desayuno, almuerzo y cena.',
      steps: [
        { label: 'Registrar comensales:', items: [
          'Selecciona el día (por defecto se muestra hoy).',
          'Introduce el número de comensales para cada turno: desayuno, almuerzo, cena.',
          'Los datos se guardan automáticamente.',
        ]},
      ],
      tips: [
        'El resumen mensual te permite ver la evolución del uso del comedor.',
        'Estos datos se incluyen en los informes exportables.',
      ],
    },
    {
      id: 'incidencias', title: 'Incidencias', roles: ['Admin', 'Gestor', 'Personal'],
      description: 'Registro y seguimiento de incidencias, eventos o problemas en el albergue.',
      steps: [
        { label: 'Crear una incidencia:', items: [
          'Pulsa "Nueva incidencia".',
          'Selecciona el tipo (convivencia, mantenimiento, sanitaria, etc.).',
          'Describe la situación y selecciona la prioridad.',
          'Opcionalmente: adjunta archivos, selecciona huéspedes implicados y configura la visibilidad.',
          'Guarda la incidencia.',
        ]},
        { label: 'Gestionar incidencias:', items: [
          'Cambia el estado: abierta → en proceso → resuelta.',
          'Añade comentarios para documentar el seguimiento.',
        ]},
      ],
      tips: [
        'Usa la "visibilidad" para controlar qué roles pueden ver cada incidencia.',
        'Las incidencias abiertas aparecen como alerta en el dashboard.',
        'Puedes adjuntar fotos o documentos como evidencia.',
      ],
    },
    {
      id: 'tareas', title: 'Tareas de empleados', roles: ['Admin', 'Personal'],
      description: 'Sistema de tareas diarias con calendario, asignación y estadísticas de cumplimiento.',
      steps: [
        { label: 'Crear tareas:', items: [
          'Selecciona un día en el calendario.',
          'Pulsa "Añadir tarea" e introduce la descripción.',
          'Asigna la tarea a uno o más trabajadores.',
        ]},
        { label: 'Completar tareas (trabajador):', items: [
          'Abre el día actual en el calendario.',
          'Marca cada tarea como "Hecha" o "No procede".',
        ]},
        { label: 'Ver estadísticas:', items: [
          'Despliega la sección "Estadísticas mensuales" debajo del calendario.',
          'Consulta el porcentaje de cumplimiento por trabajador.',
          'Exporta los datos en PDF o Excel.',
        ]},
      ],
      tips: [
        'Las tareas se pueden duplicar entre días para rutinas recurrentes.',
        'Las estadísticas muestran el rendimiento mensual de cada trabajador.',
      ],
    },
    {
      id: 'registro_horario', title: 'Registro horario', roles: ['Admin', 'Personal'],
      description: 'Fichaje de jornada laboral con cálculo automático de horas ordinarias y extras.',
      steps: [
        { label: 'Fichar (trabajador):', items: [
          'Selecciona el día en el calendario.',
          'Introduce hora de entrada y hora de salida.',
          'Si aplica, añade la pausa (inicio y fin).',
          'Selecciona el tipo de día (laboral, festivo, baja, vacaciones…).',
          'Firma digitalmente con el dedo o ratón.',
          'El sistema calcula automáticamente las horas totales, ordinarias y extras.',
        ]},
        { label: 'Consultar registros (admin):', items: [
          'Selecciona un trabajador en el desplegable.',
          'Pulsa sobre cualquier día para ver el detalle en modo lectura.',
          'Los datos incluyen horarios, firma y desglose de horas.',
        ]},
      ],
      tips: [
        'El cálculo de horas se muestra en vivo mientras introduces los horarios.',
        'Los días festivos o de baja no computan horas extras.',
        'El admin no puede modificar los registros, solo consultarlos.',
      ],
    },
    {
      id: 'inventario', title: 'Inventario', roles: ['Admin', 'Personal'],
      description: 'Gestión de productos y materiales del albergue con alertas de stock bajo.',
      steps: [
        { label: 'Añadir un producto:', items: [
          'Pulsa "Nuevo producto".',
          'Introduce nombre, categoría, cantidad actual y stock mínimo.',
          'Guarda el producto.',
        ]},
        { label: 'Registrar movimiento:', items: [
          'Pulsa sobre un producto existente.',
          'Selecciona "Entrada" o "Salida" y la cantidad.',
          'El stock se actualiza automáticamente.',
        ]},
      ],
      tips: [
        'Los productos con stock por debajo del mínimo se destacan en rojo.',
        'Puedes exportar el inventario completo a Excel para pedidos.',
      ],
    },
    {
      id: 'sugerencias', title: 'Buzón de sugerencias', roles: ['Admin'],
      description: 'Buzón público para que huéspedes envíen sugerencias anónimas via enlace o QR.',
      steps: [
        { label: 'Compartir el buzón:', items: [
          'Copia el enlace público o descarga el código QR.',
          'Compártelo con los huéspedes (impreso en el albergue, por ejemplo).',
        ]},
        { label: 'Gestionar sugerencias:', items: [
          'Las sugerencias aparecen automáticamente en la lista.',
          'Puedes marcarlas como leídas, responderlas o archivarlas.',
        ]},
      ],
      tips: [
        'Las sugerencias son anónimas: los huéspedes no necesitan identificarse.',
        'Imprime el QR y colócalo en zonas comunes para facilitar el acceso.',
      ],
    },
    {
      id: 'notas', title: 'Notas', roles: ['Admin'],
      description: 'Bloc de notas interno para recordatorios, anotaciones e información importante.',
      steps: [
        { label: 'Crear una nota:', items: [
          'Pulsa "Nueva nota".',
          'Escribe un título y el contenido.',
          'Opcionalmente, elige un color para categorizar visualmente.',
          'La nota se guarda automáticamente.',
        ]},
      ],
      tips: [
        'Usa colores diferentes para distinguir temas (ej: rojo = urgente, verde = resuelto).',
        'Las notas son privadas y solo visibles para el administrador.',
      ],
    },
  ],
};

const fr: HelpTexts = {
  dialogTitle: 'Guide de l\'application',
  dialogDescription: 'Manuel d\'utilisation avec instructions étape par étape pour chaque section.',
  legendSteps: 'Étapes interactives',
  legendTips: 'Conseils',
  legendRoles: 'Rôles avec accès',
  howToUse: 'Comment utiliser',
  shortcutsTitle: 'Raccourcis utiles',
  shortcutSearch: 'Recherche globale depuis n\'importe quelle section',
  shortcutNotifications: 'Les notifications vous alertent des incidents, arrivées et tâches en attente',
  shortcutExport: 'Presque toutes les sections permettent d\'exporter les données en PDF ou Excel',
  sections: [
    {
      id: 'dashboard', title: 'Tableau de bord', roles: ['Admin', 'Gestionnaire', 'Personnel'],
      description: 'Panneau principal avec un résumé en temps réel de l\'état de l\'hébergement.',
      steps: [
        { label: 'Le tableau de bord affiche en un coup d\'œil :', items: [
          'Occupation actuelle — lits libres et occupés avec pourcentage',
          'Arrivées du jour — résidents prévus pour aujourd\'hui',
          'Incidents ouverts — nombre d\'incidents non résolus',
          'Accès rapides — boutons directs vers les sections les plus utilisées',
        ]},
      ],
      tips: ['Cliquez sur une carte pour accéder directement à cette section.'],
    },
    {
      id: 'habitaciones', title: 'Chambres', roles: ['Admin', 'Gestionnaire', 'Personnel'],
      description: 'Gestion visuelle des chambres et des lits avec une vue interactive.',
      steps: [
        { label: 'Enregistrer une entrée :', items: [
          'Trouvez le lit libre (couleur verte) dans la chambre souhaitée.',
          'Cliquez sur le lit pour ouvrir le formulaire d\'enregistrement.',
          'Remplissez les informations du résident : nom, nationalité, dates, etc.',
          'Cliquez sur "Enregistrer" pour confirmer l\'entrée.',
        ]},
        { label: 'Effectuer un départ :', items: [
          'Cliquez sur un lit occupé (couleur rouge/orange).',
          'Confirmez le départ du résident en cliquant sur "Départ".',
        ]},
        { label: 'Bloquer un lit :', items: [
          'Cliquez sur un lit libre.',
          'Sélectionnez "Bloquer" et indiquez le motif (maintenance, réservation, etc.).',
        ]},
      ],
      tips: [
        'Les couleurs indiquent l\'état : vert = libre, rouge = occupé, gris = bloqué.',
        'Vous pouvez déplacer les résidents entre les lits pour changer l\'attribution.',
      ],
    },
    {
      id: 'historial', title: 'Historique', roles: ['Admin', 'Gestionnaire'],
      description: 'Registre complet de tous les résidents passés par l\'hébergement.',
      steps: [
        { label: 'Rechercher un résident :', items: [
          'Utilisez le champ de recherche pour filtrer par nom ou nationalité.',
          'Filtrez par plage de dates si vous avez besoin d\'une période spécifique.',
          'Les résultats se mettent à jour en temps réel.',
        ]},
        { label: 'Exporter les données :', items: [
          'Cliquez sur le bouton d\'exportation (PDF ou Excel).',
          'Un fichier sera téléchargé avec les enregistrements visibles selon les filtres.',
        ]},
      ],
      tips: [
        'L\'exportation respecte les filtres actifs.',
        'Utilisez la recherche globale (Ctrl+K) pour trouver des résidents depuis n\'importe quelle section.',
      ],
    },
    {
      id: 'llegadas', title: 'Arrivées prévues', roles: ['Admin', 'Gestionnaire', 'Personnel'],
      description: 'Calendrier des réservations et arrivées programmées.',
      steps: [
        { label: 'Enregistrer une arrivée :', items: [
          'Cliquez sur "Nouvelle arrivée" ou sur un jour du calendrier.',
          'Entrez les données : nom, nationalité, date d\'arrivée et de départ.',
          'Optionnellement, assignez un lit spécifique.',
          'Sauvegardez. L\'arrivée apparaîtra dans le calendrier.',
        ]},
        { label: 'Convertir en enregistrement :', items: [
          'Quand le résident arrive, cliquez sur sa réservation.',
          'Confirmez l\'enregistrement pour le déplacer automatiquement vers les Chambres.',
        ]},
      ],
      tips: [
        'Les arrivées du jour sont mises en évidence dans le tableau de bord.',
        'Vous pouvez enregistrer des arrivées futures pour planifier l\'occupation.',
      ],
    },
    {
      id: 'comedor', title: 'Réfectoire', roles: ['Admin', 'Gestionnaire', 'Personnel'],
      description: 'Contrôle quotidien des repas servis par service : petit-déjeuner, déjeuner et dîner.',
      steps: [
        { label: 'Enregistrer les convives :', items: [
          'Sélectionnez le jour (aujourd\'hui par défaut).',
          'Entrez le nombre de convives pour chaque service.',
          'Les données sont sauvegardées automatiquement.',
        ]},
      ],
      tips: [
        'Le résumé mensuel permet de voir l\'évolution de l\'utilisation du réfectoire.',
        'Ces données sont incluses dans les rapports exportables.',
      ],
    },
    {
      id: 'incidencias', title: 'Incidents', roles: ['Admin', 'Gestionnaire', 'Personnel'],
      description: 'Enregistrement et suivi des incidents, événements ou problèmes.',
      steps: [
        { label: 'Créer un incident :', items: [
          'Cliquez sur "Nouvel incident".',
          'Sélectionnez le type (cohabitation, maintenance, sanitaire, etc.).',
          'Décrivez la situation et sélectionnez la priorité.',
          'Optionnellement : joignez des fichiers, sélectionnez les résidents concernés et configurez la visibilité.',
          'Sauvegardez l\'incident.',
        ]},
        { label: 'Gérer les incidents :', items: [
          'Changez l\'état : ouvert → en cours → résolu.',
          'Ajoutez des commentaires pour documenter le suivi.',
        ]},
      ],
      tips: [
        'Utilisez la "visibilité" pour contrôler quels rôles peuvent voir chaque incident.',
        'Les incidents ouverts apparaissent comme alerte dans le tableau de bord.',
        'Vous pouvez joindre des photos ou documents comme preuve.',
      ],
    },
    {
      id: 'tareas', title: 'Tâches des employés', roles: ['Admin', 'Personnel'],
      description: 'Système de tâches quotidiennes avec calendrier, attribution et statistiques.',
      steps: [
        { label: 'Créer des tâches :', items: [
          'Sélectionnez un jour dans le calendrier.',
          'Cliquez sur "Ajouter une tâche" et entrez la description.',
          'Assignez la tâche à un ou plusieurs travailleurs.',
        ]},
        { label: 'Compléter les tâches (travailleur) :', items: [
          'Ouvrez le jour actuel dans le calendrier.',
          'Marquez chaque tâche comme "Faite" ou "Non applicable".',
        ]},
        { label: 'Voir les statistiques :', items: [
          'Dépliez la section "Statistiques mensuelles" sous le calendrier.',
          'Consultez le pourcentage d\'accomplissement par travailleur.',
          'Exportez les données en PDF ou Excel.',
        ]},
      ],
      tips: [
        'Les tâches peuvent être dupliquées entre les jours pour les routines.',
        'Les statistiques montrent la performance mensuelle de chaque travailleur.',
      ],
    },
    {
      id: 'registro_horario', title: 'Registre horaire', roles: ['Admin', 'Personnel'],
      description: 'Pointage de la journée de travail avec calcul automatique des heures.',
      steps: [
        { label: 'Pointer (travailleur) :', items: [
          'Sélectionnez le jour dans le calendrier.',
          'Entrez l\'heure d\'entrée et de sortie.',
          'Si applicable, ajoutez la pause (début et fin).',
          'Sélectionnez le type de jour (travaillé, férié, arrêt, vacances…).',
          'Signez numériquement avec le doigt ou la souris.',
          'Le système calcule automatiquement les heures totales, ordinaires et supplémentaires.',
        ]},
        { label: 'Consulter les registres (admin) :', items: [
          'Sélectionnez un travailleur dans le menu déroulant.',
          'Cliquez sur un jour pour voir le détail en mode lecture.',
          'Les données incluent les horaires, la signature et le détail des heures.',
        ]},
      ],
      tips: [
        'Le calcul des heures s\'affiche en temps réel pendant la saisie.',
        'Les jours fériés ou d\'arrêt ne comptent pas les heures supplémentaires.',
        'L\'admin ne peut pas modifier les registres, seulement les consulter.',
      ],
    },
    {
      id: 'inventario', title: 'Inventaire', roles: ['Admin', 'Personnel'],
      description: 'Gestion des produits et matériaux avec alertes de stock bas.',
      steps: [
        { label: 'Ajouter un produit :', items: [
          'Cliquez sur "Nouveau produit".',
          'Entrez le nom, la catégorie, la quantité actuelle et le stock minimum.',
          'Sauvegardez le produit.',
        ]},
        { label: 'Enregistrer un mouvement :', items: [
          'Cliquez sur un produit existant.',
          'Sélectionnez "Entrée" ou "Sortie" et la quantité.',
          'Le stock est mis à jour automatiquement.',
        ]},
      ],
      tips: [
        'Les produits en dessous du stock minimum sont mis en évidence en rouge.',
        'Vous pouvez exporter l\'inventaire complet en Excel pour les commandes.',
      ],
    },
    {
      id: 'sugerencias', title: 'Boîte à suggestions', roles: ['Admin'],
      description: 'Boîte publique pour que les résidents envoient des suggestions anonymes via lien ou QR.',
      steps: [
        { label: 'Partager la boîte :', items: [
          'Copiez le lien public ou téléchargez le code QR.',
          'Partagez-le avec les résidents (affiché dans l\'hébergement, par exemple).',
        ]},
        { label: 'Gérer les suggestions :', items: [
          'Les suggestions apparaissent automatiquement dans la liste.',
          'Vous pouvez les marquer comme lues, y répondre ou les archiver.',
        ]},
      ],
      tips: [
        'Les suggestions sont anonymes : les résidents n\'ont pas besoin de s\'identifier.',
        'Imprimez le QR et placez-le dans les espaces communs.',
      ],
    },
    {
      id: 'notas', title: 'Notes', roles: ['Admin'],
      description: 'Bloc-notes interne pour rappels, annotations et informations importantes.',
      steps: [
        { label: 'Créer une note :', items: [
          'Cliquez sur "Nouvelle note".',
          'Écrivez un titre et le contenu.',
          'Optionnellement, choisissez une couleur pour catégoriser visuellement.',
          'La note est sauvegardée automatiquement.',
        ]},
      ],
      tips: [
        'Utilisez des couleurs différentes pour distinguer les thèmes (ex : rouge = urgent).',
        'Les notes sont privées et visibles uniquement par l\'administrateur.',
      ],
    },
  ],
};

const en: HelpTexts = {
  dialogTitle: 'Application Guide',
  dialogDescription: 'User manual with step-by-step instructions for each section.',
  legendSteps: 'Interactive steps',
  legendTips: 'Tips',
  legendRoles: 'Roles with access',
  howToUse: 'How to use',
  shortcutsTitle: 'Useful shortcuts',
  shortcutSearch: 'Global search from any section',
  shortcutNotifications: 'Notifications alert you about incidents, arrivals and pending tasks',
  shortcutExport: 'Almost all sections allow exporting data as PDF or Excel',
  sections: [
    {
      id: 'dashboard', title: 'Dashboard', roles: ['Admin', 'Manager', 'Staff'],
      description: 'Main panel with a real-time summary of the shelter\'s status.',
      steps: [
        { label: 'The dashboard shows at a glance:', items: [
          'Current occupancy — free and occupied beds with percentage',
          'Today\'s arrivals — guests expected today',
          'Open incidents — number of unresolved incidents',
          'Quick access — direct buttons to the most used sections',
        ]},
      ],
      tips: ['Click on any card to go directly to that section.'],
    },
    {
      id: 'habitaciones', title: 'Rooms', roles: ['Admin', 'Manager', 'Staff'],
      description: 'Visual management of rooms and beds with an interactive map view.',
      steps: [
        { label: 'Register a check-in:', items: [
          'Find the free bed (green color) in the desired room.',
          'Click on the bed to open the check-in form.',
          'Fill in the guest details: name, nationality, dates, etc.',
          'Click "Register" to confirm the entry.',
        ]},
        { label: 'Perform a check-out:', items: [
          'Click on an occupied bed (red/orange color).',
          'Confirm the guest\'s departure by clicking "Check-out".',
        ]},
        { label: 'Block a bed:', items: [
          'Click on a free bed.',
          'Select "Block" and indicate the reason (maintenance, reservation, etc.).',
        ]},
      ],
      tips: [
        'Colors indicate status: green = free, red = occupied, gray = blocked.',
        'You can drag guests between beds to change assignments.',
      ],
    },
    {
      id: 'historial', title: 'History', roles: ['Admin', 'Manager'],
      description: 'Complete record of all guests who have stayed at the shelter.',
      steps: [
        { label: 'Search for a guest:', items: [
          'Use the search field to filter by name or nationality.',
          'Filter by date range if you need a specific period.',
          'Results update in real time.',
        ]},
        { label: 'Export data:', items: [
          'Click the export button (PDF or Excel).',
          'A file will be downloaded with the visible records based on applied filters.',
        ]},
      ],
      tips: [
        'Export respects active filters: if you filter by dates, only those records will be exported.',
        'Use global search (Ctrl+K) to find guests from any section.',
      ],
    },
    {
      id: 'llegadas', title: 'Expected Arrivals', roles: ['Admin', 'Manager', 'Staff'],
      description: 'Calendar of reservations and scheduled arrivals at the shelter.',
      steps: [
        { label: 'Register an arrival:', items: [
          'Click "New arrival" or click on a calendar day.',
          'Enter the data: name, nationality, arrival and departure dates.',
          'Optionally, assign a specific bed.',
          'Save the reservation. It will appear on the calendar.',
        ]},
        { label: 'Convert arrival to check-in:', items: [
          'When the guest arrives, click on their reservation.',
          'Confirm the check-in to automatically move them to Rooms.',
        ]},
      ],
      tips: [
        'Today\'s arrivals are automatically highlighted on the dashboard.',
        'You can register arrivals for future dates to plan occupancy.',
      ],
    },
    {
      id: 'comedor', title: 'Dining', roles: ['Admin', 'Manager', 'Staff'],
      description: 'Daily control of meals served per shift: breakfast, lunch and dinner.',
      steps: [
        { label: 'Register diners:', items: [
          'Select the day (today is shown by default).',
          'Enter the number of diners for each shift: breakfast, lunch, dinner.',
          'Data is saved automatically.',
        ]},
      ],
      tips: [
        'The monthly summary allows you to see the evolution of dining usage.',
        'This data is included in exportable reports.',
      ],
    },
    {
      id: 'incidencias', title: 'Incidents', roles: ['Admin', 'Manager', 'Staff'],
      description: 'Registration and tracking of incidents, events or problems at the shelter.',
      steps: [
        { label: 'Create an incident:', items: [
          'Click "New incident".',
          'Select the type (cohabitation, maintenance, health, etc.).',
          'Describe the situation and select the priority.',
          'Optionally: attach files, select involved guests and set visibility.',
          'Save the incident.',
        ]},
        { label: 'Manage incidents:', items: [
          'Change status: open → in progress → resolved.',
          'Add comments to document the follow-up.',
        ]},
      ],
      tips: [
        'Use "visibility" to control which roles can see each incident.',
        'Open incidents appear as alerts on the dashboard.',
        'You can attach photos or documents as evidence.',
      ],
    },
    {
      id: 'tareas', title: 'Employee Tasks', roles: ['Admin', 'Staff'],
      description: 'Daily task system with calendar, assignment and completion statistics.',
      steps: [
        { label: 'Create tasks:', items: [
          'Select a day on the calendar.',
          'Click "Add task" and enter the description.',
          'Assign the task to one or more workers.',
        ]},
        { label: 'Complete tasks (worker):', items: [
          'Open the current day on the calendar.',
          'Mark each task as "Done" or "Not applicable".',
        ]},
        { label: 'View statistics:', items: [
          'Expand the "Monthly Statistics" section below the calendar.',
          'Check the completion percentage per worker.',
          'Export the data as PDF or Excel.',
        ]},
      ],
      tips: [
        'Tasks can be duplicated between days for recurring routines.',
        'Statistics show the monthly performance of each worker.',
      ],
    },
    {
      id: 'registro_horario', title: 'Time Tracking', roles: ['Admin', 'Staff'],
      description: 'Work day clocking with automatic calculation of regular and overtime hours.',
      steps: [
        { label: 'Clock in (worker):', items: [
          'Select the day on the calendar.',
          'Enter the entry and exit time.',
          'If applicable, add the break (start and end).',
          'Select the day type (working, holiday, sick leave, vacation…).',
          'Sign digitally with your finger or mouse.',
          'The system automatically calculates total, regular and overtime hours.',
        ]},
        { label: 'View records (admin):', items: [
          'Select a worker from the dropdown.',
          'Click on any day to see the details in read-only mode.',
          'Data includes schedules, signature and hour breakdown.',
        ]},
      ],
      tips: [
        'Hour calculation is shown live as you enter the times.',
        'Holidays or sick days do not count as overtime.',
        'Admin cannot modify records, only view them.',
      ],
    },
    {
      id: 'inventario', title: 'Inventory', roles: ['Admin', 'Staff'],
      description: 'Product and material management with low stock alerts.',
      steps: [
        { label: 'Add a product:', items: [
          'Click "New product".',
          'Enter the name, category, current quantity and minimum stock.',
          'Save the product.',
        ]},
        { label: 'Register movement:', items: [
          'Click on an existing product.',
          'Select "Entry" or "Exit" and the quantity.',
          'Stock is updated automatically.',
        ]},
      ],
      tips: [
        'Products below minimum stock are highlighted in red.',
        'You can export the full inventory to Excel for orders.',
      ],
    },
    {
      id: 'sugerencias', title: 'Suggestion Box', roles: ['Admin'],
      description: 'Public box for guests to send anonymous suggestions via link or QR.',
      steps: [
        { label: 'Share the box:', items: [
          'Copy the public link or download the QR code.',
          'Share it with guests (printed in the shelter, for example).',
        ]},
        { label: 'Manage suggestions:', items: [
          'Suggestions appear automatically in the list.',
          'You can mark them as read, reply or archive them.',
        ]},
      ],
      tips: [
        'Suggestions are anonymous: guests don\'t need to identify themselves.',
        'Print the QR and place it in common areas for easy access.',
      ],
    },
    {
      id: 'notas', title: 'Notes', roles: ['Admin'],
      description: 'Internal notepad for reminders, annotations and important information.',
      steps: [
        { label: 'Create a note:', items: [
          'Click "New note".',
          'Write a title and content.',
          'Optionally, choose a color to visually categorize.',
          'The note is saved automatically.',
        ]},
      ],
      tips: [
        'Use different colors to distinguish topics (e.g.: red = urgent, green = resolved).',
        'Notes are private and only visible to the administrator.',
      ],
    },
  ],
};

const ar: HelpTexts = {
  dialogTitle: 'دليل التطبيق',
  dialogDescription: 'دليل الاستخدام مع تعليمات خطوة بخطوة لكل قسم.',
  legendSteps: 'خطوات تفاعلية',
  legendTips: 'نصائح',
  legendRoles: 'الأدوار المسموح لها',
  howToUse: 'كيفية الاستخدام',
  shortcutsTitle: 'اختصارات مفيدة',
  shortcutSearch: 'بحث شامل من أي قسم',
  shortcutNotifications: 'الإشعارات تنبهك بالحوادث والوصول والمهام المعلقة',
  shortcutExport: 'معظم الأقسام تتيح تصدير البيانات كـ PDF أو Excel',
  sections: [
    {
      id: 'dashboard', title: 'لوحة التحكم', roles: ['مدير', 'مسؤول', 'موظف'],
      description: 'لوحة رئيسية مع ملخص فوري لحالة الملجأ.',
      steps: [
        { label: 'تعرض لوحة التحكم بنظرة واحدة:', items: [
          'الإشغال الحالي — الأسرّة الحرة والمشغولة مع النسبة المئوية',
          'وصول اليوم — النزلاء المتوقعون اليوم',
          'الحوادث المفتوحة — عدد الحوادث غير المحلولة',
          'وصول سريع — أزرار مباشرة للأقسام الأكثر استخداماً',
        ]},
      ],
      tips: ['اضغط على أي بطاقة للذهاب مباشرة إلى ذلك القسم.'],
    },
    {
      id: 'habitaciones', title: 'الغرف', roles: ['مدير', 'مسؤول', 'موظف'],
      description: 'إدارة مرئية للغرف والأسرّة مع عرض تفاعلي.',
      steps: [
        { label: 'تسجيل دخول نزيل:', items: [
          'حدد السرير الحر (اللون الأخضر) في الغرفة المطلوبة.',
          'اضغط على السرير لفتح نموذج التسجيل.',
          'املأ بيانات النزيل: الاسم، الجنسية، التواريخ، إلخ.',
          'اضغط "تسجيل" لتأكيد الدخول.',
        ]},
        { label: 'تسجيل خروج:', items: [
          'اضغط على سرير مشغول (اللون الأحمر/البرتقالي).',
          'أكد مغادرة النزيل بالضغط على "خروج".',
        ]},
        { label: 'حظر سرير:', items: [
          'اضغط على سرير حر.',
          'اختر "حظر" وحدد السبب (صيانة، حجز، إلخ).',
        ]},
      ],
      tips: [
        'الألوان تشير إلى الحالة: أخضر = حر، أحمر = مشغول، رمادي = محظور.',
        'يمكنك سحب النزلاء بين الأسرّة لتغيير التوزيع.',
      ],
    },
    {
      id: 'historial', title: 'السجل', roles: ['مدير', 'مسؤول'],
      description: 'سجل كامل لجميع النزلاء الذين مروا بالملجأ.',
      steps: [
        { label: 'البحث عن نزيل:', items: [
          'استخدم حقل البحث للتصفية بالاسم أو الجنسية.',
          'صفّ حسب نطاق التواريخ إذا كنت بحاجة لفترة محددة.',
          'النتائج تتحدث في الوقت الفعلي.',
        ]},
        { label: 'تصدير البيانات:', items: [
          'اضغط على زر التصدير (PDF أو Excel).',
          'سيتم تنزيل ملف بالسجلات المرئية حسب الفلاتر المطبقة.',
        ]},
      ],
      tips: [
        'التصدير يحترم الفلاتر النشطة.',
        'استخدم البحث الشامل (Ctrl+K) للعثور على نزلاء من أي قسم.',
      ],
    },
    {
      id: 'llegadas', title: 'الوصول المتوقع', roles: ['مدير', 'مسؤول', 'موظف'],
      description: 'تقويم الحجوزات والوصول المبرمج للملجأ.',
      steps: [
        { label: 'تسجيل وصول:', items: [
          'اضغط "وصول جديد" أو اضغط على يوم في التقويم.',
          'أدخل البيانات: الاسم، الجنسية، تاريخ الوصول والمغادرة.',
          'اختيارياً، حدد سريراً محدداً.',
          'احفظ. سيظهر الحجز في التقويم.',
        ]},
        { label: 'تحويل الوصول إلى تسجيل دخول:', items: [
          'عند وصول النزيل، اضغط على حجزه.',
          'أكد التسجيل لنقله تلقائياً إلى الغرف.',
        ]},
      ],
      tips: [
        'وصول اليوم يُبرز تلقائياً في لوحة التحكم.',
        'يمكنك تسجيل وصول لتواريخ مستقبلية لتخطيط الإشغال.',
      ],
    },
    {
      id: 'comedor', title: 'المطعم', roles: ['مدير', 'مسؤول', 'موظف'],
      description: 'مراقبة يومية للوجبات المقدمة: فطور، غداء وعشاء.',
      steps: [
        { label: 'تسجيل رواد الطعام:', items: [
          'اختر اليوم (يُعرض اليوم بشكل افتراضي).',
          'أدخل عدد الرواد لكل وجبة.',
          'البيانات تُحفظ تلقائياً.',
        ]},
      ],
      tips: [
        'الملخص الشهري يتيح لك رؤية تطور استخدام المطعم.',
        'هذه البيانات مضمنة في التقارير القابلة للتصدير.',
      ],
    },
    {
      id: 'incidencias', title: 'الحوادث', roles: ['مدير', 'مسؤول', 'موظف'],
      description: 'تسجيل ومتابعة الحوادث والأحداث أو المشاكل في الملجأ.',
      steps: [
        { label: 'إنشاء حادثة:', items: [
          'اضغط "حادثة جديدة".',
          'اختر النوع (تعايش، صيانة، صحية، إلخ).',
          'صف الموقف واختر الأولوية.',
          'اختيارياً: أرفق ملفات، حدد النزلاء المعنيين واضبط الرؤية.',
          'احفظ الحادثة.',
        ]},
        { label: 'إدارة الحوادث:', items: [
          'غيّر الحالة: مفتوحة ← قيد المعالجة ← محلولة.',
          'أضف تعليقات لتوثيق المتابعة.',
        ]},
      ],
      tips: [
        'استخدم "الرؤية" للتحكم في الأدوار التي يمكنها رؤية كل حادثة.',
        'الحوادث المفتوحة تظهر كتنبيه في لوحة التحكم.',
        'يمكنك إرفاق صور أو مستندات كدليل.',
      ],
    },
    {
      id: 'tareas', title: 'مهام الموظفين', roles: ['مدير', 'موظف'],
      description: 'نظام مهام يومية مع تقويم وتعيين وإحصائيات الإنجاز.',
      steps: [
        { label: 'إنشاء مهام:', items: [
          'اختر يوماً في التقويم.',
          'اضغط "إضافة مهمة" وأدخل الوصف.',
          'عيّن المهمة لعامل أو أكثر.',
        ]},
        { label: 'إكمال المهام (عامل):', items: [
          'افتح اليوم الحالي في التقويم.',
          'حدد كل مهمة كـ "تم" أو "لا ينطبق".',
        ]},
        { label: 'عرض الإحصائيات:', items: [
          'افتح قسم "الإحصائيات الشهرية" أسفل التقويم.',
          'راجع نسبة الإنجاز لكل عامل.',
          'صدّر البيانات كـ PDF أو Excel.',
        ]},
      ],
      tips: [
        'يمكن تكرار المهام بين الأيام للروتين المتكرر.',
        'الإحصائيات تعرض الأداء الشهري لكل عامل.',
      ],
    },
    {
      id: 'registro_horario', title: 'سجل الدوام', roles: ['مدير', 'موظف'],
      description: 'تسجيل يوم العمل مع حساب تلقائي للساعات العادية والإضافية.',
      steps: [
        { label: 'التسجيل (عامل):', items: [
          'اختر اليوم في التقويم.',
          'أدخل وقت الدخول والخروج.',
          'إذا كان ذلك ينطبق، أضف الاستراحة (بداية ونهاية).',
          'اختر نوع اليوم (عمل، عطلة، إجازة مرضية، إجازة…).',
          'وقّع رقمياً بإصبعك أو الماوس.',
          'يحسب النظام تلقائياً الساعات الإجمالية والعادية والإضافية.',
        ]},
        { label: 'مراجعة السجلات (مدير):', items: [
          'اختر عاملاً من القائمة المنسدلة.',
          'اضغط على أي يوم لرؤية التفاصيل بوضع القراءة فقط.',
          'البيانات تشمل الجداول والتوقيع وتفصيل الساعات.',
        ]},
      ],
      tips: [
        'يظهر حساب الساعات مباشرة أثناء إدخال الأوقات.',
        'الأيام الاحتفالية أو المرضية لا تحسب ساعات إضافية.',
        'المدير لا يمكنه تعديل السجلات، فقط مراجعتها.',
      ],
    },
    {
      id: 'inventario', title: 'المخزون', roles: ['مدير', 'موظف'],
      description: 'إدارة المنتجات والمواد مع تنبيهات انخفاض المخزون.',
      steps: [
        { label: 'إضافة منتج:', items: [
          'اضغط "منتج جديد".',
          'أدخل الاسم، الفئة، الكمية الحالية والحد الأدنى للمخزون.',
          'احفظ المنتج.',
        ]},
        { label: 'تسجيل حركة:', items: [
          'اضغط على منتج موجود.',
          'اختر "دخول" أو "خروج" والكمية.',
          'يتم تحديث المخزون تلقائياً.',
        ]},
      ],
      tips: [
        'المنتجات تحت الحد الأدنى تُبرز باللون الأحمر.',
        'يمكنك تصدير المخزون الكامل إلى Excel للطلبات.',
      ],
    },
    {
      id: 'sugerencias', title: 'صندوق الاقتراحات', roles: ['مدير'],
      description: 'صندوق عام للنزلاء لإرسال اقتراحات مجهولة عبر رابط أو QR.',
      steps: [
        { label: 'مشاركة الصندوق:', items: [
          'انسخ الرابط العام أو حمّل رمز QR.',
          'شاركه مع النزلاء (مطبوع في الملجأ مثلاً).',
        ]},
        { label: 'إدارة الاقتراحات:', items: [
          'تظهر الاقتراحات تلقائياً في القائمة.',
          'يمكنك تحديدها كمقروءة أو الرد عليها أو أرشفتها.',
        ]},
      ],
      tips: [
        'الاقتراحات مجهولة: لا يحتاج النزلاء للتعريف بأنفسهم.',
        'اطبع رمز QR وضعه في المناطق المشتركة لسهولة الوصول.',
      ],
    },
    {
      id: 'notas', title: 'ملاحظات', roles: ['مدير'],
      description: 'مفكرة داخلية للتذكيرات والملاحظات والمعلومات المهمة.',
      steps: [
        { label: 'إنشاء ملاحظة:', items: [
          'اضغط "ملاحظة جديدة".',
          'اكتب عنواناً والمحتوى.',
          'اختيارياً، اختر لوناً للتصنيف البصري.',
          'تُحفظ الملاحظة تلقائياً.',
        ]},
      ],
      tips: [
        'استخدم ألواناً مختلفة لتمييز المواضيع (مثلاً: أحمر = عاجل).',
        'الملاحظات خاصة ومرئية فقط للمدير.',
      ],
    },
  ],
};

const ru: HelpTexts = {
  dialogTitle: 'Руководство по приложению',
  dialogDescription: 'Руководство пользователя с пошаговыми инструкциями для каждого раздела.',
  legendSteps: 'Интерактивные шаги',
  legendTips: 'Советы',
  legendRoles: 'Роли с доступом',
  howToUse: 'Как использовать',
  shortcutsTitle: 'Полезные сочетания',
  shortcutSearch: 'Глобальный поиск из любого раздела',
  shortcutNotifications: 'Уведомления предупреждают об инцидентах, прибытиях и ожидающих задачах',
  shortcutExport: 'Почти все разделы позволяют экспортировать данные в PDF или Excel',
  sections: [
    {
      id: 'dashboard', title: 'Панель управления', roles: ['Админ', 'Менеджер', 'Персонал'],
      description: 'Главная панель с обзором состояния приюта в реальном времени.',
      steps: [
        { label: 'Панель показывает с первого взгляда:', items: [
          'Текущая заполняемость — свободные и занятые кровати с процентом',
          'Прибытия сегодня — ожидаемые гости на сегодня',
          'Открытые инциденты — количество нерешённых инцидентов',
          'Быстрый доступ — кнопки к наиболее используемым разделам',
        ]},
      ],
      tips: ['Нажмите на карточку, чтобы перейти в этот раздел.'],
    },
    {
      id: 'habitaciones', title: 'Комнаты', roles: ['Админ', 'Менеджер', 'Персонал'],
      description: 'Визуальное управление комнатами и кроватями с интерактивным видом.',
      steps: [
        { label: 'Зарегистрировать заселение:', items: [
          'Найдите свободную кровать (зелёный цвет) в нужной комнате.',
          'Нажмите на кровать, чтобы открыть форму заселения.',
          'Заполните данные гостя: имя, национальность, даты и т.д.',
          'Нажмите "Зарегистрировать" для подтверждения.',
        ]},
        { label: 'Выполнить выезд:', items: [
          'Нажмите на занятую кровать (красный/оранжевый цвет).',
          'Подтвердите выезд гостя нажав "Выезд".',
        ]},
        { label: 'Заблокировать кровать:', items: [
          'Нажмите на свободную кровать.',
          'Выберите "Заблокировать" и укажите причину (обслуживание, бронь и т.д.).',
        ]},
      ],
      tips: [
        'Цвета показывают состояние: зелёный = свободна, красный = занята, серый = заблокирована.',
        'Вы можете перетаскивать гостей между кроватями для смены назначения.',
      ],
    },
    {
      id: 'historial', title: 'История', roles: ['Админ', 'Менеджер'],
      description: 'Полная запись всех гостей, побывавших в приюте.',
      steps: [
        { label: 'Поиск гостя:', items: [
          'Используйте поле поиска для фильтрации по имени или национальности.',
          'Фильтруйте по диапазону дат, если нужен конкретный период.',
          'Результаты обновляются в реальном времени.',
        ]},
        { label: 'Экспорт данных:', items: [
          'Нажмите кнопку экспорта (PDF или Excel).',
          'Будет загружен файл с записями согласно применённым фильтрам.',
        ]},
      ],
      tips: [
        'Экспорт учитывает активные фильтры.',
        'Используйте глобальный поиск (Ctrl+K) для поиска гостей из любого раздела.',
      ],
    },
    {
      id: 'llegadas', title: 'Ожидаемые прибытия', roles: ['Админ', 'Менеджер', 'Персонал'],
      description: 'Календарь бронирований и запланированных прибытий.',
      steps: [
        { label: 'Зарегистрировать прибытие:', items: [
          'Нажмите "Новое прибытие" или на день в календаре.',
          'Введите данные: имя, национальность, даты прибытия и отъезда.',
          'При желании назначьте конкретную кровать.',
          'Сохраните. Бронь появится в календаре.',
        ]},
        { label: 'Перевести прибытие в заселение:', items: [
          'Когда гость прибудет, нажмите на его бронь.',
          'Подтвердите заселение для автоматического перемещения в Комнаты.',
        ]},
      ],
      tips: [
        'Прибытия на сегодня автоматически выделяются на панели.',
        'Можно регистрировать прибытия на будущие даты для планирования.',
      ],
    },
    {
      id: 'comedor', title: 'Столовая', roles: ['Админ', 'Менеджер', 'Персонал'],
      description: 'Ежедневный контроль подаваемых блюд: завтрак, обед и ужин.',
      steps: [
        { label: 'Регистрация посетителей:', items: [
          'Выберите день (по умолчанию — сегодня).',
          'Введите количество посетителей для каждого приёма пищи.',
          'Данные сохраняются автоматически.',
        ]},
      ],
      tips: [
        'Ежемесячный отчёт позволяет видеть динамику использования столовой.',
        'Эти данные включены в экспортируемые отчёты.',
      ],
    },
    {
      id: 'incidencias', title: 'Инциденты', roles: ['Админ', 'Менеджер', 'Персонал'],
      description: 'Регистрация и отслеживание инцидентов, событий или проблем.',
      steps: [
        { label: 'Создать инцидент:', items: [
          'Нажмите "Новый инцидент".',
          'Выберите тип (сосуществование, обслуживание, санитарный и т.д.).',
          'Опишите ситуацию и выберите приоритет.',
          'При желании: прикрепите файлы, выберите затронутых гостей и настройте видимость.',
          'Сохраните инцидент.',
        ]},
        { label: 'Управление инцидентами:', items: [
          'Измените статус: открыт → в процессе → решён.',
          'Добавьте комментарии для документирования.',
        ]},
      ],
      tips: [
        'Используйте "видимость" для контроля доступа ролей к каждому инциденту.',
        'Открытые инциденты отображаются как предупреждение на панели.',
        'Можно прикреплять фото или документы в качестве доказательств.',
      ],
    },
    {
      id: 'tareas', title: 'Задачи сотрудников', roles: ['Админ', 'Персонал'],
      description: 'Система ежедневных задач с календарём, назначением и статистикой выполнения.',
      steps: [
        { label: 'Создать задачи:', items: [
          'Выберите день в календаре.',
          'Нажмите "Добавить задачу" и введите описание.',
          'Назначьте задачу одному или нескольким работникам.',
        ]},
        { label: 'Выполнить задачи (работник):', items: [
          'Откройте текущий день в календаре.',
          'Отметьте каждую задачу как "Выполнено" или "Не применимо".',
        ]},
        { label: 'Просмотр статистики:', items: [
          'Раскройте раздел "Месячная статистика" под календарём.',
          'Проверьте процент выполнения по каждому работнику.',
          'Экспортируйте данные в PDF или Excel.',
        ]},
      ],
      tips: [
        'Задачи можно дублировать между днями для повторяющихся рутин.',
        'Статистика показывает ежемесячную производительность каждого работника.',
      ],
    },
    {
      id: 'registro_horario', title: 'Учёт рабочего времени', roles: ['Админ', 'Персонал'],
      description: 'Табелирование рабочего дня с автоматическим расчётом обычных и сверхурочных часов.',
      steps: [
        { label: 'Отметиться (работник):', items: [
          'Выберите день в календаре.',
          'Введите время входа и выхода.',
          'Если применимо, добавьте перерыв (начало и конец).',
          'Выберите тип дня (рабочий, праздничный, больничный, отпуск…).',
          'Подпишитесь цифровой подписью пальцем или мышью.',
          'Система автоматически рассчитает общие, обычные и сверхурочные часы.',
        ]},
        { label: 'Просмотр записей (админ):', items: [
          'Выберите работника из выпадающего списка.',
          'Нажмите на любой день для просмотра деталей в режиме чтения.',
          'Данные включают графики, подпись и разбивку часов.',
        ]},
      ],
      tips: [
        'Расчёт часов отображается в реальном времени при вводе.',
        'Праздничные и больничные дни не считаются сверхурочными.',
        'Админ не может изменять записи, только просматривать.',
      ],
    },
    {
      id: 'inventario', title: 'Инвентарь', roles: ['Админ', 'Персонал'],
      description: 'Управление продуктами и материалами с оповещениями о низком запасе.',
      steps: [
        { label: 'Добавить продукт:', items: [
          'Нажмите "Новый продукт".',
          'Введите название, категорию, текущее количество и минимальный запас.',
          'Сохраните продукт.',
        ]},
        { label: 'Зарегистрировать движение:', items: [
          'Нажмите на существующий продукт.',
          'Выберите "Приход" или "Расход" и количество.',
          'Запас обновляется автоматически.',
        ]},
      ],
      tips: [
        'Продукты ниже минимального запаса выделяются красным.',
        'Можно экспортировать полный инвентарь в Excel для заказов.',
      ],
    },
    {
      id: 'sugerencias', title: 'Ящик предложений', roles: ['Админ'],
      description: 'Публичный ящик для анонимных предложений гостей через ссылку или QR.',
      steps: [
        { label: 'Поделиться ящиком:', items: [
          'Скопируйте публичную ссылку или скачайте QR-код.',
          'Поделитесь с гостями (распечатайте в приюте, например).',
        ]},
        { label: 'Управление предложениями:', items: [
          'Предложения появляются автоматически в списке.',
          'Можно отметить как прочитанные, ответить или архивировать.',
        ]},
      ],
      tips: [
        'Предложения анонимны: гостям не нужно себя идентифицировать.',
        'Распечатайте QR и разместите в общих зонах для удобства.',
      ],
    },
    {
      id: 'notas', title: 'Заметки', roles: ['Админ'],
      description: 'Внутренний блокнот для напоминаний, пометок и важной информации.',
      steps: [
        { label: 'Создать заметку:', items: [
          'Нажмите "Новая заметка".',
          'Напишите заголовок и содержание.',
          'При желании выберите цвет для визуальной категоризации.',
          'Заметка сохраняется автоматически.',
        ]},
      ],
      tips: [
        'Используйте разные цвета для различия тем (напр.: красный = срочно).',
        'Заметки приватны и видны только администратору.',
      ],
    },
  ],
};

export const helpContent: Record<Language, HelpTexts> = { es, fr, ar, en, ru };
