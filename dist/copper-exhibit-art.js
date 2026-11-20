// The three displays use the same drawing space, so their proportions stay legible on small screens.
function stroke(ctx, points, color, width) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function face(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function oval(ctx, x, y, rx, ry, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function cylinder(ctx, x, y, radius, depth, height, top, side) {
  oval(ctx, x, y + height, radius, depth, side);
  ctx.fillStyle = side;
  ctx.fillRect(x - radius, y, radius * 2, height);
  oval(ctx, x, y, radius, depth, top);
}

function gradient(ctx, x1, y1, x2, y2, start, end) {
  const shade = ctx.createLinearGradient(x1, y1, x2, y2);
  shade.addColorStop(0, start);
  shade.addColorStop(1, end);
  return shade;
}

function circuit(ctx, t) {
  const corners = [[33,107],[181,44],[292,91],[144,157]];
  face(ctx, [corners[0],corners[3], [144,164],[33,114]], '#31584b');
  face(ctx, [corners[3],corners[2], [292,98],[144,164]], '#223d34');
  face(ctx, corners, gradient(ctx, 60, 80, 235, 137, '#74a58b', '#3a6657'));
  const legs = [
    [[157,68],[137,59],[92,79],[102,84],[70,98],[111,116],[140,103]],
    [[204,77],[245,95],[190,120],[171,112],[151,121],[136,115]],
  ];
  for (const path of legs) {
    stroke(ctx, path, '#355a47', 6);
    ctx.setLineDash(t < .68 ? [2 + 18 * t, 4 - 4 * t] : []);
    stroke(ctx, path, '#ffc18a', 3.4);
    ctx.setLineDash([]);
    oval(ctx, ...path.at(-1), 6, 3, '#f4b277');
  }
  face(ctx, [[149,63],[163,57],[211,77],[196,84]], '#c77a44');
  face(ctx, [[149,63],[196,84],[196,69],[149,48]], '#d99356');
  face(ctx, [[196,84],[211,77],[211,62],[196,69]], '#96623e');
  face(ctx, [[149,48],[163,42],[211,62],[196,69]], '#efb87b');
  stroke(ctx, [[155,51],[166,47]], '#ffe8ac', 2);
  stroke(ctx, [[160,47],[160,53]], '#ffe8ac', 2);
  stroke(ctx, [[200,62],[205,60]], '#805131', 2);
  stroke(ctx, [[140,103],[143,86],[138,80]], '#d0d9ca', 2.5);
  stroke(ctx, [[136,115],[132,110],[132,86]], '#e4ede0', 2.5);
  const light = Math.max(0, (t - .55) / .45);
  if (light > 0) {
    const halo = ctx.createRadialGradient(136,74,1,136,74,43);
    halo.addColorStop(0, `rgba(250,255,159,${light * .7})`);
    halo.addColorStop(1, 'rgba(242,255,143,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(90,30,92,90);
  }
  cylinder(ctx, 136,80,11,4,7,'#e6c579','#a59265');
  oval(ctx, 136,76,9,12,light > .25 ? '#ffffa4' : '#acb491');
  oval(ctx, 133,72,2,4,light > .25 ? '#ffffed' : '#d7dfcc');
}

function printer(ctx, t) {
  const side = '#364b47';
  const bed = [[48,132],[176,87],[271,123],[146,168]];
  face(ctx, [bed[0],bed[3],[146,177],[48,140]], '#516761');
  face(ctx, [bed[3],bed[2],[271,132],[146,177]], '#354944');
  face(ctx, bed, '#7c8d7a');
  face(ctx, [[60,132],[176,92],[259,123],[146,162]], '#ab8465');
  // Individual grains make the loose powder bed distinct from the printed shape.
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 19; col++) {
      const x = 67 + col * 5.8 + row * 10;
      const y = 131 - col * 2 + row * 3.7;
      oval(ctx, x, y, 1.2, .7, (col + row) % 3 ? '#c6a383' : '#88644e');
    }
  }
  face(ctx, [[63,129],[74,124],[74,42],[63,47]], '#829b91');
  face(ctx, [[63,129],[57,126],[57,44],[63,47]], side);
  face(ctx, [[218,108],[226,105],[226,23],[218,27]], '#678277');
  face(ctx, [[218,108],[211,105],[211,24],[218,27]], side);
  face(ctx, [[54,45],[217,13],[230,18],[65,52]], '#91aa9d');
  face(ctx, [[65,52],[230,18],[230,27],[65,61]], '#4e6860');
  face(ctx, [[54,45],[65,52],[65,61],[54,54]], side);
  const x = 155, y = 130;
  cylinder(ctx, x, y, 26, 10, 3,'#dd9c6c','#925c40');
  const count = Math.floor(t * 88);
  const pieces = [];
  for (let i = 0; i < count; i++) {
    for (const offset of [0, Math.PI]) {
      const angle = offset + i / 88 * Math.PI * 3.1;
      const pointAt = (n, a) => [x + Math.cos(a) * 19, y - n * .80 + Math.sin(a) * 5];
      pieces.push({
        depth: i * .28 + Math.sin(angle) * 4,
        line: [pointAt(i,angle), pointAt(i + 1,angle + Math.PI * 3.1 / 88)],
        color: Math.sin(angle) > 0 ? '#f3ae72' : '#a76441',
      });
    }
  }
  for (const piece of pieces.sort((a,b) => a.depth - b.depth)) stroke(ctx, piece.line, piece.color, 6);
  const angle = count / 88 * Math.PI * 3.1;
  const spot = [x + Math.cos(angle) * 19, y - count * .8 + Math.sin(angle) * 5];
  const headX = 154;
  face(ctx, [[headX-10,27],[headX+2,24],[headX+13,30],[headX,34]], '#d5d8be');
  face(ctx, [[headX-10,27],[headX,34],[headX,44],[headX-10,39]], '#9fae99');
  face(ctx, [[headX,34],[headX+13,30],[headX+13,39],[headX,44]], '#70877c');
  if (t > 0 && t < 1) {
    stroke(ctx, [[headX,43],spot], '#e5facc', 1.5);
    oval(ctx, ...spot, 3.5, 2.6, '#fff7af');
  }
}

function wearGrooves(ctx, x, y, lighter, radius, flatness) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, flatness);
  for (let j = 0; j < (lighter ? 3 : 9); j++) {
    const angle = j * 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius * (.42 + j * .05), angle, angle + (lighter ? 1.3 : 2.9));
    ctx.strokeStyle = lighter ? '#4b676b' : '#4c312d';
    ctx.lineWidth = lighter ? 1.9 : 3.2;
    ctx.stroke();
  }
  ctx.restore();
}

function wearCloseUp(ctx) {
  for (const [i, x] of [85, 235].entries()) {
    const y = 83;
    oval(ctx, x, y, 60, 59, i ? '#367b7c' : '#a65d47');
    oval(ctx, x, y, 56, 55, '#304749');
    oval(ctx, x, y, 52, 51, gradient(ctx, x - 40, y - 35, x + 40, y + 35, '#dbe6df', '#809997'));
    wearGrooves(ctx, x, y, i, 52, 1);
    ctx.textAlign = 'center';
    ctx.fillStyle = i ? '#a2e6d9' : '#ffc3a9';
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillText(i ? 'Fewer scratches' : 'More scratches', x, 162);
  }
}

function discs(ctx, t, view, labels) {
  if (view === 'wear') { wearCloseUp(ctx); return; }
  const press = Math.max(0, Math.min(1, (t - .22) / .13, (.93 - t) / .15));
  const spin = Math.max(0, Math.min(1, (t - .25) / .53));
  for (const [i,x] of [92,226].entries()) {
    const y = 115;
    const ink = i ? '#a3d8be' : '#e8b177';
    const steel = gradient(ctx, x-47,0,x+47,0,'#405c5a','#889c90');
    cylinder(ctx, x, y, 52, 21, 11, '#b7c6ba', steel);
    oval(ctx, x, y, 47, 18, ink);
    oval(ctx, x, y, 41, 15, '#a4b7af');
    if (t >= .82) wearGrooves(ctx, x, y, i, 41, .39);
    if (t > 0 && t < .22) {
      const fall = t / .22;
      const dropY = 68 + fall * 42;
      oval(ctx, x - 38, dropY, 3.4, 5, ink);
      oval(ctx, x + 36, dropY - 8, 3.4, 5, ink);
    }
    const topY = y - 42 + 38 * press;
    cylinder(ctx, x, topY - 7, 36, 13, 7, '#c4d0c7', steel);
    cylinder(ctx, x, topY - 26, 11, 4, 20, '#d5dcd0', '#6e8981');
    cylinder(ctx, x, topY - 33, 14, 5, 7, '#c5d2be', '#789385');
    oval(ctx, x + Math.cos(spin * 4 * Math.PI) * 26, topY - 7 + Math.sin(spin * 4 * Math.PI) * 8, 3.5, 2, '#5b7369');
    if ((t >= .22 && t < .35) || (t >= .78 && t < .93)) {
      const arrowX = x + 46;
      const down = t < .35;
      const arrowY = topY - 12;
      stroke(ctx, [[arrowX, arrowY - 12], [arrowX, arrowY + 12]], '#ffe2a7', 2.8);
      const tip = arrowY + (down ? 12 : -12);
      const tail = tip + (down ? -6 : 6);
      stroke(ctx, [[arrowX - 5, tail], [arrowX, tip], [arrowX + 5, tail]], '#ffe2a7', 2.8);
    }
    if (labels) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#d5e3d6';
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.fillText(i ? 'Oil + copper' : 'Plain oil', x, 165);
    }
  }
}

const drawScene = { circuit, printer, discs };

export function drawCopperDisplay(canvas, id, fraction, view = 'test', labels = true) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.clientWidth) return;
  const density = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(canvas.clientWidth * density);
  const height = Math.round(canvas.clientHeight * density);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,width,height);
  const scale = Math.min(width / 320, height / 190);
  ctx.setTransform(scale,0,0,scale,(width - 320 * scale) / 2,(height - 190 * scale) / 2);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawScene[id](ctx, fraction, view, labels);
}
