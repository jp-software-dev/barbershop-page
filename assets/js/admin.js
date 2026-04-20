// AUTH: Session verification for admin panel access
(function checkAuth() {
    if (window.location.pathname.includes('admin-panel')) {
        const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
        if (!isAuthenticated || isAuthenticated !== 'true') {
            window.location.href = 'admin-login.html';
        }
    }
})();

// CONTROLLER: Main admin panel logic with CRUD integration
const adminController = {
    inventory: [],

    // INIT: Bootstrap admin panel with session data
    init: function() {
        const userBadge = document.getElementById('adminUserBadge');
        if (userBadge) {
            const user = sessionStorage.getItem('adminUser') || 'Admin';
            userBadge.innerHTML = `<i class="fas fa-user-circle"></i> ${user}`;
        }
        this.cargarInventario();
        this.configurarEventos();
        this.renderizar();
        this.actualizarEstadisticas();
        this.cambiarCategoria();
    },

    // STORAGE: Load inventory using secure CRUD helper
    cargarInventario: function() {
        this.inventory = InventoryCRUD.getAll();
    },

    // STORAGE: Save inventory using encrypted storage
    guardarInventario: function() {
        InventoryCRUD._save(this.inventory);
    },

    // EVENTS: Bind form and UI interactions
    configurarEventos: function() {
        const form = document.getElementById('adminForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarProducto();
            });
        }
        const fotoInput = document.getElementById('pFoto');
        if (fotoInput) {
            fotoInput.addEventListener('change', (e) => {
                this.previewImagen(e);
            });
        }
        const categoriaSelect = document.getElementById('pCategoria');
        if (categoriaSelect) {
            categoriaSelect.addEventListener('change', () => {
                this.cambiarCategoria();
            });
        }
    },

    // UI: Dynamic stock fields based on category selection
    cambiarCategoria: function() {
        const categoria = document.getElementById('pCategoria').value;
        const container = document.getElementById('stockFieldsContainer');
        if (!container) return;

        if (categoria === 'ropa') {
            container.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
                    <div class="form-group"><label class="form-label">Talla S</label><input type="number" id="stockS" min="0" value="0" class="admin-input"></div>
                    <div class="form-group"><label class="form-label">Talla M</label><input type="number" id="stockM" min="0" value="0" class="admin-input"></div>
                    <div class="form-group"><label class="form-label">Talla L</label><input type="number" id="stockL" min="0" value="0" class="admin-input"></div>
                    <div class="form-group"><label class="form-label">Talla XL</label><input type="number" id="stockXL" min="0" value="0" class="admin-input"></div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Stock Total</label>
                    <input type="number" id="pStock" min="0" placeholder="10" required class="admin-input">
                </div>
            `;
        }
    },

    // UTILITY: Get correct image path with fallback
    getImagePath: function(imgPath) {
        if (!imgPath) return 'assets/img/placeholder.jpg';
        if (imgPath.startsWith('data:')) return imgPath;
        if (imgPath.startsWith('http')) return imgPath;
        if (imgPath.startsWith('assets/')) return imgPath;
        if (imgPath.startsWith('img/')) return imgPath.replace('img/', 'assets/img/');
        return 'assets/img/placeholder.jpg';
    },

    // UI: Preview gallery for uploaded images
    previewImagen: function(event) {
        const gallery = document.getElementById('previewGallery');
        if (!gallery) return;
        
        gallery.innerHTML = '';
        const files = event.target.files;
        
        if (files && files.length > 0) {
            Array.from(files).forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'preview-image';
                    img.style.width = '80px';
                    img.style.height = '80px';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '16px';
                    img.style.border = index === 0 ? '3px solid #000000' : '1px solid #ccc';
                    img.title = index === 0 ? 'Imagen principal' : `Imagen ${index + 1}`;
                    gallery.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        } else {
            gallery.innerHTML = '<img src="assets/img/placeholder.jpg" class="preview-image" style="width:80px; height:80px; border-radius:16px;">';
        }
    },

    // UTILITY: Image compression to reduce localStorage size
    comprimirImagen: function(file, calidad = 0.7, maxWidth = 800) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const compressedBase64 = canvas.toDataURL('image/jpeg', calidad);
                    resolve(compressedBase64);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    },

    // CRUD: Save or update product using centralized helper
    guardarProducto: async function() {
        const btn = document.getElementById('btnGuardar');
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        btn.disabled = true;
        
        const id = document.getElementById('productId').value;
        const nombre = document.getElementById('pNombre').value;
        let precio = document.getElementById('pPrecio').value;
        const categoria = document.getElementById('pCategoria').value;
        const descText = document.getElementById('pDesc').value;
        const caracteristicas = descText ? descText.split(',').map(c => c.trim()) : [];
        
        if (!precio.startsWith('$')) precio = '$' + precio;

        const fotoInput = document.getElementById('pFoto');
        const files = fotoInput.files;
        const productoExistente = this.inventory.find(p => p.id == id);

        try {
            let listaImagenes = [];
            
            if (files && files.length > 0) {
                const promesas = [];
                for (let i = 0; i < files.length; i++) {
                    if (files[i].size > 500 * 1024) {
                        promesas.push(this.comprimirImagen(files[i], 0.6, 800));
                    } else {
                        promesas.push(new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = (e) => resolve(e.target.result);
                            reader.readAsDataURL(files[i]);
                        }));
                    }
                }
                listaImagenes = await Promise.all(promesas);
            } else if (productoExistente) {
                listaImagenes = productoExistente.imagenes || [productoExistente.img];
            } else {
                listaImagenes = ['assets/img/placeholder.jpg'];
            }

            let stockTotal = 0;
            let stockPorTalla = null;
            
            if (categoria === 'ropa') {
                const s = parseInt(document.getElementById('stockS')?.value || 0);
                const m = parseInt(document.getElementById('stockM')?.value || 0);
                const l = parseInt(document.getElementById('stockL')?.value || 0);
                const xl = parseInt(document.getElementById('stockXL')?.value || 0);
                stockPorTalla = { S: s, M: m, L: l, XL: xl };
                stockTotal = s + m + l + xl;
            } else {
                stockTotal = parseInt(document.getElementById('pStock')?.value || 0);
            }

            const productData = {
                nombre,
                precio,
                precioFormato: precio,
                categoria,
                stock: stockTotal,
                stockPorTalla,
                caracteristicas,
                img: listaImagenes[0] || 'assets/img/placeholder.jpg',
                imagenes: listaImagenes
            };

            if (id) {
                InventoryCRUD.update(id, productData);
            } else {
                InventoryCRUD.create(productData);
            }

            this.inventory = InventoryCRUD.getAll();
            this.renderizar();
            this.actualizarEstadisticas();
            this.limpiarFormulario();
            
            alert(`✅ Producto guardado correctamente con ${listaImagenes.length} imágenes.`);
            
        } catch (err) {
            console.error("Error en el guardado:", err);
            alert("❌ Error al procesar el producto. Intenta de nuevo.");
        } finally {
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        }
    },

    // RENDER: Display inventory cards using DOM optimizer with image fix
    renderizar: function() {
        const grid = document.getElementById('adminGrid');
        if (!grid) return;

        if (this.inventory.length === 0) {
            grid.innerHTML = '<p class="no-products">No hay productos en el inventario</p>';
            return;
        }

        // PERFORMANCE: Clear grid and render with batch processing
        grid.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        this.inventory.forEach((p) => {
            const totalImagenes = p.imagenes ? p.imagenes.length : 1;
            let icono = '📦';
            if (p.categoria === 'ropa') icono = '👕';
            else if (p.categoria === 'perfumes') icono = '✨';
            else if (p.categoria === 'grooming') icono = '🧴';
            
            // FIX IMAGE PATH: Use helper function
            const imageSrc = this.getImagePath(p.img);

            const tallasHTML = p.stockPorTalla ? `
                <div style="display: flex; gap: 5px; justify-content: center; margin: 10px 0; font-size: 0.85rem;">
                    <span style="background: #f0f0f0; padding: 3px 8px; border-radius: 50px;">S:${p.stockPorTalla.S || 0}</span>
                    <span style="background: #f0f0f0; padding: 3px 8px; border-radius: 50px;">M:${p.stockPorTalla.M || 0}</span>
                    <span style="background: #f0f0f0; padding: 3px 8px; border-radius: 50px;">L:${p.stockPorTalla.L || 0}</span>
                    <span style="background: #f0f0f0; padding: 3px 8px; border-radius: 50px;">XL:${p.stockPorTalla.XL || 0}</span>
                </div>
            ` : '<div style="margin: 10px 0;"></div>';

            const card = document.createElement('div');
            card.className = 'product-card admin-card';
            card.innerHTML = `
                <div class="product-image" style="position: relative;">
                    <img src="${imageSrc}" alt="${p.nombre}" 
                         onerror="this.src='assets/img/placeholder.jpg'" 
                         style="width:100%; height:180px; object-fit:cover; border-radius:16px;">
                    <span class="category-badge" style="position:absolute; top:10px; right:10px; background:#000; color:white; padding:5px 12px; border-radius:50px; font-size:0.75rem;">
                        ${icono} ${p.categoria} | ${totalImagenes} 📸
                    </span>
                </div>
                <div class="admin-product-info" style="padding:15px;">
                    <h3 style="font-size:1.1rem; margin-bottom:8px;">${this.escapeHtml(p.nombre)}</h3>
                    <p class="price" style="font-size:1.3rem; font-weight:700; color:#000;">${p.precio || '$0'}</p>
                    ${tallasHTML}
                    <div style="text-align: center; margin: 10px 0;">
                        <span style="background: #333; color: white; padding: 5px 15px; border-radius: 50px;">
                            <i class="fas fa-cubes" style="margin-right: 5px;"></i> Stock: ${p.stock || 0}
                        </span>
                    </div>
                    <div class="admin-actions" style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn-warning" onclick="adminController.editarProducto(${p.id})" style="flex:1; padding:12px; background:#000; color:#fff; border:none; border-radius:50px; cursor:pointer;">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-danger" onclick="adminController.eliminarProducto(${p.id})" style="flex:1; padding:12px; background:#fff; color:#000; border:1px solid #000; border-radius:50px; cursor:pointer;">
                            <i class="fas fa-trash"></i> Borrar
                        </button>
                    </div>
                </div>
            `;
            fragment.appendChild(card);
        });
        
        grid.appendChild(fragment);
    },

    // UTILITY: Escape HTML to prevent XSS
    escapeHtml: function(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    },

    // CRUD: Load product data into form for editing
    editarProducto: function(id) {
        const producto = InventoryCRUD.getById(id);
        if (producto) {
            document.getElementById('productId').value = producto.id;
            document.getElementById('pNombre').value = producto.nombre;
            document.getElementById('pPrecio').value = producto.precio;
            document.getElementById('pCategoria').value = producto.categoria;
            document.getElementById('pDesc').value = producto.caracteristicas ? producto.caracteristicas.join(', ') : '';

            const gallery = document.getElementById('previewGallery');
            if (gallery) {
                gallery.innerHTML = '';
                const imagenes = producto.imagenes || [producto.img];
                imagenes.forEach((imgSrc, index) => {
                    const img = document.createElement('img');
                    img.src = this.getImagePath(imgSrc);
                    img.className = 'preview-image';
                    img.style.width = '80px';
                    img.style.height = '80px';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '16px';
                    img.style.border = index === 0 ? '3px solid #000000' : '1px solid #ccc';
                    img.title = index === 0 ? 'Imagen principal' : `Imagen ${index + 1}`;
                    img.onerror = () => { img.src = 'assets/img/placeholder.jpg'; };
                    gallery.appendChild(img);
                });
            }

            this.cambiarCategoria();

            if (producto.categoria === 'ropa' && producto.stockPorTalla) {
                setTimeout(() => {
                    if (document.getElementById('stockS')) document.getElementById('stockS').value = producto.stockPorTalla.S || 0;
                    if (document.getElementById('stockM')) document.getElementById('stockM').value = producto.stockPorTalla.M || 0;
                    if (document.getElementById('stockL')) document.getElementById('stockL').value = producto.stockPorTalla.L || 0;
                    if (document.getElementById('stockXL')) document.getElementById('stockXL').value = producto.stockPorTalla.XL || 0;
                }, 100);
            } else if (document.getElementById('pStock')) {
                document.getElementById('pStock').value = producto.stock || 0;
            }

            document.getElementById('btnGuardar').innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Producto';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    // CRUD: Delete product with confirmation
    eliminarProducto: function(id) {
        if (confirm('¿Estás seguro de eliminar este producto?')) {
            InventoryCRUD.delete(id);
            this.inventory = InventoryCRUD.getAll();
            this.renderizar();
            this.actualizarEstadisticas();
        }
    },

    // UI: Update statistics badges
    actualizarEstadisticas: function() {
        const totalEl = document.getElementById('totalProductos');
        const stockEl = document.getElementById('stockTotal');
        
        if (totalEl) {
            totalEl.innerHTML = `<i class="fas fa-box"></i> ${this.inventory.length} Productos`;
        }
        if (stockEl) {
            const stockTotal = InventoryCRUD.getTotalStock();
            stockEl.innerHTML = `<i class="fas fa-cubes"></i> ${stockTotal} Stock Total`;
        }
    },

    // UI: Reset form to initial state
    limpiarFormulario: function() {
        document.getElementById('adminForm').reset();
        document.getElementById('productId').value = '';
        const gallery = document.getElementById('previewGallery');
        if (gallery) gallery.innerHTML = '<img src="assets/img/placeholder.jpg" class="preview-image" style="width:80px; height:80px; border-radius:16px;">';
        document.getElementById('btnGuardar').innerHTML = '<i class="fas fa-save"></i> Publicar Producto';
        this.cambiarCategoria();
    },

    // AUTH: Destroy session and redirect to login
    logout: function() {
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminUser');
        window.location.href = 'admin-login.html';
    }
};

// INIT: Bootstrap admin controller on page load
document.addEventListener('DOMContentLoaded', function() {
    adminController.init();
});

// GLOBAL: Expose controller for HTML button callbacks
window.adminController = adminController;