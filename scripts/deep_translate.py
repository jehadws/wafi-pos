import json
import re

def refine_all():
    with open('lang/ar.json', 'r', encoding='utf-8') as f:
        ar_orig = json.load(f)

    # Specific key overrides for high quality UI/Accounting POS experience
    exact_overrides = {
        # Core UI / Buttons / Common
        "OK": "موافق",
        "Howdy, {name}": "مرحبًا، {name}",
        "This field is required.": "هذا الحقل مطلوب.",
        "This field must contain a valid email address.": "يجب أن يحتوي هذا الحقل على عنوان بريد إلكتروني صالح.",
        "Go Back": "رجوع",
        "Filters": "تصفية",
        "Has Filters": "يحتوي على فلاتر",
        "Use Filters": "استخدام الفلاتر",
        "{entries} entries selected": "تم تحديد {entries} عنصر",
        "Download": "تنزيل",
        "There is nothing to display...": "لا يوجد شيء لعرضه...",
        "Bulk Actions": "إجراءات جماعية",
        "displaying {perPage} on {items} items": "عرض {perPage} من أصل {items} عنصر",
        "The document has been generated.": "تم إنشاء المستند بنجاح.",
        "Unexpected error occurred.": "حدث خطأ غير متوقع.",
        "Clear Selected Entries ?": "هل تريد إلغاء تحديد العناصر المختارة؟",
        "Would you like to clear all selected entries ?": "هل ترغب في إلغاء تحديد كافة العناصر المختارة؟",
        "Would you like to perform the selected bulk action on the selected entries ?": "هل ترغب في تنفيذ الإجراء الجماعي المحدد على العناصر المختارة؟",
        "No selection has been made.": "لم يتم تحديد أي عنصر.",
        "No action has been selected.": "لم يتم تحديد أي إجراء.",
        "N/D": "غير محدد",
        "Range Starts": "بداية الفترة",
        "Range Ends": "نهاية الفترة",
        "Sun": "الأحد",
        "Mon": "الإثنين",
        "Tue": "الثلاثاء",
        "Wed": "الأربعاء",
        "Thu": "الخميس",
        "Fri": "الجمعة",
        "Sat": "السبت",
        "Date": "التاريخ",
        "N/A": "غير متوفر",
        "Nothing to display": "لا يوجد شيء لعرضه",
        "Unknown Status": "حالة غير معروفة",
        "Password Forgotten ?": "هل نسيت كلمة المرور؟",
        "Sign In": "تسجيل الدخول",
        "Register": "تسجيل حساب جديد",
        "An unexpected error occurred.": "حدث خطأ غير متوقع.",
        "Unable to proceed the form is not valid.": "تعذر المتابعة، النموذج غير صالح.",
        "Save Password": "حفظ كلمة المرور",
        "Remember Your Password ?": "هل تذكرت كلمة المرور؟",
        "Submit": "إرسال",
        "Already registered ?": "هل لديك حساب بالفعل؟",
        "Best Cashiers": "أفضل موظفي الكاشير",
        "No result to display.": "لا توجد نتائج لعرضها.",
        "Well.. nothing to show for the meantime.": "لا توجد بيانات لعرضها حاليًا.",
        "Best Customers": "أفضل العملاء",
        "Well.. nothing to show for the meantime": "لا توجد بيانات لعرضها حاليًا",
        "Total Sales": "إجمالي المبيعات",
        "Today": "اليوم",
        "Total Refunds": "إجمالي المرتجعات",
        "Clients Registered": "العملاء المسجلون",
        "Commissions": "العمولات",
        "Total": "الإجمالي",
        "Discount": "الخصم",
        "Status": "الحالة",
        "Paid": "مدفوع",
        "Partially Paid": "مدفوع جزئيًا",
        "Unpaid": "غير مدفوع",
        "Hold": "معلق",
        "Void": "ملغي",
        "Refunded": "مسترد",
        "Partially Refunded": "مسترد جزئيًا",
        "Incomplete Orders": "طلبات غير مكتملة",
        "Expenses": "المصروفات",
        "Weekly Sales": "المبيعات الأسبوعية",
        "Week Taxes": "ضرائب الأسبوع",
        "Net Income": "صافي الدخل",
        "Week Expenses": "مصروفات الأسبوع",
        "Current Week": "الأسبوع الحالي",
        "Previous Week": "الأسبوع السابق",
        "Order": "طلب",
        "Refresh": "تحديث",
        "Upload": "رفع ملف",
        "Enabled": "مفعّل",
        "Disabled": "معطّل",
        "Enable": "تفعيل",
        "Disable": "تعطيل",
        "Gallery": "معرض الوسائط",
        "Medias Manager": "إدارة الوسائط",
        "Click Here Or Drop Your File To Upload": "انقر هنا أو اسحب الملف لرفعه",
        "Nothing has already been uploaded": "لم يتم رفع أي ملفات بعد",
        "File Name": "اسم الملف",
        "Uploaded At": "تاريخ الرفع",
        "By": "بواسطة",
        "Previous": "السابق",
        "Next": "التالي",
        "Use Selected": "استخدام الملف المحدد",
        "Clear All": "مسح الكل",
        "Confirm Your Action": "تأكيد الإجراء",
        "Would you like to clear all the notifications ?": "هل ترغب في مسح جميع الإشعارات؟",
        "Permissions": "الصلاحيات",
        "Payment Summary": "ملخص الدفع",
        "Sub Total": "المجموع الفرعي",
        "Shipping": "الشحن",
        "Coupons": "كوبونات الخصم",
        "Taxes": "الضرائب",
        "Change": "المبلغ المتبقي",
        "Order Status": "حالة الطلب",
        "Customer": "العميل",
        "Type": "النوع",
        "General": "عام",
        "Details": "التفاصيل",
        "Products": "المنتجات",
        "History": "السجل",
        "Payments": "المدفوعات",
        "Unable to proceed. The provided form is not valid": "تعذر المتابعة، البيانات المدخلة في النموذج غير صالحة",
        "Delete Order": "حذف الطلب",
        "Would you like to delete this order ? This action is not reversible.": "هل ترغب في حذف هذا الطلب؟ هذا الإجراء لا يمكن التراجع عنه.",
        "Refund": "استرداد / إرجاع",
        "Payment": "الدفع",
        "Draft": "مسودة",
        "Procurement": "أمر الشراء",
        "Procurements": "المشتريات",
        "WholeSale Price": "سعر الجملة",
        "Wholesale Price": "سعر الجملة",
        "Enable WholeSale Price": "تفعيل سعر الجملة",
        "Would you like to switch to wholesale price ?": "هل ترغب في التبديل إلى سعر الجملة؟",
        "Toggle Fullscreen": "تبديل وضع ملء الشاشة",
        "Open Note": "فتح الملاحظات",
        "Keyboard shortcut to open the notes.": "اختصار لوحة المفاتيح لفتح الملاحظات.",
        "Order Type Selector": "محدد نوع الطلب",
        "Keyboard shortcut to open the order type selector.": "اختصار لوحة المفاتيح لفتح محدد نوع الطلب.",
        "Orders Chart": "مخطط الطلبات",
        "Will display a chart of weekly sales.": "عرض مخطط بياني للمبيعات الأسبوعية.",
        "Incomplete Sale Card Widget": "بطاقة المبيعات غير المكتملة",
        "Will display a card of current and overall incomplete sales.": "عرض بطاقة للمبيعات غير المكتملة الحالية والإجمالية.",
        "Will display a card of current and overwall expenses.": "عرض بطاقة للمصروفات الحالية والإجمالية.",
        "Receipt &mdash; %s": "إيصال — %s",
        "Order Invoice &mdash; %s": "فاتورة الطلب — %s",
        "Order Refund Receipt &mdash; %s": "إيصال مرتجع الطلب — %s",
        "Order Receipt &mdash; %s": "إيصال الطلب — %s",
        "Payment Receipt &mdash; %s": "إيصال الدفع — %s",
        "%s Days": "%s أيام",
        "The procurement \"%s\" has been successfully refreshed.": "تم تحديث أمر الشراء \"%s\" بنجاح.",
        "Unable to delete this resource as it has %s dependency with %s item.": "تعذر حذف هذا المورد لوجود ارتباط (%s) مع عنصر (%s).",
        "Unable to delete this resource as it has %s dependency with %s items.": "تعذر حذف هذا المورد لوجود ارتباط (%s) مع (%s) عناصر.",
        "All the customers has been transferred to the new group %s.": "تم نقل جميع العملاء إلى المجموعة الجديدة %s بنجاح.",
        "{day} after month starts": "{day} يوم بعد بداية الشهر",
        "Every {day} of the month": "كل يوم {day} من الشهر",
        "{date} ago": "منذ {date}",
        "In {date}": "في تاريخ {date}",
        "{module}": "{module}",
        "+{count} other": "+{count} أخرى",
        "Cash Register : {register}": "صندوق الكاشير: {register}",
        "{product}: Purchase Unit": "{product}: وحدة الشراء",
        "By : {user}": "بواسطة: {user}",
        "Range : {date1} &mdash; {date2}": "الفترة: {date1} — {date2}",
        "{product} : Units": "{product}: الوحدات",
        "Not enough funds to add {amount} as a payment. Available balance {balance}.": "الرصيد غير كافٍ لإضافة {amount} كدفعة. الرصيد المتاح هو {balance}.",
        "The current order will be void. This action will be recorded. Consider providing a reason for this operation": "سيتم إلغاء الطلب الحالي وتسجيل هذا الإجراء. يرجى كتابة سبب الإلغاء.",
        "Unable to open this register. Only closed register can be opened.": "تعذر فتح هذا الصندوق. يمكن فقط فتح الصناديق المغلقة.",
        "Unable to check a register session history if it\\'s closed.": "تعذر التحقق من سجل جلسة الكاشير إذا كانت مغلقة.",
        "Unable to proceed. The form is not valid.": "تعذر المتابعة، النموذج غير صالح.",
        "Unable to proceed": "تعذر المتابعة",
        "Unable to proceed no products has been provided.": "تعذر المتابعة، لم يتم تحديد أي منتجات.",
        "Unable to proceed, one or more products is not valid.": "تعذر المتابعة، واحد أو أكثر من المنتجات غير صالح.",
        "Unable to proceed, no submit url has been provided.": "تعذر المتابعة، لم يتم توفير رابط الإرسال.",
        "Modify  Order.": "تعديل الطلب.",
        "Modify Order.": "تعديل الطلب.",
        # Cash Register Terminology fixes
        "Registers List": "قائمة صناديق الكاشير",
        "Display all registers.": "عرض جميع صناديق الكاشير.",
        "Add a new register": "إضافة صندوق كاشير جديد",
        "Create a new register": "إنشاء صندوق كاشير جديد",
        "Register a new register and save it.": "إضافة صندوق كاشير جديد وحفظه.",
        "Edit register": "تعديل صندوق الكاشير",
        "Modify  Register.": "تعديل صندوق الكاشير.",
        "Return to Registers": "العودة إلى صناديق الكاشير",
        "Define what is the status of the register.": "تحديد حالة صندوق الكاشير.",
        "Provide mode details about this cash register.": "تقديم تفاصيل إضافية حول صندوق الكاشير هذا.",
        "Unable to delete a register that is currently in use": "تعذر حذف صندوق كاشير قيد الاستخدام حاليًا",
        "Unable to edit a register that is currently in use": "تعذر تعديل صندوق كاشير قيد الاستخدام حاليًا",
        "Register History List": "سجل ورديات الكاشير",
        "Display all register histories.": "عرض سجلات ورديات الكاشير.",
        "Add a new register history": "إضافة سجل وردية جديد",
        "Create a new register history": "إنشاء سجل وردية جديد",
        "Register a new register history and save it.": "تسجيل وردية جديدة وحفظها.",
        "Edit register history": "تعديل سجل الوردية",
        "Modify  Registerhistory.": "تعديل سجل الوردية.",
        "Return to Register History": "العودة إلى سجل الورديات",
        "Register Id": "معرف صندوق الكاشير",
        "Register Name": "اسم صندوق الكاشير",
        "Create Register": "إنشاء صندوق كاشير",
        "No register has been opened by the logged user.": "لم يتم فتح أي وردية أو صندوق من قِبل المستخدم الحالي.",
        "The register is opened.": "تم فتح صندوق الكاشير.",
        "The register has been successfully opened": "تم فتح صندوق الكاشير بنجاح",
        "The register has been successfully closed": "تم إغلاق صندوق الكاشير بنجاح",
        "Enable Cash Registers": "تفعيل صناديق الكاشير",
        "Determine if the POS will support cash registers.": "تحديد ما إذا كانت نقاط البيع تدعم صناديق الكاشير.",
        "The register doesn\\'t have an history.": "صندوق الكاشير ليس له سجل ورديات سابقة.",
        "Register History For : %s": "سجل ورديات الصندوق: %s",
        "Open Register : %s": "فتح صندوق الكاشير: %s",
        "Select Register": "اختيار صندوق الكاشير",
        "Choose a register.": "اختر صندوق كاشير.",
        "We can\\'t attach a payment to a register as it\\'s reference is not provided.": "تعذر ربط الدفعة بصندوق الكاشير لعدم توفر المرجع.",
        "The cash register history has been successfully updated": "تم تحديث سجل ورديات الكاشير بنجاح",
        "The cash register history has already been recorded": "تم تسجيل وردية الكاشير بالفعل",
        "The register history has been successfully deleted": "تم حذف سجل الوردية بنجاح",
        "Define the payment type that will be used for all change from the registers.": "تحديد طريقة الدفع المستخدمة لإرجاع المتبقي من صناديق الكاشير.",
        "You must choose a register before proceeding.": "يجب اختيار صندوق كاشير قبل المتابعة.",
        "The register is not yet loaded.": "لم يتم تحميل بيانات صندوق الكاشير بعد.",
        "You must create a customer to which each sales are attributed when the walking customer doesn\\'t register.": "يجب إنشاء عميل افتراضي لتُنسب إليه المبيعات عندما لا يسجل العميل المباشر بياناته.",
        "The current order will be void. This will cancel the transaction, but the order won\\'t be deleted. Further details about the operation will be tracked on the report. Consider providing the reason of this operation.": "سيتم إلغاء الطلب الحالي والمعاملة المالية المرتبطة به دون حذف الطلب، وسيتم توثيق تفاصيل العملية في التقرير. يرجى إدخال سبب الإلغاء.",
        "Unable to refresh a cash register if it\\'s not opened.": "تعذر تحديث صندوق الكاشير لأنه غير مفتوح.",
        "This will clear all records and accounts. It\\'s ideal if you want to start from scratch. Are you sure you want to reset default settings for accounting?": "سيؤدي هذا إلى مسح جميع السجلات والحسابات للبدء من جديد. هل أنت متأكد من رغبتك في إعادة ضبط إعدادات المحاسبة إلى الوضع الافتراضي؟",
        "Your system doesn\\'t have any valid Payment Type. Consider creating one and try again.": "لا توجد طرق دفع صالحة معرفة بالنظام. يرجى إضافة طريقة دفع والمحاولة مرة أخرى."
    }

    ar_v2 = {}
    changes = []

    for k, v_orig in ar_orig.items():
        if k in exact_overrides:
            v_new = exact_overrides[k]
            reason = "تحسين دقة الترجمة ومطابقة معايير برامج المحاسبة ونقاط البيع وإصلاح المصطلحات والعناصر النائبة"
        else:
            v_new = v_orig

            # Broken entity cleanup
            v_new = v_new.replace("&mdash;", "—")
            v_new = v_new.replace("و [مدش] ؛", "—")
            v_new = v_new.replace("و [مدش]؛", "—")
            v_new = v_new.replace("[مدش]", "—")
            v_new = v_new.replace("&nbsp;", " ")
            v_new = v_new.replace("&quot;", '"')
            v_new = v_new.replace("&amp;", "&")

            # Placeholders
            v_new = v_new.replace("٪س", "%s")
            v_new = v_new.replace("٪ س", "%s")
            v_new = v_new.replace("٪s", "%s")
            v_new = v_new.replace("٪ s ", " %s ")
            v_new = v_new.replace("{إدخالات}", "{entries}")
            v_new = v_new.replace("{الرصيد}", "{balance}")
            v_new = v_new.replace("{يوم}", "{day}")
            v_new = v_new.replace("{التاريخ}", "{date}")
            v_new = v_new.replace("{التاريخ2}", "{date2}")
            v_new = v_new.replace("{الأيام}", "{days}")
            v_new = v_new.replace("{الوقت}", "{time}")
            v_new = v_new.replace("{الاسم}", "{name}")
            v_new = v_new.replace("{المبلغ}", "{amount}")
            v_new = v_new.replace("{المستخدم}", "{user}")
            v_new = v_new.replace("{المنتج}", "{product}")
            v_new = v_new.replace("{عد}", "{count}")
            v_new = v_new.replace("{وحدة}", "{module}")
            v_new = v_new.replace("{تسجيل}", "{register}")

            # General UI and grammatical phrasing enhancements
            if v_new.startswith("غير قادر على المتابعة"):
                v_new = v_new.replace("غير قادر على المتابعة", "تعذر المتابعة")
            if v_new.startswith("غير قادر على المضي قدما"):
                v_new = v_new.replace("غير قادر على المضي قدما", "تعذر المتابعة")
            if v_new.startswith("غير قادر على"):
                v_new = v_new.replace("غير قادر على", "تعذر")

            if "الذمم المدينة" in v_new:
                v_new = v_new.replace("الذمم المدينة", "حسابات القبض (مستحقات العملاء)")
            if "الذمم الدائنة" in v_new:
                v_new = v_new.replace("الذمم الدائنة", "حسابات الدفع (مستحقات الموردين)")
            if "المرشحات" in v_new:
                v_new = v_new.replace("المرشحات", "الفلاتر")
            if "اللجان" in v_new and "Commission" in k:
                v_new = v_new.replace("اللجان", "العمولات")
            if "مشروع" in v_new and k == "Draft":
                v_new = "مسودة"
            if "ترتيب" in v_new and "Order" in k and "sort" not in k.lower():
                v_new = v_new.replace("ترتيب", "طلب")
            if "الترتيب" in v_new and "Order" in k and "sort" not in k.lower():
                v_new = v_new.replace("الترتيب", "الطلب")

            # Typography
            v_new = v_new.replace(" ,", "، ").replace(",", "، ")
            v_new = re.sub(r' +', ' ', v_new).strip()

            if v_new != v_orig:
                if "مدش" in v_orig or "٪" in v_orig or any(p in v_orig for p in ["{إدخالات}", "{الرصيد}", "{يوم}", "{التاريخ}", "{المنتج}", "{المستخدم}"]):
                    reason = "إصلاح خطأ في العناصر النائبة والترميز"
                elif "غير قادر" in v_orig:
                    reason = "تحسين الأسلوب والطلاقة اللغوية (استخدام 'تعذر')"
                elif "الذمم" in v_orig or "الخصوم" in v_orig:
                    reason = "تبسيط المصطلحات المحاسبية لتلائم المستخدمين العاديين"
                else:
                    reason = "تحسين الصياغة ومطابقة المصطلحات القياسية"

        ar_v2[k] = v_new
        if v_new != v_orig:
            changes.append({
                "key": k,
                "old": v_orig,
                "new": v_new,
                "reason": reason
            })

    # Save to lang/ar_v2.json
    with open('lang/ar_v2.json', 'w', encoding='utf-8') as f:
        json.dump(ar_v2, f, ensure_ascii=False, indent=4)

    print(f"Built ar_v2.json successfully. Total keys: {len(ar_v2)}, Changed: {len(changes)}")

    with open('scripts/all_changes.json', 'w', encoding='utf-8') as f:
        json.dump(changes, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    refine_all()
