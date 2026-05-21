# Alibaba Live B2B Marketplace - Features List

This document outlines the core features of the Alibaba Live B2B Marketplace project based on the current implementation and documentation.

## 👥 User Roles & Dashboards
*   **Multi-Role System:** Supports Buyers, Suppliers, and Admins.
*   **Supplier Dashboard:** Manage products, view incoming enquiries/RFQs, track orders, and manage company profiles.
*   **Buyer Dashboard:** Manage shipping addresses, track order progress, and manage sent enquiries.
*   **Admin Panel:** Full control over users, site settings (maintenance mode, default currency/language, date formats), and product approvals.

## 🛍️ Product & Catalog Management
*   **Dynamic Categories:** Multi-level category and subcategory navigation.
*   **Product Listings:** Includes pricing, minimum order quantities (MOQ), supplier details, and ratings.
*   **Specialized Sections:** Top Deals, Top Rankings, New Arrivals, and Recommended Products.
*   **Product Customization:** Options for buyers to request custom modifications for products.

## 💬 Communication & RFQ (Request for Quotation)
*   **Enquiry System:** Buyers can send direct enquiries to suppliers from product pages.
*   **Supplier Inbox:** Suppliers can view, track, and reply to buyer enquiries.
*   **Real-time Notifications:** Real-time updates and notification dropdowns powered by Socket.io.

## 📦 Order Tracking & Management
*   **Step-by-step Tracking:** Level-based visual timeline for order progress (e.g., *Order Placed → Payment Confirmed → Processing → Shipped → Out for Delivery → Delivered*).
*   **Invoice Generation:** Buyers and suppliers can view and download order invoices.
*   **Shipping Management:** Buyers can add, edit, and set default shipping addresses.

## 💳 Payments & Subscriptions
*   **Multiple Payment Gateways:** Integrated with Stripe, PayPal, and Razorpay for seamless checkout.
*   **Subscription Plans:** Subscription-based access models for both Buyers and Suppliers.

## 🔐 Authentication & Security
*   **JWT Authentication:** Secure login system with bcrypt password hashing.
*   **Social Login:** Support for signing in via Facebook and LinkedIn.
*   **ReCAPTCHA v3:** Protection against bots during registration and login.

## 🌍 Localization & Customization
*   **Multi-Language & Multi-Currency:** Dynamic dropdowns to change site language and currency formats.
*   **Live Email Notifications:** SMTP integration (Nodemailer) for order updates, password resets, and admin alerts.
*   **Design Customization:** Scripts available to dynamically replace admin and frontend color schemes to match your branding.
