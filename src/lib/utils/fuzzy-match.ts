/**
 * Fuzzy matching para nombres de alumnos.
 * Compara el nombre detectado por Gemini contra la lista del grupo.
 */

interface StudentCandidate {
  id: string;
  name: string;
  first_surname: string;
  second_surname: string | null;
}

interface MatchResult {
  studentId: string;
  score: number; // 0-1, higher = better match
  matchedBy: "exact" | "fuzzy" | "partial";
}

/**
 * Normaliza un string para comparación: minúsculas, sin acentos, sin espacios extra.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s]/g, "")    // only alphanumeric + spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calcula similitud entre dos strings (Dice coefficient sobre bigramas).
 * Rápido y efectivo para nombres cortos.
 */
function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigramsA = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.slice(i, i + 2));

  let intersection = 0;
  for (let i = 0; i < b.length - 1; i++) {
    if (bigramsA.has(b.slice(i, i + 2))) intersection++;
  }

  return (2 * intersection) / (a.length - 1 + b.length - 1);
}

/**
 * Busca el mejor match de un nombre detectado contra una lista de alumnos.
 * Devuelve los candidatos ordenados por score (mejor primero).
 */
export function matchStudent(
  detected: { name: string | null; first_surname: string | null; second_surname: string | null },
  students: StudentCandidate[]
): MatchResult[] {
  if (!detected.name && !detected.first_surname) return [];

  const results: MatchResult[] = [];

  for (const student of students) {
    const scores: number[] = [];

    // Full name comparison (most reliable)
    const detectedFull = normalize(
      [detected.first_surname, detected.second_surname, detected.name].filter(Boolean).join(" ")
    );
    const studentFull = normalize(
      [student.first_surname, student.second_surname, student.name].filter(Boolean).join(" ")
    );

    if (detectedFull && studentFull) {
      if (detectedFull === studentFull) {
        results.push({ studentId: student.id, score: 1.0, matchedBy: "exact" });
        continue;
      }
      scores.push(diceCoefficient(detectedFull, studentFull) * 0.9);
    }

    // Surname comparison (high weight — surnames are more unique)
    if (detected.first_surname) {
      const detSurname = normalize(detected.first_surname);
      const stuSurname = normalize(student.first_surname);
      if (detSurname === stuSurname) {
        scores.push(0.7);
      } else {
        scores.push(diceCoefficient(detSurname, stuSurname) * 0.6);
      }
    }

    // Second surname
    if (detected.second_surname && student.second_surname) {
      const det2 = normalize(detected.second_surname);
      const stu2 = normalize(student.second_surname);
      if (det2 === stu2) {
        scores.push(0.6);
      } else {
        scores.push(diceCoefficient(det2, stu2) * 0.5);
      }
    }

    // First name comparison (lower weight — more common names)
    if (detected.name) {
      const detName = normalize(detected.name);
      const stuName = normalize(student.name);
      if (detName === stuName) {
        scores.push(0.5);
      } else {
        scores.push(diceCoefficient(detName, stuName) * 0.4);
      }
    }

    // Cross-check: detected name tokens appear anywhere in student full name
    const detectedTokens = detectedFull.split(" ").filter((t) => t.length > 2);
    const studentTokens = studentFull.split(" ");
    const tokenMatches = detectedTokens.filter((dt) =>
      studentTokens.some((st) => st === dt || diceCoefficient(dt, st) > 0.7)
    ).length;
    if (detectedTokens.length > 0) {
      scores.push((tokenMatches / detectedTokens.length) * 0.8);
    }

    const bestScore = Math.max(...scores, 0);
    if (bestScore > 0.2) {
      results.push({
        studentId: student.id,
        score: bestScore,
        matchedBy: bestScore >= 0.9 ? "exact" : bestScore >= 0.5 ? "fuzzy" : "partial",
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
