// Robust e-commerce frontend (pure HTML/CSS/JS)
// LocalStorage keys
const LS_PRODUCTS = 'devshop_products_v1';
const LS_CART = 'devshop_cart_v1';
const LS_ORDERS = 'devshop_orders_v1';

// Default seed products
const defaultProducts = [
  {
    id: 'p1',
    name: 'Urban Runner Sneakers',
    price: 2499,
    category: 'Shoes',
    image: 'images/sneakers.svg',
    description: 'Lightweight, breathable sneakers built for city runs.'
  },
  {
    id: 'p2',
    name: 'Aurora Headphones',
    price: 3999,
    category: 'Electronics',
    image: 'images/headphones.svg',
    description: 'Over-ear headphones with immersive audio & long battery life.'
  },
  {
    id: 'p3',
    name: 'Minimalist Backpack',
    price: 1999,
    category: 'Bags',
    image: 'images/backpack.svg',
    description: 'Water-resistant backpack with organized compartments.'
  },
  {
    id: 'p4',
    name: 'Classic Sunglasses',
    price: 899,
    category: 'Accessories',
    image: 'images/sunglasses.svg',
    description: 'UV-protected stylish sunglasses.'
  }
];

// Utils
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const formatPrice = (n) => '₹' + n.toFixed(2);

// State
let products = [];
let cart = {};

// Init
function init(){
  loadProducts();
  loadCart();
  renderCategoryFilter();
  renderProducts();
  updateCartCount();
  attachListeners();
}

function loadProducts(){
  const raw = localStorage.getItem(LS_PRODUCTS);
  if(raw){
    try{
      products = JSON.parse(raw);
      return;
    }catch(e){
      console.warn('Invalid products in storage, re-seeding.');
    }
  }
  products = defaultProducts;
  localStorage.setItem(LS_PRODUCTS, JSON.stringify(products));
}

function saveProducts(){
  localStorage.setItem(LS_PRODUCTS, JSON.stringify(products));
}

function loadCart(){
  const raw = localStorage.getItem(LS_CART);
  if(raw){
    try{ cart = JSON.parse(raw); }catch(e){ cart={}; }
  }else cart={};
}

function saveCart(){
  localStorage.setItem(LS_CART, JSON.stringify(cart));
}

// Rendering
function renderProducts(query=''){
  const container = $('#products');
  container.innerHTML = '';
  const q = query.trim().toLowerCase();
  let list = products.slice();

  // Filters
  const cat = $('#category-filter').value;
  if(cat && cat !== 'all') list = list.filter(p=>p.category===cat);

  // Search
  if(q) list = list.filter(p=> (p.name + ' ' + p.description + ' ' + p.category).toLowerCase().includes(q));

  // Sort
  const sort = $('#sort').value;
  if(sort==='price-asc') list.sort((a,b)=>a.price-b.price);
  if(sort==='price-desc') list.sort((a,b)=>b.price-a.price);
  if(sort==='name-asc') list.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==='name-desc') list.sort((a,b)=>b.name.localeCompare(a.name)).reverse();

  if(list.length===0){
    $('#empty-note').hidden = false;
    return;
  } else $('#empty-note').hidden = true;

  list.forEach(p=>{
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-media"><img src="${p.image}" alt="${p.name}" /></div>
      <div class="product-info">
        <div style="flex:1">
          <div class="product-title">${p.name}</div>
          <div class="product-desc">${p.description || ''}</div>
        </div>
        <div style="text-align:right">
          <div class="price">${formatPrice(p.price)}</div>
          <div class="card-actions">
            <button class="btn icon-btn add-to-cart" data-id="${p.id}">Add</button>
            <button class="btn icon-btn edit-product" data-id="${p.id}">Edit</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // Attach add to cart listeners
  $$('.add-to-cart').forEach(btn=>{
    btn.onclick = ()=>{ addToCart(btn.dataset.id, 1); animateAdd(btn); };
  });
  $$('.edit-product').forEach(btn=>{
    btn.onclick = ()=>{ openAdminModal(btn.dataset.id); };
  });
}

function renderCategoryFilter(){
  const cats = ['all', ...Array.from(new Set(products.map(p=>p.category))).filter(Boolean)];
  const sel = $('#category-filter');
  sel.innerHTML = '';
  cats.forEach(c=>{
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c === 'all' ? 'All' : c;
    sel.appendChild(opt);
  });
}

// Cart functions
function addToCart(id, qty=1){
  if(!cart[id]) cart[id] = 0;
  cart[id] += qty;
  saveCart();
  updateCartCount();
  renderCartItems();
}

function removeFromCart(id){
  delete cart[id];
  saveCart();
  updateCartCount();
  renderCartItems();
}

function changeQty(id, delta){
  if(!cart[id]) return;
  cart[id] += delta;
  if(cart[id] <= 0) delete cart[id];
  saveCart();
  updateCartCount();
  renderCartItems();
}

function clearCart(){
  cart = {};
  saveCart();
  updateCartCount();
  renderCartItems();
}

function cartTotal(){
  let total = 0;
  Object.keys(cart).forEach(id=>{
    const p = products.find(x=>x.id===id);
    if(p) total += p.price * cart[id];
  });
  return total;
}

function updateCartCount(){
  const count = Object.values(cart).reduce((s,n)=>s+n,0);
  $('#cart-count').textContent = count;
}

// Cart Drawer rendering
function renderCartItems(){
  const container = $('#cart-items');
  container.innerHTML = '';
  const ids = Object.keys(cart);
  if(ids.length===0){
    container.innerHTML = '<p style="color:var(--muted)">Your cart is empty. Add something awesome!</p>';
    $('#cart-subtotal').textContent = formatPrice(0);
    return;
  }
  ids.forEach(id=>{
    const p = products.find(x=>x.id===id);
    if(!p) return;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><strong>${p.name}</strong><div style="font-size:13px;color:var(--muted)">${p.category}</div></div>
          <div class="price">${formatPrice(p.price * cart[id])}</div>
        </div>
        <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">
          <div class="qty-controls">
            <button class="btn icon-btn qty-minus" data-id="${id}">−</button>
            <div style="min-width:24px;text-align:center">${cart[id]}</div>
            <button class="btn icon-btn qty-plus" data-id="${id}">+</button>
          </div>
          <button class="btn ghost" data-id="${id}" style="height:36px" onclick="removeFromCart('${id}')">Remove</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });

  // quantity bindings
  $$('.qty-plus').forEach(b=>b.onclick = ()=>changeQty(b.dataset.id, 1));
  $$('.qty-minus').forEach(b=>b.onclick = ()=>changeQty(b.dataset.id, -1));

  $('#cart-subtotal').textContent = formatPrice(cartTotal());
}

// Animations
function animateAdd(btn){
  btn.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:220});
}

// Admin modal
function openAdminModal(editId){
  const modal = $('#admin-modal');
  modal.setAttribute('aria-hidden','false');
  if(editId){
    const p = products.find(x=>x.id===editId);
    if(p){
      $('#p-name').value = p.name;
      $('#p-price').value = p.price;
      $('#p-category').value = p.category;
      $('#p-image').value = p.image;
      $('#p-desc').value = p.description || '';
      modal.dataset.editId = editId;
    }
  } else {
    $('#product-form').reset();
    delete modal.dataset.editId;
  }
}

function closeAdminModal(){
  const modal = $('#admin-modal');
  modal.setAttribute('aria-hidden','true');
  delete modal.dataset.editId;
}

// Product form handling
function attachListeners(){
  // header actions
  $('#admin-btn').onclick = ()=>openAdminModal();
  $('#close-admin').onclick = closeAdminModal;
  $('#reset-form').onclick = (e)=>{ e.preventDefault(); $('#product-form').reset(); };

  // search
  $('#search').addEventListener('input', (e)=> renderProducts(e.target.value));

  // sort & category
  $('#sort').onchange = ()=> renderProducts($('#search').value);
  $('#category-filter').onchange = ()=> renderProducts($('#search').value);

  // cart drawer
  $('#cart-btn').onclick = ()=> openCart();
  $('#close-cart').onclick = ()=> closeCart();

  // checkout
  $('#checkout-btn').onclick = openCheckout;
  $('#close-checkout').onclick = ()=> setModal($('#checkout-modal'), false);
  $('#cancel-checkout').onclick = ()=> setModal($('#checkout-modal'), false);

  // product form submit
  $('#product-form').onsubmit = (e)=>{
    e.preventDefault();
    const modal = $('#admin-modal');
    const editId = modal.dataset.editId;
    const name = $('#p-name').value.trim();
    const price = Number($('#p-price').value) || 0;
    const category = $('#p-category').value.trim() || 'General';
    const image = $('#p-image').value.trim() || defaultImageFor(category);
    const description = $('#p-desc').value.trim();

    if(editId){
      // edit existing
      const idx = products.findIndex(p=>p.id===editId);
      if(idx>=0){
        products[idx] = {...products[idx], name, price, category, image, description};
        saveProducts();
        renderCategoryFilter();
        renderProducts($('#search').value);
        closeAdminModal();
        return;
      }
    }

    // new product
    const id = 'p' + Date.now();
    products.unshift({id,name,price,category,image,description});
    saveProducts();
    renderCategoryFilter();
    renderProducts($('#search').value);
    closeAdminModal();
  };

  // checkout form
  $('#checkout-form').onsubmit = (e)=>{
    e.preventDefault();
    placeOrder();
  };

  // scroll to products
  $('#scroll-products').onclick = ()=> location.hash = '#products';

  // clear cart
  $('#clear-cart').onclick = ()=> { if(confirm('Clear cart?')) clearCart(); };

  // click outside modal to close
  window.addEventListener('click',(e)=>{
    if(e.target === $('#admin-modal')) closeAdminModal();
    if(e.target === $('#checkout-modal')) setModal($('#checkout-modal'), false);
  });
}

// Cart drawer open/close
function openCart(){ $('#cart-drawer').classList.add('open'); renderCartItems(); }
function closeCart(){ $('#cart-drawer').classList.remove('open'); }

// Checkout flow
function openCheckout(){
  if(Object.keys(cart).length===0){ alert('Your cart is empty. Add items to checkout.'); return; }
  setModal($('#checkout-modal'), true);
  // populate summary
  const summary = $('#order-summary');
  summary.innerHTML = '';
  const ul = document.createElement('div');
  ul.innerHTML = '<h4>Order summary</h4>';
  Object.keys(cart).forEach(id=>{
    const p = products.find(x=>x.id===id);
    if(!p) return;
    const row = document.createElement('div');
    row.style.display='flex';row.style.justifyContent='space-between';row.style.marginTop='6px';
    row.innerHTML = `<div>${p.name} × ${cart[id]}</div><div>${formatPrice(p.price * cart[id])}</div>`;
    ul.appendChild(row);
  });
  const fee = 0;
  const subtotal = cartTotal();
  const total = subtotal + fee;
  const totals = document.createElement('div');
  totals.style.marginTop='12px';
  totals.innerHTML = `<hr style="margin:12px 0;border-color:rgba(255,255,255,0.04)" />
    <div style="display:flex;justify-content:space-between"><div>Subtotal</div><div>${formatPrice(subtotal)}</div></div>
    <div style="display:flex;justify-content:space-between"><div>Shipping</div><div>${formatPrice(fee)}</div></div>
    <div style="display:flex;justify-content:space-between;font-weight:800;margin-top:6px"><div>Total</div><div>${formatPrice(total)}</div></div>
  `;
  summary.appendChild(ul);
  summary.appendChild(totals);
}

function setModal(el, open){
  if(open){ el.setAttribute('aria-hidden','false'); } else el.setAttribute('aria-hidden','true');
}

// Place order (simulate)
function placeOrder(){
  const name = $('#c-name').value.trim();
  const email = $('#c-email').value.trim();
  const address = $('#c-address').value.trim();
  if(!name || !email || !address) return alert('Fill all details');

  const orders = JSON.parse(localStorage.getItem(LS_ORDERS) || '[]');
  const order = {
    id: 'o' + Date.now(),
    date: new Date().toISOString(),
    items: cart,
    total: cartTotal(),
    customer: {name,email,address}
  };
  orders.push(order);
  localStorage.setItem(LS_ORDERS, JSON.stringify(orders));
  clearCart();
  setModal($('#checkout-modal'), false);
  alert('Order placed! Order ID: ' + order.id + '\n(Stored in localStorage)');
}

// Helpers
function defaultImageFor(category){
  // use category to select a default svg
  const map = {
    'Shoes':'images/sneakers.svg',
    'Electronics':'images/headphones.svg',
    'Bags':'images/backpack.svg',
    'Accessories':'images/sunglasses.svg'
  };
  return map[category] || 'images/product.svg';
}

// Admin edit
function openAdminModalFromBtn(){
  openAdminModal();
}

// Load initial UI
init();
