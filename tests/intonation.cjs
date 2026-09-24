const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
class EventTarget {
  constructor(){this.events={};}
  addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
  dispatch(type,event={}){for(const fn of this.events[type]||[])fn(event);}
}
class Element extends EventTarget{
  constructor(){super();this.value='';this.checked=true;this.disabled=false;this.children=[];this.dataset={};this.style={};this.tagName='DIV';this.textContent='';this.classList={add(){},toggle(){}};}
  setAttribute(k,v){this[k]=String(v);}removeAttribute(k){delete this[k];}
  append(el){this.children.push(el);}replaceChildren(){this.children=[];}
  click(){if(!this.disabled)this.dispatch('click',{});}
  closest(){return this;}
}
const els={},get=id=>els[id]??=new Element();
for(const [id,value] of Object.entries({volume:'30',tone:'warm','metro-volume':'40','scale-start':'3','scale-octaves':'1','scale-hold':'2',tuning:'440',tempo:'80'}))get(id).value=value;
const strings=[36,43,50,57].map(midi=>{const el=new Element();el.dataset.string=String(midi);return el;});
let clock=0,serial=0,microphoneCalls=0,lastConstraints,mode='grant',resolver,lastStream,resumeResolver,delayResume=false;
const timers=new Map(),intervals=new Map(),nodes=[],streams=[];
class Track extends EventTarget{
  constructor(){super();this.readyState='live';this.muted=false;this.stops=0;}
  stop(){this.readyState='ended';this.stops++;}
}
function makeStream(){
 const track=new Track();const s={getTracks:()=>[track],getAudioTracks:()=>[track],track};streams.push(s);lastStream=s;return s;
}
function node(){
 const n={connections:[],disconnected:false,connect(to){this.connections.push(to);},disconnect(){this.disconnected=true;}};nodes.push(n);return n;
}
const param=()=>({value:0,setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},cancelScheduledValues(){}});
let hz=65.406391,quiet=false;
class AudioContext{
 constructor(){this.state='suspended';this.sampleRate=48000;this.destination={speaker:true};}
 get currentTime(){return clock/1000;}
 resume(){if(delayResume)return new Promise(resolve=>{resumeResolver=()=>{this.state='running';resolve();};});this.state='running';return Promise.resolve();}
 createGain(){return Object.assign(node(),{gain:param()});}
 createOscillator(){return Object.assign(node(),{frequency:param(),start(){},stop(){}});}
 createMediaStreamSource(s){return Object.assign(node(),{micStream:s});}
 createAnalyser(){return Object.assign(node(),{fftSize:2048,getFloatTimeDomainData(data){for(let i=0;i<data.length;i++)data[i]=quiet?0:.15*Math.sin(2*Math.PI*hz*i/48000);}});}
}
const doc=Object.assign(new EventTarget(),{getElementById:get,createElement:()=>new Element(),createElementNS:()=>new Element(),visibilityState:'visible',body:new Element(),activeElement:new Element(),querySelectorAll:selector=>selector==='[data-string]'?strings:[]});
const win=Object.assign(new EventTarget(),{AudioContext,isSecureContext:true});
const box={window:win,document:doc,navigator:{mediaDevices:{getUserMedia:async constraints=>{
 microphoneCalls++;lastConstraints=constraints;
 if(mode==='deny')throw Object.assign(new Error('denied'),{name:'NotAllowedError'});
 if(mode==='pending')return new Promise(resolve=>{resolver=resolve;});
 return makeStream();
}}},setTimeout:(fn,ms=0)=>{const id=++serial;timers.set(id,{fn,at:clock+ms});return id;},clearTimeout:id=>timers.delete(id),setInterval:fn=>{intervals.set(++serial,fn);return serial;},clearInterval:id=>intervals.delete(id)};
vm.createContext(box);const run=code=>vm.runInContext(code,box);
for(const file of ['app.js','notation.js','scale.js','pitch.js','tuner.js','intonation.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../',file),'utf8'),box);
const tick=()=>new Promise(setImmediate);
async function advance(ms){
 const end=clock+ms;
 while(true){
   const entry=[...timers.entries()].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
   if(!entry)break;
   clock=entry[1].at;timers.delete(entry[0]);entry[1].fn();await tick();
 }
 clock=end;
}
async function startGuide(){get('scale-play').click();await tick();await tick();await tick();}
async function playTime(ms){for(let i=0;i<ms;i+=25){await advance(Math.min(25,ms-i));for(const fn of [...intervals.values()])fn();}}
(async()=>{
 assert.equal(microphoneCalls,0,'Never requests mic on load');
 get('scale-listen').checked=false;
 await startGuide();assert.equal(microphoneCalls,0,'Guide-only mode never requests mic');run('ScaleGuide.cancel()');
 get('scale-listen').checked=true;get('scale-headphones').checked=false;
 await startGuide();assert.match(get('scale-error').textContent,/headphones/);assert.equal(microphoneCalls,0);
 get('scale-headphones').checked=true;
 await run('ScaleIntonation.prepare()');
 assert.equal(run('ScaleIntonation.active()'),true);
 assert.equal(lastConstraints.audio.echoCancellation,false);
 assert.ok(nodes.filter(n=>n.micStream).every(n=>n.connections[0].connections.length===0),'No mic-to-speaker path');
 const target="{midi:48,name:'C3'}";
 hz=130.812782;run('ScaleIntonation.setTarget('+target+')');
 await advance(160);assert.equal(get('intonation-needle').hidden,true,'Transition window is ungraded');
 await advance(600);assert.match(get('intonation-feedback').textContent,/In tune/);
 hz*=2**(25/1200);await advance(650);assert.match(get('intonation-feedback').textContent,/Sharp/);
 hz=130.812782*2**(-25/1200);await advance(650);assert.match(get('intonation-feedback').textContent,/Flat/);
 quiet=true;await advance(90);assert.equal(get('intonation-cents').textContent,'—');quiet=false;
 hz=261.625564;await advance(650);assert.match(get('intonation-feedback').textContent,/Different note or octave/);assert.equal(get('intonation-needle').hidden,true);
 run("ScaleIntonation.setTarget({midi:95,name:'B6'})");await advance(600);assert.match(get('intonation-feedback').textContent,/outside/);
 lastStream.track.muted=true;lastStream.track.dispatch('mute');assert.match(get('intonation-feedback').textContent,/paused/);lastStream.track.muted=false;
 run('ScaleIntonation.stop()');assert.equal(lastStream.track.stops,1);
 // Actual guide count-in, target advancement, automatic completion and release.
 hz=130.812782;get('tempo').value='240';get('tempo').dispatch('change');get('scale-hold').value='2';
 await startGuide();assert.equal(run('ScaleGuide.active()&&ScaleIntonation.active()&&playing&&metroPlaying'),true);
 assert.equal(get('scale-listen').disabled,true);
 await playTime(750);assert.match(get('intonation-feedback').textContent,/count-in/);
 await playTime(900);assert.equal(get('scale-current').textContent,'D3');
 assert.equal(get('intonation-needle').hidden,true,'A new target clears the prior pitch');
 await playTime(7500);assert.equal(get('scale-status').textContent,'Scale complete');
 assert.equal(run('ScaleIntonation.active()||playing||metroPlaying'),false);assert.equal(lastStream.track.stops,1);
 mode='deny';await startGuide();assert.match(get('scale-error').textContent,/denied/);assert.equal(run('ScaleGuide.active()||ScaleIntonation.active()'),false);
 mode='pending';await startGuide();assert.equal(run('ScaleIntonation.active()'),true);
 run('ScaleGuide.cancel()');const late=makeStream();resolver(late);await tick();await tick();
 assert.equal(late.track.stops,1);assert.equal(run('playing||metroPlaying||ScaleIntonation.active()'),false);
 mode='grant';await startGuide();doc.visibilityState='hidden';doc.dispatch('visibilitychange');assert.equal(lastStream.track.stops,1);doc.visibilityState='visible';
 await startGuide();await run('CelloTuner.start()');assert.equal(run('ScaleIntonation.active()||ScaleGuide.active()'),false);run('CelloTuner.stop()');
 await startGuide();lastStream.track.readyState='ended';lastStream.track.dispatch('ended');assert.equal(run('ScaleGuide.active()||ScaleIntonation.active()'),false);
 await startGuide();run("context.state='suspended';context.onstatechange()");assert.equal(lastStream.track.stops,1);
 delayResume=true;await startGuide();const held=lastStream;run('ScaleGuide.cancel()');assert.equal(held.track.stops,1);resumeResolver();await tick();delayResume=false;
 await startGuide();win.dispatch('pagehide');assert.equal(lastStream.track.stops,1);
 assert.ok(streams.every(s=>s.track.readyState==='ended'),'No leaked streams');
 console.log('PASS: headphone gate, opt-out, live flat/sharp/in-tune, uncertainty, transitions, octave/range rejection, no monitoring, count-in/targets/completion, cancellation, late/denied mic, hide, tuner exclusion, disconnect, interrupted/pending audio and page exit.');
})().catch(error=>{console.error(error);process.exit(1)});
