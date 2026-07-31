import { createContext, ReactNode, useContext, useEffect } from "react";
import { useGetSettings } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";

export type AppLanguage = "ar" | "en";

export type MessageKey =
  | "nav.dashboard"
  | "nav.properties"
  | "nav.customers"
  | "nav.search"
  | "nav.compare"
  | "nav.import"
  | "nav.export"
  | "nav.regions"
  | "nav.propertyTypes"
  | "nav.lookup"
  | "nav.users"
  | "nav.auditLogs"
  | "nav.settings"
  | "topbar.globalSearch"
  | "topbar.shortcuts"
  | "topbar.dayMode"
  | "topbar.nightMode"
  | "topbar.newProperty"
  | "topbar.new"
  | "topbar.userMenu"
  | "topbar.signOut"
  | "role.admin"
  | "role.agent"
  | "role.viewer"
  | "common.save"
  | "common.cancel"
  | "common.loading"
  | "common.retry"
  | "common.refresh"
  | "common.clearAll"
  | "properties.title"
  | "properties.manage"
  | "properties.export"
  | "properties.new"
  | "properties.search"
  | "properties.filters"
  | "properties.tableView"
  | "properties.cardView"
  | "properties.noProperties"
  | "properties.noMatch"
  | "properties.clearSearch"
  | "properties.loadError"
  | "properties.searchResults"
  | "settings.title"
  | "settings.subtitle"
  | "settings.companyData"
  | "settings.companyDataDescription"
  | "settings.companyName"
  | "settings.defaultCurrency"
  | "settings.currencyHint"
  | "settings.regionalPreferences"
  | "settings.primaryLanguage"
  | "settings.dateFormat"
  | "settings.saved"
  | "settings.saveError"
  | "dashboard.title"
  | "dashboard.welcome"
  | "dashboard.totalProperties"
  | "dashboard.activeProperties"
  | "dashboard.readyToShow"
  | "dashboard.totalValue"
  | "dashboard.estimatedValue"
  | "dashboard.averagePrice"
  | "dashboard.averageArea"
  | "dashboard.featured"
  | "dashboard.featuredProperties"
  | "dashboard.draft"
  | "dashboard.awaitingPublish"
  | "dashboard.sold"
  | "dashboard.soldProperties"
  | "dashboard.rented"
  | "dashboard.rentedProperties"
  | "dashboard.byRegion"
  | "dashboard.byStatus"
  | "dashboard.byCategory"
  | "dashboard.byType"
  | "dashboard.latestActivity"
  | "dashboard.noRecentActivity"
  | "dashboard.noData"
  | "dashboard.count"
  | "dashboard.properties"
  | "dashboard.system"
  | "dashboard.did"
  | "dashboard.at"
  | "compare.title"
  | "compare.subtitle"
  | "compare.chooseProperties"
  | "compare.propertyOne"
  | "compare.propertyTwo"
  | "compare.propertyThree"
  | "compare.chooseProperty"
  | "compare.viewDetails"
  | "compare.property"
  | "compare.chooseAtLeastOne"
  | "compare.code"
  | "compare.titleField"
  | "compare.price"
  | "compare.area"
  | "compare.beds"
  | "compare.baths"
  | "compare.category"
  | "compare.status"
  | "compare.finishing"
  | "compare.view"
  | "compare.region"
  | "compare.propertyType"
  | "compare.subArea"
  | "compare.floor"
  | "compare.unitType"
  | "compare.featuredField"
  | "compare.description"
  | "compare.createdAt"
  | "compare.yes"
  | "compare.no"
  | "login.tagline"
  | "login.title"
  | "login.email"
  | "login.password"
  | "login.showPassword"
  | "login.hidePassword"
  | "login.submit"
  | "login.loading"
  | "login.help"
  | "login.invalidCredentials"
  | "login.emailNotConfirmed"
  | "login.tooManyRequests"
  | "login.genericError"
  | "audit.title"
  | "audit.subtitle"
  | "audit.date"
  | "audit.user"
  | "audit.action"
  | "audit.type"
  | "audit.reference"
  | "audit.loading"
  | "audit.empty"
  | "common.previous"
  | "common.next"
  | "users.title"
  | "users.subtitle"
  | "users.invite"
  | "users.name"
  | "users.email"
  | "users.role"
  | "users.joined"
  | "users.status"
  | "users.noName"
  | "users.active"
  | "users.disabled"
  | "users.empty"
  | "users.deleteConfirm"
  | "users.deleteSuccess"
  | "users.deleteError"
  | "detail.loading"
  | "detail.notFound"
  | "detail.edit"
  | "detail.gallery"
  | "detail.upload"
  | "detail.uploading"
  | "detail.view"
  | "detail.delete"
  | "detail.noImages"
  | "detail.imageHint"
  | "detail.imageCount"
  | "detail.price"
  | "detail.area"
  | "detail.beds"
  | "detail.baths"
  | "detail.description"
  | "detail.noDescription"
  | "detail.classification"
  | "detail.type"
  | "detail.category"
  | "detail.finishing"
  | "detail.viewField"
  | "detail.floor"
  | "detail.unitType"
  | "detail.subArea"
  | "detail.added"
  | "detail.links"
  | "detail.map"
  | "detail.video"
  | "detail.external"
  | "detail.history"
  | "detail.noHistory"
  | "notFound.title"
  | "customers.title"
  | "customers.subtitle"
  | "customers.new"
  | "customers.edit"
  | "customers.fullName"
  | "customers.typeLabel"
  | "customers.customType"
  | "customers.phone"
  | "customers.whatsapp"
  | "customers.email"
  | "customers.company"
  | "customers.jobTitle"
  | "customers.notes"
  | "customers.tags"
  | "customers.noTagsYet"
  | "customers.total"
  | "customers.active"
  | "customers.archivedStatus"
  | "customers.allStatuses"
  | "customers.allTypes"
  | "customers.allTags"
  | "customers.search"
  | "customers.directory"
  | "customers.records"
  | "customers.contact"
  | "customers.statusLabel"
  | "customers.lastUpdated"
  | "customers.actions"
  | "customers.loadError"
  | "customers.empty"
  | "customers.created"
  | "customers.updated"
  | "customers.saveError"
  | "customers.archived"
  | "customers.restored"
  | "customers.archive"
  | "customers.restore"
  | "customers.delete"
  | "customers.deleteConfirm"
  | "customers.deleted"
  | "customers.deleteError"
  | "customers.manageTags"
  | "customers.newTag"
  | "customers.addTag"
  | "customers.tagCreated"
  | "customers.tagError"
  | "customers.deleteTag"
  | "customers.deleteTagConfirm"
  | "customers.type.owner"
  | "customers.type.buyer"
  | "customers.type.investor"
  | "customers.type.developer"
  | "customers.type.broker"
  | "customers.type.company"
  | "customers.type.custom";

const messages: Record<AppLanguage, Record<MessageKey, string>> = {
  ar: {
    "nav.dashboard": "الرئيسية",
    "nav.properties": "العقارات",
    "nav.customers": "العملاء",
    "nav.search": "البحث",
    "nav.compare": "المقارنة",
    "nav.import": "استيراد",
    "nav.export": "تصدير",
    "nav.regions": "المناطق",
    "nav.propertyTypes": "أنواع العقارات",
    "nav.lookup": "القوائم",
    "nav.users": "المستخدمين",
    "nav.auditLogs": "سجل العمليات",
    "nav.settings": "الإعدادات",
    "topbar.globalSearch": "البحث الشامل…",
    "topbar.shortcuts": "اختصارات لوحة المفاتيح",
    "topbar.dayMode": "الوضع النهاري",
    "topbar.nightMode": "الوضع الليلي",
    "topbar.newProperty": "عقار جديد",
    "topbar.new": "جديد",
    "topbar.userMenu": "قائمة المستخدم",
    "topbar.signOut": "تسجيل الخروج",
    "role.admin": "مدير",
    "role.agent": "وسيط",
    "role.viewer": "مشاهد",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.loading": "جارٍ التحميل…",
    "common.retry": "إعادة المحاولة",
    "common.refresh": "تحديث",
    "common.clearAll": "مسح الكل",
    "properties.title": "العقارات",
    "properties.manage": "إدارة جميع العقارات",
    "properties.export": "تصدير",
    "properties.new": "عقار جديد",
    "properties.search": "بحث بالكود أو العنوان…",
    "properties.filters": "فلاتر",
    "properties.tableView": "عرض جدول",
    "properties.cardView": "عرض بطاقات",
    "properties.noProperties": "لا توجد عقارات بعد",
    "properties.noMatch": "لا توجد عقارات مطابقة للبحث الحالي",
    "properties.clearSearch": "مسح البحث والفلاتر",
    "properties.loadError": "تعذر تحميل قائمة العقارات",
    "properties.searchResults": "عقار",
    "settings.title": "إعدادات المنصة",
    "settings.subtitle": "إدارة الإعدادات العامة والتفضيلات الأساسية.",
    "settings.companyData": "البيانات الأساسية",
    "settings.companyDataDescription": "هذه البيانات تظهر في التقارير والفواتير.",
    "settings.companyName": "اسم الشركة",
    "settings.defaultCurrency": "العملة الافتراضية",
    "settings.currencyHint": "تُستخدم العملة المختارة في عرض أسعار العقارات والتقارير.",
    "settings.regionalPreferences": "التفضيلات الإقليمية",
    "settings.primaryLanguage": "اللغة الأساسية",
    "settings.dateFormat": "صيغة التاريخ",
    "settings.saved": "تم حفظ الإعدادات",
    "settings.saveError": "تعذر حفظ الإعدادات",
    "dashboard.title": "نظرة عامة",
    "dashboard.welcome": "مرحباً بك في لوحة تحكم استوديو بيانات عقار.",
    "dashboard.totalProperties": "إجمالي العقارات",
    "dashboard.activeProperties": "عقارات نشطة",
    "dashboard.readyToShow": "جاهزة للعرض",
    "dashboard.totalValue": "إجمالي القيمة",
    "dashboard.estimatedValue": "القيمة التقديرية الإجمالية",
    "dashboard.averagePrice": "متوسط السعر",
    "dashboard.averageArea": "متوسط المساحة",
    "dashboard.featured": "مميز",
    "dashboard.featuredProperties": "عقارات مميزة",
    "dashboard.draft": "مسودة",
    "dashboard.awaitingPublish": "بانتظار النشر",
    "dashboard.sold": "مباع",
    "dashboard.soldProperties": "تم بيعه",
    "dashboard.rented": "مؤجر",
    "dashboard.rentedProperties": "تم تأجيره",
    "dashboard.byRegion": "العقارات حسب المنطقة",
    "dashboard.byStatus": "الحالات",
    "dashboard.byCategory": "حسب الفئة (بيع / إيجار)",
    "dashboard.byType": "حسب نوع العقار",
    "dashboard.latestActivity": "أحدث النشاطات",
    "dashboard.noRecentActivity": "لا توجد نشاطات حديثة",
    "dashboard.noData": "لا توجد بيانات بعد",
    "dashboard.count": "العدد",
    "dashboard.properties": "العقارات",
    "dashboard.system": "نظام",
    "dashboard.did": "قام بـ",
    "dashboard.at": "في",
    "compare.title": "مقارنة العقارات",
    "compare.subtitle": "قارن بين عقارين أو ثلاثة جنباً إلى جنب",
    "compare.chooseProperties": "اختر العقارات",
    "compare.propertyOne": "العقار الأول",
    "compare.propertyTwo": "العقار الثاني",
    "compare.propertyThree": "العقار الثالث (اختياري)",
    "compare.chooseProperty": "اختر عقاراً…",
    "compare.viewDetails": "عرض التفاصيل",
    "compare.property": "الخاصية",
    "compare.chooseAtLeastOne": "اختر عقاراً على الأقل للبدء بالمقارنة",
    "compare.code": "الكود",
    "compare.titleField": "العنوان",
    "compare.price": "السعر",
    "compare.area": "المساحة",
    "compare.beds": "غرف النوم",
    "compare.baths": "الحمامات",
    "compare.category": "الفئة",
    "compare.status": "الحالة",
    "compare.finishing": "التشطيب",
    "compare.view": "الإطلالة",
    "compare.region": "المنطقة",
    "compare.propertyType": "نوع العقار",
    "compare.subArea": "المنطقة الفرعية",
    "compare.floor": "الدور",
    "compare.unitType": "نوع الوحدة",
    "compare.featuredField": "مميز",
    "compare.description": "الوصف",
    "compare.createdAt": "تاريخ الإضافة",
    "compare.yes": "نعم ⭐",
    "compare.no": "لا",
    "login.tagline": "منصة إدارة بيانات العقارات الاحترافية",
    "login.title": "تسجيل الدخول",
    "login.email": "البريد الإلكتروني",
    "login.password": "كلمة المرور",
    "login.showPassword": "إظهار كلمة المرور",
    "login.hidePassword": "إخفاء كلمة المرور",
    "login.submit": "دخول",
    "login.loading": "جارٍ الدخول…",
    "login.help": "لإنشاء أول حساب مدير، أضف مستخدماً من Supabase → Authentication ثم غيّر دوره إلى admin من جدول user_profiles.",
    "login.invalidCredentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    "login.emailNotConfirmed": "يرجى تأكيد بريدك الإلكتروني أولاً",
    "login.tooManyRequests": "محاولات كثيرة، يرجى الانتظار قليلاً",
    "login.genericError": "حدث خطأ، يرجى المحاولة مجدداً",
    "audit.title": "سجل العمليات",
    "audit.subtitle": "تتبع كامل التغييرات والنشاطات على مستوى النظام.",
    "audit.date": "التاريخ",
    "audit.user": "المستخدم",
    "audit.action": "العملية",
    "audit.type": "النوع",
    "audit.reference": "المرجع",
    "audit.loading": "جاري التحميل...",
    "audit.empty": "لا يوجد سجل عمليات.",
    "common.previous": "السابق",
    "common.next": "التالي",
    "users.title": "المستخدمين",
    "users.subtitle": "إدارة وصول الفريق والصلاحيات.",
    "users.invite": "دعوة مستخدم (قريباً)",
    "users.name": "الاسم",
    "users.email": "البريد الإلكتروني",
    "users.role": "الصلاحية",
    "users.joined": "تاريخ الانضمام",
    "users.status": "الحالة",
    "users.noName": "بدون اسم",
    "users.active": "نشط",
    "users.disabled": "معطل",
    "users.empty": "لا يوجد مستخدمين.",
    "users.deleteConfirm": "هل أنت متأكد من حذف هذا المستخدم؟",
    "users.deleteSuccess": "تم حذف المستخدم",
    "users.deleteError": "تعذر حذف المستخدم",
    "detail.loading": "جاري التحميل...",
    "detail.notFound": "العقار غير موجود",
    "detail.edit": "تعديل",
    "detail.gallery": "معرض الصور",
    "detail.upload": "رفع صورة",
    "detail.uploading": "جاري الرفع…",
    "detail.view": "عرض",
    "detail.delete": "حذف",
    "detail.noImages": "لا توجد صور — انقر لرفع صور",
    "detail.imageHint": "انقر على صورة للعرض الكامل · حوّم للحذف",
    "detail.imageCount": "صورة",
    "detail.price": "السعر",
    "detail.area": "المساحة",
    "detail.beds": "غرف النوم",
    "detail.baths": "الحمامات",
    "detail.description": "الوصف",
    "detail.noDescription": "لا يوجد وصف متاح.",
    "detail.classification": "التصنيف",
    "detail.type": "النوع",
    "detail.category": "الفئة",
    "detail.finishing": "التشطيب",
    "detail.viewField": "الإطلالة",
    "detail.floor": "الطابق",
    "detail.unitType": "نوع الوحدة",
    "detail.subArea": "المنطقة الفرعية",
    "detail.added": "تم الإضافة",
    "detail.links": "روابط",
    "detail.map": "عرض على الخريطة",
    "detail.video": "مقطع الفيديو",
    "detail.external": "رابط خارجي",
    "detail.history": "سجل التعديلات",
    "detail.noHistory": "لا يوجد سجل تاريخي.",
    "notFound.title": "الصفحة غير موجودة",
    "customers.title": "العملاء",
    "customers.subtitle": "إدارة بيانات العملاء ووسائل التواصل والوسوم.",
    "customers.new": "عميل جديد",
    "customers.edit": "تعديل العميل",
    "customers.fullName": "الاسم الكامل",
    "customers.typeLabel": "نوع العميل",
    "customers.customType": "النوع المخصص",
    "customers.phone": "الهاتف",
    "customers.whatsapp": "واتساب",
    "customers.email": "البريد الإلكتروني",
    "customers.company": "الشركة",
    "customers.jobTitle": "المسمى الوظيفي",
    "customers.notes": "ملاحظات",
    "customers.tags": "الوسوم",
    "customers.noTagsYet": "لا توجد وسوم بعد.",
    "customers.total": "إجمالي العملاء",
    "customers.active": "نشط",
    "customers.archivedStatus": "مؤرشف",
    "customers.allStatuses": "كل الحالات",
    "customers.allTypes": "كل الأنواع",
    "customers.allTags": "كل الوسوم",
    "customers.search": "بحث بالاسم أو الهاتف أو البريد…",
    "customers.directory": "دليل العملاء",
    "customers.records": "عميل",
    "customers.contact": "التواصل",
    "customers.statusLabel": "الحالة",
    "customers.lastUpdated": "آخر تحديث",
    "customers.actions": "الإجراءات",
    "customers.loadError": "تعذر تحميل العملاء.",
    "customers.empty": "لا يوجد عملاء مطابقون.",
    "customers.created": "تمت إضافة العميل.",
    "customers.updated": "تم تحديث العميل.",
    "customers.saveError": "تعذر حفظ بيانات العميل.",
    "customers.archived": "تمت أرشفة العميل.",
    "customers.restored": "تمت استعادة العميل.",
    "customers.archive": "أرشفة",
    "customers.restore": "استعادة",
    "customers.delete": "حذف",
    "customers.deleteConfirm": "هل أنت متأكد من حذف هذا العميل نهائيًا؟",
    "customers.deleted": "تم حذف العميل.",
    "customers.deleteError": "تعذر حذف العميل.",
    "customers.manageTags": "إدارة وسوم العملاء",
    "customers.newTag": "اسم الوسم الجديد",
    "customers.addTag": "إضافة وسم",
    "customers.tagCreated": "تمت إضافة الوسم.",
    "customers.tagError": "تعذر حفظ الوسم.",
    "customers.deleteTag": "حذف الوسم",
    "customers.deleteTagConfirm": "حذف هذا الوسم؟ سيُزال من العملاء المرتبطين به.",
    "customers.type.owner": "مالك",
    "customers.type.buyer": "مشتري",
    "customers.type.investor": "مستثمر",
    "customers.type.developer": "مطور",
    "customers.type.broker": "وسيط",
    "customers.type.company": "شركة",
    "customers.type.custom": "مخصص",
  },
  en: {
    "nav.dashboard": "Dashboard",
    "nav.properties": "Properties",
    "nav.customers": "Customers",
    "nav.search": "Search",
    "nav.compare": "Compare",
    "nav.import": "Import",
    "nav.export": "Export",
    "nav.regions": "Regions",
    "nav.propertyTypes": "Property types",
    "nav.lookup": "Lookup",
    "nav.users": "Users",
    "nav.auditLogs": "Audit logs",
    "nav.settings": "Settings",
    "topbar.globalSearch": "Global search…",
    "topbar.shortcuts": "Keyboard shortcuts",
    "topbar.dayMode": "Light mode",
    "topbar.nightMode": "Dark mode",
    "topbar.newProperty": "New property",
    "topbar.new": "New",
    "topbar.userMenu": "User menu",
    "topbar.signOut": "Sign out",
    "role.admin": "Admin",
    "role.agent": "Agent",
    "role.viewer": "Viewer",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading…",
    "common.retry": "Try again",
    "common.refresh": "Refresh",
    "common.clearAll": "Clear all",
    "properties.title": "Properties",
    "properties.manage": "Manage all properties",
    "properties.export": "Export",
    "properties.new": "New property",
    "properties.search": "Search by code or title…",
    "properties.filters": "Filters",
    "properties.tableView": "Table view",
    "properties.cardView": "Card view",
    "properties.noProperties": "No properties yet",
    "properties.noMatch": "No properties match the current search",
    "properties.clearSearch": "Clear search and filters",
    "properties.loadError": "Could not load the property list",
    "properties.searchResults": "properties",
    "settings.title": "Platform settings",
    "settings.subtitle": "Manage general settings and core preferences.",
    "settings.companyData": "Company details",
    "settings.companyDataDescription": "This information appears in reports and invoices.",
    "settings.companyName": "Company name",
    "settings.defaultCurrency": "Default currency",
    "settings.currencyHint": "The selected currency is used for property prices and reports.",
    "settings.regionalPreferences": "Regional preferences",
    "settings.primaryLanguage": "Primary language",
    "settings.dateFormat": "Date format",
    "settings.saved": "Settings saved",
    "settings.saveError": "Could not save settings",
    "dashboard.title": "Overview",
    "dashboard.welcome": "Welcome to the Aqar Data Studio dashboard.",
    "dashboard.totalProperties": "Total properties",
    "dashboard.activeProperties": "Active properties",
    "dashboard.readyToShow": "Ready to show",
    "dashboard.totalValue": "Total value",
    "dashboard.estimatedValue": "Estimated total value",
    "dashboard.averagePrice": "Average price",
    "dashboard.averageArea": "Average area",
    "dashboard.featured": "Featured",
    "dashboard.featuredProperties": "Featured properties",
    "dashboard.draft": "Draft",
    "dashboard.awaitingPublish": "Awaiting publication",
    "dashboard.sold": "Sold",
    "dashboard.soldProperties": "Sold properties",
    "dashboard.rented": "Rented",
    "dashboard.rentedProperties": "Rented properties",
    "dashboard.byRegion": "Properties by region",
    "dashboard.byStatus": "Statuses",
    "dashboard.byCategory": "By category (sale / rent)",
    "dashboard.byType": "By property type",
    "dashboard.latestActivity": "Latest activity",
    "dashboard.noRecentActivity": "No recent activity",
    "dashboard.noData": "No data yet",
    "dashboard.count": "Count",
    "dashboard.properties": "Properties",
    "dashboard.system": "System",
    "dashboard.did": "performed",
    "dashboard.at": "in",
    "compare.title": "Compare properties",
    "compare.subtitle": "Compare two or three properties side by side",
    "compare.chooseProperties": "Choose properties",
    "compare.propertyOne": "First property",
    "compare.propertyTwo": "Second property",
    "compare.propertyThree": "Third property (optional)",
    "compare.chooseProperty": "Choose a property…",
    "compare.viewDetails": "View details",
    "compare.property": "Property",
    "compare.chooseAtLeastOne": "Choose at least one property to start comparing",
    "compare.code": "Code",
    "compare.titleField": "Title",
    "compare.price": "Price",
    "compare.area": "Area",
    "compare.beds": "Bedrooms",
    "compare.baths": "Bathrooms",
    "compare.category": "Category",
    "compare.status": "Status",
    "compare.finishing": "Finishing",
    "compare.view": "View",
    "compare.region": "Region",
    "compare.propertyType": "Property type",
    "compare.subArea": "Sub-area",
    "compare.floor": "Floor",
    "compare.unitType": "Unit type",
    "compare.featuredField": "Featured",
    "compare.description": "Description",
    "compare.createdAt": "Added on",
    "compare.yes": "Yes ⭐",
    "compare.no": "No",
    "login.tagline": "Professional real estate data management platform",
    "login.title": "Sign in",
    "login.email": "Email address",
    "login.password": "Password",
    "login.showPassword": "Show password",
    "login.hidePassword": "Hide password",
    "login.submit": "Sign in",
    "login.loading": "Signing in…",
    "login.help": "To create the first admin account, add a user in Supabase → Authentication, then set the role to admin in the user_profiles table.",
    "login.invalidCredentials": "The email or password is incorrect",
    "login.emailNotConfirmed": "Please confirm your email first",
    "login.tooManyRequests": "Too many attempts. Please wait a moment",
    "login.genericError": "Something went wrong. Please try again",
    "audit.title": "Audit logs",
    "audit.subtitle": "Track system-wide changes and activity.",
    "audit.date": "Date",
    "audit.user": "User",
    "audit.action": "Action",
    "audit.type": "Type",
    "audit.reference": "Reference",
    "audit.loading": "Loading...",
    "audit.empty": "No audit records.",
    "common.previous": "Previous",
    "common.next": "Next",
    "users.title": "Users",
    "users.subtitle": "Manage team access and permissions.",
    "users.invite": "Invite user (soon)",
    "users.name": "Name",
    "users.email": "Email",
    "users.role": "Role",
    "users.joined": "Joined",
    "users.status": "Status",
    "users.noName": "No name",
    "users.active": "Active",
    "users.disabled": "Disabled",
    "users.empty": "No users.",
    "users.deleteConfirm": "Are you sure you want to delete this user?",
    "users.deleteSuccess": "User deleted",
    "users.deleteError": "Could not delete user",
    "detail.loading": "Loading...",
    "detail.notFound": "Property not found",
    "detail.edit": "Edit",
    "detail.gallery": "Photo gallery",
    "detail.upload": "Upload photo",
    "detail.uploading": "Uploading…",
    "detail.view": "View",
    "detail.delete": "Delete",
    "detail.noImages": "No images — click to upload",
    "detail.imageHint": "Click an image for full view · hover to delete",
    "detail.imageCount": "images",
    "detail.price": "Price",
    "detail.area": "Area",
    "detail.beds": "Bedrooms",
    "detail.baths": "Bathrooms",
    "detail.description": "Description",
    "detail.noDescription": "No description available.",
    "detail.classification": "Classification",
    "detail.type": "Type",
    "detail.category": "Category",
    "detail.finishing": "Finishing",
    "detail.viewField": "View",
    "detail.floor": "Floor",
    "detail.unitType": "Unit type",
    "detail.subArea": "Sub-area",
    "detail.added": "Added",
    "detail.links": "Links",
    "detail.map": "View on map",
    "detail.video": "Video",
    "detail.external": "External link",
    "detail.history": "Change history",
    "detail.noHistory": "No history available.",
    "notFound.title": "Page not found",
    "customers.title": "Customers",
    "customers.subtitle": "Manage customer profiles, contact details, and tags.",
    "customers.new": "New customer",
    "customers.edit": "Edit customer",
    "customers.fullName": "Full name",
    "customers.typeLabel": "Customer type",
    "customers.customType": "Custom type",
    "customers.phone": "Phone",
    "customers.whatsapp": "WhatsApp",
    "customers.email": "Email",
    "customers.company": "Company",
    "customers.jobTitle": "Job title",
    "customers.notes": "Notes",
    "customers.tags": "Tags",
    "customers.noTagsYet": "No tags yet.",
    "customers.total": "Total customers",
    "customers.active": "Active",
    "customers.archivedStatus": "Archived",
    "customers.allStatuses": "All statuses",
    "customers.allTypes": "All types",
    "customers.allTags": "All tags",
    "customers.search": "Search by name, phone, or email…",
    "customers.directory": "Customer directory",
    "customers.records": "customers",
    "customers.contact": "Contact",
    "customers.statusLabel": "Status",
    "customers.lastUpdated": "Updated",
    "customers.actions": "Actions",
    "customers.loadError": "Could not load customers.",
    "customers.empty": "No matching customers.",
    "customers.created": "Customer created.",
    "customers.updated": "Customer updated.",
    "customers.saveError": "Could not save the customer.",
    "customers.archived": "Customer archived.",
    "customers.restored": "Customer restored.",
    "customers.archive": "Archive",
    "customers.restore": "Restore",
    "customers.delete": "Delete",
    "customers.deleteConfirm": "Are you sure you want to permanently delete this customer?",
    "customers.deleted": "Customer deleted.",
    "customers.deleteError": "Could not delete the customer.",
    "customers.manageTags": "Manage customer tags",
    "customers.newTag": "New tag name",
    "customers.addTag": "Add tag",
    "customers.tagCreated": "Tag created.",
    "customers.tagError": "Could not save the tag.",
    "customers.deleteTag": "Delete tag",
    "customers.deleteTagConfirm": "Delete this tag? It will be removed from linked customers.",
    "customers.type.owner": "Owner",
    "customers.type.buyer": "Buyer",
    "customers.type.investor": "Investor",
    "customers.type.developer": "Developer",
    "customers.type.broker": "Broker",
    "customers.type.company": "Company",
    "customers.type.custom": "Custom",
  },
};

interface LanguageContextValue {
  language: AppLanguage;
  dir: "rtl" | "ltr";
  isArabic: boolean;
  t: (key: MessageKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "ar",
  dir: "rtl",
  isArabic: true,
  t: (key) => messages.ar[key],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { data: settings } = useGetSettings({
    query: { queryKey: ["settings"], enabled: Boolean(session) },
  });
  const language: AppLanguage = settings?.language === "en" ? "en" : "ar";
  const dir = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.body.dir = dir;
  }, [language, dir]);

  return (
    <LanguageContext.Provider value={{
      language,
      dir,
      isArabic: language === "ar",
      t: (key) => messages[language][key],
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}