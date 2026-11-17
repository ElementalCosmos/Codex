
(() => {
  const root = document.getElementById("elemental-radix");
  const canvas = root.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const select = root.querySelector("[data-face]");
  const flip = root.querySelector("button");
  const facesByAddress = [
    ["Fire", 1], ["Water", 2], ["Water", 1],
    ["Fire", 2], ["Fire", 3], ["Water", 3],
    ["Air", 2], ["Earth", 1], ["Earth", 3],
    ["Air", 3], ["Air", 1], ["Earth", 2]
  ];
  const glyphs = {Fire:"🜂", Air:"🜁", Earth:"🜃", Water:"🜄"};
  const faceColors = {Fire:"#771d12", Water:"#09457e", Air:"#808080", Earth:"#75602b"};
  const perspectives = ["I", "We", "All"];
  const address = i => {
    const [element, perspective] = facesByAddress[i];
    return element + " · " + perspectives[perspective - 1];
  };

  const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  const scale = (v, s) => v.map(value => value * s);
  const add = (a, b) => a.map((value, i) => value + b[i]);
  const cross = ([x,y,z], [a,b,c]) => [y*c-z*b, z*a-x*c, x*b-y*a];
  const unit = v => scale(v, 1 / Math.hypot(...v));

  // The face normals form an icosahedron. Each column in the user's rows
  // supplies one normal and its exact negative.
  const upper = [[0, 0, 1], ...Array.from({length:5}, (_, i) => {
    const angle = Math.PI * (0.30 - 0.40 * i);
    return [2 * Math.cos(angle) / Math.sqrt(5), 2 * Math.sin(angle) / Math.sqrt(5), 1 / Math.sqrt(5)];
  })];
  const normals = upper.concat(upper.map(n => scale(n, -1)));
  const corners = normals.map(() => []);
  const neighbor = (a, b) => dot(a, b) > .4;
  for (let i = 0; i < 12; i++) {
    for (let j = i + 1; j < 12; j++) {
      if (!neighbor(normals[i], normals[j])) continue;
      for (let k = j + 1; k < 12; k++) {
        if (!neighbor(normals[i], normals[k]) || !neighbor(normals[j], normals[k])) continue;
        const sum = add(add(normals[i], normals[j]), normals[k]);
        const vertex = scale(sum, 1 / dot(sum, normals[i]));
        for (const face of [i, j, k]) corners[face].push(vertex);
      }
    }
  }

  function faceBasis(normal) {
    const reference = Math.abs(normal[2]) > .99 ? [0,1,0] : [0,0,1];
    const right = unit(cross(reference, normal));
    return [right, cross(normal, right), normal];
  }
  const faces = normals.map((normal, i) => {
    const [right, up] = faceBasis(normal);
    const angle = v => Math.atan2(dot(v, up), dot(v, right));
    return {normal, vertices:corners[i].sort((a, b) => angle(a) - angle(b)), i};
  });

  let basis = faceBasis(normals[0]);
  let front = 0;
  let pointer = null;
  facesByAddress.forEach(([element], i) => select.add(new Option(glyphs[element] + " " + address(i))));
  select.selectedIndex = 0;

  function rotate(xAngle, yAngle) {
    const [right, up, forward] = basis;
    const newRight = add(scale(right, Math.cos(yAngle)), scale(forward, Math.sin(yAngle)));
    const newForward = add(scale(right, -Math.sin(yAngle)), scale(forward, Math.cos(yAngle)));
    basis = [
      newRight,
      add(scale(up, Math.cos(xAngle)), scale(newForward, -Math.sin(xAngle))),
      add(scale(up, Math.sin(xAngle)), scale(newForward, Math.cos(xAngle)))
    ];
  }

  function draw() {
    const {width, height} = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.round(width * dpr), pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const theme = getComputedStyle(root);
    const color = (name, fallback) => theme.getPropertyValue(name).trim() || fallback;
    const foreground = color("--foreground", theme.color);
    const border = color("--muted-foreground", foreground);
    const [right, up, forward] = basis;
    const size = Math.min(width, height) * .355;
    const project = v => [width/2 + size * dot(v, right), height/2 - size * dot(v, up)];
    const visible = faces.map(face => ({...face, depth:dot(face.normal, forward)}))
      .filter(face => face.depth > 0).sort((a, b) => a.depth - b.depth);
    front = visible.at(-1).i;
    select.selectedIndex = front;
    flip.textContent = "Flip to " + address((front + 6) % 12);
    for (const {vertices, depth, i} of visible) {
      const [element, perspective] = facesByAddress[i];
      ctx.beginPath();
      vertices.forEach((v, j) => {
        const [x, y] = project(v);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = faceColors[element];
      ctx.fill();
      ctx.fillStyle = "#171717";
      ctx.globalAlpha = .12 * (1 - depth);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = border;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (depth < .22) continue;
      const [x, y] = project(normals[i]);
      ctx.save();
      ctx.clip();
      ctx.fillStyle = element === "Air" ? "#171717" : "#fff";
      const glyphSize = size * .35 * Math.sqrt(depth);
      drawGlyph(element, perspective, x, y, glyphSize);
      ctx.restore();
    }
  }

  const dotPatterns = [
    [[0, 0]],
    [[0, -.13], [0, .13]],
    [[0, -.13], [-.125, .11], [.125, .11]]
  ];

  function drawGlyph(element, perspective, x, y, size) {
    const direction = element === "Fire" || element === "Air" ? 1 : -1;
    const half = size * .56;
    const tip = y - direction * size * .62;
    const base = y + direction * size * .37;
    const left = x - half, right = x + half;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = Math.max(1.6, size * .067);
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, tip);
    ctx.lineTo(right, base);
    ctx.lineTo(left, base);
    ctx.closePath();
    ctx.stroke();

    if (element === "Air" || element === "Earth") {
      ctx.beginPath();
      for (let i = 0; i < perspective; i++) {
        const lineY = y + (i - (perspective - 1) / 2) * size * .145;
        ctx.moveTo(x - half * .88, lineY);
        ctx.lineTo(x + half * .88, lineY);
      }
      ctx.stroke();
      return;
    }

    for (const [dx, dy] of dotPatterns[perspective - 1]) {
      ctx.beginPath();
      ctx.arc(x + dx * size, y + dy * size, Math.max(1.45, size * .053), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  select.addEventListener("change", () => {
    basis = faceBasis(normals[select.selectedIndex]);
    draw();
  });
  flip.addEventListener("click", () => {
    basis = faceBasis(normals[(front + 6) % 12]);
    draw();
  });
  canvas.addEventListener("pointerdown", event => {
    if (pointer || event.button !== 0) return;
    pointer = {id:event.pointerId, x:event.clientX, y:event.clientY, moved:false};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", event => {
    if (pointer?.id !== event.pointerId) return;
    rotate((event.clientY - pointer.y) * .012, (event.clientX - pointer.x) * .012);
    Object.assign(pointer, {x:event.clientX, y:event.clientY, moved:true});
    draw();
  });
  function endDrag(event) {
    if (pointer?.id !== event.pointerId) return;
    pointer = null;
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("lostpointercapture", endDrag);
  new ResizeObserver(draw).observe(canvas);
  rotate(.20, -.27);
  draw();
})();
