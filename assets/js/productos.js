// STORAGE: Global products array
let productos = [];

// UTILITY: Get correct image path with fallback
function getImagePath(imgPath) {
    if (!imgPath) return 'assets/img/placeholder.jpg';
    if (imgPath.startsWith('data:')) return imgPath;
    if (imgPath.startsWith('http')) return imgPath;
    if (imgPath.startsWith('assets/')) return imgPath;
    if (imgPath.startsWith('img/')) return imgPath.replace('img/', 'assets/img/');
    return 'assets/img/placeholder.jpg';
}

// INIT: Load products from secure storage
function cargarProductos() {
    productos = InventoryCRUD.getAll();
    
    if (!productos || productos.length === 0) {
        // DEFAULT: Seed initial product catalog with correct paths
        productos = [
            {
                id: 1,
                nombre: "Kit Grooming Premium",
                categoria: "grooming",
                precio: "$580",
                precioFormato: "$580",
                img: "assets/img/productos/pro2.jpg",
                imagenes: ["assets/img/productos/pro2.jpg", "assets/img/productos/pro3.jpg", "assets/img/productos/pro1.jpg"],
                stock: 5,
                stockPorTalla: null,
                caracteristicas: ["Incluye 4 productos", "Cera, shampoo, acondicionador y aceite", "Maletín de regalo"]
            },
            {
                id: 2,
                nombre: "Cera Modeladora Mate",
                categoria: "grooming",
                precio: "$220",
                precioFormato: "$220",
                img: "assets/img/productos/pro1.jpg",
                imagenes: ["assets/img/productos/pro1.jpg", "assets/img/productos/pro2.jpg", "assets/img/productos/pro3.jpg"],
                stock: 8,
                stockPorTalla: null,
                caracteristicas: ["Fijación fuerte (8/10)", "Acabado mate", "Resiste la humedad"]
            },
            {
                id: 3,
                nombre: "Spray Fijación Extrafuerte",
                categoria: "grooming",
                precio: "$190",
                precioFormato: "$190",
                img: "assets/img/productos/pro3.jpg",
                imagenes: ["assets/img/productos/pro3.jpg", "assets/img/productos/pro1.jpg", "assets/img/productos/pro2.jpg"],
                stock: 12,
                stockPorTalla: null,
                caracteristicas: ["Fijación extrema (10/10)", "Brillo moderado", "Secado rápido"]
            },
            {
                id: 4,
                nombre: "Sudadera Dino Dreams",
                categoria: "ropa",
                precio: "$450",
                precioFormato: "$450",
                img: "assets/img/ropa/img1.jpg",
                imagenes: ["assets/img/ropa/img1.jpg", "assets/img/ropa/img2.jpg", "assets/img/ropa/img3.jpg"],
                stockPorTalla: { S: 2, M: 1, L: 0, XL: 1 },
                stock: 4,
                caracteristicas: ["Algodón premium 320gr", "Estampado serigrafiado", "Capucha ajustable"]
            },
            {
                id: 5,
                nombre: "Sudadera Good Vibes",
                categoria: "ropa",
                precio: "$450",
                precioFormato: "$450",
                img: "assets/img/ropa/img2.jpg",
                imagenes: ["assets/img/ropa/img2.jpg", "assets/img/ropa/img3.jpg", "assets/img/ropa/img1.jpg"],
                stockPorTalla: { S: 0, M: 1, L: 1, XL: 0 },
                stock: 2,
                caracteristicas: ["Mezcla de algodón y poliéster", "Estampado en vinil textil", "Unisex"]
            },
            {
                id: 6,
                nombre: "Perfume Black Edition",
                categoria: "perfumes",
                precio: "$850",
                precioFormato: "$850",
                img: "assets/img/Perfumes/per1.jpg",
                imagenes: ["assets/img/Perfumes/per1.jpg"],
                stock: 5,
                stockPorTalla: null,
                caracteristicas: ["Notas amaderadas", "Duración de 8 horas", "Presentación de 100ml"]
            }
        ];
        InventoryCRUD._save(productos);
        console.log('Productos por defecto guardados');
    }
    
    return productos;
}

productos = cargarProductos();

// EVENT: Listen for inventory updates from admin panel
window.addEventListener('inventoryUpdated', function(e) {
    productos = e.detail;
    if (document.getElementById('productGrid') && typeof window.renderProductos === 'function') {
        window.renderProductos('todo');
    }
});

// MODAL: Open product modal with ID lookup
window.openModal = function(id) {
    console.log('Abriendo modal para producto ID:', id);
    
    const modalAbierto = document.getElementById('productModal');
    if (modalAbierto && modalAbierto.classList.contains('active')) {
        if (window.Lightbox) {
            Lightbox.cerrarModal();
        }
    }
    
    setTimeout(() => {
        const producto = InventoryCRUD.getById(id);
        
        if (producto) {
            const productoCopia = JSON.parse(JSON.stringify(producto));
            
            // FIX: Ensure images have correct paths
            if (productoCopia.img) {
                productoCopia.img = getImagePath(productoCopia.img);
            }
            if (productoCopia.imagenes) {
                productoCopia.imagenes = productoCopia.imagenes.map(img => getImagePath(img));
            }
            
            if (window.Lightbox) {
                Lightbox.abrirModal(productoCopia, 0);
            } else {
                console.error('Lightbox no está definido');
            }
        } else {
            console.error('Producto no encontrado con ID:', id);
        }
    }, 50);
};

// RENDER: Display products grid with category filter
window.renderProductos = function(filtro = "todo") {
    const grid = document.getElementById('productGrid');
    if (!grid) {
        console.log('No hay grid de productos');
        return;
    }

    const listadoActual = InventoryCRUD.getByCategory(filtro);

    if (listadoActual.length === 0) {
        grid.innerHTML = '<p class="no-products">No se encontraron productos en esta categoría.</p>';
        return;
    }

    const getCategoriaTexto = (categoria) => {
        if (!categoria) return 'PRODUCTO';
        const cat = categoria.toLowerCase();
        if (cat === 'ropa') return 'ROPA';
        if (cat === 'perfumes') return 'PERFUMES';
        if (cat === 'grooming') return 'PRODUCTOS';
        return categoria.toUpperCase();
    };

    // PERFORMANCE: Use DocumentFragment for batch rendering
    const fragment = document.createDocumentFragment();
    
    listadoActual.forEach((p) => {
        const imageSrc = getImagePath(p.img);
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer';
        card.setAttribute('onclick', `openModal(${p.id})`);
        card.innerHTML = `
            <div class="product-image-box">
                <img src="${imageSrc}" alt="${p.nombre || 'Producto'}" loading="lazy" onerror="this.src='assets/img/placeholder.jpg'">
            </div>
            <div class="product-details">
                <h3 class="product-title">${escapeHtml(p.nombre || 'Producto sin nombre')}</h3>
                <span class="product-category-label">${getCategoriaTexto(p.categoria)}</span>
                <p class="product-price">${p.precio || '$???'}</p>
            </div>
        `;
        fragment.appendChild(card);
    });
    
    grid.innerHTML = '';
    grid.appendChild(fragment);
    
    console.log('Renderizado completado, productos:', listadoActual.length);
};

// UTILITY: Escape HTML to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// SEARCH: Filter products by search term
window.buscarProductos = function() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    
    const termino = input.value.toLowerCase().trim();
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    const filtrados = InventoryCRUD.search(termino);
    
    if (termino === '') {
        window.renderProductos('todo');
        return;
    }
    
    if (filtrados.length === 0) {
        grid.innerHTML = '<p class="no-products">No se encontraron productos</p>';
        return;
    }
    
    const getCategoriaTexto = (categoria) => {
        if (!categoria) return 'PRODUCTO';
        const cat = categoria.toLowerCase();
        if (cat === 'ropa') return 'ROPA';
        if (cat === 'perfumes') return 'PERFUMES';
        if (cat === 'grooming') return 'PRODUCTOS';
        return categoria.toUpperCase();
    };
    
    // PERFORMANCE: Use DocumentFragment for batch rendering
    const fragment = document.createDocumentFragment();
    
    filtrados.forEach((p) => {
        const imageSrc = getImagePath(p.img);
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer';
        card.setAttribute('onclick', `openModal(${p.id})`);
        card.innerHTML = `
            <div class="product-image-box">
                <img src="${imageSrc}" alt="${p.nombre}" loading="lazy" onerror="this.src='assets/img/placeholder.jpg'">
            </div>
            <div class="product-details">
                <h3 class="product-title">${escapeHtml(p.nombre)}</h3>
                <span class="product-category-label">${getCategoriaTexto(p.categoria)}</span>
                <p class="product-price">${p.precio}</p>
            </div>
        `;
        fragment.appendChild(card);
    });
    
    grid.innerHTML = '';
    grid.appendChild(fragment);
};

// INIT: Initial render on page load
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('productGrid')) {
        window.renderProductos('todo');
    }
});