/* Persistencia LOCAL DE DEMOSTRACIÓN. No es una base de datos, sesión ni control de acceso real. */
(function(){
  'use strict';
  const KEY='unibite_demo_v1_20261120';
  function clone(obj){return JSON.parse(JSON.stringify(obj));}
  function storageGet(){try{return localStorage.getItem(KEY);}catch{return null;}}
  function storagePut(value){try{localStorage.setItem(KEY,value);return true;}catch{return false;}}
  function load(){
    try{
      const old=JSON.parse(storageGet()||'null');
      if(old&&Array.isArray(old.users)&&Array.isArray(old.products)&&Array.isArray(old.businesses)&&Array.isArray(old.orders)&&Array.isArray(old.history))return old;
    }catch{}
    return clone(window.UniSeed);
  }
  let state=window.UniV2.migrate(load());
  let viewer='guest';
  try{viewer=localStorage.getItem('unibite_demo_viewer')||'guest';}catch{}
  function save(){storagePut(JSON.stringify(state));}
  function reset(){state=window.UniV2.migrate(clone(window.UniSeed));save();}
  function setViewer(id){viewer=id;try{localStorage.setItem('unibite_demo_viewer',id);}catch{}}
  function user(){return state.users.find(x=>x.id===viewer)||null;}
  function ownBusiness(){return state.businesses.find(x=>x.ownerId===viewer)||null;}
  function business(id){return state.businesses.find(x=>x.id===id)||null;}
  function product(id){return state.products.find(x=>x.id===id)||null;}
  function order(id){return state.orders.find(x=>x.id===id)||null;}
  function isAdmin(){return !!user()&&user().role==='admin';}
  function canOwnBusiness(id){return !!user()&&business(id)?.ownerId===user().id;}
  function canManageOrder(id){const o=order(id);return !!o&&!!user()&&canOwnBusiness(product(o.productId)?.businessId);}
  function nextId(prefix,rows){const highest=Math.max(1005,...rows.map(x=>Number(String(x.id).replace(/\D/g,''))||0));return prefix+String(highest+1);}
  window.UniStore={get state(){return state;},get viewer(){return viewer;},save,reset,setViewer,user,ownBusiness,business,product,order,isAdmin,canOwnBusiness,canManageOrder,nextId};
})();
