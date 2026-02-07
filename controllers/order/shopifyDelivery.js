import axios from "axios";
import Order from '#models/order/orderModel.js';
import Product from '#models/productModel.js';

const baseURL = process.env.SHOPIFY_DELIVERY_BASE || "https://app.shopifydelivery.ae/webservice";
const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "API-KEY": process.env.SHOPIFY_DELIVERY_API_KEY || "",
  },
});

const UAE_CITIES = new Set([
  "Dubai", "Abu Dhabi", "Al Ain", "Sharjah", "Ajman",
  "Umm Al Quwain", "Fujairah", "Ras Al Khaimah", "Western Region", "Hatta"
]);

function normalizeCity(city) {
  if (!city) return "Dubai";
  const match = [...UAE_CITIES].find(c => c.toLowerCase() === String(city).toLowerCase());
  return match || "Dubai";
}

async function computeParcelStats(order) {
  let pieces = 0;
  let totalWeightKg = 0;
  const itemIds = order.products.map(p => p.product);
  const items = await Product.find({ _id: { $in: itemIds } }).select("_id weight title");
  const weightById = new Map(items.map(it => [String(it._id), Number(it.weight || 0)]));
  for (const p of order.products) {
    const qty = Number(p.quantity || 0);
    pieces += qty;
    const w = weightById.get(String(p.product)) || 0;
    totalWeightKg += w * qty;
  }
  if (totalWeightKg <= 0) totalWeightKg = 0.5;
  if (pieces <= 0) pieces = 1;
  return { pieces, totalWeightKg, items };
}

function buildDescription(items) {
  try {
    const titles = items.map(i => i.title).filter(Boolean);
    if (titles.length) return titles.slice(0, 6).join(", ");
  } catch { }
  return "Goods";
}

export async function createConsignmentAutoAWB(orderId) {
  const order = await Order.findById(orderId)
    .populate("customer", "name phone email")
    .populate("products.product", "title");

  if (!order) throw new Error("Order not found");

  if (order.shippingDetails?.shipment?.awb) {
    return {
      awb: order.shippingDetails.shipment.awb,
      labelPdf: order.shippingDetails.shipment.labelPdf,
      alreadyForwarded: true,
    };
  }

  const isCOD = String(order.paymentMethod).toLowerCase() === "cod";
  const { pieces, totalWeightKg, items } = await computeParcelStats(order);

  const recName = order.shippingDetails?.recipientName || order.customer?.name || "Customer";
  const recPhone = order.shippingDetails?.phone || order.customer?.phone || "";
  const recCity = normalizeCity(order.shippingDetails?.city);
  const recCountry = order.shippingDetails?.country || "United Arab Emirates";
  const toLocation = order.shippingDetails?.area || "";

  const payload = {
    ToCompany: recName,
    ToAddress: order.shippingDetails?.address,
    ToCity: recCity,
    ToLocation: toLocation,
    ToCountry: recCountry,
    ToCperson: recName,
    ToContactno: recPhone,
    ToMobileno: recPhone,

    ReferenceNumber: String(order.orderId || order._id),
    CompanyCode: "",

    Weight: Number(totalWeightKg).toFixed(2),
    Pieces: Number(pieces),
    PackageType: process.env.DEFAULT_PACKAGE_TYPE || "E-commerce Delivery",

    CurrencyCode: order.currency || process.env.DEFAULT_CURRENCY || "AED",
    NcndAmount: isCOD ? Number(order.totalAmount).toFixed(2) : "0.00",

    ItemDescription: buildDescription(items),
    SpecialInstruction: "",
    BranchName: process.env.SHOPIFY_DELIVERY_BRANCH || "Dubai",
  };

  const { data } = await api.post("/CustomerBooking", payload);
  if (!data?.success) {
    const msg = data?.message || "Failed to create consignment";
    throw new Error(`ShopifyDelivery CustomerBooking error: ${msg}`);
  }

  order.shippingDetails = {
    ...(order.shippingDetails || {}),
    trackingNumber: String(data.AwbNumber),
    shipment: {
      courier: "ShopifyDeliveryAE",
      awb: String(data.AwbNumber),
      labelPdf: data.AwbPdf,
      status: "Submitted",
      lastStatusAt: new Date(),
      forwardedAt: new Date(),
      activities: [{
        at: new Date(),
        status: "Submitted",
        details: "Shipment at Collection Point",
      }]
    },
  };
  await order.save();

  return { awb: String(data.AwbNumber), labelPdf: data.AwbPdf };
}

export async function getTrackingBulk(awbs = []) {
  if (!Array.isArray(awbs) || awbs.length === 0) return [];
  const { data } = await api.post("/GetTracking", { AwbNumber: awbs.map(String) });
  if (!data?.success) throw new Error(`GetTracking error: ${data?.message || "unknown"}`);
  return data.TrackResponse || [];
}

export async function syncTrackingForOpenOrders() {
  const openOrders = await Order.find({
    "shippingDetails.shipment.courier": "ShopifyDeliveryAE",
    "shippingDetails.shipment.awb": { $exists: true, $ne: null },
    orderStatus: { $nin: ["Delivered", "Cancelled", "Returned", "Completed"] },
  }).select("_id shippingDetails.shipment.awb");

  const awbs = openOrders.map(o => o.shippingDetails.shipment.awb);
  if (awbs.length === 0) return { updated: 0 };

  const tracks = await getTrackingBulk(awbs);

  for (const t of tracks) {
    const s = t?.Shipment;
    if (!s?.awb_number) continue;

    // map courier statuses to your orderStatus if you want:
    let mappedStatus = s.current_status || "Unknown";
    let orderStatusPatch = {};
    if (/Delivered/i.test(mappedStatus)) orderStatusPatch = { orderStatus: "Delivered" };
    if (/Return|RTO/i.test(mappedStatus)) orderStatusPatch = { orderStatus: "Returned" };

    await Order.updateOne(
      { "shippingDetails.shipment.awb": s.awb_number },
      {
        $set: {
          "shippingDetails.shipment.status": mappedStatus,
          "shippingDetails.shipment.lastStatusAt": s.status_datetime ? new Date(s.status_datetime) : new Date(),
          "shippingDetails.shipment.labelPdf": s.AwbPdf || undefined,
          ...orderStatusPatch,
        },
        $push: {
          "shippingDetails.shipment.activities": {
            $each: (s.Activity || []).map(a => ({
              at: a.datetime ? new Date(a.datetime) : new Date(),
              status: a.status,
              details: a.details,
            })),
          },
        },
      }
    );
  }

  return { updated: tracks.length };
}
