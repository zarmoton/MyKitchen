/**
 * Helper utilities for date management and Chabbat / Semaine detection.
 */

export const getDayInfo = () => {
  const now = new Date();
  const day = now.getDay(); 
  // 0: Dimanche, 1: Lundi, 2: Mardi, 3: Mercredi, 4: Jeudi, 5: Vendredi, 6: Samedi

  // Rule: Mercredi (3), Jeudi (4), Vendredi (5) -> Chabbat par défaut
  const isChabbatTime = day === 3 || day === 4 || day === 5;

  const dayNames = [
    'Dimanche',
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
  ];

  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  const dayName = dayNames[day];
  const dateFormatted = `${dayName} ${now.getDate()} ${monthNames[now.getMonth()]}`;

  return {
    dayOfWeek: day,
    dayName,
    dateFormatted,
    isChabbatTime,
    defaultMode: (isChabbatTime ? 'chabbat' : 'semaine') as 'chabbat' | 'semaine',
  };
};

export const formatDisplayDate = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const monthNames = [
      'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
      'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'
    ];
    return `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]} à ${d.getHours().toString().padStart(2, '0')}h${d.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return isoString;
  }
};
