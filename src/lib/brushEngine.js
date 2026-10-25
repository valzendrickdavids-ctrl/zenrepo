export const WIDTH=600, HEIGHT=400, CELL=2, COLS=300, TOTAL_CELLS=60000;
export const STROKE_LIMIT=4200, RECOVERY_MS=2000;
export const emptyBrush=()=>({used:0,seen:[],stroke:[],active:false,recoveryUntil:0});
// Exact 2x2 cells bound coverage before erasing; there are no antialiased edges.
export class BrushEngine {
 constructor(limit,saved=emptyBrush(),now=Date.now()){
  this.limit=limit;this.used=saved.used;this.seen=new Set(saved.seen);this.stroke=new Set(saved.stroke);
  this.active=false;this.pointer=null;this.last=null;this.recoveryUntil=saved.active?now+RECOVERY_MS:saved.recoveryUntil;
  if(this.recoveryUntil<=now)this.stroke.clear();
 }
 snapshot(){return {used:this.used,seen:[...this.seen],stroke:[...this.stroke],active:this.active,recoveryUntil:this.recoveryUntil};}
 start(pointer,now){if(this.active||now<this.recoveryUntil||this.used>=this.limit)return false;this.stroke.clear();this.active=true;this.pointer=pointer;this.last=null;this.used++;return true;}
 move(pointer,x,y,radius,now){
  if(!this.active||pointer!==this.pointer||now<this.recoveryUntil)return [];
  x=Math.max(0,Math.min(WIDTH,x));y=Math.max(0,Math.min(HEIGHT,y));
  const prev=this.last||[x,y],steps=Math.max(1,Math.ceil(Math.hypot(x-prev[0],y-prev[1])/2)),added=[];
  for(let i=1;i<=steps&&this.stroke.size<STROKE_LIMIT;i++){
   const px=prev[0]+(x-prev[0])*i/steps,py=prev[1]+(y-prev[1])*i/steps;
   for(let r=Math.max(0,Math.floor((py-radius)/CELL));r<Math.min(HEIGHT/CELL,Math.ceil((py+radius)/CELL))&&this.stroke.size<STROKE_LIMIT;r++)
    for(let c=Math.max(0,Math.floor((px-radius)/CELL));c<Math.min(COLS,Math.ceil((px+radius)/CELL))&&this.stroke.size<STROKE_LIMIT;c++){
     const cell=r*COLS+c;
     if(!this.stroke.has(cell)&&Math.hypot(c*CELL+1-px,r*CELL+1-py)<=radius){this.stroke.add(cell);this.seen.add(cell);added.push(cell);}
    }
  }
  this.last=[x,y];return added;
 }
 end(pointer,now){if(!this.active||pointer!==this.pointer)return false;this.active=false;this.pointer=null;this.last=null;this.recoveryUntil=now+RECOVERY_MS;return true;}
 get revealed(){return this.active?this.stroke.size/TOTAL_CELLS*100:0;}
 get scoringCoverage(){return this.seen.size/TOTAL_CELLS*100;}
}

