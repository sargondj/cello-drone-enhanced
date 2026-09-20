const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
class El{
 constructor(tag='DIV'){this.tagName=tag.toUpperCase();this.children=[];this.events={};this.attrs={};this.dataset={};this.value='30';this.classList={add(){}};}
 append(...els){for(const el of els){el.remove();el.parentElement=this;this.children.push(el);}}
 remove(){if(this.parentElement){const a=this.parentElement.children;a.splice(a.indexOf(this),1);this.parentElement=null;}}
 before(el){const p=this.parentElement;el.remove();el.parentElement=p;p.children.splice(p.children.indexOf(this),0,el);}
 setAttribute(k,v){this.attrs[k]=String(v);}addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
 dispatchEvent(e){for(const fn of this.events[e.type]||[])fn(e);}click(){this.dispatchEvent({type:'click'});}focus(){document.activeElement=this;}
 querySelector(sel){return this.map?.[sel]||null;}
}
const main=new El('main'),header=new El('header'),instrument=new El(),metro=new El(),tuner=new El(),scale=new El(),reference=new El(),volume=new El('input'),input=new El('input'),label=new El('label'),actions=new El();
reference.append(label,input);reference.map={'label':label};instrument.append(reference);scale.append(actions);scale.map={'.scale-actions':actions};
const elements={'tuning':input,'volume':volume,'tuner':tuner,'play':new El('button'),'tuner-play':new El('button'),'scale-play':new El('button')};
let inputEvents=0;volume.addEventListener('input',()=>inputEvents++);
main.append(header,instrument,metro,tuner,scale);
const map={'main':main,'header':header,'.instrument':instrument,'.metronome':metro,'.scale-guide':scale};
const document={querySelector:s=>map[s]||null,createElement:t=>new El(t),body:new El('body'),activeElement:new El(),events:{},addEventListener(k,fn){this.events[k]=fn;}};
let micStops=0,scaleStops=0,droneStops=0;
const box={document,$:id=>elements[id],Event:class{constructor(type){this.type=type;}},CelloTuner:{stop(){micStops++;}},ScaleGuide:{cancel(){scaleStops++;}},stop(){droneStops++;}};
vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(__dirname,'../navigation.js'),'utf8'),box);
const run=s=>vm.runInContext(s,box),panel=id=>main.children.find(el=>el.id==='panel-'+id),tabs=header.children.find(el=>el.className==='mode-tabs').children;
assert.equal(panel('practice').hidden,false);assert.equal(panel('tuner').hidden,true);assert.equal(micStops,0);
run("AppNavigation.select('scales')");assert.equal(metro.parentElement,panel('scales'));assert.equal(panel('practice').hidden,true);assert.equal(micStops,1);assert.equal(droneStops,1);assert.equal(scaleStops,1);
run("AppNavigation.select('scales')");assert.equal(micStops,1,'Selecting current tab does not interrupt audio');
run("AppNavigation.select('tuner')");assert.equal(panel('tuner').hidden,false);assert.equal(panel('scales').hidden,true);assert.equal(metro.parentElement,panel('practice'));
assert.equal(tabs[1].attrs['aria-selected'],'true');assert.equal(tabs[1].tabIndex,0);assert.equal(tabs[0].tabIndex,-1);
assert.equal(reference.parentElement,header,'A4 reference visible in all modes');
const proxy=scale.children.find(el=>el.className==='scale-drone-level').children.find(el=>el.tagName==='INPUT');proxy.value='62';proxy.dispatchEvent({type:'input'});assert.equal(volume.value,'62');assert.equal(inputEvents,1);
volume.value='17';volume.dispatchEvent({type:'input'});assert.equal(proxy.value,'17');
tabs[1].dispatchEvent({type:'keydown',key:'ArrowRight',preventDefault(){}});assert.equal(run('AppNavigation.current()'),'scales');assert.equal(document.activeElement,tabs[2]);
document.activeElement=new El();let clicked=0;elements['scale-play'].addEventListener('click',()=>clicked++);
document.events.keydown({code:'Space',repeat:false,preventDefault(){},stopImmediatePropagation(){}});assert.equal(clicked,1);
console.log('PASS: exclusive panels, shared metronome relocation, reference access, bidirectional volume, audio/mic cleanup, selected-tab semantics, arrow keys and visible-mode Space shortcut.');
