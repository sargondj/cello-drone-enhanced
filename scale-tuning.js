'use strict';
const ScaleTuning=(()=>{
  // One explicit five-limit ratio set, relative to the root drone.
  const ratios={0:1,2:9/8,3:6/5,4:5/4,5:4/3,7:3/2,8:8/5,9:5/3,10:9/5,11:15/8};
  function frequency(midi,root,a4,mode){
    if(mode!=='pure')return a4*2**((midi-69)/12);
    const distance=midi-root,octaves=Math.floor(distance/12),step=((distance%12)+12)%12;
    return a4*2**((root-69)/12)*2**octaves*(ratios[step]||2**(step/12));
  }
  return {frequency};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=ScaleTuning;
