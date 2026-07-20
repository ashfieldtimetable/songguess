// Calculates Levenshtein distance between two strings
function getLevenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Normalizes a string: removes text in brackets, removes punctuation, converts to lowercase
function normalizeString(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\[.*?\]|\(.*?\)/g, "") // Remove anything inside () or []
    .replace(/[^\w\s]|_/g, "") // Remove punctuation (keep letters, numbers, spaces)
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
}

// Checks if the user guess is similar enough (>= 75%) to the correct answer
export function checkGuess(userGuess, correctAnswer) {
  const normalizedGuess = normalizeString(userGuess);
  const normalizedAnswer = normalizeString(correctAnswer);

  if (normalizedGuess === normalizedAnswer) return true;

  const distance = getLevenshteinDistance(normalizedGuess, normalizedAnswer);
  const maxLength = Math.max(normalizedGuess.length, normalizedAnswer.length);

  if (maxLength === 0) return true;

  const similarityPercentage = ((maxLength - distance) / maxLength) * 100;
  
  return similarityPercentage >= 75;
}
