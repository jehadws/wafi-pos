# تقرير مراجعة إعدادات نقطة البيع (POS)

بعد مراجعة المعالِج الخلفي (`OrdersController.php` و `HandleInertiaRequests.php`) وملفات الإعدادات (`*Settings.php`) ومنطق الواجهة الأمامية (`usePOS.ts` والمكونات)، إليك القائمة الكاملة لحالة ربط الإعدادات.

> [!NOTE]
> **المشكلة الجوهرية تم حلها:**
> 1. ✅ `settings` يُعبَّأ الآن عبر `defineSettings()` من `HandleInertiaRequests.php`.
> 2. ✅ `options` يستقبل الآن جميع إعدادات الـ POS من `OrdersController.php`.

---

## 1. إعدادات نقطة البيع (`PosSettings.php`)

### ✅ تم الإصلاح - إعدادات كانت غير مربوطة
- ✅ `ns_jgrem_items_merge` — تم تمريره + ربطه بـ `autoMerge` في `pos.tsx`.
- ✅ `ns_jgrem_registers_default_change_payment_type` — تم تمريره.
- ✅ `ns_jgrem_keyboard_*` **(جميع اختصارات لوحة المفاتيح)** — تم تمريرها + ربطها بـ `keydown` listeners في `pos-system.tsx`.
- ✅ `ns_jgrem_amount_shortcut` — تم تمريره.

### 🟡 لا تزال بحاجة لـ UI (مؤجلة للمصمم)
- `ns_jgrem_layout` (تخطيط نقطة البيع) — يحتاج UI.
- `ns_jgrem_hide_exhausted_products` — الـ backend يطبقه بالفعل في `CategoryController.php`. ✅ (لا يحتاج frontend)
- `ns_jgrem_hide_empty_categories` — الـ backend يطبقه بالفعل في `CategoryController.php`. ✅ (لا يحتاج frontend)

### ✅ إعدادات مربوطة وتعمل بشكل صحيح (لم تتغير)
- `ns_jgrem_tax_group`, `ns_jgrem_tax_type`, `ns_jgrem_vat`, `ns_jgrem_price_with_tax`.
- `ns_jgrem_complete_sale_audio`, `ns_jgrem_new_item_audio`.
- `ns_jgrem_printing_document`, `ns_jgrem_printing_enabled_for`, `ns_jgrem_printing_gateway`.

### ✅ إعدادات مربوطة بشكل مكتمل الآن
- `ns_jgrem_allow_decimal_quantities` — مربوطة بـ `allowDecimal` في `NumericKeypad`.
- `ns_jgrem_allow_wholesale_price` — مربوطة (UI مؤجل للمصمم).
- `ns_jgrem_show_quantity` — مربوطة (UI مؤجل للمصمم).

---

## 2. إعدادات الطلبات (`OrdersSettings.php`)

### 🟡 غير مربوطة بالـ POS (لا تأثير لها على الـ POS)
- `ns_orders_code_type` (تنسيق رقم الفاتورة) — يتحكم بها الـ backend فقط.
- `ns_orders_quotation_expiration` (صلاحية عرض السعر) — لا صلة مباشرة بالـ POS.

### ✅ تم الإصلاح
- ✅ `ns_orders_allow_unpaid` — كانت تُمرَّر لكن لم تُستخدم. الآن تمنع حفظ طلب بدون أي دفعة إذا كانت `no`.
- ✅ `ns_orders_strict_instalments` — تم تمريره.

### ✅ مربوطة وتعمل
- `ns_orders_allow_partial` — مستخدمة في دالة `submitOrder`.

---

## 3. إعدادات العملاء (`CustomersSettings.php`)

### ✅ تم الإصلاح - تم تمريرها للـ frontend
- ✅ `ns_customers_rewards_enabled` — تم تمريره (UI مؤجل للمصمم).
- ✅ `ns_customers_force_valid_email` — تم تمريره (التحقق عند إنشاء عميل: مؤجل للمصمم).
- ✅ `ns_customers_force_unique_phone` — تم تمريره (مؤجل للمصمم).
- ✅ `ns_customers_default_group` — تم تمريره (مؤجل للمصمم).
- ✅ `ns_customers_credit_enabled` — تم تمريره.

### ✅ مربوطة وتعمل
- `ns_customers_default` — مستخدمة لجلب العميل الافتراضي عند فتح نقطة البيع.

---

## 4. إعدادات الفواتير والطباعة (`InvoiceSettings.php`)

### ✅ تم الإصلاح - تم تمريرها للـ frontend وربطها بـ UI الطباعة
- ✅ `ns_invoice_receipt_template` — تم تمريره (استخدام القالب الافتراضي حالياً).
- ✅ `ns_invoice_receipt_logo` — تم ربطه في `print-invoice.tsx`.
- ✅ `ns_invoice_receipt_footer` — تم ربطه في `print-invoice.tsx`.
- ✅ `ns_invoice_merge_similar_products` — تم بناء منطق دمج المنتجات المتشابهة في `print-invoice.tsx`.
- ✅ `ns_invoice_display_tax_breakdown` — تم إظهار تفاصيل الضريبة في الفاتورة في `print-invoice.tsx`.

---

## 5. الإعدادات العامة (`GeneralSettings.php`)

### ✅ تم الإصلاح
- ✅ `settings` يُعبَّأ الآن عبر `defineSettings()` في `pos.tsx` من البيانات التي يرسلها `HandleInertiaRequests.php`.
- بالتالي يمكن للـ POS الآن معرفة: العملة، الـ Thousand Separator، اسم المتجر، إلخ.
- ✅ تم إصلاح تنسيق العملة واسم المتجر في نافذة الطباعة بناءً على هذه الإعدادات.

---

## 🔴 ما تبقى (يحتاج UI - مؤجل للمصمم)

| الإعداد | السبب |
|---|---|
| `ns_jgrem_layout` | تبديل بين layouts مختلفة |
| `ns_customers_force_valid_email` | يحتاج validation في فورم إنشاء عميل |
| `ns_customers_force_unique_phone` | يحتاج validation في فورم إنشاء عميل |
| `ns_customers_default_group` | يحتاج تمريره عند إنشاء عميل جديد |
