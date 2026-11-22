/* Pronóstico exploratorio por media móvil semanal ponderada. NO es una predicción de ventas reales. */
(function(){
  'use strict';
  const dayKey=d=>{const c=new Date(d);return [c.getFullYear(),String(c.getMonth()+1).padStart(2,'0'),String(c.getDate()).padStart(2,'0')].join('-');};
  function calculate(data,products,{category='Todas',days=7,businessId=null}={}){
    const ids=new Set(products.filter(p=>(category==='Todas'||p.category===category)&&(!businessId||p.businessId===businessId)).map(p=>p.id));
    const today=new Date();today.setHours(12,0,0,0);
    const dailies=[];
    for(let ago=55;ago>=0;ago--){
      const d=new Date(today);d.setDate(d.getDate()-ago);const key=dayKey(d);
      const units=data.filter(h=>h.date===key&&ids.has(h.productId)).reduce((sum,h)=>sum+h.units,0);
      dailies.push({date:key,units,day:d.getDay()});
    }
    // Las 8 semanas se usan para medir patrones por día. La base usa tres semanas recientes.
    const weekly=[];
    for(let w=0;w<8;w++)weekly.push(dailies.slice(w*7,(w+1)*7).reduce((sum,x)=>sum+x.units,0));
    const avg=weekly[7]*.50+weekly[6]*.30+weekly[5]*.20;
    const prev=weekly[6]*.50+weekly[5]*.30+weekly[4]*.20;
    const growth=Math.max(-.18,Math.min(.18,prev?avg/prev-1:0));
    const dayWeights=Array(7).fill(0);
    const daySums=Array(7).fill(0);
    for(const h of dailies){dayWeights[h.day]+=h.units;daySums[h.day]++;}
    const mean=dayWeights.reduce((a,b)=>a+b,0)/56;
    const factor=dayWeights.map((v,i)=>mean?(v/Math.max(1,daySums[i]))/mean:1);
    const norm=factor.reduce((a,b)=>a+b,0)||7;
    const points=[];
    for(let i=1;i<=days;i++){
      const d=new Date(today);d.setDate(d.getDate()+i);
      const total=(avg/7)*(factor[d.getDay()]*7/norm)*Math.pow(1+growth/7,i);
      const units=Math.max(0,Math.round(total));
      points.push({date:dayKey(d),label:d.toLocaleDateString('es-EC',{day:'2-digit',month:'short'}),units,low:Math.max(0,Math.floor(units*.75)),high:Math.ceil(units*1.25)});
    }
    const historical=dailies.slice(-Math.min(14,days)).map(x=>({...x,label:new Date(x.date+'T12:00:00').toLocaleDateString('es-EC',{day:'2-digit',month:'short'})}));
    const sorted=products.filter(p=>ids.has(p.id)).map(p=>({name:p.name,units:data.filter(h=>h.productId===p.id&&h.date>=dailies[42].date).reduce((s,h)=>s+h.units,0)})).sort((a,b)=>b.units-a.units);
    return {weekly,history:historical,points,total:points.reduce((sum,x)=>sum+x.units,0),recent:weekly[7],growth:Math.round(growth*100),best:sorted[0]||{name:'Sin datos',units:0},base:Math.round(avg),days,category};
  }
  window.UniForecast={calculate};
})();
