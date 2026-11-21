import { publicLesson, publicTurn, unknownPublicAnswer } from './public-guide.js';

export async function answerPublicGuide(input, findFact, explainFact) {
  const turn = input.explain ? publicTurn(input.question, input.context, input.previousTopic, input.previousFact) : null;
  const lesson = turn?.lesson ?? publicLesson(input.question, input.context);
  const answer = { mode: 'local', text: lesson.text, sources: lesson.sources, topic: lesson.topic };
  if (!lesson.known || lesson.restricted) return answer;

  try {
    const result = turn?.focus ? { text: turn.focus } : await findFact(input.question, lesson.context);
    if (result?.text?.trim() && lesson.context.includes(result.text)) {
      answer.mode = turn?.focus ? 'local' : 'neural';
      answer.text = result.text;
      if (turn) {
        answer.fact = turn.sentences.indexOf(result.text);
        const explanation = await explainFact(result.text, lesson);
        if (explanation && explanation.toLowerCase() !== result.text.toLowerCase()) {
          answer.mode = 'flan';
          answer.text = explanation;
        }
      }
    } else if (result?.reason === 'unknown') {
      answer.text = unknownPublicAnswer;
      answer.sources = [];
      answer.reason = 'no-evidence';
    } else if (result?.reason === 'busy' || result?.reason === 'unavailable') {
      answer.reason = result.reason === 'busy' ? 'rate-limit' : 'unavailable';
    }
  } catch {
    answer.reason = 'unavailable';
  }
  return answer;
}
