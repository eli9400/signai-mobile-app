export const buildSignatureHtml = (title: string, tip: string) => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <style>
    html, body { margin:0; padding:0; height:100%; background:#F3F6FF; }
    #wrap { height:100%; padding:12px; box-sizing:border-box; }
    .hint {
      color: rgba(15,23,42,0.85);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial;
      font-size: 14px;
      font-weight: 800;
      margin: 0 0 10px 0;
      text-align: center;
    }
    .panel {
      background: #FFFFFF;
      border: 2px dashed rgba(37,99,235,0.25);
      border-radius: 16px;
      padding: 10px;
      box-shadow: 0 10px 24px rgba(15,23,42,0.10);
    }
    canvas {
      width: 100%;
      height: 200px;
      background: #ffffff;
      touch-action: none;
      border-radius: 12px;
      display:block;
    }
    .subhint {
      color: rgba(15,23,42,0.55);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial;
      font-size: 12px;
      font-weight: 600;
      margin: 10px 0 0 2px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="wrap">
    <div class="hint">${title}</div>
    <div class="panel">
      <canvas id="c" width="1000" height="500"></canvas>
    </div>
    <div class="subhint">${tip}</div>
  </div>
  <script>
    const c = document.getElementById('c');
    const ctx = c.getContext('2d');
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'black';
    let drawing = false;
    let last = null;
    function pos(e){
      const r = c.getBoundingClientRect();
      const t = (e.touches && e.touches[0]) ? e.touches[0] : e;
      const x = (t.clientX - r.left) * (c.width / r.width);
      const y = (t.clientY - r.top) * (c.height / r.height);
      return {x,y};
    }
    function down(e){
      if (e && e.cancelable) e.preventDefault();
      drawing = true;
      last = pos(e);
    }
    function move(e){
      if(!drawing) return;
      if (e && e.cancelable) e.preventDefault();
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
    }
    function up(){
      drawing = false;
      last = null;
    }
    c.addEventListener('mousedown', down);
    c.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    c.addEventListener('touchstart', down, {passive:false});
    c.addEventListener('touchmove', move, {passive:false});
    window.addEventListener('touchend', up);
    function clear(){
      ctx.clearRect(0,0,c.width,c.height);
    }
    function exportPng(){
      const img = ctx.getImageData(0,0,c.width,c.height);
      const d = img.data;
      let minX=c.width, minY=c.height, maxX=0, maxY=0;
      let found=false;
      for(let y=0;y<c.height;y++){
        for(let x=0;x<c.width;x++){
          const a = d[(y*c.width + x)*4 + 3];
          if(a>0){
            found=true;
            if(x<minX) minX=x;
            if(y<minY) minY=y;
            if(x>maxX) maxX=x;
            if(y>maxY) maxY=y;
          }
        }
      }
      if(!found){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'empty'}));
        return;
      }
      const pad=20;
      minX=Math.max(0,minX-pad); minY=Math.max(0,minY-pad);
      maxX=Math.min(c.width-1,maxX+pad); maxY=Math.min(c.height-1,maxY+pad);
      const w = maxX-minX+1, h=maxY-minY+1;
      const out = document.createElement('canvas');
      out.width=w; out.height=h;
      const octx = out.getContext('2d');
      octx.putImageData(ctx.getImageData(minX,minY,w,h),0,0);
      const b64 = out.toDataURL('image/png').split(',')[1];
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'png', b64}));
    }
    window.__sig = { clear, exportPng };
  </script>
</body>
</html>`;
