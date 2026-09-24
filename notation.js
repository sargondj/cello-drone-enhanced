'use strict';
// Key signature on every system. Each page ends a practice measure (barline),
// so local accidentals reset at page boundaries; durations match beats per note.
const ScaleNotation=(()=>{
  const ns='http://www.w3.org/2000/svg';
  let notes=[],beats=2,page=0,current=-1;
  const size=7;
  function el(tag,attrs={},text){
    const node=document.createElementNS(ns,tag);
    for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);
    if(text!==undefined)node.textContent=text;
    return node;
  }
  function render(){
    const start=page*size,visible=notes.slice(start,start+size);
    const treble=visible.length&&Math.min(...visible.map(n=>n.midi))>=60;
    // Bottom staff line: G2 in bass, E4 in treble. One diatonic step = 5 units.
    const bottom=treble?30:18;
    const signature=Array(7).fill(0);
    notes.slice(0,7).forEach(n=>signature[n.letterIndex]=n.keyAccidental||0);
    const sharp=signature.some(a=>a>0),order=sharp?[3,0,4,1,5,2,6]:[6,2,5,1,4,0,3];
    const signed=order.filter(letter=>signature[letter]!==0);
    const signatureLabel=signed.length?`${signed.length} ${sharp?'sharp':'flat'}${signed.length===1?'':'s'}`:'no sharps or flats';
    const firstX=65+signed.length*9,spacing=(365-firstX)/6;
    const positions=visible.map(n=>100-(n.writtenOctave*7+n.letterIndex-bottom)*5);
    const top=Math.min(22,...positions.map(y=>y-36)),end=Math.max(124,...positions.map(y=>y+12));
    const svg=el('svg',{viewBox:`0 ${top} 390 ${end-top}`,role:'img','aria-label':`${treble?'Treble':'Bass'} clef. Key signature: ${signatureLabel}. Notes ${start+1}–${start+visible.length}: ${visible.map(n=>n.name).join(', ')}. ${beats} beats per note.`});
    svg.append(el('title',{},'Scale notation · '+(treble?'treble':'bass')+' clef'));
    for(let y=60;y<=100;y+=10)svg.append(el('line',{x1:8,x2:384,y1:y,y2:y,stroke:'#83949e','stroke-width':1}));
    if(treble){
      svg.append(el('text',{x:10,y:101,'font-size':59,'font-family':'"Noto Music", "Apple Symbols", "Segoe UI Symbol", serif',fill:'#142d3b'},'𝄞'));
    }else{
      // Bass clef curl and dots, anchored to the F3 line (y=70).
      svg.append(el('path',{d:'M 13 72 C 8 61 32 57 31 73 C 30 85 20 94 12 98 C 22 87 28 79 25 69 C 23 62 14 64 14 69',fill:'#142d3b'}));
      svg.append(el('circle',{cx:14,cy:71,r:3.3,fill:'#142d3b'}));
      for(const cy of [65,75])svg.append(el('circle',{cx:36,cy,r:1.8,fill:'#142d3b'}));
    }
    // Conventional signature placements, listed in sharp/flat order.
    const ys=sharp?(treble?[60,75,55,70,85,65,80]:[70,85,65,80,95,75,90]):(treble?[80,65,85,70,90,75,95]:[90,75,95,80,100,85,105]);
    signed.forEach((letter,i)=>svg.append(el('text',{x:44+i*9,y:ys[order.indexOf(letter)]+5,'font-size':18,'font-family':'serif',fill:'#142d3b','data-key-letter':letter},sharp?'♯':'♭')));
    svg.append(el('line',{x1:384,x2:384,y1:60,y2:100,stroke:'#142d3b','data-barline':'end'}));
    const local=new Map();
    visible.forEach((n,i)=>{
      const index=start+i,x=firstX+i*spacing,y=positions[i],active=index===current;
      const group=el('g',{'data-note-index':index,class:active?'notation-note current':'notation-note'});
      if(active){group.setAttribute('aria-current','step');group.append(el('rect',{x:x-21,y:top+2,width:43,height:end-top-4,rx:7,fill:'#84cba2','fill-opacity':.3}));}
      group.append(el('title',{},n.name+(active?' · play now':'')));
      for(let ledger=110;ledger<=y;ledger+=10)group.append(el('line',{x1:x-11,x2:x+11,y1:ledger,y2:ledger,stroke:'#142d3b'}));
      for(let ledger=50;ledger>=y;ledger-=10)group.append(el('line',{x1:x-11,x2:x+11,y1:ledger,y2:ledger,stroke:'#142d3b'}));
      const color=active?'#176b48':'#142d3b';
      const pitchKey=n.letterIndex+':'+n.writtenOctave;
      const previous=local.has(pitchKey)?local.get(pitchKey):signature[n.letterIndex];
      if(n.accidental!==previous)group.append(el('text',{x:x-10,y:y+5,'text-anchor':'end','font-size':18,'font-family':'serif',fill:color,'data-local-accidental':n.accidental},{'-2':'♭♭','-1':'♭','0':'♮','1':'♯','2':'𝄪'}[n.accidental]));
      local.set(pitchKey,n.accidental);
      group.append(el('ellipse',{cx:x,cy:y,rx:beats===4?8:6,ry:4.2,transform:`rotate(-18 ${x} ${y})`,fill:beats===1?color:'white',stroke:color,'stroke-width':1.7}));
      if(beats!==4){const down=y<80;group.append(el('line',{x1:x+(down?-5.5:5.5),x2:x+(down?-5.5:5.5),y1:y,y2:y+(down?30:-30),stroke:color,'stroke-width':1.5}));}
      svg.append(group);
    });
    $('scale-notes').replaceChildren(svg);
    $('score-page').textContent=`${page+1} / ${Math.max(1,Math.ceil(notes.length/size))} · ${treble?'Treble':'Bass'} · ${signatureLabel}`;
    $('score-prev').disabled=page===0;
    $('score-next').disabled=(page+1)*size>=notes.length;
  }
  $('score-prev').addEventListener('click',()=>{if(page>0){page--;render();}});
  $('score-next').addEventListener('click',()=>{if((page+1)*size<notes.length){page++;render();}});
  return {
    setNotes(value,duration){notes=value;beats=duration;page=0;current=-1;render();},
    mark(index){current=index;if(index>=0&&index<notes.length)page=Math.floor(index/size);if(index===-1)page=0;render();}
  };
})();
