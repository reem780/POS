export const api = {
    async request(url, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (body) options.body = JSON.stringify(body);
        
        try {
            const response = await fetch(url, options);
            const contentType = response.headers.get('content-type');
            
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                if (!response.ok) throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}`);
                return text;
            }

            if (!response.ok) throw new Error(data.error || 'Server error');
            return data;
        } catch (error) {
            throw error;
        }
    },

    auth: {
        login: (credentials) => api.request('/internship/api/login.php', 'POST', credentials),
        logout: () => api.request('/internship/api/auth.php', 'POST'),
        me: () => api.request('/internship/api/auth.php')
    },

    products: {
        list: (q = '') => api.request(`/internship/api/products.php?q=${q}`),
        create: (data) => api.request('/internship/api/products.php', 'POST', data),
        update: (id, data) => api.request(`/internship/api/products.php?id=${id}`, 'PUT', data),
        delete: (id) => api.request(`/internship/api/products.php?id=${id}`, 'DELETE')
    },

    categories: {
        list: () => api.request('/internship/api/categories.php'),
        create: (data) => api.request('/internship/api/categories.php', 'POST', data),
        update: (id, data) => api.request(`/internship/api/categories.php?id=${id}`, 'PUT', data),
        delete: (id) => api.request(`/internship/api/categories.php?id=${id}`, 'DELETE')
    },

    sales: {
        list: () => api.request('/internship/api/sales.php'),
        create: (data) => api.request('/internship/api/sales.php', 'POST', data),
        summary: () => api.request('/internship/api/reports.php?type=summary')
    },

    settings: {
        get: () => api.request('/internship/api/settings.php'),
        save: (data) => api.request('/internship/api/settings.php', 'POST', data)
    },

    customers: {
        list: () => api.request('/internship/api/customers.php'),
        create: (data) => api.request('/internship/api/customers.php', 'POST', data)
    },

    suppliers: {
        list: () => api.request('/internship/api/suppliers.php'),
        create: (data) => api.request('/internship/api/suppliers.php', 'POST', data)
    }
};
