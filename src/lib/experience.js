export const TUTORIAL_VERSION = 1;
export const tutorialKey = id => `cc-tutorial-${TUTORIAL_VERSION}-${id}`;
export const completionAwards = {
  easy: { icon: '🌱', title: 'Discovery Cup', message: 'Every discovery starts with curiosity. You completed Beginner—thank you for playing!' },
  medium: { icon: '🔥', title: 'Challenger Trophy', message: 'You kept exploring when the challenge grew. Moderate is complete—well done!' },
  hard: { icon: '💎', title: 'Conqueror Crown', message: 'You took on our toughest discoveries. Expert is complete—thank you for conquering the challenge!' },
};
export function pausedRun(run, now = Date.now()) {
  return run ? {...run, remaining:run.deadline ? Math.max(0,Math.ceil((run.deadline-now)/1000)) : run.remaining, deadline:null, updatedAt:now} : null;
}
export function validateFeedback(category, message) {
  const clean=String(message||'').trim();
  if(!['Bug report','Suggestion','Other'].includes(category))throw Error('Choose a feedback type.');
  if(clean.length<10||clean.length>2000)throw Error('Please write between 10 and 2,000 characters.');
  return {category,message:clean};
}
