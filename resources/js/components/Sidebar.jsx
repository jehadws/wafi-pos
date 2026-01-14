import { useTranslation } from '@/lib/i18n';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Sidebar() {
    const { t } = useTranslation();
    const { menus, url } = usePage().props;
    const [expandedMenus, setExpandedMenus] = useState({});

    const toggleMenu = (menuKey) => {
        setExpandedMenus((prev) => ({
            ...prev,
            [menuKey]: !prev[menuKey],
        }));
    };

    const isActive = (href) => {
        if (!href) return false;
        return url === href || url.startsWith(href);
    };

    const renderMenuItems = () => {
        return Object.entries(menus).map(([key, menu]) => {
            const hasChildren = menu.childrens && Object.keys(menu.childrens).length > 0;
            const isMenuActive = isActive(menu.href) || (hasChildren && Object.values(menu.childrens).some((child) => isActive(child.href)));
            const isExpanded = expandedMenus[key] || isMenuActive;

            return (
                <div key={key} className="menu-item mb-1">
                    {/* Menu Header */}
                    {hasChildren ? (
                        <div
                            onClick={() => toggleMenu(key)}
                            className={`flex cursor-pointer items-center rounded-md px-4 py-2 transition-colors ${
                                isMenuActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                            }`}
                        >
                            {menu.icon && <i className={`las ${menu.icon} mr-3 text-xl`}></i>}
                            <span className="font-medium">{menu.label}</span>
                            <i className={`las ${isExpanded ? 'la-angle-down' : 'la-angle-right'} ml-auto`}></i>
                        </div>
                    ) : (
                        <Link
                            href={menu.href || '#'}
                            className={`flex items-center rounded-md px-4 py-2 transition-colors ${
                                isActive(menu.href) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                            }`}
                        >
                            {menu.icon && <i className={`las ${menu.icon} mr-3 text-xl`}></i>}
                            <span className="font-medium">{menu.label}</span>
                        </Link>
                    )}

                    {/* Submenu */}
                    {hasChildren && (
                        <div className={`mt-1 space-y-1 pl-10 ${isExpanded ? 'block' : 'hidden'}`}>
                            {Object.entries(menu.childrens).map(([childKey, child]) => (
                                <Link
                                    key={childKey}
                                    href={child.href || '#'}
                                    className={`block rounded-md px-4 py-2 text-sm transition-colors ${
                                        isActive(child.href) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                                    }`}
                                >
                                    {child.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="sidebar h-full w-64 overflow-y-auto border-r bg-white">
            <div className="border-b p-4">
                <h1 className="text-xl font-bold text-gray-800">{t('Your App')}</h1>
            </div>
            <nav className="p-4">{renderMenuItems()}</nav>
        </div>
    );
}
