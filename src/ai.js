/**
 * SaralAI — Client-side AI Query Engine
 * No backend required. Searches Schemes.json using keyword scoring + intent detection.
 */

import schemes from './Schemes.json';

// ─── Keyword Intent Maps ─────────────────────────────────────────────────────

const INTENT_KEYWORDS = {
     DOCUMENTS: [
          'document', 'documents', 'papers', 'paper', 'proof', 'certificate',
          'kya chahiye', 'kaunse', 'kaagaz', 'kaagzat', 'dastavez',
          'required', 'need', 'bring', 'carry', 'submit', 'upload',
          'aadhaar', 'voter', 'ration card', 'birth certificate'
     ],
     STEPS: [
          'apply', 'application', 'process', 'how to', 'kaise', 'step', 'steps',
          'procedure', 'process', 'register', 'registration', 'fill', 'form',
          'where to go', 'kahan', 'aavedan', 'apply karna', 'kya karna', 'karna hai'
     ],
     ELIGIBILITY: [
          'eligible', 'eligibility', 'who can', 'qualify', 'criteria', 'condition',
          'paatra', 'paatrata', 'kaun', 'milega', 'mil sakta', 'who gets',
          'can i apply', 'am i eligible', 'requirements', 'income'
     ],
     OVERVIEW: [
          'what is', 'kya hai', 'tell me', 'explain', 'about', 'details', 'info',
          'information', 'bataiye', 'batao', 'janakari', 'samjhaiye', 'overview',
          'scheme', 'yojana', 'help', 'benefit', 'faida', 'labh'
     ]
};

// ─── Scheme Search Keywords ───────────────────────────────────────────────────

/** Keywords associated with each scheme (for matching user queries) */
const SCHEME_KEYWORDS = {
     PMAY_U: [
          'pmay', 'awas', 'housing', 'urban', 'city', 'shahar', 'ghar', 'house',
          'home', 'pradhan mantri awas', 'pmay-u', 'makan', 'residential',
          'flat', 'apartment', 'slum', 'pucca'
     ],
     PMAY_G: [
          'pmay', 'awas', 'housing', 'rural', 'gaon', 'village', 'gram', 'ghar',
          'house', 'home', 'pradhan mantri awas', 'pmay-g', 'gramin', 'makan',
          'kutcha', 'kachcha', 'pucca', 'panchayat'
     ],
     PM_KISAN: [
          'kisan', 'farmer', 'farm', 'kheti', 'agriculture', 'kisaan', 'krishi',
          'pm kisan', 'samman nidhi', 'kisan samman', 'income support', 'land',
          'kheti badi', 'instalment', 'money farmer'
     ],
     PM_JAY: [
          'ayushman', 'health', 'hospital', 'medical', 'insurance', 'jan arogya',
          'pmjay', 'treatment', 'cashless', 'sehat', 'bimari', 'ilaaj',
          'ab-pmjay', 'ayushman bharat', 'health card', 'e-card', 'swasthya'
     ],
     NFSA_PDS: [
          'ration', 'ration card', 'food', 'grain', 'pds', 'nfsa', 'anaj', 'chawal',
          'gehu', 'wheat', 'rice', 'fair price shop', 'rasan', 'antyodaya',
          'national food', 'subsidised', 'bhoj', 'khana'
     ],
     PMJDY: [
          'jan dhan', 'jandhan', 'bank', 'account', 'banking', 'khata', 'bank account',
          'savings', 'zero balance', 'rupay', 'financial', 'money', 'banking',
          'unbanked', 'pmjdy', 'khaata', 'dbt'
     ],
     SSY: [
          'sukanya', 'girl', 'daughter', 'beti', 'samriddhi', 'savings', 'child',
          'ladki', 'bachi', 'female', 'women', 'education', 'marriage',
          'tax', '80c', 'post office', 'bachan'
     ],
     PMUY: [
          'ujjwala', 'lpg', 'gas', 'cylinder', 'cooking', 'kitchen', 'chulha',
          'rasoi', 'gas connection', 'pmuy', 'women', 'mahila', 'fuel', 'clean cooking',
          'smoke', 'gas stove', 'connection'
     ],
     NSAP: [
          'pension', 'old age', 'widow', 'disability', 'nsap', 'elderly', 'senior',
          'budhapa', 'vidhwa', 'viklang', 'handicapped', 'social assistance',
          'bujurg', 'monthly', 'allowance', 'ignoaps', 'ignwps', 'retir'
     ],
     PMKVY: [
          'skill', 'training', 'job', 'employment', 'kaushal', 'pmkvy', 'course',
          'certificate', 'certification', 'youth', 'yuva', 'rojgar', 'naukri',
          'work', 'learn', 'trade', 'rozgar', 'siksha', 'padhai', 'sector'
     ],
     NSP: [
          'scholarship', 'nsp', 'student', 'education', 'college', 'university',
          'school', 'study', 'scholarship portal', 'national scholarship', 'padhai',
          'fee', 'stipend', 'sc', 'st', 'obc', 'minority', 'competitive marks'
     ]
};

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Normalize text for comparison: lowercase, trim, remove punctuation
 */
function normalize(text) {
     return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Score a query against a scheme using keyword overlap
 * @param {string} query - Normalized user query
 * @param {string} schemeId - Scheme ID key
 * @param {object} scheme - Scheme object
 * @returns {number} Score 0–1
 */
function scoreScheme(query, schemeId, scheme) {
     const keywords = SCHEME_KEYWORDS[schemeId] || [];
     let score = 0;
     let totalWeight = 0;

     // Direct keyword matches (primary signal)
     for (const kw of keywords) {
          totalWeight += 1;
          if (query.includes(normalize(kw))) {
               score += 1;
          }
     }

     // Bonus: scheme name contains query words
     const schemeName = normalize(scheme.scheme_name);
     const queryWords = query.split(' ').filter(w => w.length > 2);
     for (const word of queryWords) {
          if (schemeName.includes(word)) {
               score += 0.5;
               totalWeight += 0.5;
          }
     }

     // Bonus: category match
     const category = normalize(scheme.category || '');
     for (const word of queryWords) {
          if (category.includes(word)) {
               score += 0.3;
               totalWeight += 0.3;
          }
     }

     return totalWeight > 0 ? score / totalWeight : 0;
}

/**
 * Search schemes by user query and return ranked results
 * @param {string} query - User's question (any language)
 * @returns {Array<{scheme, confidence}>} Ranked scheme matches
 */
export function searchSchemes(query) {
     const normalizedQuery = normalize(query);

     const scored = schemes.map(scheme => ({
          scheme,
          confidence: scoreScheme(normalizedQuery, scheme.scheme_id, scheme)
     }));

     // Sort descending by confidence
     scored.sort((a, b) => b.confidence - a.confidence);

     return scored;
}

/**
 * Detect user intent from query
 * @param {string} query - User's question
 * @returns {'OVERVIEW' | 'ELIGIBILITY' | 'DOCUMENTS' | 'STEPS'} Intent
 */
export function detectIntent(query) {
     const normalizedQuery = normalize(query);
     const scores = {};

     for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
          scores[intent] = keywords.filter(kw => normalizedQuery.includes(normalize(kw))).length;
     }

     // Find highest scoring intent
     const topIntent = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
     return topIntent[1] > 0 ? topIntent[0] : 'OVERVIEW';
}

/**
 * Generate a structured explanation from a scheme + intent
 * @param {object} scheme - Scheme object from Schemes.json
 * @param {string} intent - Intent type
 * @returns {object} Explanation data object
 */
export function generateExplanation(scheme, intent) {
     const eligibilityPoints = scheme.eligibility_criteria
          ? scheme.eligibility_criteria.map(c => c.condition)
          : [];

     const benefitPoints = scheme.benefits?.details || [scheme.benefits?.short || ''];

     const steps = scheme.application_process?.steps || [];

     const documents = scheme.required_documents
          ? scheme.required_documents.map(d => ({ name: d.document_name, mandatory: d.mandatory }))
          : [];

     // Lead with the most relevant info based on intent
     let summary = '';
     let leadPoints = [];

     switch (intent) {
          case 'ELIGIBILITY':
               summary = `Eligibility criteria for ${scheme.scheme_name}`;
               leadPoints = eligibilityPoints.length > 0 ? eligibilityPoints : benefitPoints;
               break;
          case 'DOCUMENTS':
               summary = `Documents needed for ${scheme.scheme_name}`;
               leadPoints = documents.map(d => `${d.mandatory ? '(Required) ' : '(Optional) '}${d.name}`);
               break;
          case 'STEPS':
               summary = `How to apply for ${scheme.scheme_name}`;
               leadPoints = steps;
               break;
          default: // OVERVIEW
               summary = scheme.who_is_it_for?.short || scheme.scheme_name;
               leadPoints = benefitPoints;
     }

     const confusions = scheme.common_confusions || [];
     const limitations = scheme.limitations_and_notes || [];
     const source = scheme.source_information?.official_website || '';

     return {
          schemeId: scheme.scheme_id,
          schemeName: scheme.scheme_name,
          category: scheme.category,
          intent,
          summary,
          leadPoints,
          eligibilityPoints,
          benefitPoints,
          steps,
          documents,
          confusions,
          limitations: limitations.slice(0, 2),
          officialSource: source,
          applicationMode: scheme.application_process?.mode || '',
          disclaimer: 'This information is for guidance only. For official decisions, visit the government portal.'
     };
}

/**
 * Full query pipeline: search + intent + explanation
 * @param {string} query - User's question
 * @returns {{ result: object|null, confidence: number, topMatches: Array }}
 */
export function processQuery(query) {
     if (!query || query.trim().length < 2) {
          return { result: null, confidence: 0, topMatches: [] };
     }

     const ranked = searchSchemes(query);
     const topMatch = ranked[0];
     const confidence = topMatch?.confidence || 0;
     const topMatches = ranked.slice(0, 4);

     if (confidence < 0.05) {
          return { result: null, confidence, topMatches };
     }

     const intent = detectIntent(query);
     const result = generateExplanation(topMatch.scheme, intent);

     return { result, confidence, topMatches };
}
