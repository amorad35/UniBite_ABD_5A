/* Datos ficticios para el prototipo local. No representan resultados reales de la UTEQ. */
(function () {
  'use strict';
  const nextDate = (days, hour=13, minute=0) => { const d=new Date(); d.setDate(d.getDate()+days); d.setHours(hour,minute,0,0); return d.toISOString(); };
  const seed = {
    users: [
      {id:'u1',name:'Andrea Ruiz',email:'andrea.ruiz@uteq.edu.ec',role:'estudiante'},
      {id:'u2',name:'Valeria Mora',email:'valeria.mora@uteq.edu.ec',role:'estudiante'},
      {id:'u3',name:'Equipo administrador',email:'admin@unibite.demo',role:'admin'},
      {id:'u4',name:'Daniela Paredes',email:'daniela.paredes@uteq.edu.ec',role:'estudiante'},
      {id:'u5',name:'Mateo Vera',email:'mateo.vera@uteq.edu.ec',role:'estudiante'},
      {id:'u6',name:'Sofía Calderón',email:'sofia.calderon@uteq.edu.ec',role:'estudiante'}
    ],
    businesses: [
      {id:'b1',ownerId:'u2',name:'Dulce Campus',category:'Postres',description:'Postres artesanales preparados por estudiantes, con entregas coordinadas en el campus.',location:'Campus UTEQ · punto acordado',whatsapp:'593999000111',hours:'Lun. a vie. · 09:00 – 17:00',status:'approved',verificationCode:'NB-CAMPUS-01',submittedAt:nextDate(-15),approvedAt:nextDate(-14),evidence:'Correo institucional (demostración)'},
      {id:'b2',ownerId:'u5',name:'La Esquina Snack',category:'Snacks',description:'Bocaditos y opciones saladas para la pausa entre clases.',location:'Campus UTEQ · punto acordado',whatsapp:'593999000222',hours:'Lun. a vie. · 10:00 – 16:30',status:'approved',verificationCode:'NB-SNACK-02',submittedAt:nextDate(-16),approvedAt:nextDate(-15),evidence:'Revisión manual (demostración)'},
      {id:'b3',ownerId:'u6',name:'Viva Fresh',category:'Bebidas',description:'Bebidas frías y combinaciones frescas para tus jornadas universitarias.',location:'Campus UTEQ · punto acordado',whatsapp:'593999000333',hours:'Lun. a vie. · 08:30 – 16:00',status:'approved',verificationCode:'NB-FRESH-03',submittedAt:nextDate(-19),approvedAt:nextDate(-18),evidence:'Correo institucional (demostración)'},
      {id:'b4',ownerId:'u4',name:'Café de Aula',category:'Bebidas',description:'Café y bebidas calientes para estudiantes.',location:'Campus UTEQ',whatsapp:'593999000444',hours:'Lun. a vie. · 08:00 – 14:00',status:'pending',verificationCode:null,submittedAt:nextDate(-1),evidence:'Evidencia pendiente de revisión'}
    ],
    products: [
      {id:'p1',businessId:'b2',name:'Wrap de pollo',category:'Comidas',description:'Wrap artesanal con pollo, lechuga fresca y salsa de la casa.',price:3.50,image:'src/assets/food-wrap.svg',mode:'immediate',active:true,capacity:null,deliveryAt:null,closeAt:null},
      {id:'p2',businessId:'b1',name:'Cheesecake de fresa',category:'Postres',description:'Porción cremosa con base crujiente, fresas y cobertura suave.',price:2.75,image:'src/assets/food-cake.svg',mode:'preorder',active:true,capacity:18,deliveryAt:nextDate(5,13),closeAt:nextDate(4,17)},
      {id:'p3',businessId:'b3',name:'Limonada tropical',category:'Bebidas',description:'Bebida fría con limón, hierbabuena y frutas tropicales.',price:1.75,image:'src/assets/food-drink.svg',mode:'immediate',active:true,capacity:null,deliveryAt:null,closeAt:null},
      {id:'p4',businessId:'b2',name:'Sánduche especial',category:'Comidas',description:'Pan dorado, vegetales y relleno especial preparado al momento.',price:3.00,image:'src/assets/food-sandwich.svg',mode:'immediate',active:true,capacity:null,deliveryAt:null,closeAt:null},
      {id:'p5',businessId:'b1',name:'Galletas de chocolate',category:'Postres',description:'Paquete de tres galletas caseras con trozos de chocolate.',price:1.50,image:'src/assets/food-cookie.svg',mode:'preorder',active:true,capacity:35,deliveryAt:nextDate(5,14),closeAt:nextDate(4,16)},
      {id:'p6',businessId:'b3',name:'Bowl de frutas',category:'Snacks',description:'Frutas de temporada, yogur y un toque de granola.',price:2.50,image:'src/assets/food-bowl.svg',mode:'immediate',active:true,capacity:null,deliveryAt:null,closeAt:null}
    ],
    orders: [
      {id:'UB-1001',buyerId:'u1',productId:'p1',requested:2,offered:null,confirmed:null,status:'pending',expiresAt:null,paymentMethod:'none',paymentReceived:false,deliveryStatus:'pending',deliveryCode:null,createdAt:nextDate(-1),events:['Solicitud enviada']},
      {id:'UB-1002',buyerId:'u1',productId:'p3',requested:1,offered:null,confirmed:1,status:'confirmed',expiresAt:null,paymentMethod:'cash',paymentReceived:false,deliveryStatus:'pending',deliveryCode:'QK7M-82JP',createdAt:nextDate(-2),events:['Solicitud enviada','Cantidad confirmada']},
      {id:'UB-1003',buyerId:'u1',productId:'p2',requested:4,offered:3,confirmed:null,status:'counter',expiresAt:nextDate(1,12),paymentMethod:'none',paymentReceived:false,deliveryStatus:'pending',deliveryCode:null,createdAt:nextDate(-1),events:['Solicitud enviada','Contrapropuesta: 3 unidades']},
      {id:'UB-1004',buyerId:'u5',productId:'p2',requested:2,offered:null,confirmed:2,status:'confirmed',expiresAt:null,paymentMethod:'transfer',paymentReceived:true,deliveryStatus:'pending',deliveryCode:'ZP4R-26WD',createdAt:nextDate(-3),events:['Solicitud enviada','Cantidad confirmada','Pago declarado como recibido']},
      {id:'UB-1005',buyerId:'u6',productId:'p5',requested:3,offered:null,confirmed:3,status:'confirmed',expiresAt:null,paymentMethod:'none',paymentReceived:false,deliveryStatus:'delivered',deliveryCode:'DN5K-91LA',createdAt:nextDate(-6),events:['Solicitud enviada','Cantidad confirmada','Entrega comprobada por código']}
    ],
    history: []
  };
  // 8 semanas de solicitudes históricas simuladas, no datos de ventas verificadas.
  const bases = {p1:5,p2:4,p3:8,p4:4,p5:5,p6:6};
  for(let day=55;day>=0;day--){
    const d=new Date(); d.setDate(d.getDate()-day); d.setHours(12,0,0,0);
    for(const [id,base] of Object.entries(bases)){
      const week=Math.floor((55-day)/7);
      const weekday=d.getDay();
      const factor=(weekday===0||weekday===6)?0.35:(weekday===3?1.32:1);
      const variation=0.78+((day*17+id.charCodeAt(1)*7)%9)/19;
      const trend=1+(week-3)*0.025;
      const units=Math.max(0,Math.round(base*factor*variation*trend));
      seed.history.push({date:d.toISOString().slice(0,10),productId:id,units});
    }
  }
  window.UniSeed=seed;
})();
