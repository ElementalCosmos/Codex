const canvas = document.querySelector('.perspective-spiral canvas');
const context = canvas.getContext('2d');
const size = canvas.width;
const goldenRatio = (1 + Math.sqrt(5)) / 2;

const firstTurn = -1 / 12;
const allTurn = 2;
const lastTurn = allTurn + 1 / 30;
const stepsPerTurn = 120;

function pointAt(progress) {
  const angle = Math.PI - 2 * Math.PI * progress;
  const radius = .4 * goldenRatio ** (2 * (progress - allTurn));
  return [
    size * (.5 + radius * Math.cos(angle)),
    size * (.55 + radius * Math.sin(angle)),
  ];
}

if (context) {
  context.strokeStyle = '#e0ca96';
  context.lineWidth = 2.5;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(...pointAt(firstTurn));
  for (let step = firstTurn * stepsPerTurn + 1; step <= lastTurn * stepsPerTurn; step += 1) {
    context.lineTo(...pointAt(step / stepsPerTurn));
  }
  context.stroke();

}
