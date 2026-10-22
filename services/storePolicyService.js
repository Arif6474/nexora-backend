/**
 * Authoritative business policies for Nexora E-Commerce.
 * Sourced directly from verified frontend pages and components (ProductTabs, Contact, Checkout, Footer).
 */
export const STORE_POLICIES = {
    storeName: "Nexora",
    contact: {
        email: "hello@nexora.com",
        phone: "+1 (234) 567-890",
        address: "123 Fashion Ave, New York, NY 10001",
        hours: {
            mondayFriday: "9:00 AM - 8:00 PM EST",
            saturday: "10:00 AM - 6:00 PM EST",
            sunday: "Global Concierge Active"
        }
    },
    shipping: {
        freeShippingThreshold: 200,
        currencySymbol: "$",
        standardDeliveryTime: "3 to 5 business days",
        expressDeliveryAvailable: true,
        summary: "Free standard shipping on all orders over $200. Standard orders deliver within 3-5 business days. Express delivery options are available at checkout."
    },
    returns: {
        returnWindowDays: 30,
        conditions: "Items must be unwashed, unworn, and in original condition with all tags attached.",
        refundMethods: "Refunds are processed back to the original payment method (or store credit) within 5-7 business days after inspection.",
        summary: "We offer a 30-day hassle-free return policy on unworn items in original packaging. Contact concierge at hello@nexora.com to initiate a return or exchange."
    },
    payments: {
        acceptedMethods: ["Credit / Debit Card (Visa, Mastercard, Amex)", "Cash on Delivery (COD)"],
        summary: "We accept all major Credit and Debit cards securely at checkout, as well as Cash on Delivery (COD) for eligible regions."
    },
    guestCheckout: {
        allowed: false,
        summary: "To place an order at Nexora, an account is required. Guest checkout without logging in is currently not supported. You must sign in or create an account with your email or Google account to finalize an order."
    },
    cancellation: {
        conditions: "Orders can only be cancelled while in 'Pending' status before fulfillment begins.",
        summary: "Orders may be cancelled only while their status is 'Pending'. Once an order moves to 'Processing' or 'Shipped', it cannot be cancelled directly and must follow our standard 30-day return policy. Please email hello@nexora.com with your Order ID for assistance."
    },
    discounts: {
        summary: "We occasionally offer exclusive promo codes. You can enter active discount codes at checkout before submitting your payment."
    },
    warranty: {
        summary: "All Nexora items are crafted with premium artisanal fabrics (Italian wool, Supima cotton, pure silk). We guarantee authenticity and offer quality protection on manufacturing defects."
    }
};

/**
 * Returns formatted policy context based on policy category.
 */
export function getPolicyAnswer(category) {
    switch (category) {
        case 'shipping':
            return STORE_POLICIES.shipping.summary;
        case 'returns':
        case 'refund':
        case 'exchange':
            return STORE_POLICIES.returns.summary;
        case 'payment':
            return STORE_POLICIES.payments.summary;
        case 'guest_checkout':
        case 'guestCheckout':
        case 'account':
        case 'login_requirement':
            return STORE_POLICIES.guestCheckout.summary;
        case 'cancellation':
            return STORE_POLICIES.cancellation.summary;
        case 'discounts':
        case 'promo':
            return STORE_POLICIES.discounts.summary;
        case 'contact':
        case 'hours':
            return `You can reach our concierge at ${STORE_POLICIES.contact.email} or call ${STORE_POLICIES.contact.phone}. Our flagship studio is located at ${STORE_POLICIES.contact.address}. Hours: Mon-Fri 9AM-8PM, Sat 10AM-6PM.`;
        case 'warranty':
            return STORE_POLICIES.warranty.summary;
        default:
            return `${STORE_POLICIES.shipping.summary} | ${STORE_POLICIES.guestCheckout.summary} | ${STORE_POLICIES.returns.summary} | Contact: ${STORE_POLICIES.contact.email}`;
    }
}
