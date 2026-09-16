import { LanguageCode, LanguageInfo } from '../types';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi' },
  { code: 'ml', nativeName: 'മലയാളം', englishName: 'Malayalam' },
];

export interface Translations {
  // App & Header
  appName: string;
  senior: string;
  caretaker: string;
  circleCode: string;
  switchTo: string;
  switch: string;
  testSound: string;
  soundOn: string;
  soundMuted: string;
  signOut: string;
  selectLanguage: string;

  // Login
  welcomeTitle: string;
  welcomeSubtitle: string;
  step1Role: string;
  elderlyPerson: string;
  elderlyDesc: string;
  elderlyBadge: string;
  caretakerPerson: string;
  caretakerDesc: string;
  missedDoseAlerts: string;
  yourNameElderly: string;
  yourNameCaretaker: string;
  circleCodeLabel: string;
  circleCodeHelper: string;
  emergencyPhoneLabel: string;
  emergencyPhoneHelper: string;
  stayLoggedIn: string;
  encryptedCircle: string;
  enterAs: string;
  quickDemo: string;
  quickGrandpa: string;
  quickCaretaker: string;

  // Elderly View
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  hello: string;
  scheduleForToday: string;
  viewingScheduleFor: string;
  today: string;
  yesterday: string;
  tomorrow: string;
  todaysProgress: string;
  dosesTakenCount: string;
  allMedsTaken: string;
  nextMedDue: string;
  dueInMinutes: string;
  dueNow: string;
  overdue: string;
  scheduledFor: string;
  dosage: string;
  instructions: string;
  takeMedicine: string;
  iTookIt: string;
  lockedUntil: string;
  lockedDesc: string;
  medicineLocked: string;
  taken: string;
  undo: string;
  callCaregiver: string;
  callCaregiverDesc: string;
  callNow: string;
  noMedsToday: string;
  noMedsDesc: string;
  reminderFrom: string;
  justNow: string;
  dismiss: string;

  // Caretaker View
  tabOverview: string;
  tabMedications: string;
  tabCalendar: string;
  statTotal: string;
  statTaken: string;
  statMissed: string;
  statAdherence: string;
  missedDoseAlertTitle: string;
  missedDoseAlertDesc: string;
  multipleMissedDosesAlert: string;
  minutesLate: string;
  markAsTaken: string;
  sendNudge: string;
  callSenior: string;
  dismissAlert: string;
  quickNudgesTitle: string;
  quickNudgesSubtitle: string;
  customMessage: string;
  writeMessagePlaceholder: string;
  send: string;
  cancel: string;
  simulateMissedDose: string;
  simulateMissedDoseDesc: string;
  emergencyContact: string;

  // Medications & Schedule
  addMedicine: string;
  allConfiguredMeds: string;
  managePrescriptions: string;
  noMedsAdded: string;
  noMedsAddedDesc: string;
  deleteConfirm: string;
  deleteWarning: string;
  delete: string;
  ongoing: string;
  lastDayToday: string;
  oneDayLeft: string;
  daysLeft: string;
  completedAgo: string;

  // Food Instructions
  afterFood: string;
  beforeFood: string;
  withFood: string;
  emptyStomach: string;
  anytime: string;

  // Medicine Forms
  tablet: string;
  capsule: string;
  syrup: string;
  injection: string;
  drops: string;
  inhaler: string;
  other: string;

  // Times of Day
  morning: string;
  afternoon: string;
  evening: string;
  night: string;
  custom: string;

  // Add Medication Modal
  addNewMedication: string;
  addMedSubtitle: string;
  quickSuggestions: string;
  medName: string;
  medNamePlaceholder: string;
  dosageStrength: string;
  dosagePlaceholder: string;
  medicineForm: string;
  foodInstruction: string;
  treatmentDuration: string;
  continuousOngoing: string;
  fixedDaysCourse: string;
  numberOfDays: string;
  days30Default: string;
  days14: string;
  days7: string;
  days5: string;
  startDate: string;
  scheduledTimings: string;
  presetTimings: string;
  presetOnceMorning: string;
  presetTwice: string;
  presetThrice: string;
  presetFour: string;
  addAnotherTime: string;
  specialNotes: string;
  specialNotesPlaceholder: string;
  saveMedication: string;

  // Alarm Modal
  timeForMedicine: string;
  takeNow: string;
  snooze5Min: string;
  dismissAlarm: string;

  // Audio Settings Modal
  audioSettingsTitle: string;
  soundAlerts: string;
  soundAlertsDesc: string;
  masterVolume: string;
  alarmTone: string;
  test: string;
  pushNotifications: string;
  notificationsActive: string;
  enableNotifications: string;
  saveSettings: string;

  // Call Modal
  calling: string;
  connected: string;
  callEnded: string;
  mute: string;
  unmute: string;
  speaker: string;
  endCall: string;

  // Calendar
  jumpToToday: string;
  scheduledDosesForDate: string;
  noMedsForSelectedDay: string;

  // Additional modal keys and aliases
  close: string;
  endDate: string;
  autoAlarmPromptInfo: string;
  medicationAlarm: string;
  alarmTitle: string;
  alarmRinging: string;
  takeMedicineNow: string;
  stopAlarm: string;
  addAnotherTiming: string;
  medicineName: string;
  form: string;
  courseDuration: string;
  customDays: string;

  // AI Voice Assistant
  voiceAssistant: string;
  voiceAssistantTitle: string;
  askVoiceAssistant: string;
  listening: string;
  tapToSpeak: string;
  stopListening: string;
  processing: string;
  voiceAssistanceDesc: string;
  tryAsking: string;
  voiceSuggestion1: string;
  voiceSuggestion2: string;
  voiceSuggestion3: string;
  voiceSuggestion4: string;
  voiceAssistanceNotSupported: string;
  voiceActionDone: string;
  voicePoweredBy: string;
}

export const translations: Record<LanguageCode, Translations> = {
  en: {
    appName: 'CareCircle',
    senior: 'Senior',
    caretaker: 'Caregiver',
    circleCode: 'Circle Code',
    switchTo: 'Switch to {role}',
    switch: 'Switch',
    testSound: 'Test Sound',
    soundOn: 'Sound: ON',
    soundMuted: 'Sound: Muted',
    signOut: 'Sign Out / Switch Profile',
    selectLanguage: 'Language',

    welcomeTitle: 'Welcome to CareCircle',
    welcomeSubtitle: 'The connected medication circle keeping seniors on schedule and caretakers notified of missed doses in real-time.',
    step1Role: 'Step 1: Select Who is Logging In',
    elderlyPerson: 'Elderly Person',
    elderlyDesc: 'Simple, high-contrast interface with large buttons to take medicines and audio reminders.',
    elderlyBadge: 'Grandpa / Senior',
    caretakerPerson: 'Caretaker / Family',
    caretakerDesc: 'Receives instant alerts if medicine is not taken, schedules prescriptions, sends nudges.',
    missedDoseAlerts: 'Missed Dose Alerts',
    yourNameElderly: 'Your Name (Elderly Person)',
    yourNameCaretaker: 'Your Name (Caretaker)',
    circleCodeLabel: 'Connected Circle Code',
    circleCodeHelper: 'Both roles connect using this code.',
    emergencyPhoneLabel: 'Emergency Phone Contact',
    emergencyPhoneHelper: 'For 1-tap dial by elderly',
    stayLoggedIn: 'Stay logged into this device',
    encryptedCircle: 'Encrypted Circle',
    enterAs: 'Enter as {name}',
    quickDemo: 'Quick 1-Click Demo Profiles:',
    quickGrandpa: '👴 Grandpa Robert',
    quickCaretaker: '👩‍⚕️ Caregiver Sarah',

    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
    hello: 'Hello',
    scheduleForToday: 'Here is your medicine schedule for today',
    viewingScheduleFor: 'Viewing schedule for {date}',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    todaysProgress: "Today's Progress",
    dosesTakenCount: '{taken} of {total} doses taken',
    allMedsTaken: 'All medicines taken for today! Wonderful job.',
    nextMedDue: 'NEXT MEDICINE DUE',
    dueInMinutes: 'Due in {min} min',
    dueNow: 'DUE RIGHT NOW',
    overdue: 'OVERDUE',
    scheduledFor: 'Scheduled for {time} ({label})',
    dosage: 'Dose: {dosage}',
    instructions: 'Instructions',
    takeMedicine: 'I Took My Medicine',
    iTookIt: 'I Took It',
    lockedUntil: 'Available at {time}',
    lockedDesc: 'Unlocks 15 minutes before scheduled dose ({time}) to prevent taking medicine too early.',
    medicineLocked: 'Medicine Locked',
    taken: 'Taken',
    undo: 'Undo',
    callCaregiver: 'Call Caregiver / Family',
    callCaregiverDesc: 'Need help or feeling unwell? Tap here to call immediately.',
    callNow: 'Call Now',
    noMedsToday: 'No medicines scheduled for this day',
    noMedsDesc: 'Enjoy your day! Check with your caregiver if you feel any medicine is missing.',
    reminderFrom: 'Reminder from {sender}',
    justNow: 'Just now',
    dismiss: 'Dismiss',

    tabOverview: "Today's Overview",
    tabMedications: 'All Medications ({count})',
    tabCalendar: 'Monthly Calendar',
    statTotal: "Today's Total Doses",
    statTaken: 'Doses Taken',
    statMissed: 'Untaken / Overdue',
    statAdherence: "Today's Adherence Rate",
    missedDoseAlertTitle: 'Missed Dose Alert!',
    missedDoseAlertDesc: '{senior} has not taken {med} ({dosage}) scheduled for {time}.',
    multipleMissedDosesAlert: '{senior} has {count} scheduled medication doses overdue.',
    minutesLate: '{min} min overdue',
    markAsTaken: 'Mark as Taken',
    sendNudge: 'Send Reminder Nudge',
    callSenior: 'Call {senior}',
    dismissAlert: 'Dismiss',
    quickNudgesTitle: 'Quick Caregiver Actions & Nudges',
    quickNudgesSubtitle: "Send gentle reminders directly to {senior}'s screen with an audio chime",
    customMessage: 'Custom Message',
    writeMessagePlaceholder: 'Write a caring message to {senior}...',
    send: 'Send',
    cancel: 'Cancel',
    simulateMissedDose: 'Simulate Missed Dose Alert',
    simulateMissedDoseDesc: 'Test alert sound & warning',
    emergencyContact: 'Emergency Contact',

    addMedicine: 'Add Medicine',
    allConfiguredMeds: 'All Configured Medications',
    managePrescriptions: 'Manage your prescriptions, scheduled dose timings, and durations',
    noMedsAdded: 'No medications added yet',
    noMedsAddedDesc: 'Click "Add Medicine" above to create your first prescription schedule.',
    deleteConfirm: 'Delete this medication?',
    deleteWarning: 'This will remove all scheduled doses for this medicine.',
    delete: 'Delete',
    ongoing: 'Ongoing (Always)',
    lastDayToday: 'Last day today!',
    oneDayLeft: '1 day left',
    daysLeft: '{days} days left',
    completedAgo: 'Completed {days}d ago',

    afterFood: 'After Food',
    beforeFood: 'Before Food',
    withFood: 'With Food',
    emptyStomach: 'Empty Stomach',
    anytime: 'Anytime',

    tablet: 'Tablet',
    capsule: 'Capsule',
    syrup: 'Syrup',
    injection: 'Injection',
    drops: 'Drops',
    inhaler: 'Inhaler',
    other: 'Other',

    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Night',
    custom: 'Custom',

    addNewMedication: 'Add New Medication',
    addMedSubtitle: 'Configure dosage, times of day, and treatment duration',
    quickSuggestions: 'Quick Suggestions (Click to fill)',
    medName: 'Medicine Name',
    medNamePlaceholder: 'e.g. Metformin, Paracetamol, Dolo 650',
    dosageStrength: 'Dosage / Strength',
    dosagePlaceholder: 'e.g. 500mg, 1 tablet, 10ml',
    medicineForm: 'Medicine Form',
    foodInstruction: 'Food Instruction',
    treatmentDuration: 'Treatment Duration',
    continuousOngoing: 'Continuous (Ongoing)',
    fixedDaysCourse: 'Fixed Days (Antibiotics, Courses)',
    numberOfDays: 'Number of Days',
    days30Default: '30 Days (Default Course)',
    days14: '14 Days',
    days7: '7 Days',
    days5: '5 Days',
    startDate: 'Start Date',
    scheduledTimings: 'Scheduled Timings per Day',
    presetTimings: 'Preset Timings:',
    presetOnceMorning: '1x Morning',
    presetTwice: '2x Morning & Night',
    presetThrice: '3x Morning, Afternoon, Night',
    presetFour: '4x (QDS)',
    addAnotherTime: 'Add Another Time',
    specialNotes: 'Special Instructions & Notes',
    specialNotesPlaceholder: 'e.g. Take with warm milk, drink plenty of water',
    saveMedication: 'Save & Schedule Medication',

    timeForMedicine: 'Time for Your Medicine!',
    takeNow: 'I Am Taking It Now',
    snooze5Min: 'Remind Me in 5 Min (Snooze)',
    dismissAlarm: 'Dismiss Alarm',

    audioSettingsTitle: 'Audio & Notification Settings',
    soundAlerts: 'Sound Alerts & Chimes',
    soundAlertsDesc: 'Play audio chimes when a dose is due or when caregiver sends a nudge',
    masterVolume: 'Master Volume',
    alarmTone: 'Alarm Sound Tone (Click play to preview)',
    test: 'Test',
    pushNotifications: 'Push Notifications',
    notificationsActive: 'Notifications Active',
    enableNotifications: 'Enable Notifications',
    saveSettings: 'Save Settings',

    calling: 'Calling...',
    connected: 'Connected',
    callEnded: 'Call Ended',
    mute: 'Mute',
    unmute: 'Unmute',
    speaker: 'Speaker',
    endCall: 'End Call',

    jumpToToday: 'Today',
    scheduledDosesForDate: 'Scheduled Doses for {date}',
    noMedsForSelectedDay: 'No medications scheduled for this day.',

    close: 'Close',
    endDate: 'End Date',
    autoAlarmPromptInfo: 'Alarms will chime automatically at every scheduled dose time',
    medicationAlarm: 'Medication Reminder Alarm',
    alarmTitle: 'Time for your Medicine!',
    alarmRinging: 'Audio alarm is currently ringing',
    takeMedicineNow: 'Take Medicine Now',
    stopAlarm: 'Stop Alarm',
    addAnotherTiming: '+ Add Another Time Slot',
    medicineName: 'Medicine Name',
    form: 'Medicine Form',
    courseDuration: 'Course Duration',
    customDays: 'Custom Days',

    voiceAssistant: 'AI Voice Assistant',
    voiceAssistantTitle: 'CareCircle Voice Assistant',
    askVoiceAssistant: 'Ask me anything about your medicines...',
    listening: 'Listening... Please speak',
    tapToSpeak: 'Tap to Speak',
    stopListening: 'Stop Listening',
    processing: 'Thinking...',
    voiceAssistanceDesc: 'Speak in English, Tamil, Hindi, or Malayalam to check medicines, ask food instructions, or mark doses as taken.',
    tryAsking: 'Try asking:',
    voiceSuggestion1: 'What is my next medicine?',
    voiceSuggestion2: 'Did I take my morning medicine?',
    voiceSuggestion3: 'Mark my medicine as taken',
    voiceSuggestion4: 'Call my caregiver',
    voiceAssistanceNotSupported: 'Speech recognition is not supported in this browser. You can type your question.',
    voiceActionDone: 'Action completed',
    voicePoweredBy: 'Powered by Gemini AI',
  },

  ta: {
    appName: 'CareCircle',
    senior: 'முதியவர்',
    caretaker: 'கவனிப்பாளர்',
    circleCode: 'வட்டக் குறியீடு',
    switchTo: '{role}க்கு மாறவும்',
    switch: 'மாறுக',
    testSound: 'ஒலி சோதனை',
    soundOn: 'ஒலி: இயக்கத்தில்',
    soundMuted: 'ஒலி: முடக்கப்பட்டது',
    signOut: 'வெளியேறு / சுயவிவரம் மாற்று',
    selectLanguage: 'மொழி',

    welcomeTitle: 'CareCircle-க்கு நல்வரவு',
    welcomeSubtitle: 'முதியவர்கள் சரியான நேரத்தில் மருந்து உட்கொள்ளவும், மருந்துகள் விடுபட்டால் கவனிப்பாளர்களுக்கு உடனுக்குடன் தெரிவிக்கவும் உதவும் குடும்ப மருந்து வட்டம்.',
    step1Role: 'படி 1: யார் உள்நுழைகிறார்கள் என்பதைத் தேர்ந்தெடுக்கவும்',
    elderlyPerson: 'முதியவர் / தாத்தா',
    elderlyDesc: 'பெரிய பொத்தான்கள், தெளிவான வண்ணங்கள் மற்றும் ஒலி நினைவூட்டல்களுடன் கூடிய எளிய இடைமுகம்.',
    elderlyBadge: 'தாத்தா / முதியவர்',
    caretakerPerson: 'கவனிப்பாளர் / குடும்பத்தினர்',
    caretakerDesc: 'மருந்து எடுக்காதபோது உடனடி அறிவிப்புகள், புதிய மருந்து அட்டவணை, நினைவூட்டல் செய்திகள்.',
    missedDoseAlerts: 'விடுபட்ட மருந்து எச்சரிக்கைகள்',
    yourNameElderly: 'உங்கள் பெயர் (முதியவர்)',
    yourNameCaretaker: 'உங்கள் பெயர் (கவனிப்பாளர்)',
    circleCodeLabel: 'இணைக்கப்பட்ட வட்டக் குறியீடு (Circle Code)',
    circleCodeHelper: 'இருவரும் இந்த ஒரே குறியீட்டைப் பயன்படுத்தி இணைகிறார்கள்.',
    emergencyPhoneLabel: 'அவசர தொலைபேசி எண்',
    emergencyPhoneHelper: 'முதியவர் ஒரே தொடுதலில் அழைக்க உதவும் எண்',
    stayLoggedIn: 'இந்த சாதனத்தில் உள்நுழைந்தே இருக்கவும்',
    encryptedCircle: 'பாதுகாப்பான வட்டம்',
    enterAs: '{name} ஆக நுழைக',
    quickDemo: 'விரைவு 1-கிளிக் மாதிரி கணக்குகள்:',
    quickGrandpa: '👴 தாத்தா ராபர்ட்',
    quickCaretaker: '👩‍⚕️ கவனிப்பாளர் சாரா',

    goodMorning: 'காலை வணக்கம்',
    goodAfternoon: 'மதிய வணக்கம்',
    goodEvening: 'மாலை வணக்கம்',
    hello: 'வணக்கம்',
    scheduleForToday: 'இன்றைய உங்கள் மருந்து அட்டவணை',
    viewingScheduleFor: '{date} தேதிக்கான அட்டவணை',
    today: 'இன்று',
    yesterday: 'நேற்று',
    tomorrow: 'நாளை',
    todaysProgress: 'இன்றைய முன்னேற்றம்',
    dosesTakenCount: '{total} மருந்துகளில் {taken} எடுக்கப்பட்டது',
    allMedsTaken: 'இன்றைய மருந்துகள் அனைத்தும் எடுக்கப்பட்டுவிட்டன! அருமை.',
    nextMedDue: 'அடுத்த மருந்து நேரம்',
    dueInMinutes: 'இன்னும் {min} நிமிடங்களில்',
    dueNow: 'இப்போது உட்கொள்ளவும்',
    overdue: 'தாமதமாகிறது',
    scheduledFor: 'திட்டமிடப்பட்ட நேரம்: {time} ({label})',
    dosage: 'அளவு: {dosage}',
    instructions: 'வழிமுறைகள்',
    takeMedicine: 'மருந்து சாப்பிட்டுவிட்டேன்',
    iTookIt: 'சாப்பிட்டுவிட்டேன்',
    lockedUntil: '{time} மணிக்கு கிடைக்கும்',
    lockedDesc: 'மருந்தை முன்கூட்டியே உட்கொள்வதைத் தவிர்க்க, திட்டமிடப்பட்ட நேரத்திற்கு 15 நிமிடங்களுக்கு முன் பொத்தான் திறக்கப்படும் ({time}).',
    medicineLocked: 'மருந்து பூட்டப்பட்டுள்ளது',
    taken: 'எடுக்கப்பட்டது',
    undo: 'முந்தைய நிலைக்கு',
    callCaregiver: 'கவனிப்பாளர் / குடும்பத்தினரை அழைக்கவும்',
    callCaregiverDesc: 'உதவி தேவையா அல்லது உடல்நிலை சரியில்லையா? உடனே அழைக்க இங்கே தொடவும்.',
    callNow: 'உடனே அழைக்கவும்',
    noMedsToday: 'இன்று மருந்துகள் எதுவும் திட்டமிடப்படவில்லை',
    noMedsDesc: 'மகிழ்ச்சியான நாளாக அமையட்டும்! ஏதேனும் மருந்து விடுபட்டதாக உணர்ந்தால் கவனிப்பாளரைத் தொடர்பு கொள்ளவும்.',
    reminderFrom: '{sender} அவர்களிடமிருந்து நினைவூட்டல்',
    justNow: 'சற்று முன்',
    dismiss: 'விலக்கு',

    tabOverview: 'இன்றைய கண்ணோட்டம்',
    tabMedications: 'அனைத்து மருந்துகள் ({count})',
    tabCalendar: 'மாதாந்திர காலண்டர்',
    statTotal: 'இன்றைய மொத்த மருந்துகள்',
    statTaken: 'எடுக்கப்பட்ட மருந்துகள்',
    statMissed: 'எடுக்கப்படாதவை / தாமதமானவை',
    statAdherence: 'மருந்து கடைபிடிப்பு விகிதம்',
    missedDoseAlertTitle: 'விடுபட்ட மருந்து எச்சரிக்கை!',
    missedDoseAlertDesc: '{senior} திட்டமிடப்பட்ட {time} மணிக்கு {med} ({dosage}) மருந்தை இன்னும் எடுக்கவில்லை.',
    multipleMissedDosesAlert: '{senior}-க்கு {count} திட்டமிடப்பட்ட மருந்துகள் தாமதமாகியுள்ளன.',
    minutesLate: '{min} நிமிடம் தாமதம்',
    markAsTaken: 'எடுக்கப்பட்டதாகக் குறிக்கவும்',
    sendNudge: 'நினைவூட்டல் அனுப்புக',
    callSenior: '{senior} அவர்களை அழைக்கவும்',
    dismissAlert: 'விலக்கு',
    quickNudgesTitle: 'விரைவு கவனிப்பாளர் நடவடிக்கைகள் & நினைவூட்டல்கள்',
    quickNudgesSubtitle: '{senior} அவர்களின் திரைக்கு நேரடியாக ஒலி எச்சரிக்கையுடன் கூடிய நினைவூட்டல் செய்தியை அனுப்புங்கள்',
    customMessage: 'தனிப்பயன் செய்தி',
    writeMessagePlaceholder: '{senior} அவர்களுக்கு அன்பான செய்தியை எழுதுங்கள்...',
    send: 'அனுப்புக',
    cancel: 'ரத்து',
    simulateMissedDose: 'விடுபட்ட மருந்து எச்சரிக்கை சோதனை',
    simulateMissedDoseDesc: 'எச்சரிக்கை ஒலி மற்றும் அறிவிப்பை சோதிக்கவும்',
    emergencyContact: 'அவசர தொடர்பு',

    addMedicine: 'மருந்து சேர்க்க',
    allConfiguredMeds: 'அமைக்கப்பட்ட அனைத்து மருந்துகள்',
    managePrescriptions: 'மருந்துச் சீட்டுகள், மருந்தெடுக்கும் நேரங்கள் மற்றும் கால அளவுகளை நிர்வகிக்கவும்',
    noMedsAdded: 'மருந்துகள் எதுவும் இன்னும் சேர்க்கப்படவில்லை',
    noMedsAddedDesc: 'முதல் மருந்து அட்டவணையை உருவாக்க மேலே உள்ள "மருந்து சேர்க்க" பொத்தானை அழுத்தவும்.',
    deleteConfirm: 'இந்த மருந்தை நீக்கவா?',
    deleteWarning: 'இது இந்த மருந்துக்கான அனைத்து திட்டமிடப்பட்ட அளவுகளையும் நீக்கிவிடும்.',
    delete: 'நீக்கு',
    ongoing: 'தொடர்ந்து (எப்போதும்)',
    lastDayToday: 'இன்று கடைசி நாள்!',
    oneDayLeft: 'இன்னும் 1 நாள் உள்ளது',
    daysLeft: 'இன்னும் {days} நாட்கள் உள்ளன',
    completedAgo: '{days} நாட்களுக்கு முன் முடிந்தது',

    afterFood: 'உணவிற்குப் பின்',
    beforeFood: 'உணவிற்கு முன்',
    withFood: 'உணவுடன்',
    emptyStomach: 'வெறும் வயிற்றில்',
    anytime: 'எந்த நேரத்திலும்',

    tablet: 'மாத்திரை',
    capsule: 'கேப்சூல்',
    syrup: 'சிரப்',
    injection: 'ஊசி',
    drops: 'சொட்டு மருந்து',
    inhaler: 'இன்ஹேலர்',
    other: 'பிற',

    morning: 'காலை',
    afternoon: 'மதியம்',
    evening: 'மாலை',
    night: 'இரவு',
    custom: 'தனிப்பயன்',

    addNewMedication: 'புதிய மருந்து சேர்க்க',
    addMedSubtitle: 'மருந்தின் அளவு, உட்கொள்ளும் நேரங்கள் மற்றும் கால அளவை அமைக்கவும்',
    quickSuggestions: 'விரைவு பரிந்துரைகள் (நிரப்ப தொடவும்)',
    medName: 'மருந்தின் பெயர்',
    medNamePlaceholder: 'எ.கா. பாராசிட்டமால், டோலோ 650',
    dosageStrength: 'மருந்தின் அளவு',
    dosagePlaceholder: 'எ.கா. 650 மிகி, 1 மாத்திரை, 10 மி.லி',
    medicineForm: 'மருந்தின் வகை',
    foodInstruction: 'உணவு வழிமுறை',
    treatmentDuration: 'சிகிச்சை கால அளவு',
    continuousOngoing: 'தொடர்ச்சியானது (தினசரி)',
    fixedDaysCourse: 'குறிப்பிட்ட நாட்கள் (ஆன்டிபயாடிக், படிப்புகள்)',
    numberOfDays: 'நாட்களின் எண்ணிக்கை',
    days30Default: '30 நாட்கள் (இயல்புநிலை)',
    days14: '14 நாட்கள்',
    days7: '7 நாட்கள்',
    days5: '5 நாட்கள்',
    startDate: 'தொடக்க தேதி',
    scheduledTimings: 'தினசரி திட்டமிடப்பட்ட நேரங்கள்',
    presetTimings: 'முன்னமைக்கப்பட்ட நேரங்கள்:',
    presetOnceMorning: '1x காலை',
    presetTwice: '2x காலை & இரவு',
    presetThrice: '3x காலை, மதியம், இரவு',
    presetFour: '4x முறை',
    addAnotherTime: 'மற்றொரு நேரம் சேர்க்க',
    specialNotes: 'சிறப்பு வழிமுறைகள் & குறிப்புகள்',
    specialNotesPlaceholder: 'எ.கா. வெதுவெதுப்பான பாலுடன் உட்கொள்ளவும், நிறைய தண்ணீர் குடிக்கவும்',
    saveMedication: 'மருந்தைச் சேமித்து அட்டவணைப்படுத்து',

    timeForMedicine: 'மருந்து உட்கொள்ளும் நேரம் வந்துவிட்டது!',
    takeNow: 'நான் இப்போது சாப்பிடுகிறேன்',
    snooze5Min: '5 நிமிடம் கழித்து நினைவூட்டு (Snooze)',
    dismissAlarm: 'அலாரத்தை நிறுத்து',

    audioSettingsTitle: 'ஒலி & அறிவிப்பு அமைப்புகள்',
    soundAlerts: 'ஒலி எச்சரிக்கைகள் & மணிகள்',
    soundAlertsDesc: 'மருந்து நேரம் வரும்போதோ அல்லது கவனிப்பாளர் நினைவூட்டல் அனுப்பும்போதோ ஒலி எழுப்புக',
    masterVolume: 'ஒலி அளவு',
    alarmTone: 'எச்சரிக்கை மணி ஓசை (கேட்க தொடவும்)',
    test: 'சோதனை',
    pushNotifications: 'திரை அறிவிப்புகள் (Push Notifications)',
    notificationsActive: 'அறிவிப்புகள் இயக்கத்தில் உள்ளன',
    enableNotifications: 'அறிவிப்புகளை இயக்கவும்',
    saveSettings: 'அமைப்புகளைச் சேமி',

    calling: 'அழைக்கிறது...',
    connected: 'இணைக்கப்பட்டது',
    callEnded: 'அழைப்பு முடிந்தது',
    mute: 'ஒலி நிறுத்து',
    unmute: 'ஒலி இயக்கு',
    speaker: 'ஸ்பீக்கர்',
    endCall: 'அழைப்பைத் துண்டி',

    jumpToToday: 'இன்று',
    scheduledDosesForDate: '{date} தேதிக்கான மருந்துகள்',
    noMedsForSelectedDay: 'இந்த நாளில் எந்த மருந்துகளும் திட்டமிடப்படவில்லை.',

    close: 'மூடு',
    endDate: 'முடிவு தேதி',
    autoAlarmPromptInfo: 'ஒவ்வொரு திட்டமிடப்பட்ட நேரத்திலும் தானாகவே மணி ஒலிக்கும்',
    medicationAlarm: 'மருந்து நினைவூட்டல் அலாரம்',
    alarmTitle: 'மருந்து உட்கொள்ளும் நேரம்!',
    alarmRinging: 'அலாரம் தற்போது ஒலிக்கிறது',
    takeMedicineNow: 'மருந்தை இப்போது உட்கொள்ளவும்',
    stopAlarm: 'அலாரத்தை நிறுத்து',
    addAnotherTiming: '+ மற்றொரு நேரத்தைச் சேர்க்கவும்',
    medicineName: 'மருந்தின் பெயர்',
    form: 'மருந்து வடிவம்',
    courseDuration: 'சிகிச்சை காலம்',
    customDays: 'விருப்ப நாட்கள்',

    voiceAssistant: 'AI குரல் உதவியாளர்',
    voiceAssistantTitle: 'கேர்சர்க்கிள் AI குரல் உதவியாளர்',
    askVoiceAssistant: 'உங்கள் மருந்துகள் பற்றி எதையும் கேளுங்கள்...',
    listening: 'கேட்கிறது... பேசவும்',
    tapToSpeak: 'பேச அழுத்தவும்',
    stopListening: 'நிறுத்து',
    processing: 'சிந்திக்கிறது...',
    voiceAssistanceDesc: 'அடுத்த மருந்து என்ன, சாப்பாட்டுக்கு முன்னாடியா பின்னாடியா, அல்லது எடுத்ததாகக் குறிக்க தமிழில் கேளுங்கள்.',
    tryAsking: 'இவ்வாறு கேட்கலாம்:',
    voiceSuggestion1: 'எனக்கு அடுத்த மருந்து என்ன?',
    voiceSuggestion2: 'நான் காலை மருந்தை எடுத்துக்கொண்டேனா?',
    voiceSuggestion3: 'மருந்தை எடுத்ததாகக் குறிக்கவும்',
    voiceSuggestion4: 'என் பராமரிப்பாளரை அழைக்கவும்',
    voiceAssistanceNotSupported: 'இந்த உலாவியில் குரல் அறிதல் ஆதரிக்கப்படவில்லை. கீழே உங்கள் கேள்வியை தட்டச்சு செய்யலாம்.',
    voiceActionDone: 'செயல் வெற்றிகரமாக முடிந்தது',
    voicePoweredBy: 'ஜெமினி AI மூலம் இயங்குகிறது',
  },

  hi: {
    appName: 'CareCircle',
    senior: 'वरिष्ठजन',
    caretaker: 'देखभालकर्ता',
    circleCode: 'सर्कल कोड',
    switchTo: '{role} में बदलें',
    switch: 'बदलें',
    testSound: 'ध्वनि परीक्षण',
    soundOn: 'ध्वनि: चालू',
    soundMuted: 'ध्वनि: म्यूट',
    signOut: 'साइन आउट / प्रोफ़ाइल बदलें',
    selectLanguage: 'भाषा',

    welcomeTitle: 'CareCircle में आपका स्वागत है',
    welcomeSubtitle: 'वरिष्ठजनों को समय पर दवा लेने और देखभालकर्ताओं को वास्तविक समय में सतर्क रखने वाला सुरक्षित परिवार नेटवर्क।',
    step1Role: 'चरण 1: चुनें कि कौन लॉगिन कर रहा है',
    elderlyPerson: 'वरिष्ठजन / बुजुर्ग',
    elderlyDesc: 'दवा लेने के लिए बड़े बटन और ऑडियो अलार्म के साथ सरल, स्पष्ट इंटरफ़ेस।',
    elderlyBadge: 'दादाजी / वरिष्ठजन',
    caretakerPerson: 'देखभालकर्ता / परिजन',
    caretakerDesc: 'दवा न लेने पर तत्काल सूचना, दवा की समय सारिणी और अनुस्मारक संदेश।',
    missedDoseAlerts: 'छूटी हुई दवा अलर्ट',
    yourNameElderly: 'आपका नाम (वरिष्ठजन)',
    yourNameCaretaker: 'आपका नाम (देखभालकर्ता)',
    circleCodeLabel: 'कनेक्टेड सर्कल कोड',
    circleCodeHelper: 'दोनों भूमिकाएँ इसी कोड का उपयोग करके जुड़ती हैं।',
    emergencyPhoneLabel: 'आपातकालीन फ़ोन नंबर',
    emergencyPhoneHelper: 'वरिष्ठजन द्वारा 1-टैप कॉल के लिए',
    stayLoggedIn: 'इस डिवाइस में लॉगिन रहें',
    encryptedCircle: 'सुरक्षित सर्कल',
    enterAs: '{name} के रूप में प्रवेश करें',
    quickDemo: 'त्वरित 1-क्लिक डेमो प्रोफाइल:',
    quickGrandpa: '👴 दादाजी रॉबर्ट',
    quickCaretaker: '👩‍⚕️ देखभालकर्ता सारा',

    goodMorning: 'शुभ प्रभात',
    goodAfternoon: 'शुभ दोपहर',
    goodEvening: 'शुभ संध्या',
    hello: 'नमस्ते',
    scheduleForToday: 'आज की दवा अनुसूची',
    viewingScheduleFor: '{date} के लिए दवा अनुसूची',
    today: 'आज',
    yesterday: 'कल (बीता)',
    tomorrow: 'कल (आने वाला)',
    todaysProgress: 'आज की प्रगति',
    dosesTakenCount: '{total} में से {taken} दवाएं ली गईं',
    allMedsTaken: 'आज की सभी दवाएं पूरी हो गईं! बहुत बढ़िया काम।',
    nextMedDue: 'अगली दवा का समय',
    dueInMinutes: '{min} मिनट में देय',
    dueNow: 'अभी लेने का समय',
    overdue: 'देरी हो गई',
    scheduledFor: 'निर्धारित समय: {time} ({label})',
    dosage: 'मात्रा: {dosage}',
    instructions: 'निर्देश',
    takeMedicine: 'मैंने दवा ले ली',
    iTookIt: 'मैंने ले ली',
    lockedUntil: '{time} बजे उपलब्ध होगी',
    lockedDesc: 'दवा जल्दी लेने से रोकने के लिए, यह निर्धारित समय ({time}) से 15 मिनट पहले खुलेगी।',
    medicineLocked: 'दवा लॉक है',
    taken: 'ली गई',
    undo: 'पूर्ववत करें',
    callCaregiver: 'देखभालकर्ता / परिवार को कॉल करें',
    callCaregiverDesc: 'मदद चाहिए या अस्वस्थ महसूस कर रहे हैं? तुरंत कॉल करने के लिए यहाँ दबाएँ।',
    callNow: 'अभी कॉल करें',
    noMedsToday: 'इस दिन कोई दवा निर्धारित नहीं है',
    noMedsDesc: 'आपका दिन शुभ हो! यदि कोई दवा छूट गई है तो अपने देखभालकर्ता से संपर्क करें।',
    reminderFrom: '{sender} से अनुस्मारक',
    justNow: 'अभी-अभी',
    dismiss: 'हटाएं',

    tabOverview: 'आज का अवलोकन',
    tabMedications: 'सभी दवाएं ({count})',
    tabCalendar: 'मासिक कैलेंडर',
    statTotal: 'आज की कुल खुराकें',
    statTaken: 'ली गई खुराकें',
    statMissed: 'छूटी / विलंबित खुराकें',
    statAdherence: 'दवा पालन दर',
    missedDoseAlertTitle: 'छूटी हुई दवा अलर्ट!',
    missedDoseAlertDesc: '{senior} ने निर्धारित {time} बजे {med} ({dosage}) दवा अभी तक नहीं ली है।',
    multipleMissedDosesAlert: '{senior} की {count} निर्धारित दवा की खुराकें बाकी हैं।',
    minutesLate: '{min} मिनट की देरी',
    markAsTaken: 'ली गई के रूप में चिह्नित करें',
    sendNudge: 'अनुस्मारक भेजें',
    callSenior: '{senior} को कॉल करें',
    dismissAlert: 'खारिज करें',
    quickNudgesTitle: 'त्वरित देखभालकर्ता कार्य व संदेश',
    quickNudgesSubtitle: '{senior} की स्क्रीन पर घंटी की ध्वनि के साथ सीधा अनुस्मारक संदेश भेजें',
    customMessage: 'कस्टम संदेश',
    writeMessagePlaceholder: '{senior} के लिए एक प्यारा संदेश लिखें...',
    send: 'भेजें',
    cancel: 'रद्द करें',
    simulateMissedDose: 'छूटी हुई दवा का सिमुलेशन करें',
    simulateMissedDoseDesc: 'अलर्ट ध्वनि व चेतावनी का परीक्षण करें',
    emergencyContact: 'आपातकालीन संपर्क',

    addMedicine: 'दवा जोड़ें',
    allConfiguredMeds: 'सभी कॉन्फ़िगर की गई दवाएं',
    managePrescriptions: 'अपने नुस्खे, खुराक का समय और अवधि प्रबंधित करें',
    noMedsAdded: 'अभी तक कोई दवा नहीं जोड़ी गई है',
    noMedsAddedDesc: 'अपनी पहली दवा अनुसूची बनाने के लिए ऊपर "दवा जोड़ें" पर क्लिक करें।',
    deleteConfirm: 'क्या इस दवा को हटाना चाहते हैं?',
    deleteWarning: 'यह इस दवा की सभी निर्धारित खुराकों को हटा देगा।',
    delete: 'हटाएं',
    ongoing: 'निरंतर (हमेशा)',
    lastDayToday: 'आज अंतिम दिन है!',
    oneDayLeft: '1 दिन शेष',
    daysLeft: '{days} दिन शेष',
    completedAgo: '{days} दिन पहले पूरी हुई',

    afterFood: 'भोजन के बाद',
    beforeFood: 'भोजन से पहले',
    withFood: 'भोजन के साथ',
    emptyStomach: 'खाली पेट',
    anytime: 'किसी भी समय',

    tablet: 'गोली (टैबलेट)',
    capsule: 'कैप्सूल',
    syrup: 'सिरप',
    injection: 'इंजेक्शन',
    drops: 'ड्रॉप्स',
    inhaler: 'इन्हेलर',
    other: 'अन्य',

    morning: 'सुबह',
    afternoon: 'दोपहर',
    evening: 'शाम',
    night: 'रात',
    custom: 'कस्टम',

    addNewMedication: 'नई दवा जोड़ें',
    addMedSubtitle: 'खुराक, समय और उपचार की अवधि निर्धारित करें',
    quickSuggestions: 'त्वरित सुझाव (भरने के लिए क्लिक करें)',
    medName: 'दवा का नाम',
    medNamePlaceholder: 'उदा. मेटफॉर्मिन, पैरासिटामोल, डोलो 650',
    dosageStrength: 'खुराक / क्षमता',
    dosagePlaceholder: 'उदा. 500mg, 1 गोली, 10ml',
    medicineForm: 'दवा का रूप',
    foodInstruction: 'भोजन संबंधी निर्देश',
    treatmentDuration: 'उपचार की अवधि',
    continuousOngoing: 'निरंतर (रोज़ाना)',
    fixedDaysCourse: 'निश्चित दिन (एंटीबायोटिक, कोर्स)',
    numberOfDays: 'दिनों की संख्या',
    days30Default: '30 दिन (मानक कोर्स)',
    days14: '14 दिन',
    days7: '7 दिन',
    days5: '5 दिन',
    startDate: 'प्रारंभ तिथि',
    scheduledTimings: 'प्रतिदिन का निर्धारित समय',
    presetTimings: 'प्रीसेट समय:',
    presetOnceMorning: '1x सुबह',
    presetTwice: '2x सुबह और रात',
    presetThrice: '3x सुबह, दोपहर, रात',
    presetFour: '4x बार',
    addAnotherTime: 'अन्य समय जोड़ें',
    specialNotes: 'विशेष निर्देश व नोट्स',
    specialNotesPlaceholder: 'उदा. गर्म दूध के साथ लें, पर्याप्त पानी पिएं',
    saveMedication: 'दवा सहेजें और शेड्यूल करें',

    timeForMedicine: 'दवा का समय हो गया है!',
    takeNow: 'मैं अभी ले रहा हूँ',
    snooze5Min: '5 मिनट बाद याद दिलाएं (स्नूज़)',
    dismissAlarm: 'अलार्म बंद करें',

    audioSettingsTitle: 'ऑडियो और अधिसूचना सेटिंग्स',
    soundAlerts: 'ध्वनि अलर्ट और घंटियाँ',
    soundAlertsDesc: 'दवा का समय होने पर या देखभालकर्ता द्वारा संदेश भेजने पर ध्वनि बजाएं',
    masterVolume: 'मास्टर वॉल्यूम',
    alarmTone: 'अलार्म टोन (सुनने के लिए प्ले करें)',
    test: 'परीक्षण',
    pushNotifications: 'पुश सूचनाएं',
    notificationsActive: 'सूचनाएं सक्रिय हैं',
    enableNotifications: 'सूचनाएं सक्षम करें',
    saveSettings: 'सेटिंग्स सहेजें',

    calling: 'कॉल किया जा रहा है...',
    connected: 'जुड़ गया',
    callEnded: 'कॉल समाप्त',
    mute: 'म्यूट',
    unmute: 'अनम्यूट',
    speaker: 'स्पीकर',
    endCall: 'कॉल समाप्त करें',

    jumpToToday: 'आज',
    scheduledDosesForDate: '{date} के लिए निर्धारित खुराकें',
    noMedsForSelectedDay: 'इस दिन कोई दवा निर्धारित नहीं है।',

    close: 'बंद करें',
    endDate: 'समाप्ति तिथि',
    autoAlarmPromptInfo: 'प्रत्येक निर्धारित समय पर अलार्म स्वचालित रूप से बजेगा',
    medicationAlarm: 'दवा अनुस्मारक अलार्म',
    alarmTitle: 'आपकी दवा का समय हो गया!',
    alarmRinging: 'ऑडियो अलार्म बज रहा है',
    takeMedicineNow: 'अभी दवा लें',
    stopAlarm: 'अलार्म बंद करें',
    addAnotherTiming: '+ एक और समय जोड़ें',
    medicineName: 'दवा का नाम',
    form: 'दवा का रूप',
    courseDuration: 'कोर्स की अवधि',
    customDays: 'कस्टम दिन',

    voiceAssistant: 'AI वॉयस असिस्टेंट',
    voiceAssistantTitle: 'केयरसर्कल AI वॉयस असिस्टेंट',
    askVoiceAssistant: 'अपनी दवाओं के बारे में कुछ भी पूछें...',
    listening: 'सुन रहा हूँ... कृपया बोलें',
    tapToSpeak: 'बोलने के लिए दबाएं',
    stopListening: 'रोकें',
    processing: 'सोच रहा हूँ...',
    voiceAssistanceDesc: 'अपनी अगली दवा जानने, भोजन निर्देशों या खुराक पूरी होने पर हिंदी में बोलकर पूछें।',
    tryAsking: 'यह पूछकर देखें:',
    voiceSuggestion1: 'मेरी अगली दवा कौन सी है?',
    voiceSuggestion2: 'क्या मैंने अपनी सुबह की दवा ले ली?',
    voiceSuggestion3: 'दवा को ली गई के रूप में चिह्नित करें',
    voiceSuggestion4: 'मेरे देखभालकर्ता को कॉल करें',
    voiceAssistanceNotSupported: 'इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है। आप नीचे टाइप कर सकते हैं।',
    voiceActionDone: 'कार्य पूरा हुआ',
    voicePoweredBy: 'जेमिनी AI द्वारा संचालित',
  },

  ml: {
    appName: 'CareCircle',
    senior: 'മുതിർന്നയാൾ',
    caretaker: 'പരിചാരകൻ',
    circleCode: 'സർക്കിൾ കോഡ്',
    switchTo: '{role} ലേക്ക് മാറ്റുക',
    switch: 'മാറ്റുക',
    testSound: 'ശബ്ദം പരിശോധിക്കുക',
    soundOn: 'ശബ്ദം: ഓൺ',
    soundMuted: 'ശബ്ദം: മ്യൂട്ട്',
    signOut: 'പുറത്തുകടക്കുക / പ്രൊഫൈൽ മാറ്റുക',
    selectLanguage: 'ഭാഷ',

    welcomeTitle: 'CareCircle-ലേക്ക് സ്വാഗതം',
    welcomeSubtitle: 'മുതിർന്നവർക്ക് കൃത്യസമയത്ത് മരുന്ന് നൽകാനും മരുന്ന് മുടങ്ങിയാൽ പരിചാരകരെ ഉടനടി അറിയിക്കാനുമുള്ള കുടുംബ സുരക്ഷാ ശൃംഖല.',
    step1Role: 'ഘട്ടം 1: ആരാണ് ലോഗിൻ ചെയ്യുന്നതെന്ന് തിരഞ്ഞെടുക്കുക',
    elderlyPerson: 'മുതിർന്നയാൾ / മുത്തശ്ശൻ',
    elderlyDesc: 'വലിയ ബട്ടണുകളും വ്യക്തമായ ശബ്ദ മുന്നറിയിപ്പുകളുമുള്ള ലളിതമായ ഇന്റർഫേസ്.',
    elderlyBadge: 'മുത്തശ്ശൻ / മുതിർന്നയാൾ',
    caretakerPerson: 'പരിചാരകൻ / കുടുംബം',
    caretakerDesc: 'മരുന്ന് കഴിക്കാതിരുന്നാൽ തത്സമയ മുന്നറിയിപ്പുകൾ, മരുന്ന് പട്ടിക, സന്ദേശങ്ങൾ.',
    missedDoseAlerts: 'മുടങ്ങിയ മരുന്ന് അലേർട്ടുകൾ',
    yourNameElderly: 'നിങ്ങളുടെ പേര് (മുതിർന്നയാൾ)',
    yourNameCaretaker: 'നിങ്ങളുടെ പേര് (പരിചാരകൻ)',
    circleCodeLabel: 'സർക്കിൾ കോഡ് (Circle Code)',
    circleCodeHelper: 'രണ്ടുപേരും ഈ ഒരൊറ്റ കോഡ് ഉപയോഗിച്ചാണ് ബന്ധിപ്പിക്കുന്നത്.',
    emergencyPhoneLabel: 'അടിയന്തര ഫോൺ നമ്പർ',
    emergencyPhoneHelper: 'മുതിർന്നയാൾക്ക് ഒറ്റ ടാപ്പിൽ വിളിക്കാൻ',
    stayLoggedIn: 'ഈ ഉപകരണത്തിൽ ലോഗിൻ ചെയ്ത് തുടരുക',
    encryptedCircle: 'സുരക്ഷിത ശൃംഖല',
    enterAs: '{name} ആയി പ്രവേശിക്കുക',
    quickDemo: 'പെട്ടെന്നുള്ള 1-ക്ലിക്ക് ഡെമോ അക്കൗണ്ടുകൾ:',
    quickGrandpa: '👴 മുത്തശ്ശൻ റോബർട്ട്',
    quickCaretaker: '👩‍⚕️ പരിചാരക സാറ',

    goodMorning: 'സുപ്രഭാതം',
    goodAfternoon: 'ശുഭ ഉച്ചനേരം',
    goodEvening: 'ശുഭ സന്ധ്യ',
    hello: 'നമസ്കാരം',
    scheduleForToday: 'ഇന്നത്തെ നിങ്ങളുടെ മരുന്ന് പട്ടിക',
    viewingScheduleFor: '{date}-ലെ മരുന്ന് പട്ടിക',
    today: 'ഇന്ന്',
    yesterday: 'ഇന്നലെ',
    tomorrow: 'നാളെ',
    todaysProgress: 'ഇന്നത്തെ പുരോഗതി',
    dosesTakenCount: '{total}-ൽ {taken} മരുന്നുകൾ കഴിച്ചു',
    allMedsTaken: 'ഇന്നത്തെ എല്ലാ മരുന്നുകളും കഴിച്ചു കഴിഞ്ഞു! വളരെ നല്ലത്.',
    nextMedDue: 'അടുത്ത മരുന്നിന്റെ സമയം',
    dueInMinutes: 'ഇനി {min} മിനിറ്റിൽ',
    dueNow: 'ഇപ്പോൾ കഴിക്കുക',
    overdue: 'വൈകിയിരിക്കുന്നു',
    scheduledFor: 'നിശ്ചിത സമയം: {time} ({label})',
    dosage: 'അളവ്: {dosage}',
    instructions: 'നിർദ്ദേശങ്ങൾ',
    takeMedicine: 'ഞാൻ മരുന്ന് കഴിച്ചു',
    iTookIt: 'കഴിച്ചു',
    lockedUntil: '{time}-ന് ലഭ്യമാകും',
    lockedDesc: 'മരുന്ന് നേരത്തെ കഴിക്കുന്നത് തടയാൻ, നിശ്ചിത സമയത്തിന് ({time}) 15 മിനിറ്റ് മുമ്പ് മാത്രമേ ബട്ടൺ അൺലോക്ക് ആകൂ.',
    medicineLocked: 'മരുന്ന് ലോക്ക് ചെയ്തിരിക്കുന്നു',
    taken: 'കഴിച്ചു',
    undo: 'പഴയപടിയാക്കുക',
    callCaregiver: 'പരിചാരകനെ / കുടുംബത്തെ വിളിക്കുക',
    callCaregiverDesc: 'സഹായം ആവശ്യമുണ്ടോ അല്ലെങ്കിൽ അസ്വസ്ഥത തോന്നുന്നുണ്ടോ? ഉടനടി വിളിക്കാൻ ഇവിടെ അമർത്തുക.',
    callNow: 'ഇപ്പോൾ വിളിക്കുക',
    noMedsToday: 'ഈ ദിവസം മരുന്നുകൾ ഒന്നും ഷെഡ്യൂൾ ചെയ്തിട്ടില്ല',
    noMedsDesc: 'നല്ലൊരു ദിവസം ആശംസിക്കുന്നു! ഏതെങ്കിലും മരുന്ന് വിട്ടുപോയെന്ന് തോന്നിയാൽ പരിചാരകനുമായി സംസാരിക്കുക.',
    reminderFrom: '{sender}-ൽ നിന്നുള്ള ഓർമ്മപ്പെടുത്തൽ',
    justNow: 'ഇപ്പോൾ തന്നെ',
    dismiss: 'ഒഴിവാക്കുക',

    tabOverview: 'ഇന്നത്തെ സംഗ്രഹം',
    tabMedications: 'എല്ലാ മരുന്നുകളും ({count})',
    tabCalendar: 'മാസ കലണ്ടർ',
    statTotal: 'ഇന്നത്തെ ആകെ മരുന്നുകൾ',
    statTaken: 'കഴിച്ച മരുന്നുകൾ',
    statMissed: 'കഴിക്കാത്തവ / വൈകിയവ',
    statAdherence: 'മരുന്ന് കഴിച്ച നിരക്ക്',
    missedDoseAlertTitle: 'മരുന്ന് മുടങ്ങിയ അലേർട്ട്!',
    missedDoseAlertDesc: '{senior} നിശ്ചിത {time}-ൽ {med} ({dosage}) മരുന്ന് ഇതുവരെ കഴിച്ചിട്ടില്ല.',
    multipleMissedDosesAlert: '{senior}-ന്റെ {count} നിശ്ചിത മരുന്നുകൾ കഴിക്കാൻ ബാക്കിയുണ്ട്.',
    minutesLate: '{min} മിനിറ്റ് വൈകി',
    markAsTaken: 'കഴിച്ചതായി അടയാളപ്പെടുത്തുക',
    sendNudge: 'ഓർമ്മപ്പെടുത്തൽ അയക്കുക',
    callSenior: '{senior}-നെ വിളിക്കുക',
    dismissAlert: 'ഒഴിവാക്കുക',
    quickNudgesTitle: 'ദ്രുത പരിചാരക പ്രവർത്തനങ്ങളും ഓർമ്മപ്പെടുത്തലുകളും',
    quickNudgesSubtitle: '{senior}-ന്റെ സ്ക്രീനിലേക്ക് നേരിട്ട് ശബ്ദ സന്ദേശത്തോടെയുള്ള ഓർമ്മപ്പെടുത്തൽ അയക്കുക',
    customMessage: 'ഇഷ്‌ടാനുസൃത സന്ദേശം',
    writeMessagePlaceholder: '{senior}-ന് ഒരു സ്നേഹ സന്ദേശം എഴുതുക...',
    send: 'അയക്കുക',
    cancel: 'റദ്ദാക്കുക',
    simulateMissedDose: 'മരുന്ന് മുടങ്ങിയതായി പരീക്ഷിക്കുക',
    simulateMissedDoseDesc: 'അലേർട്ട് ശബ്ദവും മുന്നറിയിപ്പും പരിശോധിക്കുക',
    emergencyContact: 'അടിയന്തര കോൺടാക്റ്റ്',

    addMedicine: 'മരുന്ന് ചേർക്കുക',
    allConfiguredMeds: 'ചേർത്ത എല്ലാ മരുന്നുകളും',
    managePrescriptions: 'നിങ്ങളുടെ മരുന്നുകൾ, സമയക്രമം, കാലാവധി എന്നിവ കൈകാര്യം ചെയ്യുക',
    noMedsAdded: 'ഇതുവരെ മരുന്നുകൾ ഒന്നും ചേർത്തിട്ടില്ല',
    noMedsAddedDesc: 'നിങ്ങളുടെ ആദ്യ മരുന്ന് ഷെഡ്യൂൾ ഉണ്ടാക്കാൻ മുകളിലുള്ള "മരുന്ന് ചേർക്കുക" ക്ലിക്ക് ചെയ്യുക.',
    deleteConfirm: 'ഈ മരുന്ന് നീക്കം ചെയ്യണോ?',
    deleteWarning: 'ഇത് ഈ മരുന്നിനായുള്ള എല്ലാ ഷെഡ്യൂളുകളും നീക്കം ചെയ്യും.',
    delete: 'നീക്കം ചെയ്യുക',
    ongoing: 'തുടർച്ചയായി (എപ്പോഴും)',
    lastDayToday: 'ഇന്ന് അവസാന ദിവസം!',
    oneDayLeft: '1 ദിവസം ശേഷിക്കുന്നു',
    daysLeft: '{days} ദിവസങ്ങൾ ശേഷിക്കുന്നു',
    completedAgo: '{days} ദിവസങ്ങൾക്ക് മുൻപ് പൂർത്തിയായി',

    afterFood: 'ഭക്ഷണത്തിന് ശേഷം',
    beforeFood: 'ഭക്ഷണത്തിന് മുൻപ്',
    withFood: 'ഭക്ഷണത്തോടൊപ്പം',
    emptyStomach: 'വെറുംവയറ്റിൽ',
    anytime: 'എപ്പോൾ വേണമെങ്കിലും',

    tablet: 'ഗുളിക (ടാബ്‌ലെറ്റ്)',
    capsule: 'കാപ്സ്യൂൾ',
    syrup: 'സിറപ്പ്',
    injection: 'കുത്തിവെയ്പ്പ്',
    drops: 'തുള്ളിമരുന്ന്',
    inhaler: 'ഇൻഹേലർ',
    other: 'മറ്റുള്ളവ',

    morning: 'രാവിലെ',
    afternoon: 'ഉച്ചയ്ക്ക്',
    evening: 'വൈകുന്നേരം',
    night: 'രാത്രി',
    custom: 'കസ്റ്റം',

    addNewMedication: 'പുതിയ മരുന്ന് ചേർക്കുക',
    addMedSubtitle: 'അളവ്, ദിവസേനയുള്ള സമയം, ചികിത്സാ കാലാവധി എന്നിവ നൽകുക',
    quickSuggestions: 'ദ്രുത നിർദ്ദേശങ്ങൾ (പൂരിപ്പിക്കാൻ ക്ലിക്ക് ചെയ്യുക)',
    medName: 'മരുന്നിന്റെ പേര്',
    medNamePlaceholder: 'ഉദാ: പാരസെറ്റമോൾ, ഡോളോ 650',
    dosageStrength: 'അളവ് / ശക്തി',
    dosagePlaceholder: 'ഉദാ: 650mg, 1 ഗുളിക, 10ml',
    medicineForm: 'മരുന്നിന്റെ രൂപം',
    foodInstruction: 'ഭക്ഷണ നിർദ്ദേശം',
    treatmentDuration: 'ചികിത്സാ കാലാവധി',
    continuousOngoing: 'തുടർച്ചയായി (ദിവസേന)',
    fixedDaysCourse: 'നിശ്ചിത ദിവസങ്ങൾ (ആന്റിബയോട്ടിക്, കോഴ്സ്)',
    numberOfDays: 'ദിവസങ്ങളുടെ എണ്ണം',
    days30Default: '30 ദിവസങ്ങൾ (സാധാരണ കോഴ്സ്)',
    days14: '14 ദിവസങ്ങൾ',
    days7: '7 ദിവസങ്ങൾ',
    days5: '5 ദിവസങ്ങൾ',
    startDate: 'തുടങ്ങുന്ന തീയതി',
    scheduledTimings: 'ദിവസേനയുള്ള സമയങ്ങൾ',
    presetTimings: 'സമയ ക്രമീകരണങ്ങൾ:',
    presetOnceMorning: '1x രാവിലെ',
    presetTwice: '2x രാവിലെയും രാത്രിയും',
    presetThrice: '3x രാവിലെ, ഉച്ചയ്ക്ക്, രാത്രി',
    presetFour: '4x പ്രാവശ്യം',
    addAnotherTime: 'മറ്റൊരു സമയം ചേർക്കുക',
    specialNotes: 'പ്രത്യേക നിർദ്ദേശങ്ങൾ',
    specialNotesPlaceholder: 'ഉദാ: ചൂടുപാലിനൊപ്പം കഴിക്കുക, ധാരാളം വെള്ളം കുടിക്കുക',
    saveMedication: 'മരുന്ന് സംരക്ഷിക്കുക',

    timeForMedicine: 'മരുന്ന് കഴിക്കാനുള്ള സമയം ആയി!',
    takeNow: 'ഞാൻ ഇപ്പോൾ കഴിക്കുന്നു',
    snooze5Min: '5 മിനിറ്റ് കഴിഞ്ഞ് ഓർമ്മിപ്പിക്കുക (സ്നൂസ്)',
    dismissAlarm: 'അലാറം നിർത്തുക',

    audioSettingsTitle: 'ഓഡിയോ & നോട്ടിഫിക്കേഷൻ ക്രമീകരണങ്ങൾ',
    soundAlerts: 'ശബ്ദ മുന്നറിയിപ്പുകൾ',
    soundAlertsDesc: 'മരുന്ന് സമയമാകുമ്പോഴും പരിചാരകൻ സന്ദേശം അയക്കുമ്പോഴും ശബ്ദം കേൾപ്പിക്കുക',
    masterVolume: 'ശബ്ദത്തിന്റെ അളവ്',
    alarmTone: 'അലാറം ശബ്ദം (കേൾക്കാൻ പ്ലേ ചെയ്യുക)',
    test: 'ടെസ്റ്റ്',
    pushNotifications: 'പുഷ് നോട്ടിഫിക്കേഷൻ',
    notificationsActive: 'നോട്ടിഫിക്കേഷനുകൾ സജീവമാണ്',
    enableNotifications: 'നോട്ടിഫിക്കേഷൻ ഓൺ ചെയ്യുക',
    saveSettings: 'സേവ് ചെയ്യുക',

    calling: 'വിളിക്കുന്നു...',
    connected: 'കണക്റ്റ് ആയി',
    callEnded: 'കോൾ അവസാനിച്ചു',
    mute: 'മ്യൂട്ട്',
    unmute: 'അൺമ്യൂട്ട്',
    speaker: 'സ്പീക്കർ',
    endCall: 'കോൾ അവസാനിപ്പിക്കുക',

    jumpToToday: 'ഇന്ന്',
    scheduledDosesForDate: '{date}-ലെ മരുന്നുകൾ',
    noMedsForSelectedDay: 'ഈ ദിവസം മരുന്നുകൾ ഒന്നും ഷെഡ്യൂൾ ചെയ്തിട്ടില്ല.',

    close: 'അടയ്ക്കുക',
    endDate: 'അവസാന തീയതി',
    autoAlarmPromptInfo: 'ഓരോ നിശ്ചിത സമയത്തും അലാറം സ്വയമേവ മുഴങ്ങും',
    medicationAlarm: 'മരുന്ന് ഓർമ്മപ്പെടുത്തൽ അലാറം',
    alarmTitle: 'മരുന്ന് കഴിക്കാനുള്ള സമയമായി!',
    alarmRinging: 'ഓഡിയോ അലാറം മുഴങ്ങുന്നു',
    takeMedicineNow: 'ഇപ്പോൾ മരുന്ന് കഴിക്കുക',
    stopAlarm: 'അലാറം നിർത്തുക',
    addAnotherTiming: '+ മറ്റൊരു സമയം ചേർക്കുക',
    medicineName: 'മരുന്നിന്റെ പേര്',
    form: 'മരുന്നിന്റെ രൂപം',
    courseDuration: 'ചികിത്സാ കാലാവധി',
    customDays: 'നിശ്ചിത ദിവസങ്ങൾ',

    voiceAssistant: 'AI വോയ്‌സ് അസിസ്റ്റന്റ്',
    voiceAssistantTitle: 'കെയർസർക്കിൾ AI വോയ്‌സ് അസിസ്റ്റന്റ്',
    askVoiceAssistant: 'മരുന്നുകളെക്കുറിച്ച് എന്തുവേണമെങ്കിലും ചോദിക്കാം...',
    listening: 'കേൾക്കുന്നു... സംസാരിക്കൂ',
    tapToSpeak: 'സംസാരിക്കാൻ അമർത്തുക',
    stopListening: 'നിർത്തുക',
    processing: 'ചിന്തിക്കുന്നു...',
    voiceAssistanceDesc: 'അടുത്ത മരുന്ന് ഏതാണ്, ഭക്ഷണത്തിന് മുൻപോ ശേഷമോ, അല്ലെങ്കിൽ കഴിച്ചതായി രേഖപ്പെടുത്താൻ മലയാളത്തിൽ ചോദിക്കാം.',
    tryAsking: 'ഇങ്ങനെ ചോദിച്ചു നോക്കൂ:',
    voiceSuggestion1: 'എന്റെ അടുത്ത മരുന്ന് ഏതാണ്?',
    voiceSuggestion2: 'ഞാൻ രാവിലത്തെ മരുന്ന് കഴിച്ചോ?',
    voiceSuggestion3: 'മരുന്ന് കഴിച്ചതായി അടയാളപ്പെടുത്തുക',
    voiceSuggestion4: 'കെയർടേക്കറെ വിളിക്കുക',
    voiceAssistanceNotSupported: 'ഈ ബ്രൗസറിൽ വോയ്‌സ് റെക്കഗ്നിഷൻ ലഭ്യമല്ല. താഴെ ടൈപ്പ് ചെയ്യാം.',
    voiceActionDone: 'പ്രവർത്തനം പൂർത്തിയായി',
    voicePoweredBy: 'ജെമിനി AI സാങ്കേതികവിദ്യ',
  },

};


export function getTranslation(
  lang: LanguageCode,
  key: keyof Translations,
  params?: Record<string, string | number>
): string {
  const langDict = translations[lang] || translations.en;
  let text = langDict[key] || translations.en[key] || (key as string);

  if (params) {
    const enrichedParams: Record<string, string | number> = { ...params };
    // Handle parameter aliases
    if (enrichedParams.senior && !enrichedParams.name) enrichedParams.name = enrichedParams.senior;
    if (enrichedParams.name && !enrichedParams.senior) enrichedParams.senior = enrichedParams.name;
    if (enrichedParams.min !== undefined && enrichedParams.minutes === undefined) enrichedParams.minutes = enrichedParams.min;
    if (enrichedParams.minutes !== undefined && enrichedParams.min === undefined) enrichedParams.min = enrichedParams.minutes;

    Object.entries(enrichedParams).forEach(([paramKey, paramVal]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    });
  }

  // Safety cleanup: replace any leftover raw template tags so they never appear to user
  text = text.replace(/\{senior\}|\{name\}/g, 'Senior');
  text = text.replace(/\{med\}/g, 'Medicine');
  text = text.replace(/\{dosage\}/g, '');
  text = text.replace(/\{time\}/g, '');
  text = text.replace(/\{min\}|\{minutes\}/g, '0');
  text = text.replace(/\{count\}/g, '1');

  return text;
}
