// HELPER: Centralized CRUD operations for inventory management
const InventoryCRUD = {
    // READ: Get all products with optional filtering
    getAll: function() {
        return StorageSchema.safeRead('barberInventory', []);
    },
    
    // READ: Get products by category
    getByCategory: function(category) {
        const products = this.getAll();
        if (category === 'todo') return products;
        return products.filter(p => p.categoria && p.categoria.toLowerCase() === category.toLowerCase());
    },
    
    // READ: Find single product by ID
    getById: function(id) {
        const products = this.getAll();
        return products.find(p => p.id === parseInt(id));
    },
    
    // READ: Search products by name or category
    search: function(term) {
        const products = this.getAll();
        const lowerTerm = term.toLowerCase().trim();
        if (!lowerTerm) return products;
        
        return products.filter(p => 
            p.nombre.toLowerCase().includes(lowerTerm) ||
            (p.categoria && p.categoria.toLowerCase().includes(lowerTerm))
        );
    },
    
    // CREATE: Add new product with timestamp
    create: function(productData) {
        const products = this.getAll();
        const newProduct = {
            ...productData,
            id: Date.now(),
            fechaCreacion: new Date().toISOString()
        };
        products.push(newProduct);
        this._save(products);
        return newProduct;
    },
    
    // UPDATE: Modify existing product
    update: function(id, updatedData) {
        const products = this.getAll();
        const index = products.findIndex(p => p.id === parseInt(id));
        if (index === -1) return null;
        
        products[index] = { ...products[index], ...updatedData, id: parseInt(id) };
        this._save(products);
        return products[index];
    },
    
    // DELETE: Remove product permanently
    delete: function(id) {
        const products = this.getAll();
        const filtered = products.filter(p => p.id !== parseInt(id));
        this._save(filtered);
        return true;
    },
    
    // UTILITY: Get total stock count
    getTotalStock: function() {
        const products = this.getAll();
        return products.reduce((total, p) => total + (p.stock || 0), 0);
    },
    
    // UTILITY: Private save method with encryption
    _save: function(products) {
        StorageSchema.safeWrite('barberInventory', products);
        window.dispatchEvent(new CustomEvent('inventoryUpdated', { detail: products }));
    }
};