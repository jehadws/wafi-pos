import json
import re
import os

def build_ar_v2():
    with open('lang/ar.json', 'r', encoding='utf-8') as f:
        ar_orig = json.load(f)

    # 1. Exact key-level overrides for professional modern Arabic
    overrides = {
        # Core UI / Buttons / Common
        "OK": "موافق",
        "Howdy, {name}": "مرحبًا، {name}",
        "This field is required.": "هذا الحقل مطلوب.",
        "This field must contain a valid email address.": "يجب أن يحتوي هذا الحقل على بريد إلكتروني صالح.",
        "Go Back": "رجوع",
        "Filters": "تصفية",
        "Has Filters": "يحتوي على فلاتر",
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
        "Register": "تسجيل حساب",
        "An unexpected error occurred.": "حدث خطأ غير متوقع.",
        "Unable to proceed the form is not valid.": "تعذر المتابعة، البيانات المدخلة في النموذج غير صالحة.",
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
        "Not enough funds to add {amount} as a payment. Available balance {balance}.": "الرصيد غير كافٍ لإضافة {amount} كدفعة. الرصيد المتاح هو {balance}."
    }

    # Process all keys
    ar_v2 = {}
    changes = []

    for k, v_orig in ar_orig.items():
        # Clean basic formatting issues
        v = v_orig
        
        # Replace broken entities
        v = v.replace("&mdash;", "—")
        v = v.replace("و [مدش] ؛", "—")
        v = v.replace("و [مدش]؛", "—")
        v = v.replace("[مدش]", "—")
        v = v.replace("&nbsp;", " ")
        v = v.replace("&quot;", '"')
        v = v.replace("&amp;", "&")
        
        # Fix broken %s in arabic
        v = v.replace("٪س", "%s")
        v = v.replace("٪ س", "%s")
        v = v.replace("٪s", "%s")
        v = v.replace("٪ s ", " %s ")
        
        # Fix translated placeholders
        v = v.replace("{إدخالات}", "{entries}")
        v = v.replace("{الرصيد}", "{balance}")
        v = v.replace("{يوم}", "{day}")
        v = v.replace("{التاريخ}", "{date}")
        v = v.replace("{الأيام}", "{days}")
        v = v.replace("{الوقت}", "{time}")
        v = v.replace("{الاسم}", "{name}")
        v = v.replace("{المبلغ}", "{amount}")

        # Check explicit overrides
        if k in overrides:
            v_new = overrides[k]
            reason = "تحسين الصياغة وتوحيد المصطلحات وإصلاح الترجمة الحرفية / العناصر النائبة"
        else:
            v_new = v
            # Common terminology fixes in text
            if "الذمم المدينة" in v_new:
                v_new = v_new.replace("الذمم المدينة", "حسابات القبض (مستحقات العملاء)")
            if "الذمم الدائنة" in v_new:
                v_new = v_new.replace("الذمم الدائنة", "حسابات الدفع (مستحقات الموردين)")
            if "الخصوم" in v_new and "الالتزامات" not in v_new:
                v_new = v_new.replace("الخصوم", "الالتزامات")
            if "حسم" in v_new and "خصم" not in v_new:
                v_new = v_new.replace("حسم", "خصم")
            if "معاق" in v_new and "Disabled" in k:
                v_new = v_new.replace("معاق", "معطّل")
            if "إبطال" in v_new and "Disable" in k:
                v_new = v_new.replace("إبطال", "تعطيل")
            if "ينعش" in v_new and "Refresh" in k:
                v_new = v_new.replace("ينعش", "تحديث")
            if "الشمس" in v_new and k == "Sun":
                v_new = "الأحد"
            if "تزوج" in v_new and k == "Wed":
                v_new = "الأربعاء"
            if "جلس" in v_new and k == "Sat":
                v_new = "السبت"
            if "المرشحات" in v_new and "Filter" in k:
                v_new = v_new.replace("المرشحات", "الفلاتر")
            if "اللجان" in v_new and "Commission" in k:
                v_new = v_new.replace("اللجان", "العمولات")
            if "مشروع" in v_new and k == "Draft":
                v_new = "مسودة"
            if "ترتيب" in v_new and "Order" in k and "sort" not in k.lower():
                v_new = v_new.replace("ترتيب", "طلب")

            # Replace comma with arabic comma
            v_new = v_new.replace(" ,", "، ").replace(",", "، ")
            v_new = re.sub(r' +', ' ', v_new)
            v_new = v_new.strip()

        # Check if changed
        if v_new != v_orig:
            # Determine reason
            if k in overrides:
                reason = "تحسين دقة الترجمة ومطابقة معايير برامج المحاسبة ونقاط البيع الحديثة"
            elif "مدش" in v_orig or "٪" in v_orig or "{" in v_orig and ("{إدخالات}" in v_orig or "{الرصيد}" in v_orig or "{يوم}" in v_orig or "{التاريخ}" in v_orig):
                reason = "إصلاح خطأ في العناصر النائبة والترميز"
            elif "الذمم" in v_orig or "الخصوم" in v_orig:
                reason = "تبسيط المصطلحات المحاسبية وتحديثها"
            elif any(w in v_orig for w in ["معاق", "تزوج", "جلس", "الشمس", "اللجان", "ينعش", "ترتيب", "المرشحات"]):
                reason = "تصحيح ترجمة حرفية خاطئة"
            else:
                reason = "تحسين الصياغة وعلامات الترقيم"
            
            changes.append({
                "key": k,
                "old": v_orig,
                "new": v_new,
                "reason": reason
            })

        ar_v2[k] = v_new

    # Write output to lang/ar_v2.json
    with open('lang/ar_v2.json', 'w', encoding='utf-8') as f:
        json.dump(ar_v2, f, ensure_ascii=False, indent=4)

    print(f"Successfully generated lang/ar_v2.json with {len(ar_v2)} keys.")
    print(f"Total changed keys: {len(changes)}")
    
    with open('scripts/changes_report.json', 'w', encoding='utf-8') as f:
        json.dump(changes, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    build_ar_v2()
