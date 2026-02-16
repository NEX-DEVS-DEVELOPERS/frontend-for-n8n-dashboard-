
import { apiFetch } from './api';

export interface Product {
    id: string;
    name: string;
    description: string;
    prices: Array<{
        amountType: string;
        priceAmount: number;
        priceCurrency: string;
        recurringInterval: string;
    }>;
}

export const paymentApi = {
    // Get products from Polar
    getProducts: async () => {
        return apiFetch<{ products: Product[] }>('/payments/products');
    },

    // Create a checkout session
    createCheckout: async (productId: string) => {
        return apiFetch<{ url: string }>('/payments/checkout', {
            method: 'POST',
            body: JSON.stringify({ productId }),
        });
    },
};
