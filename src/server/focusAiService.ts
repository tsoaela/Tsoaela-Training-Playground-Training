import { GoogleGenAI, Type } from '@google/genai';

export interface FocusAiCourseTelemetryInput {
  guideId: string;
  title: string;
  category: string;
  difficulty: string;
  readingTime: string;
  totalChapters: number;
  completedChaptersCount: number;
  remainingChapters: { index: number; title: string }[];
  progressPercent: number;
  lastReadDate?: string;
  quizTitle?: string;
  minScoreToPass: number;
  latestQuizScore?: number;
  quizAttemptsCount: number;
}

export interface FocusAiAnalyzeRequestPayload {
  userName: string;
  specialization?: string;
  syncedFocusMinutes: number;
  averageQuizScore: number;
  courses: FocusAiCourseTelemetryInput[];
}

const FOCUS_AI_MODEL = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    const err = new Error(
      'GEMINI_API_KEY is not configured on the server. Add or select an API key in Settings > Secrets to enable Focus AI.'
    ) as Error & { statusCode?: number; code?: string };
    err.statusCode = 400;
    err.code = 'API_KEY_MISSING';
    throw err;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function analyzeStudyProgressWithGemini(
  payload: FocusAiAnalyzeRequestPayload
) {
  const ai = getGeminiClient();

  const validCourseIds = new Set(payload.courses.map((c) => c.guideId));
  const compactCourses = payload.courses.slice(0, 12).map((c) => ({
    guideId: c.guideId,
    title: c.title,
    category: c.category,
    difficulty: c.difficulty,
    progressPercent: c.progressPercent,
    completedChaptersCount: c.completedChaptersCount,
    totalChapters: c.totalChapters,
    nextUnreadChapters: c.remainingChapters.slice(0, 3),
    lastReadDate: c.lastReadDate || 'Not started',
    quizTitle: c.quizTitle || 'Module Assessment',
    minScoreToPass: c.minScoreToPass,
    latestQuizScore: c.latestQuizScore ?? null,
    quizAttemptsCount: c.quizAttemptsCount,
  }));

  const promptContent = JSON.stringify(
    {
      learner: {
        name: payload.userName,
        specialization: payload.specialization || 'Interdisciplinary Systems',
        syncedFocusMinutes: payload.syncedFocusMinutes,
        averageQuizScore: payload.averageQuizScore,
      },
      courseTelemetry: compactCourses,
    },
    null,
    2
  );

  const response = await ai.models.generateContent({
    model: FOCUS_AI_MODEL,
    contents: `Analyze this student's current study telemetry and performance trends, then produce 3 to 5 concrete, high-priority study recommendations targeting specific unread chapters or pending/below-threshold quizzes.\n\nTelemetry:\n${promptContent}`,
    config: {
      systemInstruction:
        'You are an academic performance analyst inside an institutional learning dashboard. Base every recommendation strictly on the provided courseTelemetry JSON. Use exact guideId and courseTitle values from courseTelemetry. Prioritize courses that have partial chapter progress, upcoming unread chapters, failed/below-threshold quizzes, or pending quizzes on in-progress modules. Keep rationales concise, concrete, and grounded in the student data.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          coachHeadline: {
            type: Type.STRING,
            description: 'Short 6-10 word executive summary of current study momentum.',
          },
          performanceTrendSummary: {
            type: Type.STRING,
            description:
              '2-sentence objective synthesis of chapter velocity, quiz scores, and focus trends.',
          },
          studyCadenceTip: {
            type: Type.STRING,
            description:
              '1 actionable scheduling or deep-focus recommendation grounded in syncedFocusMinutes and unread workload.',
          },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                guideId: {
                  type: Type.STRING,
                  description: 'Exact guideId from the provided courseTelemetry array.',
                },
                courseTitle: {
                  type: Type.STRING,
                  description: 'Exact course title matching guideId.',
                },
                recommendationType: {
                  type: Type.STRING,
                  enum: ['chapter', 'quiz', 'review'],
                  description: 'Whether the action targets a specific chapter, a quiz, or a review.',
                },
                priority: {
                  type: Type.STRING,
                  enum: ['High', 'Medium', 'Foundational'],
                  description: 'Priority classification for the recommendation.',
                },
                targetLabel: {
                  type: Type.STRING,
                  description:
                    'Exact chapter title (e.g. "02. Process Reward Models") or quiz title to focus on next.',
                },
                rationale: {
                  type: Type.STRING,
                  description:
                    'Why this chapter or quiz is prioritized based on progressPercent or quiz score trends.',
                },
                estimatedMinutes: {
                  type: Type.INTEGER,
                  description: 'Realistic focused session duration in minutes (10 to 60).',
                },
                expectedImpact: {
                  type: Type.STRING,
                  description:
                    'Concrete outcome (e.g. "Unlocks MCTS & Compute Quiz" or "Closes 12% gap to pass threshold").',
                },
              },
              required: [
                'guideId',
                'courseTitle',
                'recommendationType',
                'priority',
                'targetLabel',
                'rationale',
                'estimatedMinutes',
                'expectedImpact',
              ],
            },
          },
        },
        required: [
          'coachHeadline',
          'performanceTrendSummary',
          'studyCadenceTip',
          'recommendations',
        ],
      },
    },
  });

  const rawText = (response.text ?? '{}').trim();
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Gemini returned malformed JSON output for Focus AI analysis.');
  }

  const normalizedRecommendations = Array.isArray(parsed.recommendations)
    ? parsed.recommendations
        .filter((item: any) => item && typeof item.guideId === 'string' && validCourseIds.has(item.guideId))
        .slice(0, 5)
        .map((item: any) => {
          const matchedCourse = payload.courses.find((c) => c.guideId === item.guideId);
          return {
            guideId: item.guideId,
            courseTitle: matchedCourse?.title || String(item.courseTitle || 'Study Guide'),
            recommendationType:
              item.recommendationType === 'quiz' || item.recommendationType === 'review'
                ? item.recommendationType
                : 'chapter',
            priority:
              item.priority === 'High' || item.priority === 'Foundational'
                ? item.priority
                : 'Medium',
            targetLabel: String(item.targetLabel || 'Next Recommended Module'),
            rationale: String(item.rationale || 'Prioritized from active study trajectory.'),
            estimatedMinutes: Math.max(10, Math.min(90, Number(item.estimatedMinutes) || 25)),
            expectedImpact: String(item.expectedImpact || 'Advances milestone readiness'),
          };
        })
    : [];

  return {
    generatedAt: new Date().toISOString(),
    modelUsed: FOCUS_AI_MODEL,
    coachHeadline: String(
      parsed.coachHeadline || 'Focus AI Priority Plan Ready'
    ),
    performanceTrendSummary: String(
      parsed.performanceTrendSummary ||
        'Analysis synthesized from completed chapters and recent quiz scores.'
    ),
    studyCadenceTip: String(
      parsed.studyCadenceTip ||
        'Schedule one uninterrupted 25-minute block on your highest-priority incomplete module.'
    ),
    recommendations: normalizedRecommendations,
  };
}

export interface TutorExplainRequestPayload {
  highlightedText: string;
  question?: string;
  mode?: 'explain' | 'breakdown' | 'custom';
  courseTitle?: string;
  chapterTitle?: string;
  pageLabel?: string;
}

export async function explainStudyPassageWithGemini(
  payload: TutorExplainRequestPayload
) {
  const ai = getGeminiClient();

  const mode =
    payload.mode === 'breakdown' || payload.mode === 'custom'
      ? payload.mode
      : 'explain';

  const contextBlock = [
    payload.courseTitle ? `Course / Study Guide: ${payload.courseTitle}` : null,
    payload.chapterTitle ? `Chapter / Section: ${payload.chapterTitle}` : null,
    payload.pageLabel ? `Study Surface: ${payload.pageLabel}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const taskInstruction =
    mode === 'breakdown'
      ? 'Provide a structured, summarized concept breakdown of the highlighted passage with intuitive definitions and 3 core concepts.'
      : mode === 'custom' && payload.question
      ? `Answer the student's question directly in the context of the highlighted passage and active study guide: "${payload.question}"`
      : 'Provide an immediate, context-aware explanation clarifying why this highlighted passage matters, translating technical jargon into clear intuition.';

  const promptContent = `${contextBlock ? `Study Context:\n${contextBlock}\n\n` : ''}Highlighted Text:\n"""\n${payload.highlightedText.slice(0, 2800)}\n"""\n\nStudent Request:\n${payload.question?.trim() || taskInstruction}`;

  const response = await ai.models.generateContent({
    model: FOCUS_AI_MODEL,
    contents: promptContent,
    config: {
      systemInstruction:
        'You are the TAI Tutor assisting students across study guides and research papers on the TTG - Tsoaela Training Ground Platform. Be clear, rigorous, and concise. Ground your answer directly in the highlighted excerpt and course context provided.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: 'One concise 1-2 sentence executive takeaway of the passage or answer.',
          },
          explanation: {
            type: Type.STRING,
            description:
              'Clear, context-aware explanation or concept breakdown tailored to the student highlight.',
          },
          keyConcepts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 concise concept bullets extracted from the passage.',
          },
          studyCheckQuestion: {
            type: Type.STRING,
            description:
              '1 short self-check reflection question helping the student verify comprehension.',
          },
        },
        required: ['summary', 'explanation', 'keyConcepts', 'studyCheckQuestion'],
      },
    },
  });

  const rawText = (response.text ?? '{}').trim();
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Gemini returned malformed JSON output for AI Tutor response.');
  }

  return {
    mode,
    summary: String(parsed.summary || 'Key Concept Summary'),
    explanation: String(parsed.explanation || ''),
    keyConcepts: Array.isArray(parsed.keyConcepts)
      ? parsed.keyConcepts.slice(0, 4).map((c: unknown) => String(c))
      : [],
    studyCheckQuestion: String(
      parsed.studyCheckQuestion || 'How does this mechanism apply in the next chapter?'
    ),
    modelUsed: FOCUS_AI_MODEL,
    generatedAt: new Date().toISOString(),
  };
}

