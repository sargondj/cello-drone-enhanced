const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
class El{
 constructor(){this.value='';this.checked=true;this.children=[];this.dataset={};this.handlers={};this.tagName='BODY';this.classList={add(){},toggle(){}};}
 setAttribute(k,v){this[k]=String(v)} removeAttribute(k){delete this[k]} addEventListener(k,v){this.handlers[k]=v} append(x){this.children.push(x)} replaceChildren(...nodes){this.children=nodes} click(){this.handlers.click?.({})}
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
const doc={getElementById:get,createElement:()=>new El(),createElementNS:()=>new El(),querySelectorAll:()=>[],body:new El(),activeElement:new El(),visibilityState:'visible',addEventListener(){}};
const box={document:doc,window:{AudioContext:AC,addEventListener(){}},navigator:{},setTimeout:(f,ms=0)=>{timeouts.set(++seq,{f,ms});return seq},clearTimeout:i=>timeouts.delete(i),setInterval:f=>{intervals.set(++seq,f);return seq},clearInterval:i=>intervals.delete(i)};
get('scale-start').value='3';get('scale-octaves').value='1';get('scale-hold').value='2';vm.createContext(box);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8'),box);
const run=s=>vm.runInContext(s,box);

vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../notation.js'),'utf8'),box);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../scale.js'),'utf8'),box);

const tick=()=>new Promise(setImmediate);
function flush(){const pending=[...timeouts];timeouts.clear();for(const [,v] of pending)v.f();}
(async()=>{
 for(let key=0;key<12;key++){
   for(let oct=2;oct<=4;oct++)for(let len=1;len<=2;len++)for(const type of ['major','natural','melodic']){
     const notes=run('ScaleGuide.makeScale('+key+','+oct+','+len+','+JSON.stringify(type)+')');
     assert.equal(notes.length,len*14+1);
     assert.equal(notes[0].midi,notes.at(-1).midi);
     assert.equal(notes[len*7].midi-notes[0].midi,len*12);
     assert.ok(notes.every(n=>!n.name.includes('undefined')));
     const expected={major:[0,2,4,5,7,9,11],natural:[0,2,3,5,7,8,10],melodic:[0,2,3,5,7,9,11]};
     for(let i=0;i<=len*7;i++)assert.equal(notes[i].midi-notes[0].midi,12*Math.floor(i/7)+expected[type][i%7]);
     for(let i=len*7+1;i<notes.length;i++){
       const degree=notes.length-1-i,pattern=expected[type==='melodic'?'natural':type];
       assert.equal(notes[i].midi-notes[0].midi,12*Math.floor(degree/7)+pattern[degree%7]);
     }
     get('scale-type').value=type;get('scale-key').value=String(key);get('scale-start').value=String(oct);get('scale-octaves').value=String(len);
     get('scale-type').handlers.change();
     const staff=get('scale-notes').children[0];
     assert.ok(staff['aria-label'].includes(notes[0].name));assert.ok(!staff.viewBox.includes('NaN'));
     run('ScaleNotation.mark(8)');assert.match(get('score-page').textContent,/^2 \/ /);
     assert.equal(get('scale-notes').children[0].children.filter(n=>n['aria-current']==='step').length,1);
     run('ScaleNotation.mark(-1)');assert.equal(get('score-prev').disabled,true);

   }
 }
 assert.equal(run('ScaleGuide.makeScale(6,3,1)[6].name'),'E♯4');
 assert.equal(run('ScaleGuide.makeScale(1,3,1)[3].name'),'G♭3');
 get('scale-type').value='major';get('scale-key').value='0';get('scale-start').value='3';get('scale-octaves').value='1';
 get('scale-play').click();await tick();await tick();
 assert.equal(run('playing&&metroPlaying&&ScaleGuide.active()'),true);
 assert.equal(get('tempo').disabled,true);assert.equal(get('scale-type').disabled,true);assert.equal(run('level()'),.42);assert.equal(run('metroLevel()'),.35);
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
 console.log('PASS: 216 scale configurations; ascending/descending interval patterns; notation paging/highlighting; key spelling; count-in; synchronized note advancement; full last-note duration; 1/2 octave completion; existing-drone preservation; cancellation; lost-timing stop.');
})().catch(e=>{console.error(e);process.exit(1)});
