/**
 * TTG Intelligent Client-Side Spellcheck & Grammar Engine
 * Provides real-time spelling correction, grammar checking, wordiness elimination,
 * stylistic suggestions, and academic readability metrics without external API calls.
 */

export interface TextSuggestion {
  id: string;
  type: 'spelling' | 'grammar' | 'style' | 'wordiness' | 'punctuation';
  message: string;
  originalText: string;
  suggestedText: string;
  index: number;
  length: number;
  severity: 'error' | 'warning' | 'info';
  categoryLabel: string;
  explanation: string;
}

export interface ReadabilityStats {
  fleschScore: number;
  fleschReadingLevel: string;
  gradeLevel: number;
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  readingTimeMinutes: number;
  overallQualityScore: number;
  suggestionCount: number;
  errorCount: number;
  warningCount: number;
}

// Common misspellings and academic vocabulary typos
const COMMON_SPELLING_DICTIONARY: Record<string, string> = {
  // Frequently misspelled English words
  teh: 'the',
  recieve: 'receive',
  recieved: 'received',
  recieving: 'receiving',
  seperate: 'separate',
  seperated: 'separated',
  seperating: 'separating',
  definately: 'definitely',
  definitly: 'definitely',
  occured: 'occurred',
  occuring: 'occurring',
  untill: 'until',
  beleive: 'believe',
  beleived: 'believed',
  accomodate: 'accommodate',
  accomodation: 'accommodation',
  goverment: 'government',
  enviroment: 'environment',
  enviromental: 'environmental',
  neccessary: 'necessary',
  unneccessary: 'unnecessary',
  calender: 'calendar',
  consistant: 'consistent',
  maintainance: 'maintenance',
  occurance: 'occurrence',
  refered: 'referred',
  refering: 'referring',
  truely: 'truly',
  wich: 'which',
  acheive: 'achieve',
  acheived: 'achieved',
  acheivement: 'achievement',
  adress: 'address',
  adresses: 'addresses',
  begining: 'beginning',
  curiousity: 'curiosity',
  priviledge: 'privilege',
  existance: 'existence',
  embarass: 'embarrass',
  embarassed: 'embarrassed',
  embarassing: 'embarrassing',
  noticable: 'noticeable',
  persue: 'pursue',
  wierd: 'weird',
  alot: 'a lot',
  fourty: 'forty',
  pronounciation: 'pronunciation',
  recommand: 'recommend',
  recommanded: 'recommended',
  recommandation: 'recommendation',
  succesful: 'successful',
  succesfully: 'successfully',
  threshhold: 'threshold',
  tommorrow: 'tomorrow',
  tomorow: 'tomorrow',
  whitch: 'which',
  wierdly: 'weirdly',
  foreward: 'forward',
  guarentee: 'guarantee',
  garantee: 'guarantee',
  independant: 'independent',
  independantly: 'independently',
  inteligence: 'intelligence',
  intelegent: 'intelligent',
  millenium: 'millennium',
  parrallel: 'parallel',
  posession: 'possession',
  rythm: 'rhythm',
  tendancy: 'tendency',
  restaraunt: 'restaurant',
  beleif: 'belief',
  concious: 'conscious',
  dissapear: 'disappear',
  dissapoint: 'disappoint',
  foriegn: 'foreign',
  grammer: 'grammar',
  hierachy: 'hierarchy',
  knowlege: 'knowledge',
  liasion: 'liaison',
  persistant: 'persistent',
  peice: 'piece',
  procede: 'proceed',
  publically: 'publicly',
  questionaire: 'questionnaire',
  supercede: 'supersede',
  suprise: 'surprise',
  writting: 'writing',
  writen: 'written',
  yeild: 'yield',
  visable: 'visible',
  apologise: 'apologize',
  analsis: 'analysis',
  catagory: 'category',
  catagories: 'categories',
  collegue: 'colleague',
  collegues: 'colleagues',
  convinient: 'convenient',
  dilema: 'dilemma',
  dispair: 'despair',
  fascinatingly: 'fascinatingly',
  harrass: 'harass',
  harrassment: 'harassment',
  impliment: 'implement',
  implimented: 'implemented',
  implimentation: 'implementation',
  inadvertant: 'inadvertent',
  inadvertantly: 'inadvertently',
  innoculate: 'inoculate',
  intelligable: 'intelligible',
  judgemental: 'judgmental',
  mischevious: 'mischievous',
  miniscule: 'minuscule',
  mispell: 'misspell',
  mispelled: 'misspelled',
  mispelling: 'misspelling',
  necesary: 'necessary',
  ocasion: 'occasion',
  ocasional: 'occasional',
  ocasionally: 'occasionally',
  paralell: 'parallel',
  percieve: 'perceive',
  perseverence: 'perseverance',
  playwrite: 'playwright',
  privelege: 'privilege',
  propoganda: 'propaganda',
  reconize: 'recognize',
  relavent: 'relevant',
  resistence: 'resistance',
  sensable: 'sensible',
  sieze: 'seize',
  stubborness: 'stubbornness',
  unforseen: 'unforeseen',
  vaccum: 'vacuum',
  withold: 'withhold',
};

// Wordy phrasing and concise institutional alternatives
const WORDINESS_PATTERNS: Array<{
  pattern: RegExp;
  replacement: string;
  message: string;
  explanation: string;
}> = [
  {
    pattern: /\bin order to\b/gi,
    replacement: 'to',
    message: 'Wordy phrase: Replace "in order to" with "to"',
    explanation: 'Concise institutional writing favors direct phrasing.',
  },
  {
    pattern: /\bdue to the fact that\b/gi,
    replacement: 'because',
    message: 'Wordy phrase: Replace "due to the fact that" with "because"',
    explanation: 'Improves reader momentum and executive clarity.',
  },
  {
    pattern: /\bat the present time\b/gi,
    replacement: 'currently',
    message: 'Wordy phrase: Replace "at the present time" with "currently"',
    explanation: 'Shortens sentence cadence without altering intent.',
  },
  {
    pattern: /\bfor the purpose of\b/gi,
    replacement: 'for',
    message: 'Wordy phrase: Replace "for the purpose of" with "to" or "for"',
    explanation: 'Eliminates prepositional bloating.',
  },
  {
    pattern: /\bin the event that\b/gi,
    replacement: 'if',
    message: 'Wordy phrase: Replace "in the event that" with "if"',
    explanation: 'Conditional "if" is punchy and unambiguous.',
  },
  {
    pattern: /\ba large number of\b/gi,
    replacement: 'many',
    message: 'Wordy phrase: Replace "a large number of" with "many"',
    explanation: 'Specific quantifier is faster to digest.',
  },
  {
    pattern: /\bhas the ability to\b/gi,
    replacement: 'can',
    message: 'Wordy phrase: Replace "has the ability to" with "can"',
    explanation: 'Active verbs strengthen cognitive clarity.',
  },
  {
    pattern: /\bwith the exception of\b/gi,
    replacement: 'except',
    message: 'Wordy phrase: Replace "with the exception of" with "except"',
    explanation: 'Cuts three unnecessary function words.',
  },
  {
    pattern: /\bin spite of the fact that\b/gi,
    replacement: 'although',
    message: 'Wordy phrase: Replace "in spite of the fact that" with "although"',
    explanation: 'Single conjunction replacement.',
  },
  {
    pattern: /\btake into consideration\b/gi,
    replacement: 'consider',
    message: 'Nominalization: Replace "take into consideration" with "consider"',
    explanation: 'Converts noun-verb phrase back into an active verb.',
  },
  {
    pattern: /\bmake an assumption\b/gi,
    replacement: 'assume',
    message: 'Nominalization: Replace "make an assumption" with "assume"',
    explanation: 'Direct action verb.',
  },
  {
    pattern: /\bdraw to a close\b/gi,
    replacement: 'conclude',
    message: 'Wordy idiom: Replace "draw to a close" with "conclude"',
    explanation: 'Crisp academic closure.',
  },
  {
    pattern: /\butilize\b/gi,
    replacement: 'use',
    message: 'Style suggestion: Consider "use" instead of "utilize"',
    explanation: '"Use" is simpler and universally preferred in modern style guides.',
  },
  {
    pattern: /\butilization\b/gi,
    replacement: 'use',
    message: 'Style suggestion: Consider "use" instead of "utilization"',
    explanation: 'Plain English recommendation.',
  },
];

// Redundant pairs (tautology)
const REDUNDANCY_PATTERNS: Array<{
  pattern: RegExp;
  replacement: string;
  message: string;
}> = [
  {
    pattern: /\bbasic fundamentals\b/gi,
    replacement: 'fundamentals',
    message: 'Redundancy: Fundamentals are inherently basic.',
  },
  {
    pattern: /\bpast history\b/gi,
    replacement: 'history',
    message: 'Redundancy: History is always in the past.',
  },
  {
    pattern: /\bfuture plans\b/gi,
    replacement: 'plans',
    message: 'Redundancy: Plans are forward-looking by definition.',
  },
  {
    pattern: /\bend result\b/gi,
    replacement: 'result',
    message: 'Redundancy: A result is inherently at the end.',
  },
  {
    pattern: /\bclose proximity\b/gi,
    replacement: 'proximity',
    message: 'Redundancy: Proximity denotes closeness.',
  },
  {
    pattern: /\bunintended mistake\b/gi,
    replacement: 'mistake',
    message: 'Redundancy: Mistakes are by nature unintended.',
  },
  {
    pattern: /\bcompletely unanimous\b/gi,
    replacement: 'unanimous',
    message: 'Redundancy: Unanimity is absolute.',
  },
  {
    pattern: /\bfirst and foremost\b/gi,
    replacement: 'primarily',
    message: 'Cliché: Replace "first and foremost" with "primarily".',
  },
];

// Grammar and syntax checks
const GRAMMAR_PATTERNS: Array<{
  pattern: RegExp;
  replacement: string;
  message: string;
  explanation: string;
}> = [
  {
    pattern: /\b(they|we|you) was\b/gi,
    replacement: '$1 were',
    message: 'Subject-verb agreement error',
    explanation: 'Use plural "were" with they, we, and you.',
  },
  {
    pattern: /\b(he|she|it) don't\b/gi,
    replacement: "$1 doesn't",
    message: 'Subject-verb agreement error',
    explanation: 'Use singular "doesn\'t" with third-person subjects.',
  },
  {
    pattern: /\ba ([aeiou][a-z]+)\b/gi,
    replacement: 'an $1',
    message: 'Article agreement: "a" before vowel sound',
    explanation: 'Use "an" before words starting with a vowel sound.',
  },
  {
    pattern: /\ban ([bcdfghjklmnpqrstvwxyz][a-z]+)\b/gi,
    replacement: 'a $1',
    message: 'Article agreement: "an" before consonant sound',
    explanation: 'Use "a" before words starting with a consonant sound.',
  },
  {
    pattern: /\byour welcome\b/gi,
    replacement: "you're welcome",
    message: 'Homophone error: "your" vs "you\'re"',
    explanation: '"You\'re" is the contraction of "you are".',
  },
  {
    pattern: /\btheir is\b/gi,
    replacement: 'there is',
    message: 'Homophone error: "their" vs "there"',
    explanation: '"There is" indicates existence; "their" is possessive.',
  },
  {
    pattern: /\btheir are\b/gi,
    replacement: 'there are',
    message: 'Homophone error: "their" vs "there"',
    explanation: '"There are" indicates existence; "their" is possessive.',
  },
  {
    pattern: /\bshould of\b/gi,
    replacement: 'should have',
    message: 'Grammar error: "should of"',
    explanation: 'Use "should have" or "should\'ve".',
  },
  {
    pattern: /\bcould of\b/gi,
    replacement: 'could have',
    message: 'Grammar error: "could of"',
    explanation: 'Use "could have" or "could\'ve".',
  },
  {
    pattern: /\bwould of\b/gi,
    replacement: 'would have',
    message: 'Grammar error: "would of"',
    explanation: 'Use "would have" or "would\'ve".',
  },
];

/**
 * Counts syllables in an English word using phonetic heuristics
 */
function countSyllables(word: string): number {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleanWord) return 0;
  if (cleanWord.length <= 3) return 1;

  let syllableCount = 0;
  const vowels = 'aeiouy';
  let prevIsVowel = false;

  for (let i = 0; i < cleanWord.length; i++) {
    const isVowel = vowels.includes(cleanWord[i]);
    if (isVowel && !prevIsVowel) {
      syllableCount++;
    }
    prevIsVowel = isVowel;
  }

  // Adjust for silent e at the end
  if (cleanWord.endsWith('e') && !cleanWord.endsWith('le') && syllableCount > 1) {
    syllableCount--;
  }

  return Math.max(1, syllableCount);
}

/**
 * Computes Flesch Reading Ease score and grade level
 */
export function calculateReadability(text: string): ReadabilityStats {
  const words = text.match(/[a-zA-Z0-9'-]+/g) || [];
  const sentences = text.split(/[.!?]+(?:\s+|$)/).filter((s) => s.trim().length > 0);

  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);
  const characterCount = text.length;

  let totalSyllables = 0;
  for (const w of words) {
    totalSyllables += countSyllables(w);
  }

  const avgWordsPerSentence = wordCount > 0 ? Number((wordCount / sentenceCount).toFixed(1)) : 0;
  const syllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 1;

  // Flesch Reading Ease: 206.835 - (1.015 * ASL) - (84.6 * ASW)
  let flesch = 100;
  if (wordCount > 3) {
    flesch = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * syllablesPerWord;
    flesch = Math.max(0, Math.min(100, Number(flesch.toFixed(1))));
  }

  // Flesch-Kincaid Grade Level: 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  let gradeLevel = 8;
  if (wordCount > 3) {
    gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * syllablesPerWord - 15.59;
    gradeLevel = Math.max(1, Math.min(18, Number(gradeLevel.toFixed(1))));
  }

  let fleschReadingLevel = 'Standard / Plain English';
  if (flesch >= 90) fleschReadingLevel = 'Very Easy (5th Grade)';
  else if (flesch >= 80) fleschReadingLevel = 'Easy (6th Grade)';
  else if (flesch >= 70) fleschReadingLevel = 'Fairly Easy (7th Grade)';
  else if (flesch >= 60) fleschReadingLevel = 'Standard (8th-9th Grade)';
  else if (flesch >= 50) fleschReadingLevel = 'Fairly Difficult (10th-12th Grade)';
  else if (flesch >= 30) fleschReadingLevel = 'Difficult (College Executive)';
  else fleschReadingLevel = 'Very Difficult (Academic Specialist)';

  // Estimated reading time: 200 words per minute average
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return {
    fleschScore: flesch,
    fleschReadingLevel,
    gradeLevel,
    wordCount,
    characterCount,
    sentenceCount,
    avgWordsPerSentence,
    readingTimeMinutes,
    overallQualityScore: 95,
    suggestionCount: 0,
    errorCount: 0,
    warningCount: 0,
  };
}

/**
 * Analyzes full document text in real time and returns suggestions with line/character offsets
 */
export function analyzeDocumentText(content: string): {
  suggestions: TextSuggestion[];
  stats: ReadabilityStats;
} {
  const suggestions: TextSuggestion[] = [];
  const baseStats = calculateReadability(content);

  if (!content || !content.trim()) {
    return {
      suggestions: [],
      stats: {
        ...baseStats,
        overallQualityScore: 100,
      },
    };
  }

  // 1. Check Repeated Consecutive Words (e.g. "the the", "in in")
  const repeatedWordsRegex = /\b([a-zA-Z]{2,})\s+\1\b/gi;
  let match: RegExpExecArray | null;
  while ((match = repeatedWordsRegex.exec(content)) !== null) {
    const word = match[1];
    suggestions.push({
      id: `rep_${match.index}`,
      type: 'grammar',
      message: `Repeated word: "${word}" appears twice consecutively`,
      originalText: match[0],
      suggestedText: word,
      index: match.index,
      length: match[0].length,
      severity: 'error',
      categoryLabel: 'Grammar',
      explanation: 'Remove the duplicate word to preserve readability.',
    });
  }

  // 2. Check Spelling Dictionary
  // Tokenize words with exact offsets
  const wordTokenRegex = /\b[a-zA-Z]+(?:'[a-zA-Z]+)?\b/g;
  while ((match = wordTokenRegex.exec(content)) !== null) {
    const rawWord = match[0];
    const lower = rawWord.toLowerCase();

    if (COMMON_SPELLING_DICTIONARY[lower]) {
      const correction = COMMON_SPELLING_DICTIONARY[lower];
      // Match casing of original
      let formattedCorrection = correction;
      if (rawWord[0] === rawWord[0].toUpperCase() && rawWord[1]?.toLowerCase() === rawWord[1]) {
        formattedCorrection = correction.charAt(0).toUpperCase() + correction.slice(1);
      } else if (rawWord === rawWord.toUpperCase()) {
        formattedCorrection = correction.toUpperCase();
      }

      suggestions.push({
        id: `spell_${match.index}`,
        type: 'spelling',
        message: `Misspelled: "${rawWord}" -> "${formattedCorrection}"`,
        originalText: rawWord,
        suggestedText: formattedCorrection,
        index: match.index,
        length: rawWord.length,
        severity: 'error',
        categoryLabel: 'Spelling',
        explanation: `Common spelling correction for institutional accuracy.`,
      });
    }
  }

  // 3. Check Grammar & Syntax Patterns
  for (const rule of GRAMMAR_PATTERNS) {
    const regex = new RegExp(rule.pattern.source, 'gi');
    while ((match = regex.exec(content)) !== null) {
      // Replace with captured groups if any
      const original = match[0];
      const suggested = original.replace(rule.pattern, rule.replacement);
      
      // Avoid duplicate flags if already detected
      if (!suggestions.some((s) => s.index === match!.index)) {
        suggestions.push({
          id: `gram_${match.index}`,
          type: 'grammar',
          message: rule.message,
          originalText: original,
          suggestedText: suggested,
          index: match.index,
          length: original.length,
          severity: 'error',
          categoryLabel: 'Grammar',
          explanation: rule.explanation,
        });
      }
    }
  }

  // 4. Check Wordiness Patterns
  for (const rule of WORDINESS_PATTERNS) {
    const regex = new RegExp(rule.pattern.source, 'gi');
    while ((match = regex.exec(content)) !== null) {
      const original = match[0];
      let suggested = rule.replacement;
      if (original[0] === original[0].toUpperCase()) {
        suggested = suggested.charAt(0).toUpperCase() + suggested.slice(1);
      }

      suggestions.push({
        id: `wordy_${match.index}`,
        type: 'wordiness',
        message: rule.message,
        originalText: original,
        suggestedText: suggested,
        index: match.index,
        length: original.length,
        severity: 'info',
        categoryLabel: 'Conciseness',
        explanation: rule.explanation,
      });
    }
  }

  // 5. Check Redundant Word Pairs
  for (const rule of REDUNDANCY_PATTERNS) {
    const regex = new RegExp(rule.pattern.source, 'gi');
    while ((match = regex.exec(content)) !== null) {
      const original = match[0];
      let suggested = rule.replacement;
      if (original[0] === original[0].toUpperCase()) {
        suggested = suggested.charAt(0).toUpperCase() + suggested.slice(1);
      }

      suggestions.push({
        id: `redundant_${match.index}`,
        type: 'style',
        message: rule.message,
        originalText: original,
        suggestedText: suggested,
        index: match.index,
        length: original.length,
        severity: 'warning',
        categoryLabel: 'Clarity',
        explanation: 'Avoid redundant word pairs to elevate rhetorical power.',
      });
    }
  }

  // 6. Check Punctuation Spacing (e.g. space before comma/period)
  const punctuationSpaceRegex = /\s+([,.:;?!])/g;
  while ((match = punctuationSpaceRegex.exec(content)) !== null) {
    suggestions.push({
      id: `punc_${match.index}`,
      type: 'punctuation',
      message: `Extraneous space before punctuation mark "${match[1]}"`,
      originalText: match[0],
      suggestedText: match[1],
      index: match.index,
      length: match[0].length,
      severity: 'warning',
      categoryLabel: 'Punctuation',
      explanation: 'Punctuation marks should immediately follow the word.',
    });
  }

  // Sort suggestions by appearance index
  suggestions.sort((a, b) => a.index - b.index);

  // Calculate Overall Quality Score (0 to 100)
  const errors = suggestions.filter((s) => s.severity === 'error').length;
  const warnings = suggestions.filter((s) => s.severity === 'warning').length;
  const infos = suggestions.filter((s) => s.severity === 'info').length;

  let qualityScore = 100;
  if (baseStats.wordCount > 0) {
    const errorPenalty = (errors * 5);
    const warningPenalty = (warnings * 2);
    const infoPenalty = (infos * 1);
    qualityScore = Math.max(40, Math.min(100, Math.round(100 - (errorPenalty + warningPenalty + infoPenalty))));
  }

  const finalStats: ReadabilityStats = {
    ...baseStats,
    overallQualityScore: qualityScore,
    suggestionCount: suggestions.length,
    errorCount: errors,
    warningCount: warnings,
  };

  return {
    suggestions,
    stats: finalStats,
  };
}

/**
 * Safely replaces a single suggestion in the text
 */
export function applySuggestion(
  currentText: string,
  suggestion: TextSuggestion
): string {
  // Validate that originalText is actually at the indexed position
  const targetSub = currentText.substring(suggestion.index, suggestion.index + suggestion.length);
  if (targetSub.toLowerCase() === suggestion.originalText.toLowerCase()) {
    return (
      currentText.substring(0, suggestion.index) +
      suggestion.suggestedText +
      currentText.substring(suggestion.index + suggestion.length)
    );
  }

  // Fallback: search and replace first exact match
  return currentText.replace(suggestion.originalText, suggestion.suggestedText);
}

/**
 * Applies all safe spelling and punctuation fixes in reverse order to preserve string indices
 */
export function fixAllSafeSuggestions(
  currentText: string,
  suggestions: TextSuggestion[]
): string {
  // Filter for errors and punctuation fixes
  const safeItems = suggestions
    .filter((s) => s.type === 'spelling' || s.type === 'punctuation' || s.type === 'grammar')
    .sort((a, b) => b.index - a.index); // Reverse order

  let updated = currentText;
  for (const item of safeItems) {
    const sub = updated.substring(item.index, item.index + item.length);
    if (sub.toLowerCase() === item.originalText.toLowerCase()) {
      updated =
        updated.substring(0, item.index) +
        item.suggestedText +
        updated.substring(item.index + item.length);
    }
  }

  return updated;
}
