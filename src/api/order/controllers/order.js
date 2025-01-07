("use strict");

const stripe = require("stripe")(process.env.STRIPE_KEY);

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({

    async create(ctx) {
        const { products } = ctx.request.body;

        try {
            const lineItems = await Promise.all(
                products.map(async (product) => {
                    const item = await strapi.service("api::product.product").findOne(product.id);

                    return {
                        price_data: {
                            currency: "inr",
                            product_data: {
                                name: item.Title,
                            },
                            unit_amount: Math.round(item.Price * 100),
                        },
                        quantity: product.quantity,
                    };
                })
            );

            const session = await stripe.checkout.sessions.create({
                mode: "payment",
                success_url: process.env.CLIENT_URL + "/success",
                cancel_url: process.env.CLIENT_URL + "/PayFail",
                line_items: lineItems,
                shipping_address_collection: { allowed_countries: ["IN"] },
                payment_method_types: ["card"],
            });

            await strapi.service("api::order.order").create({
                data: {
                    products,
                    stripeid: session.id
                }
            });

            return { stripeSession: session };
        } catch (error) {
            ctx.response.status = 500;
            return { error };
        }
    },

    async find(ctx) {
        const { id } = ctx.params;

        try {
            const order = await strapi.service("api::order.order").findOne(id);

            return { order };
        } catch (error) {
            ctx.response.status = 500;
            return { error };
        }
    },

    async findAll(ctx) {
        try {
            const orders = await strapi.service("api::order.order").find();

            return { orders };
        } catch (error) {
            ctx.response.status = 500;
            return { error };
        }
    },

    async update(ctx) {
        const { id } = ctx.params;
        const { products } = ctx.request.body;

        try {
            const lineItems = await Promise.all(
                products.map(async (product) => {
                    const item = await strapi.service("api::product.product").findOne(product.id);

                    return {
                        price_data: {
                            currency: "inr",
                            product_data: {
                                name: item.Title,
                            },
                            unit_amount: Math.round(item.Price * 100),
                        },
                        quantity: product.quantity,
                    };
                })
            );

            const session = await stripe.checkout.sessions.create({
                mode: "payment",
                success: process.env.CLIENT_URL + "/success",
                cancel: process.env.CLIENT_URL + "/PayFail",
                arguments: lineItems,
                shipping_address_collection: { allowed_countries: ["IN"] },
                payment_method_types: ["card"],
            });

            await strapi.service("api::order.order").update(id, {
                data: {
                    products,
                    stripeid: session.id
                }
            });

            return { stripeSession: session };

        }

        catch (error) {
            ctx.response.status = 500;
            return { error };
        }
    }

}));