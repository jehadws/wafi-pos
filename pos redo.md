### pos settings payload
```
{
    "layout": {
        "ns_jgrem_layout": "grocery_shop",
        "ns_jgrem_complete_sale_audio": "http://127.0.0.1:8000/audio/bubble.mp3",
        "ns_jgrem_new_item_audio": "http://127.0.0.1:8000/audio/pop.mp3"
    },
    "printing": {
        "ns_jgrem_printing_document": "invoice",
        "ns_jgrem_printing_enabled_for": "all_orders",
        "ns_jgrem_printing_gateway": "default"
    },
    "registers": {
        "ns_jgrem_registers_enabled": null,
        "ns_jgrem_idle_counter": null,
        "ns_jgrem_disbursement": null,
        "ns_jgrem_registers_default_change_payment_type": 1
    },
    "vat": {
        "ns_jgrem_vat": "disabled",
        "ns_jgrem_tax_group": null,
        "ns_jgrem_tax_type": null
    },
    "shortcuts": {
        "ns_jgrem_keyboard_cancel_order": [],
        "ns_jgrem_keyboard_hold_order": [],
        "ns_jgrem_keyboard_create_customer": [],
        "ns_jgrem_keyboard_payment": [],
        "ns_jgrem_keyboard_shipping": [],
        "ns_jgrem_keyboard_note": [],
        "ns_jgrem_keyboard_order_type": [],
        "ns_jgrem_keyboard_fullscreen": [],
        "ns_jgrem_keyboard_quick_search": [],
        "ns_jgrem_keyboard_toggle_merge": [],
        "ns_jgrem_amount_shortcut": null
    },
    "features": {
        "ns_jgrem_show_quantity": "yes",
        "ns_jgrem_items_merge": "no",
        "ns_jgrem_allow_wholesale_price": "yes",
        "ns_jgrem_allow_decimal_quantities": "no",
        "ns_jgrem_quick_product": "yes",
        "ns_jgrem_quick_product_default_unit": 2,
        "ns_jgrem_unit_price_ediable": "no",
        "ns_jgrem_price_with_tax": "yes",
        "ns_jgrem_order_types": [
            "takeaway"
        ],
        "ns_jgrem_numpad": "advanced",
        "ns_jgrem_force_autofocus": "yes",
        "ns_jgrem_hide_exhausted_products": "no",
        "ns_jgrem_hide_empty_categories": "no"
    }
}
```
### pos settings options
```
{
    "ns_jgrem_layout": [
        {
            "label": "Retail Layout",
            "value": "grocery_shop"
        },
        {
            "label": "Clothing Shop",
            "value": "clothing_shop"
        }
    ],
    "ns_jgrem_complete_sale_audio": [
        {
            "label": "Disabled",
            "value": "disabled"
        },
        {
            "label": "Bubble",
            "value": "http://127.0.0.1:8000/audio/bubble.mp3"
        },
        {
            "label": "Ding",
            "value": "http://127.0.0.1:8000/audio/ding.mp3"
        },
        {
            "label": "Pop",
            "value": "http://127.0.0.1:8000/audio/pop.mp3"
        },
        {
            "label": "Cash Sound",
            "value": "http://127.0.0.1:8000/audio/cash-sound.mp3"
        }
    ],
    "ns_jgrem_new_item_audio": [
        {
            "label": "Disabled",
            "value": "disabled"
        },
        {
            "label": "Bubble",
            "value": "http://127.0.0.1:8000/audio/bubble.mp3"
        },
        {
            "label": "Ding",
            "value": "http://127.0.0.1:8000/audio/ding.mp3"
        },
        {
            "label": "Pop",
            "value": "http://127.0.0.1:8000/audio/pop.mp3"
        },
        {
            "label": "Cash Sound",
            "value": "http://127.0.0.1:8000/audio/cash-sound.mp3"
        }
    ],
    "ns_jgrem_printing_document": [
        {
            "label": "Invoice",
            "value": "invoice"
        },
        {
            "label": "Receipt",
            "value": "receipt"
        }
    ],
    "ns_jgrem_printing_enabled_for": [
        {
            "label": "Disabled",
            "value": "disabled"
        },
        {
            "label": "All Orders",
            "value": "all_orders"
        },
        {
            "label": "From Partially Paid Orders",
            "value": "partially_paid_orders"
        },
        {
            "label": "Only Paid Orders",
            "value": "only_paid_orders"
        }
    ],
    "ns_jgrem_printing_gateway": [
        {
            "label": "Default Printing (web)",
            "value": "default"
        }
    ],
    "ns_jgrem_registers_enabled": [
        {
            "label": "Yes",
            "value": "yes"
        },
        {
            "label": "No",
            "value": "no"
        }
    ],
    "ns_jgrem_idle_counter": [
        {
            "label": "Disabled",
            "value": "disabled"
        },
        {
            "label": "5 Minutes",
            "value": "5min"
        },
        {
            "label": "10 Minutes",
            "value": "10min"
        },
        {
            "label": "15 Minutes",
            "value": "15min"
        },
        {
            "label": "20 Minutes",
            "value": "20min"
        },
        {
            "label": "30 Minutes",
            "value": "30min"
        }
    ],
    "ns_jgrem_disbursement": [
        {
            "label": "Yes",
            "value": "yes"
        },
        {
            "label": "No",
            "value": "no"
        }
    ],
    "ns_jgrem_registers_default_change_payment_type": [
        {
            "label": "Cash",
            "value": 1
        },
        {
            "label": "Bank Payment",
            "value": 2
        },
        {
            "label": "Customer Account",
            "value": 3
        }
    ],
    "ns_jgrem_vat": [
        {
            "label": "Disabled",
            "value": "disabled"
        },
        {
            "label": "Flat Rate",
            "value": "flat_vat"
        },
        {
            "label": "Flexible Rate",
            "value": "variable_vat"
        },
        {
            "label": "Products Vat",
            "value": "products_vat"
        }
    ],
    "ns_jgrem_tax_group": [
        {
            "label": "tax group1",
            "value": 4
        }
    ],
    "ns_jgrem_tax_type": [
        {
            "label": "Inclusive",
            "value": "inclusive"
        },
        {
            "label": "Exclusive",
            "value": "exclusive"
        }
    ],
    "ns_jgrem_keyboard_shortcuts": [
        {
            "label": "backspace",
            "value": "backspace"
        },
        {
            "label": "tab",
            "value": "tab"
        },
        {
            "label": "enter",
            "value": "enter"
        },
        {
            "label": "shift",
            "value": "shift"
        },
        {
            "label": "ctrl",
            "value": "ctrl"
        },
        {
            "label": "alt",
            "value": "alt"
        },
        {
            "label": "pause",
            "value": "pause"
        },
        {
            "label": "capital",
            "value": "capital"
        },
        {
            "label": "escape",
            "value": "escape"
        },
        {
            "label": "pageup",
            "value": "pageup"
        },
        {
            "label": "pagedown",
            "value": "pagedown"
        },
        {
            "label": "end",
            "value": "end"
        },
        {
            "label": "home",
            "value": "home"
        },
        {
            "label": "left",
            "value": "left"
        },
        {
            "label": "up",
            "value": "up"
        },
        {
            "label": "right",
            "value": "right"
        },
        {
            "label": "down",
            "value": "down"
        },
        {
            "label": "insert",
            "value": "insert"
        },
        {
            "label": "delete",
            "value": "delete"
        },
        {
            "label": "0",
            "value": "0"
        },
        {
            "label": "1",
            "value": "1"
        },
        {
            "label": "2",
            "value": "2"
        },
        {
            "label": "3",
            "value": "3"
        },
        {
            "label": "4",
            "value": "4"
        },
        {
            "label": "5",
            "value": "5"
        },
        {
            "label": "6",
            "value": "6"
        },
        {
            "label": "7",
            "value": "7"
        },
        {
            "label": "8",
            "value": "8"
        },
        {
            "label": "9",
            "value": "9"
        },
        {
            "label": "a",
            "value": "a"
        },
        {
            "label": "b",
            "value": "b"
        },
        {
            "label": "c",
            "value": "c"
        },
        {
            "label": "d",
            "value": "d"
        },
        {
            "label": "e",
            "value": "e"
        },
        {
            "label": "f",
            "value": "f"
        },
        {
            "label": "g",
            "value": "g"
        },
        {
            "label": "h",
            "value": "h"
        },
        {
            "label": "i",
            "value": "i"
        },
        {
            "label": "j",
            "value": "j"
        },
        {
            "label": "k",
            "value": "k"
        },
        {
            "label": "l",
            "value": "l"
        },
        {
            "label": "m",
            "value": "m"
        },
        {
            "label": "n",
            "value": "n"
        },
        {
            "label": "o",
            "value": "o"
        },
        {
            "label": "p",
            "value": "p"
        },
        {
            "label": "q",
            "value": "q"
        },
        {
            "label": "r",
            "value": "r"
        },
        {
            "label": "s",
            "value": "s"
        },
        {
            "label": "t",
            "value": "t"
        },
        {
            "label": "u",
            "value": "u"
        },
        {
            "label": "v",
            "value": "v"
        },
        {
            "label": "w",
            "value": "w"
        },
        {
            "label": "x",
            "value": "x"
        },
        {
            "label": "y",
            "value": "y"
        },
        {
            "label": "z",
            "value": "z"
        },
        {
            "label": "num_0",
            "value": "num_0"
        },
        {
            "label": "num_1",
            "value": "num_1"
        },
        {
            "label": "num_2",
            "value": "num_2"
        },
        {
            "label": "num_3",
            "value": "num_3"
        },
        {
            "label": "num_4",
            "value": "num_4"
        },
        {
            "label": "num_5",
            "value": "num_5"
        },
        {
            "label": "num_6",
            "value": "num_6"
        },
        {
            "label": "num_7",
            "value": "num_7"
        },
        {
            "label": "num_8",
            "value": "num_8"
        },
        {
            "label": "num_9",
            "value": "num_9"
        },
        {
            "label": "num_multiply",
            "value": "num_multiply"
        },
        {
            "label": "num_add",
            "value": "num_add"
        },
        {
            "label": "num_enter",
            "value": "num_enter"
        },
        {
            "label": "num_subtract",
            "value": "num_subtract"
        },
        {
            "label": "num_decimal",
            "value": "num_decimal"
        },
        {
            "label": "num_divide",
            "value": "num_divide"
        },
        {
            "label": "⌘",
            "value": "⌘"
        },
        {
            "label": "f1",
            "value": "f1"
        },
        {
            "label": "f2",
            "value": "f2"
        },
        {
            "label": "f3",
            "value": "f3"
        },
        {
            "label": "f4",
            "value": "f4"
        },
        {
            "label": "f5",
            "value": "f5"
        },
        {
            "label": "f6",
            "value": "f6"
        },
        {
            "label": "f7",
            "value": "f7"
        },
        {
            "label": "f8",
            "value": "f8"
        },
        {
            "label": "f9",
            "value": "f9"
        },
        {
            "label": "f10",
            "value": "f10"
        },
        {
            "label": "f11",
            "value": "f11"
        },
        {
            "label": "f12",
            "value": "f12"
        }
    ],
    "ns_jgrem_show_quantity": [
        {
            "label": "Yes",
            "value": "yes"
        },
        {
            "label": "No",
            "value": "no"
        }
    ],
    "ns_jgrem_items_merge": [
        {
            "label": "Yes",
            "value": "yes"
        },
        {
            "label": "No",
            "value": "no"
        }
    ],
    "ns_jgrem_allow_wholesale_price": [
        {
            "label": "Yes",
            "value": "yes"
        },
        {
            "label": "No",
            "value": "no"
        }
    ],
    "ns_jgrem_allow_decimal_quantities": [
        {
            "label": "Yes",
            "value": "yes"
        },
        {
            "label": "No",
            "value": "no"
        }
    ],
    "ns_jgrem_quick_product": [
        {
            "label": "Yes",
            "value": "yes"
        },
        {
            "label": "No",
            "value": "no"
        }
    ],
    "ns_jgrem_quick_product_default_unit": [
        {
            "label": "قطعة",
            "value": 2
        },
        {
            "label": "صندوق",
            "value": 6
        },
        {
            "label": "نصف صندوق",
            "value": 7
        },
        {
            "label": "ميليقرام",
            "value": 10
        },
        {
            "label": "جرام",
            "value": 11
        },
        {
            "label": "كيلوغرام",
            "value": 12
        },
        {
            "label": "ميليلتر",
            "value": 13
        },
        {
            "label": "لتر",
            "value": 14
        }
    ],
    "ns_jgrem_unit_price_ediable": [
        {
            "label": "Yes",
            "value": "yes"
        },
        {
            "label": "No",
            "value": "no"
        }
    ],
    "ns_jgrem_price_with_tax": [
        {
            "label": "Yes",
            "value": "yes"
        },
        {
            "label": "No",
            "value": "no"
        }
    ],
    "ns_jgrem_order_types": [
        {
            "label": "Take Away",
            "value": "takeaway"
        },
        {
            "label": "Delivery",
            "value": "delivery"
        }
    ],
    "ns_jgrem_numpad": [
        {
            "label": "Default",
            "value": "default"
        },
        {
            "label": "Advanced",
            "value": "advanced"
        }
    ],
    "ns_jgrem_force_autofocus": [
        {
            "label": "Yes",
            "value": "yes"
        },
        {
            "label": "No",
            "value": "no"
        }
    ],
    "ns_jgrem_hide_exhausted_products": [
        {
            "label": "Yes",
            "value": "yes"
        },
        {
            "label": "No",
            "value": "no"
        }
    ],
    "ns_jgrem_hide_empty_categories": [
        {
            "label": "Yes",
            "value": "yes"
        },
        {
            "label": "No",
            "value": "no"
        }
    ]
}
```

### pos settings
```
{
    "identification": {
        "ns_store_name": "JgremPOS",
        "ns_store_address": "salah alden",
        "ns_store_city": "tripoli",
        "ns_store_phone": 921397242,
        "ns_store_email": "jehad.a6k@gmail.com",
        "ns_store_pobox": 218,
        "ns_store_fax": null,
        "ns_store_additional": null,
        "ns_store_square_logo": null,
        "ns_store_rectangle_logo": null,
        "ns_store_language": "en",
        "ns_default_theme": "dark"
    },
    "currency": {
        "ns_currency_symbol": "د.ل",
        "ns_currency_iso": "LYD",
        "ns_currency_position": "after",
        "ns_currency_prefered": "symbol",
        "ns_currency_thousand_separator": null,
        "ns_currency_decimal_separator": null,
        "ns_currency_precision": 2
    },
    "date": {
        "ns_date_format": "Y-m-d",
        "ns_datetime_format": "Y-m-d H:i",
        "ns_datetime_timezone": "Africa/Cairo"
    },
    "registration": {
        "ns_registration_enabled": "yes",
        "ns_registration_role": 1,
        "ns_registration_validated": "no",
        "ns_recovery_enabled": "yes"
    }
}
```

pos paymentTypes
```
[
    {
        "id": 1,
        "label": "Cash",
        "identifier": "cash-payment",
        "priority": 0,
        "description": null,
        "author": 76,
        "active": 1,
        "readonly": 1,
        "created_at": "2025-05-20T08:30:21.000000Z",
        "updated_at": "2025-05-20T08:30:21.000000Z",
        "selected": true
    },
    {
        "id": 2,
        "label": "Bank Payment",
        "identifier": "bank-payment",
        "priority": 0,
        "description": null,
        "author": 76,
        "active": 1,
        "readonly": 1,
        "created_at": "2025-05-20T08:30:21.000000Z",
        "updated_at": "2025-05-20T08:30:21.000000Z",
        "selected": false
    },
    {
        "id": 3,
        "label": "Customer Account",
        "identifier": "account-payment",
        "priority": 0,
        "description": null,
        "author": 76,
        "active": 1,
        "readonly": 1,
        "created_at": "2025-05-20T08:30:21.000000Z",
        "updated_at": "2025-05-20T08:30:21.000000Z",
        "selected": false
    }
]
```

### pos orderTypes
```
{
    "takeaway": {
        "identifier": "takeaway",
        "label": "Take Away",
        "icon": "/images/groceries.png",
        "selected": false
    }
}
```

### pos categories
```
[
    {
        "id": 7,
        "name": "بقوليات",
        "parent_id": 0,
        "media_id": 0,
        "preview_url": "https://vid.alarabiya.net/images/2019/03/25/4eea9d9a-580e-4f09-8cdf-fb362343e1d7/4eea9d9a-580e-4f09-8cdf-fb362343e1d7_16x9_1200x676.jpg?width=801&format=jpg",
        "displays_on_pos": 1,
        "total_items": 2,
        "description": null,
        "author": 76,
        "uuid": null,
        "created_at": "2025-06-16T10:26:31.000000Z",
        "updated_at": "2025-06-26T10:50:16.000000Z"
    },
    {
        "id": 10,
        "name": "juices",
        "parent_id": 0,
        "media_id": 0,
        "preview_url": "https://www.aljawharamag.com/aljawhara/uploads/2024/08/cae944b2309159a23e5a6c898b503916.jpg",
        "displays_on_pos": 1,
        "total_items": 4,
        "description": null,
        "author": 76,
        "uuid": null,
        "created_at": "2025-06-26T08:02:06.000000Z",
        "updated_at": "2025-07-07T19:30:23.000000Z"
    },
    {
        "id": 11,
        "name": "مواد تشطيب",
        "parent_id": 0,
        "media_id": 0,
        "preview_url": null,
        "displays_on_pos": 1,
        "total_items": 0,
        "description": null,
        "author": 76,
        "uuid": null,
        "created_at": "2026-01-18T16:04:44.000000Z",
        "updated_at": "2026-01-18T16:04:44.000000Z"
    },
    {
        "id": 12,
        "name": "مواد اساسية",
        "parent_id": 0,
        "media_id": 0,
        "preview_url": null,
        "displays_on_pos": 1,
        "total_items": 0,
        "description": null,
        "author": 76,
        "uuid": null,
        "created_at": "2026-01-18T16:05:12.000000Z",
        "updated_at": "2026-01-18T16:05:12.000000Z"
    },
    {
        "id": 13,
        "name": "الحديد والمعادن",
        "parent_id": 0,
        "media_id": 0,
        "preview_url": null,
        "displays_on_pos": 1,
        "total_items": 0,
        "description": null,
        "author": 76,
        "uuid": null,
        "created_at": "2026-01-18T16:06:22.000000Z",
        "updated_at": "2026-01-18T16:06:22.000000Z"
    },
    {
        "id": 14,
        "name": "السباكة",
        "parent_id": 0,
        "media_id": 0,
        "preview_url": null,
        "displays_on_pos": 1,
        "total_items": 0,
        "description": null,
        "author": 76,
        "uuid": null,
        "created_at": "2026-01-18T16:07:02.000000Z",
        "updated_at": "2026-01-18T16:07:02.000000Z"
    },
    {
        "id": 15,
        "name": "الكهرباء",
        "parent_id": 0,
        "media_id": 0,
        "preview_url": null,
        "displays_on_pos": 1,
        "total_items": 0,
        "description": null,
        "author": 76,
        "uuid": null,
        "created_at": "2026-01-18T16:07:24.000000Z",
        "updated_at": "2026-01-18T16:07:24.000000Z"
    },
    {
        "id": 16,
        "name": "العدة والأدوات",
        "parent_id": 0,
        "media_id": 0,
        "preview_url": null,
        "displays_on_pos": 1,
        "total_items": 0,
        "description": null,
        "author": 76,
        "uuid": null,
        "created_at": "2026-01-18T16:09:31.000000Z",
        "updated_at": "2026-01-18T16:09:31.000000Z"
    },
    {
        "id": 17,
        "name": "مواد كيميائية واللاصقة",
        "parent_id": 0,
        "media_id": 0,
        "preview_url": null,
        "displays_on_pos": 1,
        "total_items": 0,
        "description": null,
        "author": 76,
        "uuid": null,
        "created_at": "2026-01-18T16:10:34.000000Z",
        "updated_at": "2026-01-18T16:10:34.000000Z"
    },
    {
        "id": 18,
        "name": "خدمات",
        "parent_id": 0,
        "media_id": 0,
        "preview_url": null,
        "displays_on_pos": 1,
        "total_items": 0,
        "description": null,
        "author": 76,
        "uuid": null,
        "created_at": "2026-01-18T16:11:07.000000Z",
        "updated_at": "2026-01-18T16:11:07.000000Z"
    },
    {
        "id": 19,
        "name": "خلاطات",
        "parent_id": 0,
        "media_id": 0,
        "preview_url": null,
        "displays_on_pos": 1,
        "total_items": 14,
        "description": null,
        "author": 76,
        "uuid": null,
        "created_at": "2026-01-22T08:15:15.000000Z",
        "updated_at": "2026-01-22T09:58:24.000000Z"
    }
]
```

### pos categories
```
{
    "products": [
        {
            "id": 16,
            "name": "حنفية فردية في الحائط كروم versliy 5892",
            "tax_type": "inclusive",
            "tax_group_id": 4,
            "tax_value": 0,
            "product_type": "product",
            "type": "materialized",
            "accurate_tracking": false,
            "auto_cogs": true,
            "status": "available",
            "stock_management": "enabled",
            "barcode": "JBYQl6c1rG",
            "barcode_type": "code128",
            "sku": "khlatat--hnfy-frdy-fy-alhayt-krom-versliy--ydiMn",
            "description": null,
            "thumbnail_id": null,
            "category_id": 19,
            "parent_id": 0,
            "unit_group": 2,
            "on_expiration": "allow_sales",
            "expires": 0,
            "searchable": 1,
            "author": 76,
            "uuid": null,
            "created_at": "2026-01-22T08:17:53.000000Z",
            "updated_at": "2026-01-22T08:20:12.000000Z",
            "galleries": [],
            "tax_group": {
                "id": 4,
                "name": "tax group1",
                "description": null,
                "author": 76,
                "uuid": null,
                "created_at": "2025-06-11T05:25:50.000000Z",
                "updated_at": "2025-06-11T05:25:50.000000Z",
                "taxes": [
                    {
                        "id": 3,
                        "name": "tax10",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-06-11T05:53:11.000000Z",
                        "updated_at": "2025-06-11T05:53:11.000000Z"
                    },
                    {
                        "id": 4,
                        "name": "tax2",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-07-07T17:49:42.000000Z",
                        "updated_at": "2025-07-07T17:49:42.000000Z"
                    }
                ]
            },
            "unit_quantities": [
                {
                    "id": 16,
                    "product_id": 16,
                    "type": "product",
                    "preview_url": "",
                    "expiration_date": null,
                    "unit_id": 2,
                    "barcode": "JBYQl6c1rG-16",
                    "quantity": 12,
                    "low_quantity": 0,
                    "stock_alert_enabled": 0,
                    "sale_price": 25,
                    "sale_price_edit": 25,
                    "sale_price_without_tax": 17.8571429,
                    "sale_price_with_tax": 25,
                    "sale_price_tax": 7.1428571,
                    "wholesale_price": 6.9642857,
                    "wholesale_price_edit": 9.75,
                    "wholesale_price_with_tax": 9.75,
                    "wholesale_price_without_tax": 6.9642857,
                    "wholesale_price_tax": 2.7857143,
                    "custom_price": 0,
                    "custom_price_edit": 0,
                    "custom_price_with_tax": 0,
                    "custom_price_without_tax": 0,
                    "custom_price_tax": 0,
                    "visible": 1,
                    "convert_unit_id": null,
                    "cogs": 9.75,
                    "uuid": null,
                    "created_at": "2026-01-22T08:17:53.000000Z",
                    "updated_at": "2026-01-22T10:06:13.000000Z",
                    "unit": {
                        "id": 2,
                        "name": "قطعة",
                        "identifier": "piece",
                        "description": null,
                        "author": 76,
                        "group_id": 2,
                        "value": 1,
                        "preview_url": null,
                        "base_unit": true,
                        "uuid": null,
                        "created_at": "2025-05-19T10:16:35.000000Z",
                        "updated_at": "2025-05-19T10:16:35.000000Z"
                    }
                }
            ]
        },
        {
            "id": 17,
            "name": "حنفية+سنيسكة زاوية كروم versliy 5652",
            "tax_type": "inclusive",
            "tax_group_id": 4,
            "tax_value": 0,
            "product_type": "product",
            "type": "materialized",
            "accurate_tracking": false,
            "auto_cogs": true,
            "status": "available",
            "stock_management": "enabled",
            "barcode": "2LA3NxmQ6r",
            "barcode_type": "code128",
            "sku": "khlatat--hnfysnysk-zaoy-krom-versliy-5652--4jWyj",
            "description": null,
            "thumbnail_id": null,
            "category_id": 19,
            "parent_id": 0,
            "unit_group": 2,
            "on_expiration": "allow_sales",
            "expires": 0,
            "searchable": 1,
            "author": 76,
            "uuid": null,
            "created_at": "2026-01-22T08:19:49.000000Z",
            "updated_at": "2026-01-22T08:19:49.000000Z",
            "galleries": [],
            "tax_group": {
                "id": 4,
                "name": "tax group1",
                "description": null,
                "author": 76,
                "uuid": null,
                "created_at": "2025-06-11T05:25:50.000000Z",
                "updated_at": "2025-06-11T05:25:50.000000Z",
                "taxes": [
                    {
                        "id": 3,
                        "name": "tax10",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-06-11T05:53:11.000000Z",
                        "updated_at": "2025-06-11T05:53:11.000000Z"
                    },
                    {
                        "id": 4,
                        "name": "tax2",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-07-07T17:49:42.000000Z",
                        "updated_at": "2025-07-07T17:49:42.000000Z"
                    }
                ]
            },
            "unit_quantities": [
                {
                    "id": 17,
                    "product_id": 17,
                    "type": "product",
                    "preview_url": "",
                    "expiration_date": null,
                    "unit_id": 2,
                    "barcode": "2LA3NxmQ6r-17",
                    "quantity": 6,
                    "low_quantity": 0,
                    "stock_alert_enabled": 0,
                    "sale_price": 20,
                    "sale_price_edit": 20,
                    "sale_price_without_tax": 14.2857143,
                    "sale_price_with_tax": 20,
                    "sale_price_tax": 5.7142857,
                    "wholesale_price": 9.6428571,
                    "wholesale_price_edit": 13.5,
                    "wholesale_price_with_tax": 13.5,
                    "wholesale_price_without_tax": 9.6428571,
                    "wholesale_price_tax": 3.8571429,
                    "custom_price": 0,
                    "custom_price_edit": 0,
                    "custom_price_with_tax": 0,
                    "custom_price_without_tax": 0,
                    "custom_price_tax": 0,
                    "visible": 1,
                    "convert_unit_id": null,
                    "cogs": 13.5,
                    "uuid": null,
                    "created_at": "2026-01-22T08:19:49.000000Z",
                    "updated_at": "2026-01-22T10:06:14.000000Z",
                    "unit": {
                        "id": 2,
                        "name": "قطعة",
                        "identifier": "piece",
                        "description": null,
                        "author": 76,
                        "group_id": 2,
                        "value": 1,
                        "preview_url": null,
                        "base_unit": true,
                        "uuid": null,
                        "created_at": "2025-05-19T10:16:35.000000Z",
                        "updated_at": "2025-05-19T10:16:35.000000Z"
                    }
                }
            ]
        },
        {
            "id": 18,
            "name": "خلاط دوش كروم versliy 5654",
            "tax_type": "inclusive",
            "tax_group_id": 4,
            "tax_value": 0,
            "product_type": "product",
            "type": "materialized",
            "accurate_tracking": false,
            "auto_cogs": true,
            "status": "available",
            "stock_management": "enabled",
            "barcode": "Aqnbvmt59A",
            "barcode_type": "code128",
            "sku": "khlatat--khlat-dosh-krom-versliy-5654--jTyeE",
            "description": null,
            "thumbnail_id": null,
            "category_id": 19,
            "parent_id": 0,
            "unit_group": 2,
            "on_expiration": "allow_sales",
            "expires": 0,
            "searchable": 1,
            "author": 76,
            "uuid": null,
            "created_at": "2026-01-22T08:21:47.000000Z",
            "updated_at": "2026-01-22T08:21:47.000000Z",
            "galleries": [],
            "tax_group": {
                "id": 4,
                "name": "tax group1",
                "description": null,
                "author": 76,
                "uuid": null,
                "created_at": "2025-06-11T05:25:50.000000Z",
                "updated_at": "2025-06-11T05:25:50.000000Z",
                "taxes": [
                    {
                        "id": 3,
                        "name": "tax10",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-06-11T05:53:11.000000Z",
                        "updated_at": "2025-06-11T05:53:11.000000Z"
                    },
                    {
                        "id": 4,
                        "name": "tax2",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-07-07T17:49:42.000000Z",
                        "updated_at": "2025-07-07T17:49:42.000000Z"
                    }
                ]
            },
            "unit_quantities": [
                {
                    "id": 18,
                    "product_id": 18,
                    "type": "product",
                    "preview_url": "",
                    "expiration_date": null,
                    "unit_id": 2,
                    "barcode": "Aqnbvmt59A-18",
                    "quantity": 25,
                    "low_quantity": 0,
                    "stock_alert_enabled": 0,
                    "sale_price": 125,
                    "sale_price_edit": 125,
                    "sale_price_without_tax": 89.2857143,
                    "sale_price_with_tax": 125,
                    "sale_price_tax": 35.7142857,
                    "wholesale_price": 58.9285714,
                    "wholesale_price_edit": 82.5,
                    "wholesale_price_with_tax": 82.5,
                    "wholesale_price_without_tax": 58.9285714,
                    "wholesale_price_tax": 23.5714286,
                    "custom_price": 0,
                    "custom_price_edit": 0,
                    "custom_price_with_tax": 0,
                    "custom_price_without_tax": 0,
                    "custom_price_tax": 0,
                    "visible": 1,
                    "convert_unit_id": null,
                    "cogs": 82.5,
                    "uuid": null,
                    "created_at": "2026-01-22T08:21:47.000000Z",
                    "updated_at": "2026-01-23T17:51:37.000000Z",
                    "unit": {
                        "id": 2,
                        "name": "قطعة",
                        "identifier": "piece",
                        "description": null,
                        "author": 76,
                        "group_id": 2,
                        "value": 1,
                        "preview_url": null,
                        "base_unit": true,
                        "uuid": null,
                        "created_at": "2025-05-19T10:16:35.000000Z",
                        "updated_at": "2025-05-19T10:16:35.000000Z"
                    }
                }
            ]
        },
        {
            "id": 19,
            "name": "خلاط دوش كروم versliy 5655",
            "tax_type": "inclusive",
            "tax_group_id": 4,
            "tax_value": 0,
            "product_type": "product",
            "type": "materialized",
            "accurate_tracking": false,
            "auto_cogs": true,
            "status": "available",
            "stock_management": "enabled",
            "barcode": "7iILllCEcX",
            "barcode_type": "code128",
            "sku": "khlatat--khlat-dosh-krom-versliy-5655--LIm0G",
            "description": null,
            "thumbnail_id": null,
            "category_id": 19,
            "parent_id": 0,
            "unit_group": 2,
            "on_expiration": "allow_sales",
            "expires": 0,
            "searchable": 1,
            "author": 76,
            "uuid": null,
            "created_at": "2026-01-22T08:23:17.000000Z",
            "updated_at": "2026-01-22T08:23:17.000000Z",
            "galleries": [],
            "tax_group": {
                "id": 4,
                "name": "tax group1",
                "description": null,
                "author": 76,
                "uuid": null,
                "created_at": "2025-06-11T05:25:50.000000Z",
                "updated_at": "2025-06-11T05:25:50.000000Z",
                "taxes": [
                    {
                        "id": 3,
                        "name": "tax10",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-06-11T05:53:11.000000Z",
                        "updated_at": "2025-06-11T05:53:11.000000Z"
                    },
                    {
                        "id": 4,
                        "name": "tax2",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-07-07T17:49:42.000000Z",
                        "updated_at": "2025-07-07T17:49:42.000000Z"
                    }
                ]
            },
            "unit_quantities": [
                {
                    "id": 19,
                    "product_id": 19,
                    "type": "product",
                    "preview_url": "",
                    "expiration_date": null,
                    "unit_id": 2,
                    "barcode": "7iILllCEcX-19",
                    "quantity": 2,
                    "low_quantity": 0,
                    "stock_alert_enabled": 0,
                    "sale_price": 95,
                    "sale_price_edit": 95,
                    "sale_price_without_tax": 67.8571429,
                    "sale_price_with_tax": 95,
                    "sale_price_tax": 27.1428571,
                    "wholesale_price": 47.5,
                    "wholesale_price_edit": 66.5,
                    "wholesale_price_with_tax": 66.5,
                    "wholesale_price_without_tax": 47.5,
                    "wholesale_price_tax": 19,
                    "custom_price": 0,
                    "custom_price_edit": 0,
                    "custom_price_with_tax": 0,
                    "custom_price_without_tax": 0,
                    "custom_price_tax": 0,
                    "visible": 1,
                    "convert_unit_id": null,
                    "cogs": 66.5,
                    "uuid": null,
                    "created_at": "2026-01-22T08:23:17.000000Z",
                    "updated_at": "2026-01-22T10:33:34.000000Z",
                    "unit": {
                        "id": 2,
                        "name": "قطعة",
                        "identifier": "piece",
                        "description": null,
                        "author": 76,
                        "group_id": 2,
                        "value": 1,
                        "preview_url": null,
                        "base_unit": true,
                        "uuid": null,
                        "created_at": "2025-05-19T10:16:35.000000Z",
                        "updated_at": "2025-05-19T10:16:35.000000Z"
                    }
                }
            ]
        },
        {
            "id": 20,
            "name": "خلاط شجرة رقبة متحركة رصاصي versliy 5889",
            "tax_type": "inclusive",
            "tax_group_id": 4,
            "tax_value": 0,
            "product_type": "product",
            "type": "materialized",
            "accurate_tracking": false,
            "auto_cogs": true,
            "status": "available",
            "stock_management": "enabled",
            "barcode": "jF5TKjHvSl",
            "barcode_type": "code128",
            "sku": "khlatat--khlat-shgr-rkb-mthrk-rsasy-versliy-5889--7Se5R",
            "description": null,
            "thumbnail_id": null,
            "category_id": 19,
            "parent_id": 0,
            "unit_group": 2,
            "on_expiration": "allow_sales",
            "expires": 0,
            "searchable": 1,
            "author": 76,
            "uuid": null,
            "created_at": "2026-01-22T08:25:25.000000Z",
            "updated_at": "2026-01-22T08:25:25.000000Z",
            "galleries": [],
            "tax_group": {
                "id": 4,
                "name": "tax group1",
                "description": null,
                "author": 76,
                "uuid": null,
                "created_at": "2025-06-11T05:25:50.000000Z",
                "updated_at": "2025-06-11T05:25:50.000000Z",
                "taxes": [
                    {
                        "id": 3,
                        "name": "tax10",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-06-11T05:53:11.000000Z",
                        "updated_at": "2025-06-11T05:53:11.000000Z"
                    },
                    {
                        "id": 4,
                        "name": "tax2",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-07-07T17:49:42.000000Z",
                        "updated_at": "2025-07-07T17:49:42.000000Z"
                    }
                ]
            },
            "unit_quantities": [
                {
                    "id": 20,
                    "product_id": 20,
                    "type": "product",
                    "preview_url": "",
                    "expiration_date": null,
                    "unit_id": 2,
                    "barcode": "jF5TKjHvSl-20",
                    "quantity": 0,
                    "low_quantity": 0,
                    "stock_alert_enabled": 0,
                    "sale_price": 145,
                    "sale_price_edit": 145,
                    "sale_price_without_tax": 103.5714286,
                    "sale_price_with_tax": 145,
                    "sale_price_tax": 41.4285714,
                    "wholesale_price": 77.8571429,
                    "wholesale_price_edit": 109,
                    "wholesale_price_with_tax": 109,
                    "wholesale_price_without_tax": 77.8571429,
                    "wholesale_price_tax": 31.1428571,
                    "custom_price": 0,
                    "custom_price_edit": 0,
                    "custom_price_with_tax": 0,
                    "custom_price_without_tax": 0,
                    "custom_price_tax": 0,
                    "visible": 1,
                    "convert_unit_id": null,
                    "cogs": 0,
                    "uuid": null,
                    "created_at": "2026-01-22T08:25:25.000000Z",
                    "updated_at": "2026-01-22T08:25:25.000000Z",
                    "unit": {
                        "id": 2,
                        "name": "قطعة",
                        "identifier": "piece",
                        "description": null,
                        "author": 76,
                        "group_id": 2,
                        "value": 1,
                        "preview_url": null,
                        "base_unit": true,
                        "uuid": null,
                        "created_at": "2025-05-19T10:16:35.000000Z",
                        "updated_at": "2025-05-19T10:16:35.000000Z"
                    }
                }
            ]
        },
        {
            "id": 21,
            "name": "خلاط شجرة رقبة متحركة كروم versliy 5888",
            "tax_type": "inclusive",
            "tax_group_id": 4,
            "tax_value": 0,
            "product_type": "product",
            "type": "materialized",
            "accurate_tracking": false,
            "auto_cogs": true,
            "status": "available",
            "stock_management": "enabled",
            "barcode": "NUMqZG3YL1",
            "barcode_type": "code128",
            "sku": "khlatat--khlat-shgr-rkb-mthrk-krom-versliy-5888--Gby91",
            "description": null,
            "thumbnail_id": null,
            "category_id": 19,
            "parent_id": 0,
            "unit_group": 2,
            "on_expiration": "allow_sales",
            "expires": 0,
            "searchable": 1,
            "author": 76,
            "uuid": null,
            "created_at": "2026-01-22T08:26:53.000000Z",
            "updated_at": "2026-01-22T08:26:53.000000Z",
            "galleries": [],
            "tax_group": {
                "id": 4,
                "name": "tax group1",
                "description": null,
                "author": 76,
                "uuid": null,
                "created_at": "2025-06-11T05:25:50.000000Z",
                "updated_at": "2025-06-11T05:25:50.000000Z",
                "taxes": [
                    {
                        "id": 3,
                        "name": "tax10",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-06-11T05:53:11.000000Z",
                        "updated_at": "2025-06-11T05:53:11.000000Z"
                    },
                    {
                        "id": 4,
                        "name": "tax2",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-07-07T17:49:42.000000Z",
                        "updated_at": "2025-07-07T17:49:42.000000Z"
                    }
                ]
            },
            "unit_quantities": [
                {
                    "id": 21,
                    "product_id": 21,
                    "type": "product",
                    "preview_url": "",
                    "expiration_date": null,
                    "unit_id": 2,
                    "barcode": "NUMqZG3YL1-21",
                    "quantity": 0,
                    "low_quantity": 0,
                    "stock_alert_enabled": 0,
                    "sale_price": 145,
                    "sale_price_edit": 145,
                    "sale_price_without_tax": 103.5714286,
                    "sale_price_with_tax": 145,
                    "sale_price_tax": 41.4285714,
                    "wholesale_price": 70.7142857,
                    "wholesale_price_edit": 99,
                    "wholesale_price_with_tax": 99,
                    "wholesale_price_without_tax": 70.7142857,
                    "wholesale_price_tax": 28.2857143,
                    "custom_price": 0,
                    "custom_price_edit": 0,
                    "custom_price_with_tax": 0,
                    "custom_price_without_tax": 0,
                    "custom_price_tax": 0,
                    "visible": 1,
                    "convert_unit_id": null,
                    "cogs": 0,
                    "uuid": null,
                    "created_at": "2026-01-22T08:26:53.000000Z",
                    "updated_at": "2026-01-22T08:26:53.000000Z",
                    "unit": {
                        "id": 2,
                        "name": "قطعة",
                        "identifier": "piece",
                        "description": null,
                        "author": 76,
                        "group_id": 2,
                        "value": 1,
                        "preview_url": null,
                        "base_unit": true,
                        "uuid": null,
                        "created_at": "2025-05-19T10:16:35.000000Z",
                        "updated_at": "2025-05-19T10:16:35.000000Z"
                    }
                }
            ]
        },
        {
            "id": 22,
            "name": "خلاط شجرة كروم versliy 5887",
            "tax_type": "inclusive",
            "tax_group_id": 4,
            "tax_value": 0,
            "product_type": "product",
            "type": "materialized",
            "accurate_tracking": false,
            "auto_cogs": true,
            "status": "available",
            "stock_management": "enabled",
            "barcode": "mIDO6YotRH",
            "barcode_type": "code128",
            "sku": "khlatat--khlat-shgr-krom-versliy-5887--aoeSd",
            "description": null,
            "thumbnail_id": null,
            "category_id": 19,
            "parent_id": 0,
            "unit_group": 2,
            "on_expiration": "allow_sales",
            "expires": 0,
            "searchable": 1,
            "author": 76,
            "uuid": null,
            "created_at": "2026-01-22T08:30:18.000000Z",
            "updated_at": "2026-01-22T08:30:18.000000Z",
            "galleries": [],
            "tax_group": {
                "id": 4,
                "name": "tax group1",
                "description": null,
                "author": 76,
                "uuid": null,
                "created_at": "2025-06-11T05:25:50.000000Z",
                "updated_at": "2025-06-11T05:25:50.000000Z",
                "taxes": [
                    {
                        "id": 3,
                        "name": "tax10",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-06-11T05:53:11.000000Z",
                        "updated_at": "2025-06-11T05:53:11.000000Z"
                    },
                    {
                        "id": 4,
                        "name": "tax2",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-07-07T17:49:42.000000Z",
                        "updated_at": "2025-07-07T17:49:42.000000Z"
                    }
                ]
            },
            "unit_quantities": [
                {
                    "id": 22,
                    "product_id": 22,
                    "type": "product",
                    "preview_url": "",
                    "expiration_date": null,
                    "unit_id": 2,
                    "barcode": "mIDO6YotRH-22",
                    "quantity": 0,
                    "low_quantity": 0,
                    "stock_alert_enabled": 0,
                    "sale_price": 75,
                    "sale_price_edit": 75,
                    "sale_price_without_tax": 53.5714286,
                    "sale_price_with_tax": 75,
                    "sale_price_tax": 21.4285714,
                    "wholesale_price": 30,
                    "wholesale_price_edit": 42,
                    "wholesale_price_with_tax": 42,
                    "wholesale_price_without_tax": 30,
                    "wholesale_price_tax": 12,
                    "custom_price": 0,
                    "custom_price_edit": 0,
                    "custom_price_with_tax": 0,
                    "custom_price_without_tax": 0,
                    "custom_price_tax": 0,
                    "visible": 1,
                    "convert_unit_id": null,
                    "cogs": 0,
                    "uuid": null,
                    "created_at": "2026-01-22T08:30:18.000000Z",
                    "updated_at": "2026-01-22T08:30:18.000000Z",
                    "unit": {
                        "id": 2,
                        "name": "قطعة",
                        "identifier": "piece",
                        "description": null,
                        "author": 76,
                        "group_id": 2,
                        "value": 1,
                        "preview_url": null,
                        "base_unit": true,
                        "uuid": null,
                        "created_at": "2025-05-19T10:16:35.000000Z",
                        "updated_at": "2025-05-19T10:16:35.000000Z"
                    }
                }
            ]
        },
        {
            "id": 23,
            "name": "خلاط وجه كروم versliy 5663",
            "tax_type": "inclusive",
            "tax_group_id": 4,
            "tax_value": 0,
            "product_type": "product",
            "type": "materialized",
            "accurate_tracking": false,
            "auto_cogs": true,
            "status": "available",
            "stock_management": "enabled",
            "barcode": "ixcKuBoxU8",
            "barcode_type": "code128",
            "sku": "khlatat--khlat-ogh-krom-versliy-5663--hy6Xy",
            "description": null,
            "thumbnail_id": null,
            "category_id": 19,
            "parent_id": 0,
            "unit_group": 2,
            "on_expiration": "allow_sales",
            "expires": 0,
            "searchable": 1,
            "author": 76,
            "uuid": null,
            "created_at": "2026-01-22T08:33:30.000000Z",
            "updated_at": "2026-01-22T08:33:30.000000Z",
            "galleries": [],
            "tax_group": {
                "id": 4,
                "name": "tax group1",
                "description": null,
                "author": 76,
                "uuid": null,
                "created_at": "2025-06-11T05:25:50.000000Z",
                "updated_at": "2025-06-11T05:25:50.000000Z",
                "taxes": [
                    {
                        "id": 3,
                        "name": "tax10",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-06-11T05:53:11.000000Z",
                        "updated_at": "2025-06-11T05:53:11.000000Z"
                    },
                    {
                        "id": 4,
                        "name": "tax2",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-07-07T17:49:42.000000Z",
                        "updated_at": "2025-07-07T17:49:42.000000Z"
                    }
                ]
            },
            "unit_quantities": [
                {
                    "id": 23,
                    "product_id": 23,
                    "type": "product",
                    "preview_url": "",
                    "expiration_date": null,
                    "unit_id": 2,
                    "barcode": "ixcKuBoxU8-23",
                    "quantity": 0,
                    "low_quantity": 0,
                    "stock_alert_enabled": 0,
                    "sale_price": 70,
                    "sale_price_edit": 70,
                    "sale_price_without_tax": 50,
                    "sale_price_with_tax": 70,
                    "sale_price_tax": 20,
                    "wholesale_price": 33.5714286,
                    "wholesale_price_edit": 47,
                    "wholesale_price_with_tax": 47,
                    "wholesale_price_without_tax": 33.5714286,
                    "wholesale_price_tax": 13.4285714,
                    "custom_price": 0,
                    "custom_price_edit": 0,
                    "custom_price_with_tax": 0,
                    "custom_price_without_tax": 0,
                    "custom_price_tax": 0,
                    "visible": 1,
                    "convert_unit_id": null,
                    "cogs": 0,
                    "uuid": null,
                    "created_at": "2026-01-22T08:33:30.000000Z",
                    "updated_at": "2026-01-22T08:33:30.000000Z",
                    "unit": {
                        "id": 2,
                        "name": "قطعة",
                        "identifier": "piece",
                        "description": null,
                        "author": 76,
                        "group_id": 2,
                        "value": 1,
                        "preview_url": null,
                        "base_unit": true,
                        "uuid": null,
                        "created_at": "2025-05-19T10:16:35.000000Z",
                        "updated_at": "2025-05-19T10:16:35.000000Z"
                    }
                }
            ]
        },
        {
            "id": 24,
            "name": "خلاط وجه كروم versliy 5872",
            "tax_type": "inclusive",
            "tax_group_id": 4,
            "tax_value": 0,
            "product_type": "product",
            "type": "materialized",
            "accurate_tracking": false,
            "auto_cogs": true,
            "status": "available",
            "stock_management": "enabled",
            "barcode": "LD3t8DcJup",
            "barcode_type": "code128",
            "sku": "khlatat--khlat-ogh-krom-versliy-5872--dtjAN",
            "description": null,
            "thumbnail_id": null,
            "category_id": 19,
            "parent_id": 0,
            "unit_group": 2,
            "on_expiration": "allow_sales",
            "expires": 0,
            "searchable": 1,
            "author": 76,
            "uuid": null,
            "created_at": "2026-01-22T09:45:25.000000Z",
            "updated_at": "2026-01-22T09:45:25.000000Z",
            "galleries": [],
            "tax_group": {
                "id": 4,
                "name": "tax group1",
                "description": null,
                "author": 76,
                "uuid": null,
                "created_at": "2025-06-11T05:25:50.000000Z",
                "updated_at": "2025-06-11T05:25:50.000000Z",
                "taxes": [
                    {
                        "id": 3,
                        "name": "tax10",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-06-11T05:53:11.000000Z",
                        "updated_at": "2025-06-11T05:53:11.000000Z"
                    },
                    {
                        "id": 4,
                        "name": "tax2",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-07-07T17:49:42.000000Z",
                        "updated_at": "2025-07-07T17:49:42.000000Z"
                    }
                ]
            },
            "unit_quantities": [
                {
                    "id": 24,
                    "product_id": 24,
                    "type": "product",
                    "preview_url": "",
                    "expiration_date": null,
                    "unit_id": 2,
                    "barcode": "LD3t8DcJup-24",
                    "quantity": 0,
                    "low_quantity": 0,
                    "stock_alert_enabled": 0,
                    "sale_price": 55,
                    "sale_price_edit": 55,
                    "sale_price_without_tax": 39.2857143,
                    "sale_price_with_tax": 55,
                    "sale_price_tax": 15.7142857,
                    "wholesale_price": 17.5,
                    "wholesale_price_edit": 24.5,
                    "wholesale_price_with_tax": 24.5,
                    "wholesale_price_without_tax": 17.5,
                    "wholesale_price_tax": 7,
                    "custom_price": 0,
                    "custom_price_edit": 0,
                    "custom_price_with_tax": 0,
                    "custom_price_without_tax": 0,
                    "custom_price_tax": 0,
                    "visible": 1,
                    "convert_unit_id": null,
                    "cogs": 0,
                    "uuid": null,
                    "created_at": "2026-01-22T09:45:25.000000Z",
                    "updated_at": "2026-01-22T09:45:25.000000Z",
                    "unit": {
                        "id": 2,
                        "name": "قطعة",
                        "identifier": "piece",
                        "description": null,
                        "author": 76,
                        "group_id": 2,
                        "value": 1,
                        "preview_url": null,
                        "base_unit": true,
                        "uuid": null,
                        "created_at": "2025-05-19T10:16:35.000000Z",
                        "updated_at": "2025-05-19T10:16:35.000000Z"
                    }
                }
            ]
        },
        {
            "id": 25,
            "name": "سنيسكة زاوية رصاصية versliy 5855",
            "tax_type": "inclusive",
            "tax_group_id": 4,
            "tax_value": 0,
            "product_type": "product",
            "type": "materialized",
            "accurate_tracking": false,
            "auto_cogs": true,
            "status": "available",
            "stock_management": "enabled",
            "barcode": "AFITcpfq7F",
            "barcode_type": "code128",
            "sku": "khlatat--snysk-zaoy-rsasy-versliy-5855--2wGLI",
            "description": null,
            "thumbnail_id": null,
            "category_id": 19,
            "parent_id": 0,
            "unit_group": 2,
            "on_expiration": "allow_sales",
            "expires": 0,
            "searchable": 1,
            "author": 76,
            "uuid": null,
            "created_at": "2026-01-22T09:47:38.000000Z",
            "updated_at": "2026-01-22T09:47:38.000000Z",
            "galleries": [],
            "tax_group": {
                "id": 4,
                "name": "tax group1",
                "description": null,
                "author": 76,
                "uuid": null,
                "created_at": "2025-06-11T05:25:50.000000Z",
                "updated_at": "2025-06-11T05:25:50.000000Z",
                "taxes": [
                    {
                        "id": 3,
                        "name": "tax10",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-06-11T05:53:11.000000Z",
                        "updated_at": "2025-06-11T05:53:11.000000Z"
                    },
                    {
                        "id": 4,
                        "name": "tax2",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-07-07T17:49:42.000000Z",
                        "updated_at": "2025-07-07T17:49:42.000000Z"
                    }
                ]
            },
            "unit_quantities": [
                {
                    "id": 25,
                    "product_id": 25,
                    "type": "product",
                    "preview_url": "",
                    "expiration_date": null,
                    "unit_id": 2,
                    "barcode": "AFITcpfq7F-25",
                    "quantity": 0,
                    "low_quantity": 0,
                    "stock_alert_enabled": 0,
                    "sale_price": 15,
                    "sale_price_edit": 15,
                    "sale_price_without_tax": 10.7142857,
                    "sale_price_with_tax": 15,
                    "sale_price_tax": 4.2857143,
                    "wholesale_price": 6.9285714,
                    "wholesale_price_edit": 9.7,
                    "wholesale_price_with_tax": 9.7,
                    "wholesale_price_without_tax": 6.9285714,
                    "wholesale_price_tax": 2.7714286,
                    "custom_price": 0,
                    "custom_price_edit": 0,
                    "custom_price_with_tax": 0,
                    "custom_price_without_tax": 0,
                    "custom_price_tax": 0,
                    "visible": 1,
                    "convert_unit_id": null,
                    "cogs": 0,
                    "uuid": null,
                    "created_at": "2026-01-22T09:47:38.000000Z",
                    "updated_at": "2026-01-22T09:47:38.000000Z",
                    "unit": {
                        "id": 2,
                        "name": "قطعة",
                        "identifier": "piece",
                        "description": null,
                        "author": 76,
                        "group_id": 2,
                        "value": 1,
                        "preview_url": null,
                        "base_unit": true,
                        "uuid": null,
                        "created_at": "2025-05-19T10:16:35.000000Z",
                        "updated_at": "2025-05-19T10:16:35.000000Z"
                    }
                }
            ]
        },
        {
            "id": 26,
            "name": "سنيسكة زاوية كروم versliy 5853",
            "tax_type": "inclusive",
            "tax_group_id": 4,
            "tax_value": 0,
            "product_type": "product",
            "type": "materialized",
            "accurate_tracking": false,
            "auto_cogs": true,
            "status": "available",
            "stock_management": "enabled",
            "barcode": "n4dZmg1oYS",
            "barcode_type": "code128",
            "sku": "khlatat--snysk-zaoy-krom-versliy-5853--HTfzb",
            "description": null,
            "thumbnail_id": null,
            "category_id": 19,
            "parent_id": 0,
            "unit_group": 2,
            "on_expiration": "allow_sales",
            "expires": 0,
            "searchable": 1,
            "author": 76,
            "uuid": null,
            "created_at": "2026-01-22T09:51:45.000000Z",
            "updated_at": "2026-01-22T09:51:45.000000Z",
            "galleries": [],
            "tax_group": {
                "id": 4,
                "name": "tax group1",
                "description": null,
                "author": 76,
                "uuid": null,
                "created_at": "2025-06-11T05:25:50.000000Z",
                "updated_at": "2025-06-11T05:25:50.000000Z",
                "taxes": [
                    {
                        "id": 3,
                        "name": "tax10",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-06-11T05:53:11.000000Z",
                        "updated_at": "2025-06-11T05:53:11.000000Z"
                    },
                    {
                        "id": 4,
                        "name": "tax2",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-07-07T17:49:42.000000Z",
                        "updated_at": "2025-07-07T17:49:42.000000Z"
                    }
                ]
            },
            "unit_quantities": [
                {
                    "id": 26,
                    "product_id": 26,
                    "type": "product",
                    "preview_url": "",
                    "expiration_date": null,
                    "unit_id": 2,
                    "barcode": "n4dZmg1oYS-26",
                    "quantity": 0,
                    "low_quantity": 0,
                    "stock_alert_enabled": 0,
                    "sale_price": 18,
                    "sale_price_edit": 18,
                    "sale_price_without_tax": 12.8571429,
                    "sale_price_with_tax": 18,
                    "sale_price_tax": 5.1428571,
                    "wholesale_price": 7.8571429,
                    "wholesale_price_edit": 11,
                    "wholesale_price_with_tax": 11,
                    "wholesale_price_without_tax": 7.8571429,
                    "wholesale_price_tax": 3.1428571,
                    "custom_price": 0,
                    "custom_price_edit": 0,
                    "custom_price_with_tax": 0,
                    "custom_price_without_tax": 0,
                    "custom_price_tax": 0,
                    "visible": 1,
                    "convert_unit_id": null,
                    "cogs": 0,
                    "uuid": null,
                    "created_at": "2026-01-22T09:51:45.000000Z",
                    "updated_at": "2026-01-22T09:51:45.000000Z",
                    "unit": {
                        "id": 2,
                        "name": "قطعة",
                        "identifier": "piece",
                        "description": null,
                        "author": 76,
                        "group_id": 2,
                        "value": 1,
                        "preview_url": null,
                        "base_unit": true,
                        "uuid": null,
                        "created_at": "2025-05-19T10:16:35.000000Z",
                        "updated_at": "2025-05-19T10:16:35.000000Z"
                    }
                }
            ]
        },
        {
            "id": 27,
            "name": "سنيسكة زاوية كروم دائرية versliy 5856",
            "tax_type": "inclusive",
            "tax_group_id": 4,
            "tax_value": 0,
            "product_type": "product",
            "type": "materialized",
            "accurate_tracking": false,
            "auto_cogs": true,
            "status": "available",
            "stock_management": "enabled",
            "barcode": "mRmuvWfguE",
            "barcode_type": "code128",
            "sku": "khlatat--snysk-zaoy-krom-dayry-versliy-5856--kszsF",
            "description": null,
            "thumbnail_id": null,
            "category_id": 19,
            "parent_id": 0,
            "unit_group": 2,
            "on_expiration": "allow_sales",
            "expires": 0,
            "searchable": 1,
            "author": 76,
            "uuid": null,
            "created_at": "2026-01-22T09:54:55.000000Z",
            "updated_at": "2026-01-22T09:54:55.000000Z",
            "galleries": [],
            "tax_group": {
                "id": 4,
                "name": "tax group1",
                "description": null,
                "author": 76,
                "uuid": null,
                "created_at": "2025-06-11T05:25:50.000000Z",
                "updated_at": "2025-06-11T05:25:50.000000Z",
                "taxes": [
                    {
                        "id": 3,
                        "name": "tax10",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-06-11T05:53:11.000000Z",
                        "updated_at": "2025-06-11T05:53:11.000000Z"
                    },
                    {
                        "id": 4,
                        "name": "tax2",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-07-07T17:49:42.000000Z",
                        "updated_at": "2025-07-07T17:49:42.000000Z"
                    }
                ]
            },
            "unit_quantities": [
                {
                    "id": 27,
                    "product_id": 27,
                    "type": "product",
                    "preview_url": "",
                    "expiration_date": null,
                    "unit_id": 2,
                    "barcode": "mRmuvWfguE-27",
                    "quantity": 0,
                    "low_quantity": 0,
                    "stock_alert_enabled": 0,
                    "sale_price": 10,
                    "sale_price_edit": 10,
                    "sale_price_without_tax": 7.1428571,
                    "sale_price_with_tax": 10,
                    "sale_price_tax": 2.8571429,
                    "wholesale_price": 3.9285714,
                    "wholesale_price_edit": 5.5,
                    "wholesale_price_with_tax": 5.5,
                    "wholesale_price_without_tax": 3.9285714,
                    "wholesale_price_tax": 1.5714286,
                    "custom_price": 0,
                    "custom_price_edit": 0,
                    "custom_price_with_tax": 0,
                    "custom_price_without_tax": 0,
                    "custom_price_tax": 0,
                    "visible": 1,
                    "convert_unit_id": null,
                    "cogs": 0,
                    "uuid": null,
                    "created_at": "2026-01-22T09:54:55.000000Z",
                    "updated_at": "2026-01-22T09:54:56.000000Z",
                    "unit": {
                        "id": 2,
                        "name": "قطعة",
                        "identifier": "piece",
                        "description": null,
                        "author": 76,
                        "group_id": 2,
                        "value": 1,
                        "preview_url": null,
                        "base_unit": true,
                        "uuid": null,
                        "created_at": "2025-05-19T10:16:35.000000Z",
                        "updated_at": "2025-05-19T10:16:35.000000Z"
                    }
                }
            ]
        },
        {
            "id": 28,
            "name": "سنيسكة زاوية كروم دائرية محببة versliy 5852",
            "tax_type": "inclusive",
            "tax_group_id": 4,
            "tax_value": 0,
            "product_type": "product",
            "type": "materialized",
            "accurate_tracking": false,
            "auto_cogs": true,
            "status": "available",
            "stock_management": "enabled",
            "barcode": "rSf6zQ29T3",
            "barcode_type": "code128",
            "sku": "khlatat--snysk-zaoy-krom-dayry-mhbb-versliy-5852--P0wE0",
            "description": null,
            "thumbnail_id": null,
            "category_id": 19,
            "parent_id": 0,
            "unit_group": 2,
            "on_expiration": "allow_sales",
            "expires": 0,
            "searchable": 1,
            "author": 76,
            "uuid": null,
            "created_at": "2026-01-22T09:56:12.000000Z",
            "updated_at": "2026-01-22T09:56:12.000000Z",
            "galleries": [],
            "tax_group": {
                "id": 4,
                "name": "tax group1",
                "description": null,
                "author": 76,
                "uuid": null,
                "created_at": "2025-06-11T05:25:50.000000Z",
                "updated_at": "2025-06-11T05:25:50.000000Z",
                "taxes": [
                    {
                        "id": 3,
                        "name": "tax10",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-06-11T05:53:11.000000Z",
                        "updated_at": "2025-06-11T05:53:11.000000Z"
                    },
                    {
                        "id": 4,
                        "name": "tax2",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-07-07T17:49:42.000000Z",
                        "updated_at": "2025-07-07T17:49:42.000000Z"
                    }
                ]
            },
            "unit_quantities": [
                {
                    "id": 28,
                    "product_id": 28,
                    "type": "product",
                    "preview_url": "",
                    "expiration_date": null,
                    "unit_id": 2,
                    "barcode": "rSf6zQ29T3-28",
                    "quantity": 0,
                    "low_quantity": 0,
                    "stock_alert_enabled": 0,
                    "sale_price": 10,
                    "sale_price_edit": 10,
                    "sale_price_without_tax": 7.1428571,
                    "sale_price_with_tax": 10,
                    "sale_price_tax": 2.8571429,
                    "wholesale_price": 3.8571429,
                    "wholesale_price_edit": 5.4,
                    "wholesale_price_with_tax": 5.4,
                    "wholesale_price_without_tax": 3.8571429,
                    "wholesale_price_tax": 1.5428571,
                    "custom_price": 0,
                    "custom_price_edit": 0,
                    "custom_price_with_tax": 0,
                    "custom_price_without_tax": 0,
                    "custom_price_tax": 0,
                    "visible": 1,
                    "convert_unit_id": null,
                    "cogs": 0,
                    "uuid": null,
                    "created_at": "2026-01-22T09:56:12.000000Z",
                    "updated_at": "2026-01-22T09:56:12.000000Z",
                    "unit": {
                        "id": 2,
                        "name": "قطعة",
                        "identifier": "piece",
                        "description": null,
                        "author": 76,
                        "group_id": 2,
                        "value": 1,
                        "preview_url": null,
                        "base_unit": true,
                        "uuid": null,
                        "created_at": "2025-05-19T10:16:35.000000Z",
                        "updated_at": "2025-05-19T10:16:35.000000Z"
                    }
                }
            ]
        },
        {
            "id": 29,
            "name": "سنيسكة زوجية دائرية محببة كروم versliy 07",
            "tax_type": "inclusive",
            "tax_group_id": 4,
            "tax_value": 0,
            "product_type": "product",
            "type": "materialized",
            "accurate_tracking": false,
            "auto_cogs": true,
            "status": "available",
            "stock_management": "enabled",
            "barcode": "L2UXxW2a1m",
            "barcode_type": "code128",
            "sku": "khlatat--snysk-zogy-dayry-mhbb-krom-versliy-07--A08Gt",
            "description": null,
            "thumbnail_id": null,
            "category_id": 19,
            "parent_id": 0,
            "unit_group": 2,
            "on_expiration": "allow_sales",
            "expires": 0,
            "searchable": 1,
            "author": 76,
            "uuid": null,
            "created_at": "2026-01-22T09:58:13.000000Z",
            "updated_at": "2026-01-22T09:58:13.000000Z",
            "galleries": [],
            "tax_group": {
                "id": 4,
                "name": "tax group1",
                "description": null,
                "author": 76,
                "uuid": null,
                "created_at": "2025-06-11T05:25:50.000000Z",
                "updated_at": "2025-06-11T05:25:50.000000Z",
                "taxes": [
                    {
                        "id": 3,
                        "name": "tax10",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-06-11T05:53:11.000000Z",
                        "updated_at": "2025-06-11T05:53:11.000000Z"
                    },
                    {
                        "id": 4,
                        "name": "tax2",
                        "description": null,
                        "rate": 0,
                        "tax_group_id": 4,
                        "author": 76,
                        "uuid": null,
                        "created_at": "2025-07-07T17:49:42.000000Z",
                        "updated_at": "2025-07-07T17:49:42.000000Z"
                    }
                ]
            },
            "unit_quantities": [
                {
                    "id": 29,
                    "product_id": 29,
                    "type": "product",
                    "preview_url": "",
                    "expiration_date": null,
                    "unit_id": 2,
                    "barcode": "L2UXxW2a1m-29",
                    "quantity": 0,
                    "low_quantity": 0,
                    "stock_alert_enabled": 0,
                    "sale_price": 45,
                    "sale_price_edit": 45,
                    "sale_price_without_tax": 32.1428571,
                    "sale_price_with_tax": 45,
                    "sale_price_tax": 12.8571429,
                    "wholesale_price": 21.0714286,
                    "wholesale_price_edit": 29.5,
                    "wholesale_price_with_tax": 29.5,
                    "wholesale_price_without_tax": 21.0714286,
                    "wholesale_price_tax": 8.4285714,
                    "custom_price": 0,
                    "custom_price_edit": 0,
                    "custom_price_with_tax": 0,
                    "custom_price_without_tax": 0,
                    "custom_price_tax": 0,
                    "visible": 1,
                    "convert_unit_id": null,
                    "cogs": 0,
                    "uuid": null,
                    "created_at": "2026-01-22T09:58:13.000000Z",
                    "updated_at": "2026-01-22T09:58:13.000000Z",
                    "unit": {
                        "id": 2,
                        "name": "قطعة",
                        "identifier": "piece",
                        "description": null,
                        "author": 76,
                        "group_id": 2,
                        "value": 1,
                        "preview_url": null,
                        "base_unit": true,
                        "uuid": null,
                        "created_at": "2025-05-19T10:16:35.000000Z",
                        "updated_at": "2025-05-19T10:16:35.000000Z"
                    }
                }
            ]
        }
    ],
    "categories": [],
    "previousCategory": null,
    "currentCategory": {
        "id": 19,
        "name": "خلاطات",
        "parent_id": 0,
        "media_id": 0,
        "preview_url": null,
        "displays_on_pos": 1,
        "total_items": 14,
        "description": null,
        "author": 76,
        "uuid": null,
        "created_at": "2026-01-22T08:15:15.000000Z",
        "updated_at": "2026-01-22T09:58:24.000000Z",
        "sub_categories": []
    }
}
```

### submit order
```
{
    "status": "success",
    "message": "The order has been placed.",
    "data": {
        "order": {
            "created_at": "2026-01-23 21:43:46",
            "customer_id": 82,
            "shipping": 0,
            "subtotal": 95,
            "discount_type": "flat",
            "discount_percentage": 0,
            "discount": 0,
            "total": 95,
            "type": "takeaway",
            "final_payment_date": null,
            "total_instalments": 0,
            "register_id": null,
            "note": null,
            "note_visibility": "hidden",
            "updated_at": "2026-01-23 21:43:46",
            "tax_group_id": null,
            "tax_type": false,
            "total_coupons": 0,
            "payment_status": "paid",
            "delivery_status": "not-available",
            "process_status": "not-available",
            "support_instalments": true,
            "author": 76,
            "title": null,
            "tax_value": 0,
            "products_tax_value": 27.1428571,
            "code": "260123-001",
            "tendered": 95,
            "total_with_tax": 95,
            "total_cogs": 66.5,
            "change": 0,
            "total_without_tax": 95,
            "id": 29,
            "products": [
                {
                    "id": 39,
                    "name": "\u062e\u0644\u0627\u0637 \u062f\u0648\u0634 \u0643\u0631\u0648\u0645 versliy 5655",
                    "unit_name": "\u0642\u0637\u0639\u0629",
                    "mode": "normal",
                    "product_type": "materialized",
                    "product_id": 19,
                    "order_id": 29,
                    "unit_id": 2,
                    "unit_quantity_id": 19,
                    "product_category_id": 19,
                    "procurement_product_id": null,
                    "tax_group_id": 4,
                    "tax_type": "inclusive",
                    "uuid": null,
                    "status": "sold",
                    "return_observations": null,
                    "return_condition": null,
                    "discount_type": "percentage",
                    "discount": 0,
                    "quantity": 1,
                    "discount_percentage": 0,
                    "unit_price": 95,
                    "price_with_tax": 95,
                    "price_without_tax": 67.8571429,
                    "wholesale_tax_value": 0,
                    "sale_tax_value": 0,
                    "tax_value": 27.1428571,
                    "rate": 0,
                    "total_price": 95,
                    "total_price_with_tax": 95,
                    "total_price_without_tax": 67.8571429,
                    "total_purchase_price": 66.5,
                    "created_at": "2026-01-23T19:43:46.000000Z",
                    "updated_at": "2026-01-23T19:43:46.000000Z"
                }
            ],
            "payments": [
                {
                    "id": 28,
                    "order_id": 29,
                    "value": 95,
                    "author": 76,
                    "identifier": "cash-payment",
                    "uuid": null,
                    "created_at": "2026-01-23T19:43:46.000000Z",
                    "updated_at": "2026-01-23T19:43:46.000000Z"
                }
            ],
            "coupons": [],
            "instalments": [],
            "addresses": [
                {
                    "type": "shipping",
                    "author": 76,
                    "order_id": 29,
                    "updated_at": "2026-01-23T19:43:46.000000Z",
                    "created_at": "2026-01-23T19:43:46.000000Z",
                    "id": 53
                },
                {
                    "type": "billing",
                    "author": 76,
                    "order_id": 29,
                    "updated_at": "2026-01-23T19:43:46.000000Z",
                    "created_at": "2026-01-23T19:43:46.000000Z",
                    "id": 54
                }
            ]
        }
    }
}
```