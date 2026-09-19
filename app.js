
const DB_KEY = "stockforge_industrial_v1";
const SESSION_KEY = "stockforge_session";

const seed = {
  categories:["Cabos","Disjuntores","Contatores","Relés","Bornes","Sensores","Conectores","Fusíveis","Componentes eletrônicos"],
  suppliers:["WEG","Schneider Electric","Siemens","Phoenix Contact"],
  units:["un","m","kg","cx","pct"],
  locations:["Almoxarifado A","Almoxarifado B","Prateleira A1","Prateleira B2","Linha de montagem"],
  products:[
    {id:"P001",name:"Contator 18A 220V",category:"Contatores",unit:"un",location:"Prateleira A1",stock:25,min:30,supplier:"WEG"},
    {id:"P002",name:"Disjuntor bipolar 20A",category:"Disjuntores",unit:"un",location:"Prateleira A1",stock:55,min:30,supplier:"Schneider Electric"},
    {id:"P003",name:"Cabo flexível 2,5mm",category:"Cabos",unit:"m",location:"Almoxarifado A",stock:420,min:150,supplier:"Prysmian"},
    {id:"P004",name:"Relé térmico 12-18A",category:"Relés",unit:"un",location:"Prateleira B2",stock:34,min:20,supplier:"WEG"},
    {id:"P005",name:"Borne de passagem 4mm",category:"Bornes",unit:"un",location:"Almoxarifado B",stock:180,min:100,supplier:"Phoenix Contact"},
    {id:"P006",name:"Sensor indutivo M18",category:"Sensores",unit:"un",location:"Prateleira B2",stock:12,min:15,supplier:"Siemens"},
    {id:"P007",name:"Conector industrial 16A",category:"Conectores",unit:"un",location:"Almoxarifado B",stock:70,min:25,supplier:"Schneider Electric"},
    {id:"P008",name:"Fusível 10A",category:"Fusíveis",unit:"un",location:"Prateleira A1",stock:8,min:20,supplier:"WEG"}
  ],
  movements:[
    {id:1,date:"2026-09-18T16:20:00",type:"entrada",productId:"P001",qty:10,user:"Almoxarifado",note:"Reposição de fornecedor"},
    {id:2,date:"2026-09-18T14:05:00",type:"saida",productId:"P002",qty:8,user:"Produção",note:"OP-2026-041"},
    {id:3,date:"2026-09-17T11:40:00",type:"saida",productId:"P001",qty:5,user:"Produção",note:"OP-2026-040"},
    {id:4,date:"2026-09-17T09:10:00",type:"devolucao",productId:"P005",qty:12,user:"João Silva",note:"Material não utilizado"},
    {id:5,date:"2026-09-16T15:30:00",type:"ajuste",productId:"P008",qty:2,user:"Auditoria",note:"Contagem física"}
  ],
  orders:[
    {id:"OP-2026-041",product:"Painel elétrico PE-20",qty:20,status:"Em produção",date:"2026-09-18",materials:[["Cabo flexível 2,5mm","120 m"],["Disjuntor bipolar 20A","40 un"],["Contator 18A 220V","60 un"],["Borne de passagem 4mm","200 un"],["Relé térmico 12-18A","40 un"]]},
    {id:"OP-2026-040",product:"Painel de comando PC-12",qty:12,status:"Planejada",date:"2026-09-17",materials:[["Cabo flexível 2,5mm","80 m"],["Contator 18A 220V","24 un"],["Borne de passagem 4mm","96 un"]]}
  ]
};

let db = loadDB();
let session = null;

function loadDB(){
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || structuredClone(seed); }
  catch(e){ return structuredClone(seed); }
}
function saveDB(){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function saveSession(){ localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
function getProduct(id){ return db.products.find(p=>p.id===id); }
function formatDate(d){ return new Date(d).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}); }
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function typeLabel(t){return {entrada:"Entrada",saida:"Saída",devolucao:"Devolução",ajuste:"Ajuste"}[t]||t}
function toast(msg,type="success"){const t=document.querySelector("#toast");t.textContent=msg;t.className=`toast show ${type}`;setTimeout(()=>t.className="toast",2500)}

function init(){
  session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  if(!session){document.querySelector("#loginScreen").classList.remove("hidden");return;}
  showApp();
}
function showApp(){
  document.querySelector("#loginScreen").classList.add("hidden");
  document.querySelector("#app").classList.remove("hidden");
  document.querySelector("#currentUser").textContent=session.name;
  document.querySelector("#currentRole").textContent=session.role==="admin"?"Administrador":"Funcionário";
  document.querySelector("#userAvatar").textContent=session.name.charAt(0).toUpperCase();
  document.querySelectorAll(".admin-only,.admin-action").forEach(el=>el.classList.toggle("hidden",session.role!=="admin"));
  bind();
  renderAll();
}
function bind(){
  document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.onclick=()=>navigate(b.dataset.page));
  document.querySelectorAll("[data-page-link]").forEach(b=>b.onclick=()=>navigate(b.dataset.pageLink));
  document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>handleAction(b.dataset.action));
  document.querySelector("#logoutBtn").onclick=()=>{localStorage.removeItem(SESSION_KEY);location.reload()};
  document.querySelector("#loginForm").onsubmit=login;
  document.querySelector("#productSearch").oninput=renderProducts;
  document.querySelector("#stockFilter").onchange=renderProducts;
  document.querySelector("#movementSearch").oninput=renderMovements;
  document.querySelector("#movementTypeFilter").onchange=renderMovements;
  document.querySelector("#menuBtn").onclick=()=>document.querySelector("#sidebar").classList.toggle("open");
  document.querySelector(".modal-backdrop").onclick=closeModal;
}
function login(e){
  e.preventDefault();
  const u=document.querySelector("#loginUser").value.trim(), p=document.querySelector("#loginPass").value;
  const users={admin:{pass:"admin123",name:"Administrador",role:"admin"},funcionario:{pass:"1234",name:"Funcionário",role:"employee"}};
  if(users[u]&&users[u].pass===p){session={name:users[u].name,role:users[u].role};saveSession();showApp()}
  else {const x=document.querySelector("#loginError");x.textContent="Usuário ou senha inválidos.";x.classList.remove("hidden")}
}
function navigate(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelector(`#page-${page}`).classList.add("active");
  document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  const titles={dashboard:"Dashboard",products:"Produtos",movements:"Movimentações",orders:"Ordens de produção",reports:"Relatórios",registrations:"Cadastros"};
  document.querySelector("#pageTitle").textContent=titles[page]||"Dashboard";
  if(window.innerWidth<760)document.querySelector("#sidebar").classList.remove("open");
  renderAll();
}
function renderAll(){renderDashboard();renderProducts();renderMovements();renderOrders();renderReports();renderRegistrations()}

function renderDashboard(){
  const total=db.products.reduce((a,p)=>a+Number(p.stock),0), low=db.products.filter(p=>p.stock<=p.min);
  document.querySelector("#statProducts").textContent=db.products.length;
  document.querySelector("#statStock").textContent=total.toLocaleString("pt-BR");
  document.querySelector("#statLow").textContent=low.length;
  document.querySelector("#statMoves").textContent=db.movements.length;
  document.querySelector("#statCategories").textContent=`${db.categories.length} categorias`;
  document.querySelector("#lowStockList").innerHTML=low.length?low.slice(0,5).map(p=>`<div class="alert-row"><div><div class="name">${esc(p.name)}</div><small>${esc(p.location)} • mínimo ${p.min} ${p.unit}</small></div><span class="pill pill-danger">${p.stock} ${p.unit}</span></div>`).join(""):`<div class="empty">Nenhum produto abaixo do mínimo.</div>`;
  const moves=[...db.movements].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  document.querySelector("#recentMoves").innerHTML=moves.length?moves.map(m=>`<div class="activity-row"><div class="move-dot ${m.type==="entrada"?"in":m.type==="saida"?"out":m.type==="devolucao"?"ret":"adj"}">${m.type==="entrada"?"↓":m.type==="saida"?"↑":"↔"}</div><div><b style="font-size:10px">${esc(getProduct(m.productId)?.name||"Produto removido")}</b><small>${typeLabel(m.type)} • ${m.qty} • ${formatDate(m.date)}</small></div></div>`).join(""):`<div class="empty">Nenhuma movimentação registrada.</div>`;
  const counts={};db.products.forEach(p=>counts[p.category]=(counts[p.category]||0)+p.stock);const max=Math.max(...Object.values(counts),1);
  document.querySelector("#categoryBars").innerHTML=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="bar-line"><span>${esc(k)}</span><div class="bar-track"><div class="bar-fill" style="width:${v/max*100}%"></div></div><b>${v.toLocaleString("pt-BR")}</b></div>`).join("");
}

function renderProducts(){
  const q=(document.querySelector("#productSearch")?.value||"").toLowerCase(), f=document.querySelector("#stockFilter")?.value||"all";
  let arr=db.products.filter(p=>`${p.id} ${p.name} ${p.category} ${p.location}`.toLowerCase().includes(q));
  arr=arr.filter(p=>f==="all"||(f==="low"&&p.stock<=p.min)||(f==="ok"&&p.stock>p.min)||(f==="zero"&&p.stock===0));
  document.querySelector("#productsTable").innerHTML=arr.length?arr.map(p=>`<tr><td class="product-code">${p.id}</td><td><div class="product-name">${esc(p.name)}</div><small>${esc(p.supplier||"—")}</small></td><td>${esc(p.category)}</td><td>${p.unit}</td><td>${esc(p.location)}</td><td class="stock-num">${p.stock}</td><td>${p.min}</td><td>${p.stock===0?'<span class="pill pill-danger">Sem estoque</span>':p.stock<=p.min?'<span class="pill pill-danger">Abaixo do mínimo</span>':'<span class="pill pill-success">Normal</span>'}</td><td>${session?.role==="admin"?`<button class="action-btn" onclick="openProduct('${p.id}')">Editar</button><button class="action-btn" onclick="deleteProduct('${p.id}')">Excluir</button>`:'—'}</td></tr>`).join(""):`<tr><td colspan="9" class="empty">Nenhum produto encontrado.</td></tr>`;
}
function renderMovements(){
  const q=(document.querySelector("#movementSearch")?.value||"").toLowerCase(), f=document.querySelector("#movementTypeFilter")?.value||"all";
  let arr=[...db.movements].sort((a,b)=>new Date(b.date)-new Date(a.date)).filter(m=>{const p=getProduct(m.productId);return `${m.type} ${p?.name||""} ${m.user} ${m.note}`.toLowerCase().includes(q)&& (f==="all"||m.type===f)});
  document.querySelector("#movementsTable").innerHTML=arr.length?arr.map(m=>`<tr><td>${formatDate(m.date)}</td><td><span class="pill ${m.type==="entrada"||m.type==="devolucao"?"pill-success":"pill-info"}">${typeLabel(m.type)}</span></td><td>${esc(getProduct(m.productId)?.name||"Produto removido")}</td><td><b>${m.qty}</b> ${getProduct(m.productId)?.unit||""}</td><td>${esc(m.user)}</td><td>${esc(m.note||"—")}</td></tr>`).join(""):`<tr><td colspan="6" class="empty">Nenhuma movimentação encontrada.</td></tr>`;
  document.querySelector("#moveIn").textContent=db.movements.filter(m=>m.type==="entrada").reduce((a,m)=>a+m.qty,0);
  document.querySelector("#moveOut").textContent=db.movements.filter(m=>m.type==="saida").reduce((a,m)=>a+m.qty,0);
  document.querySelector("#moveReturn").textContent=db.movements.filter(m=>m.type==="devolucao").reduce((a,m)=>a+m.qty,0);
  document.querySelector("#moveAdjust").textContent=db.movements.filter(m=>m.type==="ajuste").length;
}
function renderOrders(){
  document.querySelector("#ordersGrid").innerHTML=db.orders.map(o=>`<div class="order-card"><div class="order-head"><div><div class="order-code">${esc(o.id)}</div><div class="order-product">${esc(o.product)}</div></div><span class="pill ${o.status==="Em produção"?"pill-info":"pill-success"}">${esc(o.status)}</span></div><div class="order-meta"><div><span>QUANTIDADE</span><b>${o.qty} unidades</b></div><div><span>DATA</span><b>${new Date(o.date+"T12:00").toLocaleDateString("pt-BR")}</b></div></div><div class="material-list"><h4>MATERIAIS NECESSÁRIOS</h4>${o.materials.map(x=>`<div class="material-item"><span>${esc(x[0])}</span><b>${esc(x[1])}</b></div>`).join("")}</div></div>`).join("")||`<div class="empty">Nenhuma ordem cadastrada.</div>`;
}
function renderReports(){
  const low=db.products.filter(p=>p.stock<=p.min).length, total=db.products.reduce((a,p)=>a+p.stock,0);
  document.querySelector("#reportIndicators").innerHTML=`<div class="indicator"><span>VALOR DE REFERÊNCIA</span><b>${db.products.length} itens</b></div><div class="indicator"><span>ESTOQUE TOTAL</span><b>${total.toLocaleString("pt-BR")} un/m</b></div><div class="indicator"><span>ALERTAS</span><b>${low} produtos</b></div><div class="indicator"><span>FORNECEDORES</span><b>${db.suppliers.length}</b></div><div class="indicator"><span>MOVIMENTAÇÕES</span><b>${db.movements.length}</b></div><div class="indicator"><span>ORDENS</span><b>${db.orders.length}</b></div>`;
}
function renderRegistrations(){
  const render=(id,arr,key)=>document.querySelector(id).innerHTML=arr.map((x,i)=>`<div class="list-row"><span>${esc(key?x[key]:x)}</span>${session?.role==="admin"?`<button onclick="removeRegistration('${key||""}',${i})">Excluir</button>`:""}</div>`).join("")||`<div class="empty">Nenhum registro.</div>`;
  render("#categoriesList",db.categories);render("#suppliersList",db.suppliers);render("#unitsList",db.units);render("#locationsList",db.locations);
}

function handleAction(a){
  if(a==="quick-product")openProduct();
  if(a==="quick-movement")openMovement();
  if(a==="quick-order")openOrder();
  if(a==="close-modal")closeModal();
  if(a==="add-category")openRegistration("category","Nova categoria","categories");
  if(a==="add-supplier")openRegistration("supplier","Novo fornecedor","suppliers");
  if(a==="add-unit")openRegistration("unit","Nova unidade","units");
  if(a==="add-location")openRegistration("location","Nova localização","locations");
  if(a==="print-report")printReport("stock");
  if(a==="print-movements")printReport("movements");
  if(a==="print-orders")printReport("orders");
}
function openModal(title,subtitle,body){document.querySelector("#modalTitle").textContent=title;document.querySelector("#modalSubtitle").textContent=subtitle||"";document.querySelector("#modalBody").innerHTML=body;document.querySelector("#modal").classList.remove("hidden")}
function closeModal(){document.querySelector("#modal").classList.add("hidden")}

function openProduct(id){
  if(session.role!=="admin"){toast("Somente administradores podem cadastrar ou editar produtos.","error");return}
  const p=id?getProduct(id):null;
  const cats=db.categories.map(x=>`<option ${p?.category===x?"selected":""}>${esc(x)}</option>`).join("");
  const units=db.units.map(x=>`<option ${p?.unit===x?"selected":""}>${esc(x)}</option>`).join("");
  const locs=db.locations.map(x=>`<option ${p?.location===x?"selected":""}>${esc(x)}</option>`).join("");
  openModal(p?"Editar produto":"Novo produto","Preencha os dados do material.",`<form id="productForm"><div class="form-grid">
    <div class="form-group"><label>Código <span class="required">*</span><input name="id" required value="${p?.id||"P"+String(Date.now()).slice(-4)}" ${p?"readonly":""}></label></div>
    <div class="form-group"><label>Nome do produto <span class="required">*</span><input name="name" required value="${esc(p?.name||"")}"></label></div>
    <div class="form-group"><label>Categoria <select name="category">${cats}</select></label></div>
    <div class="form-group"><label>Unidade <select name="unit">${units}</select></label></div>
    <div class="form-group"><label>Localização <select name="location">${locs}</select></label></div>
    <div class="form-group"><label>Fornecedor<input name="supplier" value="${esc(p?.supplier||"")}"></label></div>
    <div class="form-group"><label>Estoque atual <input type="number" min="0" name="stock" required value="${p?.stock??0}"></label></div>
    <div class="form-group"><label>Estoque mínimo <input type="number" min="0" name="min" required value="${p?.min??0}"></label></div>
  </div><div class="form-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button><button class="btn btn-primary">Salvar produto</button></div></form>`);
  document.querySelector("#productForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),o=Object.fromEntries(f);o.stock=+o.stock;o.min=+o.min;if(p)Object.assign(p,o);else{if(getProduct(o.id)){toast("Código já existe.","error");return}db.products.push(o)}saveDB();closeModal();renderAll();toast(p?"Produto atualizado.":"Produto cadastrado.")};
}
function deleteProduct(id){if(!confirm("Excluir este produto? O histórico de movimentações será mantido."))return;db.products=db.products.filter(p=>p.id!==id);saveDB();renderAll();toast("Produto excluído.")}
function openMovement(){
  const opts=db.products.map(p=>`<option value="${p.id}">${esc(p.id)} — ${esc(p.name)} (saldo: ${p.stock} ${p.unit})</option>`).join("");
  openModal("Registrar movimentação","O estoque será atualizado automaticamente.",`<form id="movementForm"><div class="form-grid">
    <div class="form-group"><label>Tipo <span class="required">*</span><select name="type"><option value="entrada">Entrada</option><option value="saida">Saída</option><option value="devolucao">Devolução</option><option value="ajuste">Ajuste</option></select></label></div>
    <div class="form-group"><label>Produto <span class="required">*</span><select name="productId">${opts}</select></label></div>
    <div class="form-group"><label>Quantidade <span class="required">*</span><input type="number" name="qty" min="1" required value="1"></label></div>
    <div class="form-group"><label>Responsável<input name="user" value="${esc(session.name)}"></label></div>
    <div class="form-group full"><label>Observação<textarea name="note" placeholder="Ex.: OP-2026-041, reposição, contagem física..."></textarea></label></div>
  </div><div class="form-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button><button class="btn btn-primary">Registrar</button></div></form>`);
  document.querySelector("#movementForm").onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target)),p=getProduct(f.productId);const qty=+f.qty;let delta=0;if(f.type==="entrada"||f.type==="devolucao")delta=qty;else if(f.type==="saida")delta=-qty;else{const target=prompt(`Ajuste: informe o novo estoque para ${p.name}`,p.stock);if(target===null)return;delta=+target-p.stock}if(p.stock+delta<0){toast("Estoque insuficiente para esta saída.","error");return}p.stock+=delta;db.movements.push({id:Date.now(),date:new Date().toISOString(),type:f.type,productId:f.productId,qty:Math.abs(delta),user:f.user||session.name,note:f.note||"—"});saveDB();closeModal();renderAll();toast("Movimentação registrada.")};
}
function openOrder(){
  if(session.role!=="admin"){toast("Somente administradores podem criar ordens.","error");return}
  openModal("Nova ordem de produção","Informe o produto final e os materiais necessários.",`<form id="orderForm"><div class="form-grid">
  <div class="form-group"><label>Número da ordem <span class="required">*</span><input name="id" required value="OP-${new Date().getFullYear()}-${String(db.orders.length+42).padStart(3,"0")}"></label></div>
  <div class="form-group"><label>Produto a fabricar <span class="required">*</span><input name="product" required placeholder="Ex.: Painel elétrico PE-20"></label></div>
  <div class="form-group"><label>Quantidade <input type="number" name="qty" min="1" value="1"></label></div>
  <div class="form-group"><label>Data <input type="date" name="date" value="${new Date().toISOString().slice(0,10)}"></label></div>
  <div class="form-group"><label>Status <select name="status"><option>Planejada</option><option>Em produção</option><option>Concluída</option></select></label></div>
  <div class="form-group full"><label>Materiais necessários <textarea name="materials" placeholder="Um por linha. Ex.:&#10;Cabo flexível 2,5mm — 120 m&#10;Contator 18A 220V — 60 un"></textarea></label></div>
  </div><div class="form-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button><button class="btn btn-primary">Criar ordem</button></div></form>`);
  document.querySelector("#orderForm").onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));const materials=(f.materials||"").split("\n").filter(Boolean).map(x=>{const a=x.split("—");return[a[0].trim(),(a[1]||"").trim()]});db.orders.unshift({id:f.id,product:f.product,qty:+f.qty,status:f.status,date:f.date,materials});saveDB();closeModal();renderAll();toast("Ordem criada.")};
}
function openRegistration(kind,title,key){
  if(session.role!=="admin"){toast("Somente administradores podem alterar cadastros.","error");return}
  openModal(title,"O registro ficará disponível nos formulários do sistema.",`<form id="regForm"><div class="form-group"><label>Nome <span class="required">*</span><input name="value" required autofocus></label></div><div class="form-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button><button class="btn btn-primary">Adicionar</button></div></form>`);
  document.querySelector("#regForm").onsubmit=e=>{e.preventDefault();const v=new FormData(e.target).get("value").trim();if(!v)return;if(db[key].includes(v)){toast("Esse registro já existe.","error");return}db[key].push(v);saveDB();closeModal();renderAll();toast("Cadastro adicionado.")};
}
function removeRegistration(key,i){
  if(!confirm("Excluir este cadastro auxiliar?"))return;db[key].splice(i,1);saveDB();renderAll();toast("Cadastro excluído.");
}
function printReport(kind){
  const old=document.title;document.title=`Relatório StockForge — ${kind}`;
  if(kind==="stock"){navigate("products")}else if(kind==="movements"){navigate("movements")}else{navigate("orders")}
  setTimeout(()=>{window.print();document.title=old},200);
}
window.openProduct=openProduct;window.deleteProduct=deleteProduct;window.closeModal=closeModal;window.removeRegistration=removeRegistration;
init();
