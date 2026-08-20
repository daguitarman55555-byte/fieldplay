export function extractContourPaths(values,cols,rows,level,width,height){
  const segments=[],cw=width/cols,ch=height/rows,at=(i,j)=>values[j*(cols+1)+i];
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const v=[at(i,j),at(i+1,j),at(i+1,j+1),at(i,j+1)];if(!v.every(Number.isFinite))continue;
    const mask=(v[0]>=level?1:0)|(v[1]>=level?2:0)|(v[2]>=level?4:0)|(v[3]>=level?8:0),pairs=caseEdges(mask,v,level);
    for(const [a,b] of pairs)segments.push([edgePoint(a,i,j,v,level,cw,ch),edgePoint(b,i,j,v,level,cw,ch)]);
  }
  return joinSegments(segments);
}

function caseEdges(mask,v,level){const fixed={1:[[3,0]],2:[[0,1]],3:[[3,1]],4:[[1,2]],6:[[0,2]],7:[[3,2]],8:[[2,3]],9:[[0,2]],11:[[1,2]],12:[[1,3]],13:[[0,1]],14:[[3,0]]};if(mask!==5&&mask!==10)return fixed[mask]||[];const center=(v[0]+v[1]+v[2]+v[3])*.25,high=center>=level;if(mask===5)return high?[[0,1],[2,3]]:[[3,0],[1,2]];return high?[[3,0],[1,2]]:[[0,1],[2,3]];}
function edgePoint(edge,i,j,v,level,cw,ch){const ends=[[0,1],[1,2],[3,2],[0,3]][edge],[a,b]=ends,t=clamp((level-v[a])/(v[b]-v[a]||1e-12)),corners=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]];return[(corners[a][0]+(corners[b][0]-corners[a][0])*t)*cw,(corners[a][1]+(corners[b][1]-corners[a][1])*t)*ch];}
function joinSegments(segments){const buckets=new Map(),unused=new Set(segments.map((_,i)=>i)),key=p=>`${Math.round(p[0]*1000)},${Math.round(p[1]*1000)}`;segments.forEach((s,i)=>s.forEach(p=>{const k=key(p),list=buckets.get(k)||[];list.push(i);buckets.set(k,list);}));const paths=[];while(unused.size){const first=unused.values().next().value;unused.delete(first);const path=[segments[first][0],segments[first][1]];let changed=true;while(changed){changed=false;for(const side of [1,0]){const p=side?path[path.length-1]:path[0],candidates=buckets.get(key(p))||[],next=candidates.find(i=>unused.has(i));if(next===undefined)continue;unused.delete(next);const s=segments[next],q=key(s[0])===key(p)?s[1]:s[0];side?path.push(q):path.unshift(q);changed=true;}}paths.push(path);}return paths;}
export function smoothContourPath(points,iterations=1){let out=points;if(points.length<4||iterations<=0)return points;const closed=distance(points[0],points[points.length-1])<1e-3;for(let n=0;n<iterations;n++){const next=[];if(!closed)next.push(out[0]);for(let i=0;i<out.length-1;i++){const a=out[i],b=out[i+1];next.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);}if(!closed)next.push(out[out.length-1]);else next.push(next[0]);out=next;}return out;}
const clamp=x=>Math.max(0,Math.min(1,x)),distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
