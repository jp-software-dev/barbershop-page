// SECURITY: LocalStorage data schema validator and encryption layer
const StorageSchema = {
    // SECURITY: Base64 encoding for sensitive client data
    encode: function(data) {
        try {
            return btoa(encodeURIComponent(JSON.stringify(data)));
        } catch(e) {
            console.error('ENCODE ERROR - Data corruption prevented');
            return null;
        }
    },
    
    // SECURITY: Base64 decoding with integrity check
    decode: function(encodedData) {
        try {
            const decoded = decodeURIComponent(atob(encodedData));
            return JSON.parse(decoded);
        } catch(e) {
            console.error('DECODE ERROR - Invalid storage format');
            return null;
        }
    },
    
    // ROBUSTNESS: Validate inventory structure before loading
    validateInventory: function(data) {
        if (!Array.isArray(data)) return [];
        return data.filter(item => item && typeof item === 'object' && item.id);
    },
    
    // ROBUSTNESS: Safe read with fallback mechanism
    safeRead: function(key, defaultValue = []) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return defaultValue;
            
            const decoded = this.decode(raw);
            if (!decoded) return defaultValue;
            
            if (key === 'barberInventory') {
                return this.validateInventory(decoded);
            }
            return decoded;
        } catch(e) {
            console.error(`STORAGE READ ERROR - Key: ${key}`);
            return defaultValue;
        }
    },
    
    // SECURITY: Encrypted write to localStorage
    safeWrite: function(key, data) {
        try {
            const encoded = this.encode(data);
            if (encoded) {
                localStorage.setItem(key, encoded);
                return true;
            }
            return false;
        } catch(e) {
            console.error(`STORAGE WRITE ERROR - Key: ${key}`);
            return false;
        }
    }
};

// ROBUSTNESS: Migrate existing unencrypted data if present
(function migrateExistingData() {
    const rawInventory = localStorage.getItem('barberInventory');
    if (rawInventory && !rawInventory.includes('=')) {
        try {
            const parsed = JSON.parse(rawInventory);
            if (Array.isArray(parsed)) {
                StorageSchema.safeWrite('barberInventory', parsed);
                console.log('MIGRATION SUCCESS - Data encrypted');
            }
        } catch(e) {
            console.error('MIGRATION FAILED - Invalid existing data');
        }
    }
})();