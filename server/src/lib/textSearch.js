/**
 * textSearch — Dependency-free TF-IDF + cosine similarity search.
 *
 * Tokenizes text (lowercase, strips punctuation, removes stopwords),
 * supports Arabic (Unicode range \u0600-\u06FF) and Latin text,
 * weights question fields higher than answer fields, and returns
 * the top K entries ranked by cosine similarity score (0 to 1).
 *
 * Usage:
 *   const { search } = require("./textSearch");
 *   const results = search("What is Tawaf?", entries, 3);
 *   // results → [{ entry, score }, ...]
 */

// ── Stopwords (English + Common Arabic) ──

const STOPWORDS = new Set([
  // English
  "the","a","an","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","shall","should","may","might","must","can",
  "could","i","me","my","you","your","he","him","his","she","her","it","its",
  "we","us","our","they","them","their","what","which","who","whom","this",
  "that","these","those","am","at","by","for","with","about","against","between",
  "into","through","during","before","after","above","below","from","up","down",
  "in","out","on","off","over","under","again","further","then","once","here",
  "there","when","where","why","how","all","each","every","both","few","more",
  "most","other","some","such","no","nor","not","only","own","same","so","than",
  "too","very","just","because","as","until","while","of","to","and","but","or",
  "if","also","please","tell","like","get","know","need","want","would","should",
  "could","does","doing","done","make","made","take","took","use","used","using",
  "say","said","see","saw","go","went","gone","come","came","give","gave","given",
  "find","found","think","thought","ask","asked","calling","called",
  // Arabic
  "في","من","على","إلى","عن","مع","كان","هذا","هذه","ذلك","تلك","هو","هي",
  "هم","هن","أن","إن","ما","لم","لن","لا","هل","أو","ثم","قد","كل","كانت",
  "كانوا","يكون","تكون","يكونوا","لقد","حتى","بعد","قبل","بين","خلال",
  "تحت","فوق","دون","خارج","داخل","أمام","وراء","حول","إذ","إذا","لو",
  "لما","ولكن","لكن","أي","أيها","أيتها","الذي","التي","الذين","اللواتي",
  "اللائي","مما","ممن","فيه","فيها","منها","منه","عليه","عليها","إليه",
  "إليها","بينما","حيث","أين","كيف","متى","كم","لماذا",
]);

// ── Tokenizer ──

/**
 * Tokenize a string: lowercase, split on non-alphanumeric (preserving
 * Arabic Unicode), remove stopwords and single-character tokens.
 *
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  if (!text) return [];

  // Normalize: lowercase for Latin, preserve Arabic
  const normalized = text
    .toLowerCase()
    // Remove diacritics (tashkeel) from Arabic text
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // Normalize Arabic alef variants to bare alef
    .replace(/[إأآٱ]/g, "ا")
    // Normalize teh marbuta to heh
    .replace(/ة/g, "ه")
    // Normalize waw with hamza
    .replace(/ؤ/g, "و")
    // Normalize yeh with hamza
    .replace(/ئ/g, "ي");

  // Split on non-word characters (handles both Latin and Arabic)
  const raw = normalized.split(/[^a-zA-Z0-9\u0600-\u06FF]+/).filter(Boolean);

  // Filter stopwords and single chars
  return raw.filter((word) => word.length > 1 && !STOPWORDS.has(word));
}

/**
 * Compute term frequency for a token list.
 * Returns a Map<term, count>.
 */
function termFrequency(tokens) {
  const tf = new Map();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  // Normalize by document length
  const len = tokens.length || 1;
  for (const [key, val] of tf) {
    tf.set(key, val / len);
  }
  return tf;
}

/**
 * Compute inverse document frequency for a set of document token vectors.
 * Uses additive (Laplace) smoothing so that even with a single document
 * IDF values remain positive (avoiding log(1) = 0 and zero-vector scores).
 *
 * idf(t) = log(1 + N / (1 + df(t)))   where N = total docs, df(t) = docs containing t.
 */
function inverseDocumentFrequency(documentVectors) {
  const N = documentVectors.length;
  const df = new Map(); // doc frequency per term

  for (const vec of documentVectors) {
    // vec.tf is a Map<term, value>
    const seen = new Set();
    for (const term of vec.tf.keys()) {
      if (!seen.has(term)) {
        seen.add(term);
        df.set(term, (df.get(term) || 0) + 1);
      }
    }
  }

  const idf = new Map();
  for (const [term, docCount] of df) {
    // Additive smoothing: ensures idf > 0 even with 1 document
    idf.set(term, Math.log(1 + N / (1 + docCount)));
  }
  return idf;
}

/**
 * Compute the L2 (Euclidean) norm of a TF-IDF vector.
 */
function l2Norm(vector) {
  let sum = 0;
  for (const val of vector.values()) {
    sum += val * val;
  }
  return Math.sqrt(sum);
}

/**
 * Compute cosine similarity between two TF-IDF vectors.
 * Returns 0 if either vector has no magnitude.
 */
function cosineSimilarity(vecA, vecB) {
  const normA = l2Norm(vecA);
  const normB = l2Norm(vecB);

  if (normA === 0 || normB === 0) return 0;

  let dotProduct = 0;
  // Iterate over the smaller vector's keys
  const [small, large] = vecA.size <= vecB.size ? [vecA, vecB] : [vecB, vecA];

  for (const [term, valA] of small) {
    const valB = large.get(term);
    if (valB !== undefined) {
      dotProduct += valA * valB;
    }
  }

  return dotProduct / (normA * normB);
}

/**
 * Build a TF-IDF vector for a single document given the global IDF map.
 * tf-idf(t, d) = tf(t, d) * idf(t)
 *
 * @param {Map<string, number>} tf - Term frequency map for this document
 * @param {Map<string, number>} idf - Inverse document frequency map (global)
 * @returns {Map<string, number>} TF-IDF vector
 */
function computeTfIdf(tf, idf) {
  const vector = new Map();
  for (const [term, tfVal] of tf) {
    const idfVal = idf.get(term) || 0;
    if (idfVal > 0) {
      vector.set(term, tfVal * idfVal);
    }
  }
  return vector;
}

// ── Public API ──

/**
 * Search a set of entries for the most relevant matches to a query.
 *
 * Fields are weighted: question text gets 3× the weight of answer text,
 * topic and tags contribute at 2×.
 *
 * @param {string} query    - The search query string
 * @param {Array}  entries  - Array of objects with { topic?, question, answer?, tags? }
 * @param {number} [topK=5] - Maximum number of results to return
 * @returns {Array<{ entry: Object, score: number }>} Ranked results, highest score first
 */
function search(query, entries, topK = 5) {
  if (!query || !entries || entries.length === 0) return [];

  const queryTokens = tokenize(query);

  // Build document vectors (each entry becomes a weighted TF vector)
  const documentVectors = entries.map((entry) => {
    const questionTokens = tokenize(entry.question || "");
    const answerTokens = tokenize(entry.answer || "");
    const topicTokens = tokenize(entry.topic || "");
    const tagTokens = (entry.tags || [])
      .flatMap((tag) => tokenize(tag));

    // Weighted concatenation: question 3x, answer 1x, topic 2x, tags 2x
    const weighted = [
      ...questionTokens,
      ...questionTokens,
      ...questionTokens,
      ...answerTokens,
      ...topicTokens,
      ...topicTokens,
      ...tagTokens,
      ...tagTokens,
    ];

    const tf = termFrequency(weighted);
    return { entry, tf };
  });

  // Compute global IDF across all document vectors
  const idf = inverseDocumentFrequency(documentVectors);

  // Also add the query into the IDF mix so query-specific rare terms
  // aren't penalized (query IDF is computed separately)
  const queryTf = termFrequency(queryTokens);
  const queryVector = computeTfIdf(queryTf, idf);

  // Compute TF-IDF vectors for all documents
  const docVectors = documentVectors.map(({ entry, tf }) => ({
    entry,
    vector: computeTfIdf(tf, idf),
  }));

  // Score each document against the query
  const scored = docVectors.map(({ entry, vector }) => ({
    entry,
    score: cosineSimilarity(queryVector, vector),
  }));

  // Sort descending by score, take top K
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => ({
      entry: s.entry,
      score: Math.round(s.score * 10000) / 10000, // 4 decimal places
    }));
}

module.exports = { search, tokenize, cosineSimilarity };
