const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
class El{
 constructor(){this.value='';this.checked=true;this.children=[];this.dataset={};this.handlers={};this.tagName='BODY';this.classList={add(){},toggle(){}};}
 setAttribute(k,v){this[k]=String(v)} removeAttribute(k){delete this[k]} addEventListener(k,v){this.handlers[k]=v} append(x){this.children.push(x)} replaceChildren(){this.children=[]} click(){this.handlers.click?.({})}
}
const ids={},get=id=>ids[id]??=new El(),timeouts=new Map(),intervals=new Map();let seq=0;
get('volume').value='30';get('tone').value='warm';get('metro-volume').value='40';
const param=()=>({value:0,setTargetAtTime(v){this.value=v},setValueAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v},exponentialRampToValueAtTime(v){this.value=v},cancelScheduledValues(){}});
const oscs=[];
class AC{
 constructor(){this.currentTime=0;this.state='suspended'} async resume(){this.state='running'}
 createGain(){return{gain:param(),connect(){},disconnect(){}}}
 createOscillator(){const o={frequency:param(),connect(){},disconnect(){},start(t){this.startTime=t},stop(t){this.stopTime=t}};oscs.push(o);return o}
}
const doc={getElementById:get,createElement:()=>new El(),querySelectorAll:()=>[],body:new El(),activeElement:new El(),visibilityState:'visible',addEventListener(){}};
const box={document:doc,window:{AudioContext:AC,addEventListener(){}},navigator:{},setTimeout:(f,ms=0)=>{timeouts.set(++seq,{f,ms});return seq},clearTimeout:i=>timeouts.delete(i),setInterval:f=>{intervals.set(++seq,f);return seq},clearInterval:i=>intervals.delete(i)};
get('scale-start').value='3';get('scale-octaves').value='1';get('scale-hold').value='2';vm.createContext(box);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8'),box);
const run=s=>vm.runInContext(s,box);

vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../scale.js'),'utf8'),box);

const tick=()=>new Promise(setImmediate);
function flush(){const pending=[...timeouts];timeouts.clear();for(const [,v] of pending)v.f();}
(async()=>{
 for(let key=0;key<12;key++){
   for(let oct=2;oct<=4;oct++)for(let len=1;len<=2;len++){
     const notes=run('ScaleGuide.makeScale('+key+','+oct+','+len+')');
     assert.equal(notes.length,len*14+1);
     assert.equal(notes[0].midi,notes.at(-1).midi);
     assert.equal(notes[len*7].midi-notes[0].midi,len*12);
     assert.ok(notes.every(n=>!n.name.includes('undefined')));
   }
 }
 assert.equal(run('ScaleGuide.makeScale(6,3,1)[6].name'),'E♯4');
 assert.equal(run('ScaleGuide.makeScale(1,3,1)[3].name'),'G♭3');
 get('scale-play').click();await tick();await tick();
 assert.equal(run('playing&&metroPlaying&&ScaleGuide.active()'),true);
 assert.equal(get('tempo').disabled,true);
 // Replace background pump with controlled scheduler calls.
 run('clearInterval(metroTimer)');flush();
 assert.equal(get('scale-current').textContent,'1');
 for(let event=1;event<34;event++){
   run('context.currentTime=nextBeatTime-.05;scheduleBeats()');flush();
   if(event===4)assert.equal(get('scale-current').textContent,'C3');
   if(event===18)assert.equal(get('scale-current').textContent,'C4');
 }
 assert.equal(get('scale-current').textContent,'C3');
 assert.notEqual(get('scale-status').textContent,'Scale complete');
 run('context.currentTime=nextBeatTime-.05;scheduleBeats()');
 const count=oscs.length;flush();
 assert.equal(get('scale-status').textContent,'Scale complete');
 assert.equal(run('playing||metroPlaying||ScaleGuide.active()'),false);
 assert.equal(get('tempo').disabled,false);
 // A drone already playing remains playing after the guide stops.
 await run('start()');get('scale-play').click();await tick();await tick();
 get('scale-play').click();assert.equal(run('playing'),true);assert.equal(run('metroPlaying'),false);
 run('stop()');
 // Cancel during asynchronous startup must not leave either audio source running.
 get('scale-play').click();get('scale-play').click();await tick();await tick();
 assert.equal(run('playing||metroPlaying||ScaleGuide.active()'),false);
 // Two octaves with four beats per note: 4 count-in + 29*4.
 get('scale-octaves').value='2';get('scale-hold').value='4';get('scale-drone').checked=false;
 get('scale-play').click();await tick();await tick();run('clearInterval(metroTimer)');flush();
 for(let event=1;event<120;event++){run('context.currentTime=nextBeatTime-.05;scheduleBeats()');flush();}
 assert.notEqual(get('scale-status').textContent,'Scale complete');
 run('context.currentTime=nextBeatTime-.05;scheduleBeats()');flush();
 assert.equal(get('scale-status').textContent,'Scale complete');
 assert.equal(run('playing'),false);
 // Lost timing stops an active exercise rather than silently skipping notes.
 get('scale-play').click();await tick();await tick();run('context.currentTime+=5;scheduleBeats()');
 assert.equal(run('ScaleGuide.active()||metroPlaying'),false);
 assert.match(get('scale-status').textContent,/Timing interrupted/);
 console.log('PASS: 72 scale configurations; key spelling; count-in; synchronized note advancement; full last-note duration; 1/2 octave completion; existing-drone preservation; cancellation; lost-timing stop.');
})().catch(e=>{console.error(e);process.exit(1)});
