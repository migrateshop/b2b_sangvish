customozation


buyer and supplier side  subscription based working or not check the full code for frontend 

create new buyer and supplier check the supscription

Buyer: testbuyer@example.com / password123
Supplier: testsupplier@example.com / password123



countries and states menus value show frontendside dynamic show and add some states to db
countries iso code, dial code, status not showing check this and update iso code dial code in db


social login page facebook and linkedin icon is missing

admin setting page 

add field
manintanace mode (no/yes)
default currency dropdodwon select currency
default language dropdodwon select language
date format
price show format for $500 or 500$

any needed add extra fields


supplier header section add notifiication icon , hover the  notification icon show notification list
icon show notification dropdown list 


supplier showcase products list where to see??

top deals, top ranking, new arrivals ,top suppliers section correctly working check this 

currency and language change dropdown design not matching


company name
phone number
state/region
business type (export business,e-commerce business)



buyer dashboard 
sidebar toggle option needed 
remove the empty spaces for sidebar

ai mode page not working check this 




product change detail page design  look a alibaba site detail  page and responsive needed , all vaules are dynamic so dont use static values


pending
search page list and grid view  add the option


home section
Here is a **clear and professional prompt** to generate a **dynamic ecommerce homepage similar to the Alibaba homepage**, with **responsive layout and fully dynamic data**.

---

# Prompt: Ecommerce Homepage Design (Alibaba Style)

Design a **modern ecommerce homepage inspired by the Alibaba homepage layout**.

The homepage must support **fully dynamic data from backend APIs** and should **not contain any static values**.

Frontend will use **React**, backend APIs will be provided by **Express.js**, and all content must be dynamically loaded from the database.

The page must be **fully responsive for desktop, tablet, and mobile devices**.

---

# General Requirements

* Use **React component-based structure**
* Data must come from **Express API endpoints**
* No hardcoded products, banners, categories, or suppliers
* All sections must support **dynamic content**
* Follow **modern B2B ecommerce UI style similar to Alibaba**
* Optimize for performance and fast loading

---

# 1️⃣ Top Navigation Header

The header should include:

* Website logo
* Search bar
* Category dropdown
* Login / Register
* Messages
* Orders
* Cart
* Language selector

Dynamic data examples:

```
categories
user.profile
notifications
cart.count
```

Search functionality should support **product keyword search and category filtering**.

---


# 3️⃣ Category Navigation Sidebar

Left sidebar category list similar to Alibaba.

Display main categories with hover dropdown showing subcategories.

Dynamic structure example:

```
category.name
category.icon
category.subcategories[]
```

API example:

```
GET /api/categories
```

---

# 4️⃣ Featured Products Section

Display highlighted products chosen by the system or admin.

Layout:

* Product card grid
* 4–5 products per row (desktop)

Product card fields:

* Product image
* Product title
* Price range
* Minimum order quantity
* Supplier name
* Location
* Rating

Dynamic data example:

```
product.id
product.title
product.image
product.price_range
product.min_order
product.rating
product.supplier_name
product.location
```

---

# 5️⃣ Top Deals Section

Highlight discounted or promotional products.

Features:

* Discount badge
* Original price
* Discounted price
* Countdown timer (optional)

Dynamic API:

```
GET /api/products/top-deals
```

---

# 6️⃣ Top Rankings Section

Show top performing products by category.

Display ranking numbers similar to Alibaba.

Example layout:

```
#1 Product
#2 Product
#3 Product
```

Dynamic API:

```
GET /api/products/top-rankings
```

---

# 7️⃣ New Arrivals Section

Display recently added products.

Layout:

* Grid layout
* "New" badge

Dynamic API:

```
GET /api/products/new-arrivals
```

---

# 8️⃣ Supplier Promotion Section

Show featured suppliers or manufacturers.

Supplier card fields:

* Supplier logo
* Company name
* Country
* Years in business
* Verification badge
* Product count

Dynamic data example:

```
supplier.company_name
supplier.logo
supplier.country
supplier.years_in_business
supplier.product_count
```

API example:

```
GET /api/suppliers/featured
```

---

# 9️⃣ Recommended Products Section

Personalized product recommendations.

Features:

* Horizontal product slider
* Dynamic recommendation algorithm

Dynamic API:

```
GET /api/products/recommended
```

---

# 🔟 Footer Section

Footer must be dynamic and include:

* Company information
* Customer service links
* Supplier resources
* Legal policies
* Social media links

Dynamic data example:

```
footer.links
footer.contact
footer.social_links
```

---

# Responsive Design Requirements

### Desktop

* Full layout with sidebar categories and large product grids

### Tablet

* Sidebar collapses into dropdown
* Product grid reduces to 3 columns

### Mobile

* Single column layout
* Mobile menu drawer
* Horizontal product sliders

---

# UI Design Style

* Clean B2B ecommerce layout
* Soft shadows
* Rounded cards
* Clear typography
* Professional spacing similar to Alibaba

---

# Performance Optimization

* Lazy load images
* Skeleton loading for API requests
* API pagination for product lists
* Image optimization

---

# Important Rules

❌ Do not use static values
❌ Do not hardcode products or categories

✅ All values must be fetched from backend APIs
✅ Components must be reusable
✅ Page must support unlimited dynamic content


-------------------------------------
new task  - completed
Here is the **correct and clear prompt content** you can use:

---

**Prompt:**

Review the **Send Enquiry feature functionality for both Buyer and Supplier dashboards** in the B2B marketplace system (similar to Alibaba).

### 1. Send Enquiry Functionality

Check whether the **Send Enquiry option is working properly** and explain the full workflow.

Explain clearly:

* Where the **Send Enquiry button appears on the Buyer side**
* Where the **received enquiries appear on the Supplier side**
* What happens when a buyer submits an enquiry
* How suppliers can view and respond to enquiries

### 2. Missing Options on Product Detail Page

Check the **Product Detail Page** and verify the following missing features:

* **Customization Option** (for product customization requests)
* **Send Enquiry Button**

These options should normally appear on the product detail page similar to the Alibaba product page.

Explain:

* Why these options may be missing
* Where they should be displayed
* How they should function for buyers

### 3. Buyer Dashboard Improvement

Add a new menu item in the **Buyer Dashboard sidebar**:

**Shipping Address**

This section should allow buyers to:

* Add new shipping address
* Edit address
* Delete address
* Set default shipping address

All address fields should be **dynamic and stored in the database**.

Example fields:

* Full Name
* Phone Number
* Address Line
* City
* State
* Country
* Postal Code

### 4. Important Requirements

* All data must be **dynamic from the backend**
* Do not use **static values**
* Ensure the features work properly for **both buyer and supplier roles**
* Follow a **B2B marketplace workflow similar to Alibaba**

---

If you want, I can also give you a **very advanced prompt for the complete Enquiry System (Buyer → Supplier workflow like Alibaba)** which includes:

* enquiry database structure
* enquiry chat system
* supplier enquiry dashboard
* enquiry notifications
* enquiry status tracking.

buyer and supplier side order detail page and view invoice option needed , invlice download option needed - completed

buyer , supplier logut redirect to the home page 
admin logout rediredct to admin login page



------------------
smtp

Here is the **correct and clear prompt content** for your requirement:

---

### Production Mode Setup & Live Mail Configuration (Prompt)

Configure the project to run in **production mode** and enable **live email functionality**.

#### 1. Production Environment Setup

* Set the application environment to **production**.
* Disable debug mode for security.

Example:

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com
```

#### 2. Live Mail Configuration

Configure the mail system to send **real emails in the live server** using SMTP.

Example configuration in `.env`:

```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your_email@gmail.com
MAIL_FROM_NAME="Your Website Name"
```

#### 3. Mail Testing

* Create a test email function to confirm email delivery.
* Verify that emails are sent successfully for:

  * User registration
  * Password reset
  * Order confirmation
  * Enquiry notifications
  * Admin notifications

#### 4. Security Checks

* Hide sensitive environment variables.
* Ensure `.env` file is not publicly accessible.
* Enable HTTPS for secure email communication.

#### 5. Queue (Optional but Recommended)

For better performance in production:

* Enable **mail queue system** so emails are sent in the background.

Example:

```
QUEUE_CONNECTION=database
```

#### 6. Final Verification

Before going live:

* Test email sending from the application.
* Check spam folder handling.
* Confirm sender name and branding appear correctly.

---



1.social login and facebook login not working check this 
2. paypal and razorpay payment gateway not working check this
3. shipping service method
4. new supplier signup  rfq count showing , and company profile is not verified but verified tick showing check this


Got it 👍 — you want the **Order Details page** to show **progress steps (level-based tracking)** like a timeline.

This is a **very important UX feature** used in platforms like Amazon and Alibaba.

---

# ✅ 🔥 FINAL PROMPT (ORDER PROGRESS LEVEL SYSTEM)

> Implement an order tracking system in the Order Details page that displays order progress in a step-by-step (level-based) format, showing completed, current, and pending stages.

---

# 🟢 1. ORDER STATUS LEVELS

Define standard levels:

```text
1. Order Placed
2. Payment Confirmed
3. Processing
4. Shipped
5. Out for Delivery
6. Delivered
```

👉 Optional:

```text
7. Cancelled / Failed
```

---

# 🟢 2. DATABASE STRUCTURE

### orders table

| field      | type   |
| ---------- | ------ |
| id         | int    |
| user_id    | int    |
| status     | string |
| created_at | date   |

---

### order_status_logs (IMPORTANT)

| field      | type   |
| ---------- | ------ |
| id         | int    |
| order_id   | int    |
| status     | string |
| message    | string |
| created_at | date   |

👉 This table stores **step history**

---

# 🟢 3. BACKEND API

### `GET /api/orders/:id`

Response:

```json
{
  "order": {
    "id": 101,
    "status": "shipped"
  },
  "timeline": [
    { "status": "Order Placed", "date": "2026-03-10", "completed": true },
    { "status": "Payment Confirmed", "date": "2026-03-10", "completed": true },
    { "status": "Processing", "date": "2026-03-11", "completed": true },
    { "status": "Shipped", "date": "2026-03-12", "completed": true },
    { "status": "Out for Delivery", "date": null, "completed": false },
    { "status": "Delivered", "date": null, "completed": false }
  ]
}
```

---

# 🟢 4. FRONTEND (React UI)

## ✅ Timeline Design

* Horizontal (desktop)
* Vertical (mobile)

---

## ✅ Example UI

```text
[✔] Order Placed      → Mar 10
[✔] Payment Done      → Mar 10
[✔] Processing        → Mar 11
[✔] Shipped           → Mar 12
[ ] Out for Delivery
[ ] Delivered
```

---

## 🟢 React Example

```jsx
const steps = [
  "Order Placed",
  "Payment Confirmed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered"
];

return (
  <div className="timeline">
    {steps.map((step, index) => {
      const completed = timeline[index]?.completed;

      return (
        <div key={index} className={`step ${completed ? "done" : ""}`}>
          <div className="circle">{completed ? "✔" : index + 1}</div>
          <p>{step}</p>
          <span>{timeline[index]?.date || ""}</span>
        </div>
      );
    })}
  </div>
);
```

---

# 🟢 5. STATUS LOGIC

```text
Current Step = last completed status
Previous Steps = completed
Next Steps = pending
```

---

# 🟢 6. UI BEHAVIOR

* ✅ Completed → Green ✔
* 🔵 Current → Highlighted
* ⚪ Pending → Grey

---

# 🟢 7. EXTRA FEATURES (Recommended)

* Show:

  * Estimated delivery date
  * Shipping method
  * Tracking ID

---

# 🟢 8. SPECIAL CASES

### ❌ Cancelled Order

```text
Order Placed → Cancelled
```

👉 Show red status

---

### ⏳ Delayed Order

* Add message:

```text
Delayed due to logistics
```

---

# 🟢 9. FINAL UX GOAL

✔ Clear order visibility
✔ User trust increase
✔ Professional ecommerce experience

---

# 🚀 FINAL RESULT

✔ Step-by-step order tracking
✔ Level-based UI
✔ Real-time updates
✔ Matches Amazon / Alibaba

---

# 💡 PRO TIP

👉 Store logs in `order_status_logs` — this gives:

* Timeline history
* Easy debugging
* Audit tracking

---


request for quatation only apply for login buyer and supplier

deliver to




home page layout and design is good , but a simple design so some modify design and primary color blue color change to attractive color like alibaba site based, home page every section  between spaces same needed



file:///E:/Doctor%20All%20File/Documentation/index.html

“Refer to the documentation available at the provided link and integrate the same format into this project. Provide a step-by-step implementation guide for setting up and structuring the project documentation accordingly.”

💡 Alternative (more clear & detailed):

“Use the documentation format from the given reference link and apply it to this project. Provide a clear, step-by-step guide to integrate and structure the documentation, including layout, sections, and best practices.”

create html file

remove demo data from database:

Remove all demo records from the database, seed the live production data, and use Gemini to generate high-quality product and category images based on the live catalog data. Ensure the generated images match each product name, category, and branding style.


npm install react-image-crop


<div data-name="All categories" class="tab-content"><div class="animated-tab-content-children" data-tnh-auto-exp="All categories-children" data-aplus-ae="x8_17c0c170" data-spm-anchor-id="a2700.product_home_fy25.home_header.i8.2ce267af2JkVni" style="opacity: 1; transform: none;"><div class="header-category-panel"><div class="modal-panel-container"><div class="hc-level1-panel" data-dot-header-categories="true" data-params="type=modal_level1_panel&amp;action=category-panel" data-aplus-ae="x1_1c727447" data-spm-anchor-id="a2700.product_home_fy25.home_header.i24.2ce267af2JkVni"><div class="level1-panel-list"><div class="hc-level1-cate-unit" data-level1-category-id="for_you" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=for_you&amp;title=&amp;position=modal_panel" data-aplus-ae="x2_36effd56" data-spm-anchor-id="a2700.product_home_fy25.home_header.i25.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i2/O1CN012ailkW1kUh1i8VPv2_!!6000000004687-2-tps-200-200.png&quot;) center center / contain no-repeat;"></div><span class="title" data-spm-anchor-id="a2700.product_home_fy25.home_header.i66.2ce267af2JkVni">Categories for you</span></div><div class="hc-level1-cate-unit active" data-level1-category-id="100000" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100000&amp;title=&amp;position=modal_panel" data-aplus-ae="x3_359283ed" data-spm-anchor-id="a2700.product_home_fy25.home_header.i26.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i4/O1CN01ygU3AZ27j73ldMB9H_!!6000000007832-2-tps-84-85.png&quot;) center center / contain no-repeat;"></div><span class="title" data-spm-anchor-id="a2700.product_home_fy25.home_header.i64.2ce267af2JkVni">Apparel &amp; Accessories</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100003" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100003&amp;title=&amp;position=modal_panel" data-aplus-ae="x4_5e341ae7" data-spm-anchor-id="a2700.product_home_fy25.home_header.i27.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i2/O1CN01OuJJcx1C2a97heqAC_!!6000000000023-2-tps-84-84.png&quot;) center center / contain no-repeat;"></div><span class="title">Consumer Electronics</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100054" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100054&amp;title=&amp;position=modal_panel" data-aplus-ae="x5_cca0daf" data-spm-anchor-id="a2700.product_home_fy25.home_header.i28.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i3/O1CN01ryJtgK1msB0Y4XdGk_!!6000000005009-2-tps-84-84.png&quot;) center center / contain no-repeat;"></div><span class="title">Sportswear &amp; Outdoor Apparel</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100015" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100015&amp;title=&amp;position=modal_panel" data-aplus-ae="x6_5ee16757" data-spm-anchor-id="a2700.product_home_fy25.home_header.i29.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i4/O1CN013JX4r629MmzCY1tkw_!!6000000008054-2-tps-85-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Shoes &amp; Accessories</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100011" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100011&amp;title=&amp;position=modal_panel" data-aplus-ae="x7_71e8780a" data-spm-anchor-id="a2700.product_home_fy25.home_header.i30.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i1/O1CN01CWSXoF1fbVCWJMSqS_!!6000000004025-2-tps-84-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Parents, Kids &amp; Toys</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100005" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100005&amp;title=&amp;position=modal_panel" data-aplus-ae="x8_19abbb52" data-spm-anchor-id="a2700.product_home_fy25.home_header.i31.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i3/O1CN01en2avh1xYRdiivuMn_!!6000000006455-2-tps-84-84.png&quot;) center center / contain no-repeat;"></div><span class="title">Home &amp; Garden</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100009" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100009&amp;title=&amp;position=modal_panel" data-aplus-ae="x9_57742811" data-spm-anchor-id="a2700.product_home_fy25.home_header.i32.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i1/O1CN01vXyEYH1es9zVxoAXL_!!6000000003926-2-tps-85-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Sports &amp; Entertainment</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100010" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100010&amp;title=&amp;position=modal_panel" data-aplus-ae="x10_9d69055" data-spm-anchor-id="a2700.product_home_fy25.home_header.i33.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i3/O1CN01zjJ20d1uGAzpNEPU5_!!6000000006009-2-tps-84-84.png&quot;) center center / contain no-repeat;"></div><span class="title">Beauty</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100013" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100013&amp;title=&amp;position=modal_panel" data-aplus-ae="x11_4ba132f3" data-spm-anchor-id="a2700.product_home_fy25.home_header.i34.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i1/O1CN01mkFYQf1vb4gSgxcEX_!!6000000006190-2-tps-85-84.png&quot;) center center / contain no-repeat;"></div><span class="title">Jewelry, Eyewear &amp; Watches</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100019" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100019&amp;title=&amp;position=modal_panel" data-aplus-ae="x12_5e95eb88" data-spm-anchor-id="a2700.product_home_fy25.home_header.i35.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i2/O1CN01wOXuOK2AKmpodPhUd_!!6000000008185-2-tps-85-84.png&quot;) center center / contain no-repeat;"></div><span class="title">Luggage, Bags &amp; Cases</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100020" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100020&amp;title=&amp;position=modal_panel" data-aplus-ae="x13_2e72a0c6" data-spm-anchor-id="a2700.product_home_fy25.home_header.i36.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i1/O1CN01YGbLcT1f2Ehl690j3_!!6000000003948-2-tps-84-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Packaging &amp; Printing</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100024" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100024&amp;title=&amp;position=modal_panel" data-aplus-ae="x14_4e7c836f" data-spm-anchor-id="a2700.product_home_fy25.home_header.i37.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i2/O1CN019WXnqp1j7y7pl0zRN_!!6000000004502-2-tps-84-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Personal Care &amp; Home Care</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100031" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100031&amp;title=&amp;position=modal_panel" data-aplus-ae="x15_43e058cf" data-spm-anchor-id="a2700.product_home_fy25.home_header.i38.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i2/O1CN01exYeAv1bdYVputNUd_!!6000000003488-2-tps-84-84.png&quot;) center center / contain no-repeat;"></div><span class="title">Health &amp; Medical</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100039" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100039&amp;title=&amp;position=modal_panel" data-aplus-ae="x16_4f7bd635" data-spm-anchor-id="a2700.product_home_fy25.home_header.i39.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i2/O1CN01pvb4KN21HjgqsRPBz_!!6000000006960-2-tps-84-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Gifts &amp; Crafts</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100040" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100040&amp;title=&amp;position=modal_panel" data-aplus-ae="x17_792cbc90" data-spm-anchor-id="a2700.product_home_fy25.home_header.i40.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i2/O1CN01ZJgGc31TxEdpw77oU_!!6000000002448-2-tps-84-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Pet Supplies </span></div><div class="hc-level1-cate-unit" data-level1-category-id="100033" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100033&amp;title=&amp;position=modal_panel" data-aplus-ae="x18_d33781d" data-spm-anchor-id="a2700.product_home_fy25.home_header.i41.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i4/O1CN01vpW6Ma1HAR12dRzSI_!!6000000000717-2-tps-85-85.png&quot;) center center / contain no-repeat;"></div><span class="title">School &amp; Office Supplies</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100012" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100012&amp;title=&amp;position=modal_panel" data-aplus-ae="x19_3feaba4a" data-spm-anchor-id="a2700.product_home_fy25.home_header.i42.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i2/O1CN01G5tIdA1kmYqNRU1Lt_!!6000000004726-2-tps-84-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Industrial Machinery</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100042" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100042&amp;title=&amp;position=modal_panel" data-aplus-ae="x20_f6d1a8" data-spm-anchor-id="a2700.product_home_fy25.home_header.i43.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i4/O1CN01SVZsN11jYX8GSHpai_!!6000000004560-2-tps-84-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Commercial Equipment &amp; Machinery</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100032" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100032&amp;title=&amp;position=modal_panel" data-aplus-ae="x21_41b3642a" data-spm-anchor-id="a2700.product_home_fy25.home_header.i44.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i4/O1CN01fHTUz71MOhSwFm5Rw_!!6000000001425-2-tps-85-84.png&quot;) center center / contain no-repeat;"></div><span class="title">Construction &amp; Building Machinery</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100051" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100051&amp;title=&amp;position=modal_panel" data-aplus-ae="x22_686dc5c1" data-spm-anchor-id="a2700.product_home_fy25.home_header.i45.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i3/O1CN01qZ6DGC1blngBMfThZ_!!6000000003506-2-tps-85-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Construction &amp; Real Estate</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100052" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100052&amp;title=&amp;position=modal_panel" data-aplus-ae="x23_3fe09800" data-spm-anchor-id="a2700.product_home_fy25.home_header.i46.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i1/O1CN01dDYddB2AIxHqBqWnr_!!6000000008181-2-tps-85-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Furniture</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100053" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100053&amp;title=&amp;position=modal_panel" data-aplus-ae="x24_75d08daa" data-spm-anchor-id="a2700.product_home_fy25.home_header.i47.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i4/O1CN014CRmnr24WLARFvFsD_!!6000000007398-2-tps-85-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Lights &amp; Lighting</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100021" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100021&amp;title=&amp;position=modal_panel" data-aplus-ae="x25_5cc91c2e" data-spm-anchor-id="a2700.product_home_fy25.home_header.i48.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i3/O1CN018Yc9aJ1rz70WHzHKA_!!6000000005701-2-tps-84-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Home Appliances</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100022" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100022&amp;title=&amp;position=modal_panel" data-aplus-ae="x26_16fde730" data-spm-anchor-id="a2700.product_home_fy25.home_header.i49.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i3/O1CN01cL4uKh1fjkMmCcAxm_!!6000000004043-2-tps-85-84.png&quot;) center center / contain no-repeat;"></div><span class="title">Automotive Supplies &amp; Tools</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100018" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100018&amp;title=&amp;position=modal_panel" data-aplus-ae="x27_6a68692c" data-spm-anchor-id="a2700.product_home_fy25.home_header.i50.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i3/O1CN01X4bNKG1KK08TIH9S5_!!6000000001144-2-tps-85-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Vehicle Parts &amp; Accessories</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100043" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100043&amp;title=&amp;position=modal_panel" data-aplus-ae="x28_4e63814b" data-spm-anchor-id="a2700.product_home_fy25.home_header.i51.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i2/O1CN01cQwZ0p29RMwmIREHW_!!6000000008064-2-tps-84-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Tools &amp; Hardware</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100049" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100049&amp;title=&amp;position=modal_panel" data-aplus-ae="x29_4c23b536" data-spm-anchor-id="a2700.product_home_fy25.home_header.i52.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i1/O1CN01VftmRo1FMgPaXrrF7_!!6000000000473-2-tps-85-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Renewable Energy</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100050" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100050&amp;title=&amp;position=modal_panel" data-aplus-ae="x30_9519655" data-spm-anchor-id="a2700.product_home_fy25.home_header.i53.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i2/O1CN01TuXq7l1sweX3SbiJX_!!6000000005831-2-tps-85-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Electrical Equipment &amp; Supplies</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100045" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100045&amp;title=&amp;position=modal_panel" data-aplus-ae="x31_60ffdc66" data-spm-anchor-id="a2700.product_home_fy25.home_header.i54.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i2/O1CN01dVyppL26K5o5JB7aM_!!6000000007642-2-tps-85-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Safety &amp; Security</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100044" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100044&amp;title=&amp;position=modal_panel" data-aplus-ae="x32_131a7fa7" data-spm-anchor-id="a2700.product_home_fy25.home_header.i55.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i2/O1CN01bU3qvn1kttDTEE28E_!!6000000004742-2-tps-85-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Material Handling</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100046" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100046&amp;title=&amp;position=modal_panel" data-aplus-ae="33" data-spm-anchor-id="a2700.product_home_fy25.home_header.i56.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i4/O1CN01JhV2lV1ieCPsjebe4_!!6000000004437-2-tps-85-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Testing Instrument &amp; Equipment</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100047" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100047&amp;title=&amp;position=modal_panel" data-aplus-ae="34" data-spm-anchor-id="a2700.product_home_fy25.home_header.i57.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i3/O1CN01YVQOQ61vdp5ux6icg_!!6000000006196-2-tps-85-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Power Transmission</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100035" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100035&amp;title=&amp;position=modal_panel" data-aplus-ae="35" data-spm-anchor-id="a2700.product_home_fy25.home_header.i58.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i1/O1CN01tWklPu1zErwaYNsjO_!!6000000006683-2-tps-84-84.png&quot;) center center / contain no-repeat;"></div><span class="title">Electronic Components</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100026" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100026&amp;title=&amp;position=modal_panel" data-aplus-ae="36" data-spm-anchor-id="a2700.product_home_fy25.home_header.i59.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i2/O1CN01r5i3671OMzBDYuqdR_!!6000000001692-2-tps-85-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Vehicles &amp; Transportation</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100041" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100041&amp;title=&amp;position=modal_panel" data-aplus-ae="37" data-spm-anchor-id="a2700.product_home_fy25.home_header.i60.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i1/O1CN017eDRdU1CJ4RMAEGoK_!!6000000000059-2-tps-84-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Agriculture, Food &amp; Beverage</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100030" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100030&amp;title=&amp;position=modal_panel" data-aplus-ae="38" data-spm-anchor-id="a2700.product_home_fy25.home_header.i61.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i2/O1CN017toEfm26ZfEn1Ez4e_!!6000000007676-2-tps-84-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Raw Materials</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100048" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100048&amp;title=&amp;position=modal_panel" data-aplus-ae="39" data-spm-anchor-id="a2700.product_home_fy25.home_header.i62.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i3/O1CN01bBge9L22ksVXHzCdj_!!6000000007159-2-tps-85-84.png&quot;) center center / contain no-repeat;"></div><span class="title">Fabrication Services</span></div><div class="hc-level1-cate-unit" data-level1-category-id="100038" data-dot-header-categories="true" data-params="type=level1_category&amp;level1CategoryId=100038&amp;title=&amp;position=modal_panel" data-aplus-ae="40" data-spm-anchor-id="a2700.product_home_fy25.home_header.i63.2ce267af2JkVni"><div class="img" style="background: url(&quot;https://s.alicdn.com/@img/imgextra/i2/O1CN01cCPUpj1vdMfGZgqTZ_!!6000000006195-2-tps-85-85.png&quot;) center center / contain no-repeat;"></div><span class="title">Service</span></div></div></div><div class="hc-level3-panel"><div class="hc-level3-list"><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="for_you"><div class="category-title-container"><div class="category-title">Categories for you</div></div><div class="leaf-container"><div class="leaf-row first-row"><a class="hc-leaf-item" href="https://www.alibaba.com/category/fashion-jewelry-jewelry-sets_201650801.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201650801&amp;title=&amp;level1CategoryId=for_you&amp;position=modal_panel" data-aplus-ae="x79_39d98df1" data-spm-anchor-id="a2700.product_home_fy25.home_header.76"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/HTB1mW6caELrK1Rjy1zbq6AenFXah.jpg" class="product-img" loading="lazy"></div><div class="title">Fashion Jewelry Jewelry Sets</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/fashion-jewelry-rings_201650701.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201650701&amp;title=&amp;level1CategoryId=for_you&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.77" data-aplus-ae="x80_e9e8860"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/HTB17cDQd8Cw3KVjSZR0q6zcUpXaD.jpg" class="product-img" loading="lazy"></div><div class="title">Fashion Jewelry Rings</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/hoop-earring_201650401.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201650401&amp;title=&amp;level1CategoryId=for_you&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.78" data-aplus-ae="x81_22e332bd"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H5684b61e3aba4b77ab543c59bbac93faa.jpg" class="product-img" loading="lazy"></div><div class="title">Hoop Earring</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/jewelry-sets_100007324.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=100007324&amp;title=&amp;level1CategoryId=for_you&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.79" data-aplus-ae="x82_25371ad"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H50c306f72e29489991010cd20bd0589b5.jpg" class="product-img" loading="lazy"></div><div class="title">Jewelry Sets</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/necklaces_100007320.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=100007320&amp;title=&amp;level1CategoryId=for_you&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.80" data-aplus-ae="x83_43c46062"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/HTB1O7LdbMKG3KVjSZFLq6yMvXXa1.jpg" class="product-img" loading="lazy"></div><div class="title">Necklaces</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/earrings_100007318.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=100007318&amp;title=&amp;level1CategoryId=for_you&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.81" data-aplus-ae="x84_3274164d"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H5cc8bfa641b04d69b79deb274e386700I.jpg" class="product-img" loading="lazy"></div><div class="title">Earrings</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/jewelry_201650501.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201650501&amp;title=&amp;level1CategoryId=for_you&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.82" data-aplus-ae="x85_1893ea04"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hdaa20c843c2e4cf7b8f7e9226c0aedc7j.jpg" class="product-img" loading="lazy"></div><div class="title">Jewelry</div></a></div><div class="leaf-row second-row"><a class="hc-leaf-item" href="https://www.alibaba.com/category/women-necklace_201650501.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201650501&amp;title=&amp;level1CategoryId=for_you&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.83" data-aplus-ae="x86_6da8444c"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H8f875b42383a4e05af2c5bceb4f2fe67Y.jpg" class="product-img" loading="lazy"></div><div class="title">Women Necklace</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/earrings-set_201650401.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201650401&amp;title=&amp;level1CategoryId=for_you&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.84" data-aplus-ae="x87_5cc8a54e"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/HTB17Ot1NmzqK1RjSZFLq6An2XXaM.jpg" class="product-img" loading="lazy"></div><div class="title">Earrings Set</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/bangles_201650301.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201650301&amp;title=&amp;level1CategoryId=for_you&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.85" data-aplus-ae="x88_5eb65350"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hcbf5c19ceed746daa9ef0f8eb15c261bY.jpg" class="product-img" loading="lazy"></div><div class="title">Bangles</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/anklets_127726041.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=127726041&amp;title=&amp;level1CategoryId=for_you&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.86" data-aplus-ae="x89_6f3c1de1"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H25e05460782344f697030d5c57c98c2ey.jpg" class="product-img" loading="lazy"></div><div class="title">Anklets</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/camera_201151901.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201151901&amp;title=&amp;level1CategoryId=for_you&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.87" data-aplus-ae="x90_732d4dc7"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H61878cba3a314d5d8f1b5b5f33de4697b.jpg" class="product-img" loading="lazy"></div><div class="title">Camera</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/digital-cameras_1909.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=1909&amp;title=&amp;level1CategoryId=for_you&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.88" data-aplus-ae="x91_25c81bae"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H11b24dfe4d344a699dac52264a7b9016J.jpg" class="product-img" loading="lazy"></div><img src="https://s.alicdn.com/@img/imgextra/i1/O1CN017VUC0e28oRCBkDak2_!!6000000007979-2-tps-54-55.png" class="icon" loading="lazy"><div class="title">Digital Cameras</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/ring-set_201650701.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201650701&amp;title=&amp;level1CategoryId=for_you&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.89" data-aplus-ae="x92_41ca2c63"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H5619f737c6ce47c9a9a4bac1f647a19fj.jpg" class="product-img" loading="lazy"></div><div class="title">Ring Set</div></a></div></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100000"><div class="category-title-container"><div class="category-title">Apparel &amp; Accessories</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/3/index.html&amp;ncms_spm=a27aq.cp_3&amp;prefetchKey=allcategoriesv2&amp;categoryIds=3" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100000" data-aplus-ae="x41_454cd7c7" data-spm-anchor-id="a2700.product_home_fy25.home_header.5">Browse featured selections</a></div><div class="leaf-container"><div class="leaf-row first-row"><a class="hc-leaf-item" href="https://www.alibaba.com/category/sarong_201587602.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201587602&amp;title=&amp;level1CategoryId=100000&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.90" data-aplus-ae="x93_33721252"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Ubf2785ed4c094395b676141900bbe1d8O.jpg" class="product-img" loading="lazy"></div><div class="title">Sarong</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/kurti_201764703.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201764703&amp;title=&amp;level1CategoryId=100000&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.91" data-aplus-ae="x94_7f6d129d"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Sdbd07f749974455db7a778503a28ade72.jpeg" class="product-img" loading="lazy"></div><div class="title">Kurti</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/lehenga-choli_201764703.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201764703&amp;title=&amp;level1CategoryId=100000&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.92" data-aplus-ae="x95_7d107785"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/S3ad12662e6ce4c34aa522d55f013d3afM.jpg" class="product-img" loading="lazy"></div><div class="title">Lehenga Choli</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/kaftan_201756202.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201756202&amp;title=&amp;level1CategoryId=100000&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.93" data-aplus-ae="x96_722bb4c7"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H6b965cec90b14a07aab50d9ea3a5ae99u.jpg" class="product-img" loading="lazy"></div><div class="title">Kaftan</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/pakistani-dress_201764703.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201764703&amp;title=&amp;level1CategoryId=100000&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.94" data-aplus-ae="x97_4da8efb8"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hff0fcb3933884f299a24036805fabbaeU.jpg" class="product-img" loading="lazy"></div><div class="title">Pakistani Dress</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/indian-dress_201764703.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201764703&amp;title=&amp;level1CategoryId=100000&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.95" data-aplus-ae="x98_435abc1a"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/HTB1ckgFaYr1gK0jSZR0q6zP8XXay.jpg" class="product-img" loading="lazy"></div><div class="title">Indian Dress</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/sarees_201764703.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201764703&amp;title=&amp;level1CategoryId=100000&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.96" data-aplus-ae="x99_e1b2da8"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/A0d1ba660ed24490a854c5ce49f0d62c7R.jpg" class="product-img" loading="lazy"></div><div class="title">Sarees</div></a></div><div class="leaf-row second-row"><a class="hc-leaf-item" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=&amp;title=&amp;action=more&amp;position=modal_panel" data-aplus-ae="x100_79d047cd"><div class="product-wrapper"><img src="https://s.alicdn.com/@img/imgextra/i2/O1CN015j2EYl1oJ1ldUovSw_!!6000000005203-55-tps-95-95.svg" class="product-img" loading="lazy"></div><div class="title">View all</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/beach-dress_100005791.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=100005791&amp;title=&amp;level1CategoryId=100000&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.97" data-aplus-ae="x101_3e26638c"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Uedecb62cc911473cb86545442be6ffb0O.jpg" class="product-img" loading="lazy"></div><div class="title">Beach Dress</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/prom-dresses_127694039.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=127694039&amp;title=&amp;level1CategoryId=100000&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.98" data-aplus-ae="x102_5a730145"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hf8929527b5c843c286d998d1cff541638.jpg" class="product-img" loading="lazy"></div><img src="https://s.alicdn.com/@img/imgextra/i1/O1CN017VUC0e28oRCBkDak2_!!6000000007979-2-tps-54-55.png" class="icon" loading="lazy"><div class="title">Prom Dresses</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/plus-size-women's-dresses_201619601.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201619601&amp;title=&amp;level1CategoryId=100000&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.99" data-aplus-ae="x103_3473f124"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hd1da320a1c1e47a9b021d2dcb9942c1dk.png" class="product-img" loading="lazy"></div><img src="https://s.alicdn.com/@img/imgextra/i1/O1CN017VUC0e28oRCBkDak2_!!6000000007979-2-tps-54-55.png" class="icon" loading="lazy"><div class="title">Plus Size Women's Dresses</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/abaya_201756202.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201756202&amp;title=&amp;level1CategoryId=100000&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.100" data-aplus-ae="x104_f9a98ed"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/UTB88H1zyyDEXKJk43Oqq6Az3XXaK.jpg" class="product-img" loading="lazy"></div><div class="title">Abaya</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/casual-dresses_100005791.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=100005791&amp;title=&amp;level1CategoryId=100000&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.101" data-aplus-ae="x105_1d21379"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hefff77239da0489b96099b2000fbe5dce.png" class="product-img" loading="lazy"></div><img src="https://s.alicdn.com/@img/imgextra/i1/O1CN017VUC0e28oRCBkDak2_!!6000000007979-2-tps-54-55.png" class="icon" loading="lazy"><div class="title">Casual Dresses</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/pakistani-suits_201764703.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201764703&amp;title=&amp;level1CategoryId=100000&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.102" data-aplus-ae="x106_6b40d770"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/U51434ea0777141508c395d9334a1be429.jpg" class="product-img" loading="lazy"></div><div class="title">Pakistani Suits</div></a></div></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100003"><div class="category-title-container"><div class="category-title">Consumer Electronics</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/44/index.html&amp;ncms_spm=a27aq.cp_44&amp;prefetchKey=allcategoriesv2&amp;categoryIds=44" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100003" data-spm-anchor-id="a2700.product_home_fy25.home_header.6" data-aplus-ae="x42_1342c4ca">Browse featured selections</a></div><div class="leaf-container"><div class="leaf-row first-row"><a class="hc-leaf-item" href="https://www.alibaba.com/category/photo-studio-accessories_100010905.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=100010905&amp;title=&amp;level1CategoryId=100003&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.103" data-aplus-ae="x107_78dc1f47"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H49357c6feaf24dd78673f0e2aa79b6bcR.png" class="product-img" loading="lazy"></div><img src="https://s.alicdn.com/@img/imgextra/i1/O1CN017VUC0e28oRCBkDak2_!!6000000007979-2-tps-54-55.png" class="icon" loading="lazy"><div class="title">Photo Studio Accessories</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/action-camera_201340102.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201340102&amp;title=&amp;level1CategoryId=100003&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.104" data-aplus-ae="x108_624771b8"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hde91caee47394f27b29a7e7e04d7290fi.jpg" class="product-img" loading="lazy"></div><div class="title">Action Camera</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/tripod_201228905.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201228905&amp;title=&amp;level1CategoryId=100003&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.105" data-aplus-ae="x109_24ff9b48"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H51d83077c02048c49a6c17f9f7a98d8eQ.jpg" class="product-img" loading="lazy"></div><img src="https://s.alicdn.com/@img/imgextra/i1/O1CN017VUC0e28oRCBkDak2_!!6000000007979-2-tps-54-55.png" class="icon" loading="lazy"><div class="title">Tripod</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/video-cameras_1902.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=1902&amp;title=&amp;level1CategoryId=100003&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.106" data-aplus-ae="x110_4352af1f"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hc1e5beed38d042948cb9015068dd2ab16.jpg" class="product-img" loading="lazy"></div><img src="https://s.alicdn.com/@img/imgextra/i1/O1CN017VUC0e28oRCBkDak2_!!6000000007979-2-tps-54-55.png" class="icon" loading="lazy"><div class="title">Video Cameras</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/ring-light_100010899.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=100010899&amp;title=&amp;level1CategoryId=100003&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.107" data-aplus-ae="x111_5c5eedca"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H9e5cbe85591c48699aba8a999432b63fP.jpg" class="product-img" loading="lazy"></div><div class="title">Ring Light</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/digital-cameras_1909.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=1909&amp;title=&amp;level1CategoryId=100003&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.108" data-aplus-ae="x112_6b760cf3"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H11b24dfe4d344a699dac52264a7b9016J.jpg" class="product-img" loading="lazy"></div><img src="https://s.alicdn.com/@img/imgextra/i1/O1CN017VUC0e28oRCBkDak2_!!6000000007979-2-tps-54-55.png" class="icon" loading="lazy"><div class="title">Digital Cameras</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/camera_201151901.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201151901&amp;title=&amp;level1CategoryId=100003&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.109" data-aplus-ae="x113_33b9156f"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H61878cba3a314d5d8f1b5b5f33de4697b.jpg" class="product-img" loading="lazy"></div><div class="title">Camera</div></a></div><div class="leaf-row second-row"><a class="hc-leaf-item" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=&amp;title=&amp;action=more&amp;position=modal_panel" data-aplus-ae="114"><div class="product-wrapper"><img src="https://s.alicdn.com/@img/imgextra/i2/O1CN015j2EYl1oJ1ldUovSw_!!6000000005203-55-tps-95-95.svg" class="product-img" loading="lazy"></div><div class="title">View all</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/light-stand_100010899.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=100010899&amp;title=&amp;level1CategoryId=100003&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.110" data-aplus-ae="x115_4a6d1721"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hf6558b94b6ef467f8a839eb2f07eb159C.jpg" class="product-img" loading="lazy"></div><div class="title">Light Stand</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/led-video-light_100010899.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=100010899&amp;title=&amp;level1CategoryId=100003&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.111" data-aplus-ae="x116_68b27f29"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hdec92d140a884d7f9aa899a88e51400b8.jpg" class="product-img" loading="lazy"></div><div class="title">Led Video Light</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/mounts_201340112.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201340112&amp;title=&amp;level1CategoryId=100003&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.112" data-aplus-ae="x117_5df16995"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hc247ffe1fff8467bbd7a1994a2dec956Z.png" class="product-img" loading="lazy"></div><img src="https://s.alicdn.com/@img/imgextra/i1/O1CN017VUC0e28oRCBkDak2_!!6000000007979-2-tps-54-55.png" class="icon" loading="lazy"><div class="title">Mounts</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/video-light_100010899.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=100010899&amp;title=&amp;level1CategoryId=100003&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.113" data-aplus-ae="x118_2d804035"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hd237bc4dc96e4d2fa1a47dcd0a61b4d1T.jpg" class="product-img" loading="lazy"></div><div class="title">Video Light</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/softbox_100010905.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=100010905&amp;title=&amp;level1CategoryId=100003&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.114" data-aplus-ae="x119_6edde1d"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H5002f8ba324744fa87fbcd2a2a17c058Q.jpg" class="product-img" loading="lazy"></div><div class="title">Softbox</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/phone-tripod_201228905.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201228905&amp;title=&amp;level1CategoryId=100003&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.115" data-aplus-ae="120"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H0cf7f8ebcd31437abdee4b3fc2fda66bA.jpg" class="product-img" loading="lazy"></div><div class="title">Phone Tripod</div></a></div></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100054"><div class="category-title-container"><div class="category-title">Sportswear &amp; Outdoor Apparel</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/202240208/index.html&amp;ncms_spm=a27aq.cp_202240208&amp;prefetchKey=allcategoriesv2&amp;categoryIds=202240208" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100054" data-spm-anchor-id="a2700.product_home_fy25.home_header.7" data-aplus-ae="43">Browse featured selections</a></div><div class="leaf-container"><div class="leaf-row first-row"><a class="hc-leaf-item" href="https://www.alibaba.com/category/cricket-shoes_127734048.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=127734048&amp;title=&amp;level1CategoryId=100054&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.116" data-aplus-ae="121"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/HTB1ZvNjaAP2gK0jSZPxq6ycQpXaS.jpg" class="product-img" loading="lazy"></div><div class="title">Cricket Shoes</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/baseball-shoes_127734046.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=127734046&amp;title=&amp;level1CategoryId=100054&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.117" data-aplus-ae="x122_6bc98fc2"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Ha6a63b66335f4b69adbb98bc60cbe7836.jpg" class="product-img" loading="lazy"></div><div class="title">Baseball Shoes</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/golf-shoes_127734043.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=127734043&amp;title=&amp;level1CategoryId=100054&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.118" data-aplus-ae="x123_35795dec"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H83e9c0a69b8f4569ba8298c86d371be27.jpg" class="product-img" loading="lazy"></div><div class="title">Golf Shoes</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/water-shoes_201345111.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201345111&amp;title=&amp;level1CategoryId=100054&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.119" data-aplus-ae="x124_122a85c6"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hbcb891a1c614459cb0a3106915280136M.jpeg" class="product-img" loading="lazy"></div><div class="title">Water Shoes</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/barefoot-shoes_127734048.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=127734048&amp;title=&amp;level1CategoryId=100054&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.120" data-aplus-ae="x125_49f37e7e"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/He90d6f1f9e73404c99abac222e2c63f0P.jpg" class="product-img" loading="lazy"></div><div class="title">Barefoot Shoes</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/volleyball-shoes_127734047.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=127734047&amp;title=&amp;level1CategoryId=100054&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.121" data-aplus-ae="x126_67ceb95f"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H4c0c01a2d95149cb8da9af35ea43097d7.jpg" class="product-img" loading="lazy"></div><div class="title">Volleyball Shoes</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/football-boots_127734036.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=127734036&amp;title=&amp;level1CategoryId=100054&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.122" data-aplus-ae="127"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H304b9ae8068248b7bf0a4b955f0402ecb.jpg" class="product-img" loading="lazy"></div><div class="title">Football Boots</div></a></div><div class="leaf-row second-row"><a class="hc-leaf-item" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=&amp;title=&amp;action=more&amp;position=modal_panel" data-aplus-ae="128"><div class="product-wrapper"><img src="https://s.alicdn.com/@img/imgextra/i2/O1CN015j2EYl1oJ1ldUovSw_!!6000000005203-55-tps-95-95.svg" class="product-img" loading="lazy"></div><div class="title">View all</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/table-tennis-shoes_127734044.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=127734044&amp;title=&amp;level1CategoryId=100054&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.123" data-aplus-ae="x129_46d31252"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H51c288bbbeb94f119f4a8abd7731a860Q.jpg" class="product-img" loading="lazy"></div><div class="title">Table&nbsp;Tennis&nbsp;Shoes</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/leg-massager_201777104.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201777104&amp;title=&amp;level1CategoryId=100054&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.124" data-aplus-ae="x130_327ccaeb"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H477496d781754e97824918010e8763ded.jpg" class="product-img" loading="lazy"></div><div class="title">Leg Massager</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/leg-warmers_201755601.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201755601&amp;title=&amp;level1CategoryId=100054&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.125" data-aplus-ae="x131_5368ddf7"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hd6c6f2e0ec1a4c639b5e6498fb35080f5.jpg" class="product-img" loading="lazy"></div><div class="title">Leg Warmers</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/knee-support_100005601.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=100005601&amp;title=&amp;level1CategoryId=100054&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.126" data-aplus-ae="x132_210bb093"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hbdfbb473b3174c179d1074ebb26d3ad4A.jpg" class="product-img" loading="lazy"></div><div class="title">Knee Support</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/kinesiology-tape_201916402.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201916402&amp;title=&amp;level1CategoryId=100054&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.127" data-aplus-ae="x133_490e807f"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Ha5dc5dc7966f4ac0b59b7bc447bdc9eej.jpg" class="product-img" loading="lazy"></div><div class="title">Kinesiology Tape</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/hunting-boots_201335910.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201335910&amp;title=&amp;level1CategoryId=100054&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.128" data-aplus-ae="134"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H730e005ad5234e3fa2623aec58365f048.jpg" class="product-img" loading="lazy"></div><div class="title">Hunting Boots</div></a></div></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100015"><div class="category-title-container"><div class="category-title">Shoes &amp; Accessories</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/322/index.html&amp;ncms_spm=a27aq.cp_322&amp;prefetchKey=allcategoriesv2&amp;categoryIds=322" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100015" data-spm-anchor-id="a2700.product_home_fy25.home_header.8" data-aplus-ae="44">Browse featured selections</a></div><div class="leaf-container"><div class="leaf-row first-row"><a class="hc-leaf-item" href="https://www.alibaba.com/category/canvas-shoes_201333410.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201333410&amp;title=&amp;level1CategoryId=100015&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.129" data-aplus-ae="135"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/HTB1iaCWeqSs3KVjSZPiq6AsiVXah.jpg" class="product-img" loading="lazy"></div><div class="title">Canvas Shoes</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/flats_201152005.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201152005&amp;title=&amp;level1CategoryId=100015&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.130" data-aplus-ae="136"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H221988de36a944488e4d7e20b83ea0c56.jpg" class="product-img" loading="lazy"></div><img src="https://s.alicdn.com/@img/imgextra/i1/O1CN017VUC0e28oRCBkDak2_!!6000000007979-2-tps-54-55.png" class="icon" loading="lazy"><div class="title">Flats</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/sports-slippers_201773404.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201773404&amp;title=&amp;level1CategoryId=100015&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.131" data-aplus-ae="137"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hb7e40a41f4254318be4a2738877d9392j.jpg" class="product-img" loading="lazy"></div><div class="title">Sports Slippers</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/flip-flops-slippers_201340010.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201340010&amp;title=&amp;level1CategoryId=100015&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.132" data-aplus-ae="138"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hf3527a837ef049f29ad50b2b9f66e131A.jpg" class="product-img" loading="lazy"></div><div class="title">Flip-Flops Slippers</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/men-sandals_201152907.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201152907&amp;title=&amp;level1CategoryId=100015&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.133" data-aplus-ae="139"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/A079ba516029149ea82ca13f5b3f61807B.jpg" class="product-img" loading="lazy"></div><div class="title">Men Sandals</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/slides-slippers_201336721.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201336721&amp;title=&amp;level1CategoryId=100015&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.134" data-aplus-ae="140"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H30616abcdec8442da9786fde3db566625.jpg" class="product-img" loading="lazy"></div><div class="title">Slides Slippers</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/sandals_201152907.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201152907&amp;title=&amp;level1CategoryId=100015&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.135" data-aplus-ae="141"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H17427efa7d864b6ab578873a8fc0e503q.jpg" class="product-img" loading="lazy"></div><img src="https://s.alicdn.com/@img/imgextra/i1/O1CN017VUC0e28oRCBkDak2_!!6000000007979-2-tps-54-55.png" class="icon" loading="lazy"><div class="title">Sandals</div></a></div><div class="leaf-row second-row"><a class="hc-leaf-item" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=&amp;title=&amp;action=more&amp;position=modal_panel" data-aplus-ae="142"><div class="product-wrapper"><img src="https://s.alicdn.com/@img/imgextra/i2/O1CN015j2EYl1oJ1ldUovSw_!!6000000005203-55-tps-95-95.svg" class="product-img" loading="lazy"></div><div class="title">View all</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/sport-sandals_201152907.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201152907&amp;title=&amp;level1CategoryId=100015&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.136" data-aplus-ae="143"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H733168af0eff4224918b885aa17d4f8dp.jpg" class="product-img" loading="lazy"></div><div class="title">Sport Sandals</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/indoor-slippers_201339411.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201339411&amp;title=&amp;level1CategoryId=100015&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.137" data-aplus-ae="144"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/Hc932c7797ea04697953d3f72d87adb98h.jpg" class="product-img" loading="lazy"></div><div class="title">Indoor Slippers</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/summer-sandals_201330707.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201330707&amp;title=&amp;level1CategoryId=100015&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.138" data-aplus-ae="145"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H6d66e440c2414725ad8a83997f0df0d76.jpg" class="product-img" loading="lazy"></div><div class="title">Summer Sandals</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/gym-shoes_201334413.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201334413&amp;title=&amp;level1CategoryId=100015&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.139" data-aplus-ae="146"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H7ba5c8050533482bbb7fbe8612a257cbU.jpg" class="product-img" loading="lazy"></div><div class="title">Gym Shoes</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/orthopedic-shoes_201778402.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201778402&amp;title=&amp;level1CategoryId=100015&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.140" data-aplus-ae="147"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H34209ec6f1a44a8abc772cd043ca9351Q.jpg" class="product-img" loading="lazy"></div><div class="title">Orthopedic Shoes</div></a><a class="hc-leaf-item" href="https://www.alibaba.com/category/clogs-shoes_201153804.html" target="_blank" data-dot-header-categories="true" data-params="type=leaf_category&amp;leafCategoryId=201153804&amp;title=&amp;level1CategoryId=100015&amp;position=modal_panel" data-spm-anchor-id="a2700.product_home_fy25.home_header.141" data-aplus-ae="148"><div class="product-wrapper"><img src="https://s.alicdn.com/@sc01/kf/H4d9e6752f8fa46538d615d68a81ef7a37.jpg" class="product-img" loading="lazy"></div><div class="title">Clogs Shoes</div></a></div></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100011"><div class="category-title-container"><div class="category-title">Parents, Kids &amp; Toys</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/26/index.html&amp;ncms_spm=a27aq.cp_26&amp;prefetchKey=allcategoriesv2&amp;categoryIds=26" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100011" data-spm-anchor-id="a2700.product_home_fy25.home_header.9" data-aplus-ae="45">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100005"><div class="category-title-container"><div class="category-title">Home &amp; Garden</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/15/index.html&amp;ncms_spm=a27aq.cp_15&amp;prefetchKey=allcategoriesv2&amp;categoryIds=15" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100005" data-spm-anchor-id="a2700.product_home_fy25.home_header.10" data-aplus-ae="46">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100009"><div class="category-title-container"><div class="category-title">Sports &amp; Entertainment</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/18/index.html&amp;ncms_spm=a27aq.cp_18&amp;prefetchKey=allcategoriesv2&amp;categoryIds=18" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100009" data-spm-anchor-id="a2700.product_home_fy25.home_header.11" data-aplus-ae="47">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100010"><div class="category-title-container"><div class="category-title">Beauty</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/66/index.html&amp;ncms_spm=a27aq.cp_66&amp;prefetchKey=allcategoriesv2&amp;categoryIds=66" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100010" data-spm-anchor-id="a2700.product_home_fy25.home_header.12" data-aplus-ae="48">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100013"><div class="category-title-container"><div class="category-title">Jewelry, Eyewear &amp; Watches</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/36/index.html&amp;ncms_spm=a27aq.cp_36&amp;prefetchKey=allcategoriesv2&amp;categoryIds=36" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100013" data-spm-anchor-id="a2700.product_home_fy25.home_header.13" data-aplus-ae="49">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100019"><div class="category-title-container"><div class="category-title">Luggage, Bags &amp; Cases</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/1524/index.html&amp;ncms_spm=a27aq.cp_1524&amp;prefetchKey=allcategoriesv2&amp;categoryIds=1524" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100019" data-spm-anchor-id="a2700.product_home_fy25.home_header.14" data-aplus-ae="50">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100020"><div class="category-title-container"><div class="category-title">Packaging &amp; Printing</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/23/index.html&amp;ncms_spm=a27aq.cp_23&amp;prefetchKey=allcategoriesv2&amp;categoryIds=23" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100020" data-spm-anchor-id="a2700.product_home_fy25.home_header.15" data-aplus-ae="51">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100024"><div class="category-title-container"><div class="category-title">Personal Care &amp; Home Care</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/201951502/index.html&amp;ncms_spm=a27aq.cp_201951502&amp;prefetchKey=allcategoriesv2&amp;categoryIds=201951502" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100024" data-spm-anchor-id="a2700.product_home_fy25.home_header.16" data-aplus-ae="52">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100031"><div class="category-title-container"><div class="category-title">Health &amp; Medical</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/100002908/index.html&amp;ncms_spm=a27aq.cp_100002908&amp;prefetchKey=allcategoriesv2&amp;categoryIds=100002908" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100031" data-spm-anchor-id="a2700.product_home_fy25.home_header.17" data-aplus-ae="53">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100039"><div class="category-title-container"><div class="category-title">Gifts &amp; Crafts</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/17/index.html&amp;ncms_spm=a27aq.cp_17&amp;prefetchKey=allcategoriesv2&amp;categoryIds=17" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100039" data-spm-anchor-id="a2700.product_home_fy25.home_header.18" data-aplus-ae="54">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100040"><div class="category-title-container"><div class="category-title">Pet Supplies </div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/201946504/index.html&amp;ncms_spm=a27aq.cp_201946504&amp;prefetchKey=allcategoriesv2&amp;categoryIds=201946504" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100040" data-spm-anchor-id="a2700.product_home_fy25.home_header.19" data-aplus-ae="55">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100033"><div class="category-title-container"><div class="category-title">School &amp; Office Supplies</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/21/index.html&amp;ncms_spm=a27aq.cp_21&amp;prefetchKey=allcategoriesv2&amp;categoryIds=21" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100033" data-spm-anchor-id="a2700.product_home_fy25.home_header.20" data-aplus-ae="56">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100012"><div class="category-title-container"><div class="category-title">Industrial Machinery</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/43/index.html&amp;ncms_spm=a27aq.cp_43&amp;prefetchKey=allcategoriesv2&amp;categoryIds=43" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100012" data-spm-anchor-id="a2700.product_home_fy25.home_header.21" data-aplus-ae="57">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100042"><div class="category-title-container"><div class="category-title">Commercial Equipment &amp; Machinery</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/2829/index.html&amp;ncms_spm=a27aq.cp_2829&amp;prefetchKey=allcategoriesv2&amp;categoryIds=2829" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100042" data-spm-anchor-id="a2700.product_home_fy25.home_header.22" data-aplus-ae="58">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100032"><div class="category-title-container"><div class="category-title">Construction &amp; Building Machinery</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/201943703/index.html&amp;ncms_spm=a27aq.cp_201943703&amp;prefetchKey=allcategoriesv2&amp;categoryIds=201943703" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100032" data-spm-anchor-id="a2700.product_home_fy25.home_header.23" data-aplus-ae="59">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100051"><div class="category-title-container"><div class="category-title">Construction &amp; Real Estate</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/13/index.html&amp;ncms_spm=a27aq.cp_13&amp;prefetchKey=allcategoriesv2&amp;categoryIds=13" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100051" data-spm-anchor-id="a2700.product_home_fy25.home_header.24" data-aplus-ae="60">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100052"><div class="category-title-container"><div class="category-title">Furniture</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/1503/index.html&amp;ncms_spm=a27aq.cp_1503&amp;prefetchKey=allcategoriesv2&amp;categoryIds=1503" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100052" data-spm-anchor-id="a2700.product_home_fy25.home_header.25" data-aplus-ae="61">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100053"><div class="category-title-container"><div class="category-title">Lights &amp; Lighting</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/39/index.html&amp;ncms_spm=a27aq.cp_39&amp;prefetchKey=allcategoriesv2&amp;categoryIds=39" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100053" data-spm-anchor-id="a2700.product_home_fy25.home_header.26" data-aplus-ae="62">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100021"><div class="category-title-container"><div class="category-title">Home Appliances</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/6/index.html&amp;ncms_spm=a27aq.cp_6&amp;prefetchKey=allcategoriesv2&amp;categoryIds=6" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100021" data-spm-anchor-id="a2700.product_home_fy25.home_header.27" data-aplus-ae="63">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100022"><div class="category-title-container"><div class="category-title">Automotive Supplies &amp; Tools</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/202014504/index.html&amp;ncms_spm=a27aq.cp_202014504&amp;prefetchKey=allcategoriesv2&amp;categoryIds=202014504" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100022" data-spm-anchor-id="a2700.product_home_fy25.home_header.28" data-aplus-ae="64">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100018"><div class="category-title-container"><div class="category-title">Vehicle Parts &amp; Accessories</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/34/index.html&amp;ncms_spm=a27aq.cp_34&amp;prefetchKey=allcategoriesv2&amp;categoryIds=34" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100018" data-spm-anchor-id="a2700.product_home_fy25.home_header.29" data-aplus-ae="65">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100043"><div class="category-title-container"><div class="category-title">Tools &amp; Hardware</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/1420/index.html&amp;ncms_spm=a27aq.cp_1420&amp;prefetchKey=allcategoriesv2&amp;categoryIds=1420" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100043" data-spm-anchor-id="a2700.product_home_fy25.home_header.30" data-aplus-ae="66">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100049"><div class="category-title-container"><div class="category-title">Renewable Energy</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/201726502/index.html&amp;ncms_spm=a27aq.cp_201726502&amp;prefetchKey=allcategoriesv2&amp;categoryIds=201726502" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100049" data-spm-anchor-id="a2700.product_home_fy25.home_header.31" data-aplus-ae="67">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100050"><div class="category-title-container"><div class="category-title">Electrical Equipment &amp; Supplies</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/5/index.html&amp;ncms_spm=a27aq.cp_5&amp;prefetchKey=allcategoriesv2&amp;categoryIds=5" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100050" data-spm-anchor-id="a2700.product_home_fy25.home_header.32" data-aplus-ae="68">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100045"><div class="category-title-container"><div class="category-title">Safety &amp; Security</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/30/index.html&amp;ncms_spm=a27aq.cp_30&amp;prefetchKey=allcategoriesv2&amp;categoryIds=30" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100045" data-spm-anchor-id="a2700.product_home_fy25.home_header.33" data-aplus-ae="69">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100044"><div class="category-title-container"><div class="category-title">Material Handling</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/201725504/index.html&amp;ncms_spm=a27aq.cp_201725504&amp;prefetchKey=allcategoriesv2&amp;categoryIds=201725504" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100044" data-spm-anchor-id="a2700.product_home_fy25.home_header.34" data-aplus-ae="70">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100046"><div class="category-title-container"><div class="category-title">Testing Instrument &amp; Equipment</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/201734802/index.html&amp;ncms_spm=a27aq.cp_201734802&amp;prefetchKey=allcategoriesv2&amp;categoryIds=201734802" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100046" data-spm-anchor-id="a2700.product_home_fy25.home_header.35" data-aplus-ae="71">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100047"><div class="category-title-container"><div class="category-title">Power Transmission</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/201723202/index.html&amp;ncms_spm=a27aq.cp_201723202&amp;prefetchKey=allcategoriesv2&amp;categoryIds=201723202" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100047" data-spm-anchor-id="a2700.product_home_fy25.home_header.36" data-aplus-ae="72">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100035"><div class="category-title-container"><div class="category-title">Electronic Components</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/502/index.html&amp;ncms_spm=a27aq.cp_502&amp;prefetchKey=allcategoriesv2&amp;categoryIds=502" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100035" data-spm-anchor-id="a2700.product_home_fy25.home_header.37" data-aplus-ae="73">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100026"><div class="category-title-container"><div class="category-title">Vehicles &amp; Transportation</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/201275273/index.html&amp;ncms_spm=a27aq.cp_201275273&amp;prefetchKey=allcategoriesv2&amp;categoryIds=201275273" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100026" data-spm-anchor-id="a2700.product_home_fy25.home_header.38" data-aplus-ae="74">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100041"><div class="category-title-container"><div class="category-title">Agriculture, Food &amp; Beverage</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/2/index.html&amp;ncms_spm=a27aq.cp_2&amp;prefetchKey=allcategoriesv2&amp;categoryIds=2" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100041" data-spm-anchor-id="a2700.product_home_fy25.home_header.39" data-aplus-ae="75">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100030"><div class="category-title-container"><div class="category-title">Raw Materials</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/9/index.html&amp;ncms_spm=a27aq.cp_9&amp;prefetchKey=allcategoriesv2&amp;categoryIds=9" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100030" data-spm-anchor-id="a2700.product_home_fy25.home_header.40" data-aplus-ae="76">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100048"><div class="category-title-container"><div class="category-title">Fabrication Services</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/41/index.html&amp;ncms_spm=a27aq.cp_41&amp;prefetchKey=allcategoriesv2&amp;categoryIds=41" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100048" data-spm-anchor-id="a2700.product_home_fy25.home_header.41" data-aplus-ae="77">Browse featured selections</a></div></div><div class="hc-level3-cate-unit level3-panel-unit" data-category-id="100038"><div class="category-title-container"><div class="category-title">Service</div><a class="category-link" href="https://sale.alibaba.com/category/products/index.html?wx_navbar_transparent=true&amp;path=/category/products/28/index.html&amp;ncms_spm=a27aq.cp_28&amp;prefetchKey=allcategoriesv2&amp;categoryIds=28" target="_blank" data-dot-header-categories="true" data-params="type=level1_category_link&amp;categoryId=100038" data-spm-anchor-id="a2700.product_home_fy25.home_header.42" data-aplus-ae="78">Browse featured selections</a></div></div></div></div></div></div></div></div>

update the same or similar categories update to database



documentation

Here’s a **clear and professional corrected prompt** you can use:

---

### ✅ Correct Prompt

**Update the complete project documentation to include:**

1. **Full project setup guide**

   * prerequisites
   * environment configuration
   * backend setup
   * frontend setup
   * database migration
   * storage linking
   * queue / cron setup
   * build and deployment steps

2. **Installation process**

   * local development installation
   * staging/live server installation
   * npm and composer commands
   * environment variables explanation
   * common troubleshooting steps

3. **Complete admin panel documentation**

   * explain all admin menus
   * submenu descriptions
   * purpose of each module
   * workflow of each section
   * roles and permissions usage
   * settings and configuration menus

4. **Buyer panel documentation**

   * explain all buyer menus
   * order flow
   * product browsing
   * quotations / inquiries
   * wallet / payments
   * notifications
   * profile and settings

5. **Supplier panel documentation**

   * explain all supplier menus
   * product management
   * inventory
   * quotation responses
   * order management
   * earnings / wallet
   * shipping and delivery workflow
   * profile and business settings

6. **User flow explanation**

   * admin workflow
   * buyer workflow
   * supplier workflow
   * end-to-end transaction lifecycle

7. **Screenshots / UI references**

   * include important page screenshots
   * explain screen purpose
   * mention validation and user actions

The documentation should be **well-structured, professional, and easy for developers, testers, and clients to understand**.

---

If you want, I can help convert this into a **client-ready BRD / technical documentation format**.
