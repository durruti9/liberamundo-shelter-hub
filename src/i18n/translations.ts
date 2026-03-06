export type Language = 'es' | 'fr' | 'ar' | 'en';

export interface Translations {
  // General
  appName: string;
  managementSystem: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  confirm: string;
  close: string;
  notes: string;
  name: string;
  nationality: string;
  language: string;
  
  // Login
  email: string;
  password: string;
  login: string;
  wrongCredentials: string;

  // Header
  administrator: string;
  manager: string;
  shelterStaff: string;
  users: string;
  logout: string;
  
  // Tabs
  rooms: string;
  history: string;
  arrivals: string;
  dining: string;
  incidents: string;

  // Habitaciones
  occupied: string;
  free: string;
  occupancy: string;
  activeDiets: string;
  noGuests: string;
  checkIn: string;
  checkOut: string;
  changeBed: string;
  bed: string;
  room: string;
  beds: string;
  checkoutDate: string;
  selectExitDate: string;
  futureCheckoutNote: string;
  selectedDate: string;
  guestWillStay: string;
  confirmCheckout: string;
  noFreeBeds: string;
  editGuest: string;
  saveChanges: string;
  deleteWithoutRecord: string;
  deleteWithoutRecordWarning: string;
  deleteWithoutRecordConfirm: string;
  deleteWithoutRecordFinal: string;
  stayDuration: string;
  exitDate: string;
  day: string;
  days: string;
  remaining: string;
  checkoutToday: string;
  checkoutPassed: string;

  // Llegadas
  upcomingArrivals: string;
  newArrival: string;
  noArrivals: string;
  arrivalDate: string;
  assignedRoomBed: string;
  unassigned: string;
  editArrival: string;
  newScheduledArrival: string;
  plannedArrivalDate: string;
  plannedRoom: string;
  plannedBed: string;
  scheduleArrival: string;
  confirmEntry: string;
  reviewBeforeConfirm: string;
  entryDate: string;
  roomFull: string;
  roomAvailable: string;
  confirmTransfer: string;
  actions: string;
  diet: string;
  nieDocument: string;

  // Historial
  guestHistory: string;
  exportCSV: string;
  noRecords: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  active: string;
  historic: string;
  reincorporate: string;
  reincorporateToRoom: string;
  selectRoom: string;
  selectBed: string;
  confirmDeletion: string;
  deleteConfirmMsg: string;

  // Comedor
  diningOrganization: string;
  diners: string;
  noActiveGuests: string;
  fullName: string;
  roomShort: string;
  dietType: string;
  foodParticularities: string;
  separateMeals: string;
  daysToSeparate: string;
  absenceReason: string;
  lastModification: string;
  observations: string;
  paused: string;
  foodPlaceholder: string;
  observationsPlaceholder: string;
  downloadWeeklyPdf: string;
  weekOf: string;

  // Comedor options
  all: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  allDays: string;
  weekdays: string;
  weekends: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;

  // Incidencias
  incidentRegistry: string;
  newIncident: string;
  noIncidents: string;
  incidentType: string;
  incidentDescription: string;
  incidentDate: string;
  incidentGuest: string;
  incidentTypes: {
    behavioral: string;
    medical: string;
    administrative: string;
    social: string;
    other: string;
  };
  resolved: string;
  pending: string;
  toggleResolved: string;
  
  // User management
  userManagement: string;
  inviteNewUser: string;
  createUser: string;
  role: string;

  // Settings & multi-albergue
  settings: string;
  shelterManagement: string;
  addShelter: string;
  deleteShelter: string;
  shelterName: string;
  roomConfiguration: string;
  addRoom: string;
  deleteRoom: string;
  roomName: string;
  numberOfBeds: string;
  switchShelter: string;
  editShelterName: string;
  deleteShelterWarning: string;
  deleteShelterConfirm: string;
  selectShelter: string;
  createShelter: string;
  currentShelter: string;
  noRooms: string;
  assignedShelters: string;
  allShelters: string;

  // Dashboard
  dashboard: string;
  occupancyOverview: string;
  occupancyRate: string;
  totalBeds: string;
  occupiedBeds: string;
  freeBeds: string;
  avgStay: string;
  avgStayDays: string;
  upcomingCheckouts: string;
  noUpcomingCheckouts: string;
  daysLeft: string;
  dietDistribution: string;
  monthlyOccupancy: string;
  guestsOverTime: string;
  activeIncidents: string;
  month: string;

  // Backup
  backupRestore: string;
  exportAllData: string;
  exportDescription: string;
  importData: string;
  importDescription: string;
  importWarning: string;
  exportSuccess: string;
  importSuccess: string;
  importError: string;
  downloadBackup: string;
  selectFile: string;
}

const es: Translations = {
  appName: 'Albergue LiberaMundo',
  managementSystem: 'Sistema de gestión',
  cancel: 'Cancelar',
  save: 'Guardar',
  delete: 'Eliminar',
  edit: 'Editar',
  confirm: 'Confirmar',
  close: 'Cerrar',
  notes: 'Notas',
  name: 'Nombre',
  nationality: 'Nacionalidad',
  language: 'Idioma',
  email: 'Correo electrónico',
  password: 'Contraseña',
  login: 'Iniciar sesión',
  wrongCredentials: 'Credenciales incorrectas',
  administrator: 'Administrador',
  manager: 'Gestor',
  shelterStaff: 'Personal Albergue',
  users: 'Usuarios',
  logout: 'Cerrar sesión',
  rooms: 'Habitaciones',
  history: 'Historial',
  arrivals: 'Llegadas',
  dining: 'Comedor',
  incidents: 'Incidencias',
  occupied: 'Ocupadas',
  free: 'Libres',
  occupancy: 'Ocupación',
  activeDiets: 'Dietas activas',
  noGuests: 'Sin huéspedes',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  changeBed: 'Cambiar cama',
  bed: 'Cama',
  room: 'Habitación',
  beds: 'camas',
  checkoutDate: 'Fecha de Check-out',
  selectExitDate: 'Selecciona la fecha de salida',
  futureCheckoutNote: 'Si seleccionas una fecha futura, permanecerá en la habitación hasta ese día.',
  selectedDate: 'Fecha seleccionada',
  guestWillStay: 'El huésped permanecerá hasta esta fecha',
  confirmCheckout: 'Confirmar Check-out',
  noFreeBeds: 'No hay camas libres',
  editGuest: 'Editar huésped',
  saveChanges: 'Guardar cambios',
  deleteWithoutRecord: 'Borrar sin registro',
  deleteWithoutRecordWarning: '⚠️ Esta acción eliminará completamente al huésped del sistema. NO quedará reflejado en el historial. Esta acción es irreversible.',
  deleteWithoutRecordConfirm: '¿Estás completamente seguro? Escribe "CONFIRMAR" para proceder.',
  deleteWithoutRecordFinal: 'Eliminar permanentemente',
  stayDuration: 'Estancia',
  exitDate: 'Sale',
  day: 'día',
  days: 'días',
  remaining: 'restantes',
  checkoutToday: 'Sale hoy',
  checkoutPassed: 'Fecha de salida pasada',
  upcomingArrivals: 'Próximas Llegadas',
  newArrival: '+ Nueva llegada',
  noArrivals: 'No hay llegadas programadas',
  arrivalDate: 'Fecha llegada',
  assignedRoomBed: 'Hab. / Cama',
  unassigned: 'Sin asignar',
  editArrival: 'Editar llegada',
  newScheduledArrival: 'Nueva llegada programada',
  plannedArrivalDate: 'Fecha de llegada prevista',
  plannedRoom: 'Habitación prevista',
  plannedBed: 'Cama prevista',
  scheduleArrival: 'Programar llegada',
  confirmEntry: 'Confirmar entrada',
  reviewBeforeConfirm: 'Revisa y edita los datos antes de confirmar el traslado a la habitación. Solo puedes asignar camas libres.',
  entryDate: 'Fecha de entrada',
  roomFull: '(Completa)',
  roomAvailable: '(Disponible)',
  confirmTransfer: 'Confirmar traslado',
  actions: 'Acciones',
  diet: 'Dieta',
  nieDocument: 'NIE / Documento',
  guestHistory: 'Historial de Huéspedes',
  exportCSV: 'Exportar CSV',
  noRecords: 'No hay registros',
  checkInDate: 'Check-in',
  checkOutDate: 'Check-out',
  status: 'Estado',
  active: 'Activo',
  historic: 'Histórico',
  reincorporate: 'Reincorporar',
  reincorporateToRoom: 'Reincorporar a habitación',
  selectRoom: 'Seleccionar habitación',
  selectBed: 'Seleccionar cama',
  confirmDeletion: 'Confirmar eliminación',
  deleteConfirmMsg: '¿Estás seguro de que quieres eliminar este huésped permanentemente? Esta acción no se puede deshacer.',
  diningOrganization: 'Comedor — Organización de Comidas',
  diners: 'comensales',
  noActiveGuests: 'No hay huéspedes activos',
  fullName: 'Nombre Completo',
  roomShort: 'Hab.',
  dietType: 'Tipo de Dieta',
  foodParticularities: 'Particularidades Alimentarias',
  separateMeals: 'Separar Comidas',
  daysToSeparate: 'Días a Separar',
  absenceReason: 'Motivo Ausencia',
  lastModification: 'Última Modificación',
  observations: 'Observaciones',
  paused: 'Pausado',
  foodPlaceholder: 'Alimentación preferiblemente...',
  observationsPlaceholder: 'Ramadán, etc.',
  downloadWeeklyPdf: 'Descargar PDF semanal',
  weekOf: 'Semana del',
  all: 'Todas',
  breakfast: 'Desayuno',
  lunch: 'Comida',
  dinner: 'Cena',
  allDays: 'Todos los días',
  weekdays: 'Laborables',
  weekends: 'Fines de semana',
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
  incidentRegistry: 'Registro de Incidencias',
  newIncident: '+ Nueva incidencia',
  noIncidents: 'No hay incidencias registradas',
  incidentType: 'Tipo',
  incidentDescription: 'Descripción',
  incidentDate: 'Fecha',
  incidentGuest: 'Huésped',
  incidentTypes: {
    behavioral: 'Conductual',
    medical: 'Médica',
    administrative: 'Administrativa',
    social: 'Social',
    other: 'Otra',
  },
  resolved: 'Resuelta',
  pending: 'Pendiente',
  toggleResolved: 'Marcar como resuelta',
  userManagement: 'Gestión de Usuarios',
  inviteNewUser: 'Invitar nuevo usuario',
  createUser: 'Crear usuario',
  role: 'Rol',
  settings: 'Configuración',
  shelterManagement: 'Gestión de Albergues',
  addShelter: 'Añadir albergue',
  deleteShelter: 'Eliminar albergue',
  shelterName: 'Nombre del albergue',
  roomConfiguration: 'Configuración de Habitaciones',
  addRoom: 'Añadir habitación',
  deleteRoom: 'Eliminar habitación',
  roomName: 'Nombre de la habitación',
  numberOfBeds: 'Nº de camas',
  switchShelter: 'Cambiar albergue',
  editShelterName: 'Editar nombre',
  deleteShelterWarning: '⚠️ Se eliminará el albergue y TODOS sus datos (huéspedes, historial, comedor, incidencias). Esta acción es irreversible.',
  deleteShelterConfirm: '¿Estás seguro? Escribe "ELIMINAR" para proceder.',
  selectShelter: 'Seleccionar albergue',
  createShelter: 'Crear albergue',
  currentShelter: 'Albergue actual',
  noRooms: 'No hay habitaciones configuradas',
  assignedShelters: 'Albergues asignados',
  allShelters: 'Todos los albergues',
  dashboard: 'Panel',
  occupancyOverview: 'Resumen de Ocupación',
  occupancyRate: 'Tasa de ocupación',
  totalBeds: 'Camas totales',
  occupiedBeds: 'Camas ocupadas',
  freeBeds: 'Camas libres',
  avgStay: 'Estancia media',
  avgStayDays: 'días de media',
  upcomingCheckouts: 'Próximas salidas',
  noUpcomingCheckouts: 'Sin salidas próximas',
  daysLeft: 'días restantes',
  dietDistribution: 'Distribución de dietas',
  monthlyOccupancy: 'Ocupación mensual',
  guestsOverTime: 'Huéspedes en el tiempo',
  activeIncidents: 'Incidencias activas',
  month: 'Mes',
  backupRestore: 'Backup y Restauración',
  exportAllData: 'Exportar todos los datos',
  exportDescription: 'Descarga un archivo JSON con todos los datos de todos los albergues, huéspedes, comedor, llegadas, incidencias y usuarios.',
  importData: 'Importar datos',
  importDescription: 'Restaura datos desde un archivo de backup previamente exportado.',
  importWarning: '⚠️ Esto reemplazará TODOS los datos actuales. Esta acción no se puede deshacer.',
  exportSuccess: 'Backup exportado correctamente',
  importSuccess: 'Datos restaurados correctamente. Recargando...',
  importError: 'Error al importar. Archivo inválido.',
  downloadBackup: 'Descargar backup',
  selectFile: 'Seleccionar archivo',
};

const fr: Translations = {
  appName: 'Albergue LiberaMundo',
  managementSystem: 'Système de gestion',
  cancel: 'Annuler',
  save: 'Enregistrer',
  delete: 'Supprimer',
  edit: 'Modifier',
  confirm: 'Confirmer',
  close: 'Fermer',
  notes: 'Notes',
  name: 'Nom',
  nationality: 'Nationalité',
  language: 'Langue',
  email: 'E-mail',
  password: 'Mot de passe',
  login: 'Se connecter',
  wrongCredentials: 'Identifiants incorrects',
  administrator: 'Administrateur',
  manager: 'Gestionnaire',
  shelterStaff: 'Personnel hébergement',
  users: 'Utilisateurs',
  logout: 'Se déconnecter',
  rooms: 'Chambres',
  history: 'Historique',
  arrivals: 'Arrivées',
  dining: 'Réfectoire',
  incidents: 'Incidents',
  occupied: 'Occupés',
  free: 'Libres',
  occupancy: 'Occupation',
  activeDiets: 'Régimes actifs',
  noGuests: 'Aucun résident',
  checkIn: 'Enregistrement',
  checkOut: 'Départ',
  changeBed: 'Changer de lit',
  bed: 'Lit',
  room: 'Chambre',
  beds: 'lits',
  checkoutDate: 'Date de départ',
  selectExitDate: 'Sélectionnez la date de sortie',
  futureCheckoutNote: 'Si vous sélectionnez une date future, le résident restera jusqu\'à ce jour.',
  selectedDate: 'Date sélectionnée',
  guestWillStay: 'Le résident restera jusqu\'à cette date',
  confirmCheckout: 'Confirmer le départ',
  noFreeBeds: 'Aucun lit disponible',
  editGuest: 'Modifier le résident',
  saveChanges: 'Enregistrer les modifications',
  deleteWithoutRecord: 'Supprimer sans enregistrement',
  deleteWithoutRecordWarning: '⚠️ Cette action supprimera complètement le résident du système. Aucune trace ne sera conservée. Irréversible.',
  deleteWithoutRecordConfirm: 'Êtes-vous sûr ? Tapez "CONFIRMER" pour continuer.',
  deleteWithoutRecordFinal: 'Supprimer définitivement',
  stayDuration: 'Séjour',
  exitDate: 'Départ',
  day: 'jour',
  days: 'jours',
  remaining: 'restants',
  checkoutToday: 'Départ aujourd\'hui',
  checkoutPassed: 'Date de départ passée',
  upcomingArrivals: 'Prochaines Arrivées',
  newArrival: '+ Nouvelle arrivée',
  noArrivals: 'Aucune arrivée programmée',
  arrivalDate: 'Date d\'arrivée',
  assignedRoomBed: 'Ch. / Lit',
  unassigned: 'Non assigné',
  editArrival: 'Modifier l\'arrivée',
  newScheduledArrival: 'Nouvelle arrivée programmée',
  plannedArrivalDate: 'Date d\'arrivée prévue',
  plannedRoom: 'Chambre prévue',
  plannedBed: 'Lit prévu',
  scheduleArrival: 'Programmer l\'arrivée',
  confirmEntry: 'Confirmer l\'entrée',
  reviewBeforeConfirm: 'Vérifiez et modifiez les données avant de confirmer le transfert.',
  entryDate: 'Date d\'entrée',
  roomFull: '(Complet)',
  roomAvailable: '(Disponible)',
  confirmTransfer: 'Confirmer le transfert',
  actions: 'Actions',
  diet: 'Régime',
  nieDocument: 'Pièce d\'identité',
  guestHistory: 'Historique des Résidents',
  exportCSV: 'Exporter CSV',
  noRecords: 'Aucun enregistrement',
  checkInDate: 'Entrée',
  checkOutDate: 'Sortie',
  status: 'Statut',
  active: 'Actif',
  historic: 'Historique',
  reincorporate: 'Réincorporer',
  reincorporateToRoom: 'Réincorporer dans une chambre',
  selectRoom: 'Sélectionner une chambre',
  selectBed: 'Sélectionner un lit',
  confirmDeletion: 'Confirmer la suppression',
  deleteConfirmMsg: 'Êtes-vous sûr de vouloir supprimer définitivement ce résident ?',
  diningOrganization: 'Réfectoire — Organisation des Repas',
  diners: 'convives',
  noActiveGuests: 'Aucun résident actif',
  fullName: 'Nom Complet',
  roomShort: 'Ch.',
  dietType: 'Type de Régime',
  foodParticularities: 'Particularités Alimentaires',
  separateMeals: 'Séparer Repas',
  daysToSeparate: 'Jours à Séparer',
  absenceReason: 'Motif d\'Absence',
  lastModification: 'Dernière Modification',
  observations: 'Observations',
  paused: 'En pause',
  foodPlaceholder: 'Alimentation préférable...',
  observationsPlaceholder: 'Ramadan, etc.',
  downloadWeeklyPdf: 'Télécharger PDF hebdomadaire',
  weekOf: 'Semaine du',
  all: 'Tous',
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  allDays: 'Tous les jours',
  weekdays: 'Jours ouvrables',
  weekends: 'Week-ends',
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
  incidentRegistry: 'Registre des Incidents',
  newIncident: '+ Nouvel incident',
  noIncidents: 'Aucun incident enregistré',
  incidentType: 'Type',
  incidentDescription: 'Description',
  incidentDate: 'Date',
  incidentGuest: 'Résident',
  incidentTypes: {
    behavioral: 'Comportemental',
    medical: 'Médical',
    administrative: 'Administratif',
    social: 'Social',
    other: 'Autre',
  },
  resolved: 'Résolu',
  pending: 'En attente',
  toggleResolved: 'Marquer comme résolu',
  userManagement: 'Gestion des Utilisateurs',
  inviteNewUser: 'Inviter un nouvel utilisateur',
  createUser: 'Créer un utilisateur',
  role: 'Rôle',
  settings: 'Paramètres',
  shelterManagement: 'Gestion des Hébergements',
  addShelter: 'Ajouter un hébergement',
  deleteShelter: 'Supprimer l\'hébergement',
  shelterName: 'Nom de l\'hébergement',
  roomConfiguration: 'Configuration des Chambres',
  addRoom: 'Ajouter une chambre',
  deleteRoom: 'Supprimer la chambre',
  roomName: 'Nom de la chambre',
  numberOfBeds: 'Nbre de lits',
  switchShelter: 'Changer d\'hébergement',
  editShelterName: 'Modifier le nom',
  deleteShelterWarning: '⚠️ L\'hébergement et TOUTES ses données seront supprimés. Irréversible.',
  deleteShelterConfirm: 'Êtes-vous sûr ? Tapez "SUPPRIMER" pour continuer.',
  selectShelter: 'Sélectionner un hébergement',
  createShelter: 'Créer un hébergement',
  currentShelter: 'Hébergement actuel',
  noRooms: 'Aucune chambre configurée',
  assignedShelters: 'Hébergements assignés',
  allShelters: 'Tous les hébergements',
  dashboard: 'Tableau de bord',
  occupancyOverview: 'Aperçu de l\'occupation',
  occupancyRate: 'Taux d\'occupation',
  totalBeds: 'Lits totaux',
  occupiedBeds: 'Lits occupés',
  freeBeds: 'Lits libres',
  avgStay: 'Séjour moyen',
  avgStayDays: 'jours en moyenne',
  upcomingCheckouts: 'Départs prochains',
  noUpcomingCheckouts: 'Aucun départ prochain',
  daysLeft: 'jours restants',
  dietDistribution: 'Répartition des régimes',
  monthlyOccupancy: 'Occupation mensuelle',
  guestsOverTime: 'Résidents au fil du temps',
  activeIncidents: 'Incidents actifs',
  month: 'Mois',
  backupRestore: 'Sauvegarde et Restauration',
  exportAllData: 'Exporter toutes les données',
  exportDescription: 'Téléchargez un fichier JSON avec toutes les données.',
  importData: 'Importer des données',
  importDescription: 'Restaurez les données depuis un fichier de sauvegarde.',
  importWarning: '⚠️ Cela remplacera TOUTES les données actuelles.',
  exportSuccess: 'Sauvegarde exportée avec succès',
  importSuccess: 'Données restaurées. Rechargement...',
  importError: 'Erreur d\'importation. Fichier invalide.',
  downloadBackup: 'Télécharger la sauvegarde',
  selectFile: 'Sélectionner un fichier',
};

const ar: Translations = {
  appName: 'Albergue LiberaMundo',
  managementSystem: 'نظام الإدارة',
  cancel: 'إلغاء',
  save: 'حفظ',
  delete: 'حذف',
  edit: 'تعديل',
  confirm: 'تأكيد',
  close: 'إغلاق',
  notes: 'ملاحظات',
  name: 'الاسم',
  nationality: 'الجنسية',
  language: 'اللغة',
  email: 'البريد الإلكتروني',
  password: 'كلمة المرور',
  login: 'تسجيل الدخول',
  wrongCredentials: 'بيانات اعتماد غير صحيحة',
  administrator: 'مدير',
  manager: 'مسؤول',
  shelterStaff: 'موظف الملجأ',
  users: 'المستخدمون',
  logout: 'تسجيل الخروج',
  rooms: 'الغرف',
  history: 'السجل',
  arrivals: 'الوصول',
  dining: 'المطعم',
  incidents: 'الحوادث',
  occupied: 'مشغولة',
  free: 'متاحة',
  occupancy: 'الإشغال',
  activeDiets: 'الأنظمة الغذائية',
  noGuests: 'لا يوجد نزلاء',
  checkIn: 'تسجيل الدخول',
  checkOut: 'تسجيل الخروج',
  changeBed: 'تغيير السرير',
  bed: 'سرير',
  room: 'غرفة',
  beds: 'أسرّة',
  checkoutDate: 'تاريخ المغادرة',
  selectExitDate: 'اختر تاريخ المغادرة',
  futureCheckoutNote: 'إذا اخترت تاريخاً مستقبلياً، سيبقى النزيل حتى ذلك اليوم.',
  selectedDate: 'التاريخ المحدد',
  guestWillStay: 'سيبقى النزيل حتى هذا التاريخ',
  confirmCheckout: 'تأكيد المغادرة',
  noFreeBeds: 'لا توجد أسرّة متاحة',
  editGuest: 'تعديل النزيل',
  saveChanges: 'حفظ التغييرات',
  deleteWithoutRecord: 'حذف بدون سجل',
  deleteWithoutRecordWarning: '⚠️ سيتم حذف النزيل نهائياً من النظام. لن يظهر في السجل. لا يمكن التراجع.',
  deleteWithoutRecordConfirm: 'هل أنت متأكد تماماً؟ اكتب "تأكيد" للمتابعة.',
  deleteWithoutRecordFinal: 'حذف نهائياً',
  stayDuration: 'الإقامة',
  exitDate: 'المغادرة',
  day: 'يوم',
  days: 'أيام',
  remaining: 'متبقية',
  checkoutToday: 'يغادر اليوم',
  checkoutPassed: 'تاريخ المغادرة مضى',
  upcomingArrivals: 'الوصول القادم',
  newArrival: '+ وصول جديد',
  noArrivals: 'لا توجد حالات وصول مجدولة',
  arrivalDate: 'تاريخ الوصول',
  assignedRoomBed: 'غرفة / سرير',
  unassigned: 'غير محدد',
  editArrival: 'تعديل الوصول',
  newScheduledArrival: 'وصول مجدول جديد',
  plannedArrivalDate: 'تاريخ الوصول المتوقع',
  plannedRoom: 'الغرفة المتوقعة',
  plannedBed: 'السرير المتوقع',
  scheduleArrival: 'جدولة الوصول',
  confirmEntry: 'تأكيد الدخول',
  reviewBeforeConfirm: 'راجع البيانات قبل تأكيد النقل.',
  entryDate: 'تاريخ الدخول',
  roomFull: '(ممتلئة)',
  roomAvailable: '(متاحة)',
  confirmTransfer: 'تأكيد النقل',
  actions: 'الإجراءات',
  diet: 'النظام الغذائي',
  nieDocument: 'وثيقة الهوية',
  guestHistory: 'سجل النزلاء',
  exportCSV: 'تصدير CSV',
  noRecords: 'لا توجد سجلات',
  checkInDate: 'الدخول',
  checkOutDate: 'الخروج',
  status: 'الحالة',
  active: 'نشط',
  historic: 'تاريخي',
  reincorporate: 'إعادة دمج',
  reincorporateToRoom: 'إعادة دمج في غرفة',
  selectRoom: 'اختر غرفة',
  selectBed: 'اختر سرير',
  confirmDeletion: 'تأكيد الحذف',
  deleteConfirmMsg: 'هل أنت متأكد من حذف هذا النزيل نهائياً؟',
  diningOrganization: 'المطعم — تنظيم الوجبات',
  diners: 'رواد',
  noActiveGuests: 'لا يوجد نزلاء نشطون',
  fullName: 'الاسم الكامل',
  roomShort: 'غرفة',
  dietType: 'نوع النظام الغذائي',
  foodParticularities: 'خصوصيات غذائية',
  separateMeals: 'فصل الوجبات',
  daysToSeparate: 'أيام الفصل',
  absenceReason: 'سبب الغياب',
  lastModification: 'آخر تعديل',
  observations: 'ملاحظات',
  paused: 'متوقف',
  foodPlaceholder: 'تغذية مفضلة...',
  observationsPlaceholder: 'رمضان، إلخ.',
  downloadWeeklyPdf: 'تحميل PDF أسبوعي',
  weekOf: 'أسبوع',
  all: 'الكل',
  breakfast: 'فطور',
  lunch: 'غداء',
  dinner: 'عشاء',
  allDays: 'كل الأيام',
  weekdays: 'أيام العمل',
  weekends: 'عطل نهاية الأسبوع',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
  saturday: 'السبت',
  sunday: 'الأحد',
  incidentRegistry: 'سجل الحوادث',
  newIncident: '+ حادثة جديدة',
  noIncidents: 'لا توجد حوادث مسجلة',
  incidentType: 'النوع',
  incidentDescription: 'الوصف',
  incidentDate: 'التاريخ',
  incidentGuest: 'النزيل',
  incidentTypes: {
    behavioral: 'سلوكي',
    medical: 'طبي',
    administrative: 'إداري',
    social: 'اجتماعي',
    other: 'أخرى',
  },
  resolved: 'تم الحل',
  pending: 'قيد الانتظار',
  toggleResolved: 'وضع علامة كمحلول',
  userManagement: 'إدارة المستخدمين',
  inviteNewUser: 'دعوة مستخدم جديد',
  createUser: 'إنشاء مستخدم',
  role: 'الدور',
  settings: 'الإعدادات',
  shelterManagement: 'إدارة الملاجئ',
  addShelter: 'إضافة ملجأ',
  deleteShelter: 'حذف الملجأ',
  shelterName: 'اسم الملجأ',
  roomConfiguration: 'تكوين الغرف',
  addRoom: 'إضافة غرفة',
  deleteRoom: 'حذف الغرفة',
  roomName: 'اسم الغرفة',
  numberOfBeds: 'عدد الأسرّة',
  switchShelter: 'تغيير الملجأ',
  editShelterName: 'تعديل الاسم',
  deleteShelterWarning: '⚠️ سيتم حذف الملجأ وجميع بياناته. لا يمكن التراجع.',
  deleteShelterConfirm: 'هل أنت متأكد؟ اكتب "حذف" للمتابعة.',
  selectShelter: 'اختر ملجأ',
  createShelter: 'إنشاء ملجأ',
  currentShelter: 'الملجأ الحالي',
  noRooms: 'لا توجد غرف مُعدّة',
  assignedShelters: 'الملاجئ المعيّنة',
  allShelters: 'جميع الملاجئ',
  dashboard: 'لوحة التحكم',
  occupancyOverview: 'نظرة عامة على الإشغال',
  occupancyRate: 'معدل الإشغال',
  totalBeds: 'إجمالي الأسرة',
  occupiedBeds: 'أسرة مشغولة',
  freeBeds: 'أسرة حرة',
  avgStay: 'متوسط الإقامة',
  avgStayDays: 'أيام في المتوسط',
  upcomingCheckouts: 'المغادرات القادمة',
  noUpcomingCheckouts: 'لا مغادرات قادمة',
  daysLeft: 'أيام متبقية',
  dietDistribution: 'توزيع الأنظمة الغذائية',
  monthlyOccupancy: 'الإشغال الشهري',
  guestsOverTime: 'النزلاء عبر الزمن',
  activeIncidents: 'حوادث نشطة',
  month: 'شهر',
  backupRestore: 'النسخ الاحتياطي والاستعادة',
  exportAllData: 'تصدير جميع البيانات',
  exportDescription: 'تحميل ملف JSON بجميع البيانات.',
  importData: 'استيراد البيانات',
  importDescription: 'استعادة البيانات من ملف نسخة احتياطية.',
  importWarning: '⚠️ سيتم استبدال جميع البيانات الحالية.',
  exportSuccess: 'تم تصدير النسخة الاحتياطية بنجاح',
  importSuccess: 'تمت استعادة البيانات. جارٍ إعادة التحميل...',
  importError: 'خطأ في الاستيراد. ملف غير صالح.',
  downloadBackup: 'تحميل النسخة الاحتياطية',
  selectFile: 'اختر ملفاً',
};

const en: Translations = {
  appName: 'Albergue LiberaMundo',
  managementSystem: 'Management System',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  confirm: 'Confirm',
  close: 'Close',
  notes: 'Notes',
  name: 'Name',
  nationality: 'Nationality',
  language: 'Language',
  email: 'Email',
  password: 'Password',
  login: 'Log in',
  wrongCredentials: 'Incorrect credentials',
  administrator: 'Administrator',
  manager: 'Manager',
  shelterStaff: 'Shelter Staff',
  users: 'Users',
  logout: 'Log out',
  rooms: 'Rooms',
  history: 'History',
  arrivals: 'Arrivals',
  dining: 'Dining',
  incidents: 'Incidents',
  occupied: 'Occupied',
  free: 'Free',
  occupancy: 'Occupancy',
  activeDiets: 'Active diets',
  noGuests: 'No guests',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  changeBed: 'Change bed',
  bed: 'Bed',
  room: 'Room',
  beds: 'beds',
  checkoutDate: 'Check-out Date',
  selectExitDate: 'Select exit date',
  futureCheckoutNote: 'If you select a future date, the guest will remain until that day.',
  selectedDate: 'Selected date',
  guestWillStay: 'Guest will stay until this date',
  confirmCheckout: 'Confirm Check-out',
  noFreeBeds: 'No free beds',
  editGuest: 'Edit guest',
  saveChanges: 'Save changes',
  deleteWithoutRecord: 'Delete without record',
  deleteWithoutRecordWarning: '⚠️ This will permanently remove the guest. NO record will be kept. Irreversible.',
  deleteWithoutRecordConfirm: 'Are you sure? Type "CONFIRM" to proceed.',
  deleteWithoutRecordFinal: 'Delete permanently',
  stayDuration: 'Stay',
  exitDate: 'Leaves',
  day: 'day',
  days: 'days',
  remaining: 'remaining',
  checkoutToday: 'Checks out today',
  checkoutPassed: 'Checkout date passed',
  upcomingArrivals: 'Upcoming Arrivals',
  newArrival: '+ New arrival',
  noArrivals: 'No scheduled arrivals',
  arrivalDate: 'Arrival date',
  assignedRoomBed: 'Room / Bed',
  unassigned: 'Unassigned',
  editArrival: 'Edit arrival',
  newScheduledArrival: 'New scheduled arrival',
  plannedArrivalDate: 'Planned arrival date',
  plannedRoom: 'Planned room',
  plannedBed: 'Planned bed',
  scheduleArrival: 'Schedule arrival',
  confirmEntry: 'Confirm entry',
  reviewBeforeConfirm: 'Review and edit data before confirming transfer.',
  entryDate: 'Entry date',
  roomFull: '(Full)',
  roomAvailable: '(Available)',
  confirmTransfer: 'Confirm transfer',
  actions: 'Actions',
  diet: 'Diet',
  nieDocument: 'ID Document',
  guestHistory: 'Guest History',
  exportCSV: 'Export CSV',
  noRecords: 'No records',
  checkInDate: 'Check-in',
  checkOutDate: 'Check-out',
  status: 'Status',
  active: 'Active',
  historic: 'Historic',
  reincorporate: 'Reincorporate',
  reincorporateToRoom: 'Reincorporate to room',
  selectRoom: 'Select room',
  selectBed: 'Select bed',
  confirmDeletion: 'Confirm deletion',
  deleteConfirmMsg: 'Are you sure you want to permanently delete this guest?',
  diningOrganization: 'Dining — Meal Organization',
  diners: 'diners',
  noActiveGuests: 'No active guests',
  fullName: 'Full Name',
  roomShort: 'Room',
  dietType: 'Diet Type',
  foodParticularities: 'Food Particularities',
  separateMeals: 'Separate Meals',
  daysToSeparate: 'Days to Separate',
  absenceReason: 'Absence Reason',
  lastModification: 'Last Modified',
  observations: 'Observations',
  paused: 'Paused',
  foodPlaceholder: 'Preferably...',
  observationsPlaceholder: 'Ramadan, etc.',
  downloadWeeklyPdf: 'Download weekly PDF',
  weekOf: 'Week of',
  all: 'All',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  allDays: 'All days',
  weekdays: 'Weekdays',
  weekends: 'Weekends',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
  incidentRegistry: 'Incident Registry',
  newIncident: '+ New incident',
  noIncidents: 'No incidents recorded',
  incidentType: 'Type',
  incidentDescription: 'Description',
  incidentDate: 'Date',
  incidentGuest: 'Guest',
  incidentTypes: {
    behavioral: 'Behavioral',
    medical: 'Medical',
    administrative: 'Administrative',
    social: 'Social',
    other: 'Other',
  },
  resolved: 'Resolved',
  pending: 'Pending',
  toggleResolved: 'Mark as resolved',
  userManagement: 'User Management',
  inviteNewUser: 'Invite new user',
  createUser: 'Create user',
  role: 'Role',
  settings: 'Settings',
  shelterManagement: 'Shelter Management',
  addShelter: 'Add shelter',
  deleteShelter: 'Delete shelter',
  shelterName: 'Shelter name',
  roomConfiguration: 'Room Configuration',
  addRoom: 'Add room',
  deleteRoom: 'Delete room',
  roomName: 'Room name',
  numberOfBeds: 'No. of beds',
  switchShelter: 'Switch shelter',
  editShelterName: 'Edit name',
  deleteShelterWarning: '⚠️ The shelter and ALL its data will be deleted. Irreversible.',
  deleteShelterConfirm: 'Are you sure? Type "DELETE" to proceed.',
  selectShelter: 'Select shelter',
  createShelter: 'Create shelter',
  currentShelter: 'Current shelter',
  noRooms: 'No rooms configured',
  assignedShelters: 'Assigned shelters',
  allShelters: 'All shelters',
};

export const translations: Record<Language, Translations> = { es, fr, ar, en };

export function getTranslations(lang: Language): Translations {
  return translations[lang];
}
