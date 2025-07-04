import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function Sidebar() {
    const { menus, url } = usePage().props;
    const [expandedMenus, setExpandedMenus] = useState({});
    
    const toggleMenu = (menuKey) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuKey]: !prev[menuKey]
        }));
    };
    
    const isActive = (href) => {
        if (!href) return false;
        return url === href || url.startsWith(href);
    };
    
    const renderMenuItems = () => {
        return Object.entries(menus).map(([key, menu]) => {
            const hasChildren = menu.childrens && Object.keys(menu.childrens).length > 0;
            const isMenuActive = isActive(menu.href) || 
                (hasChildren && Object.values(menu.childrens).some(child => isActive(child.href)));
            const isExpanded = expandedMenus[key] || isMenuActive;
            
            return (
                <div key={key} className="menu-item mb-1">
                    {/* Menu Header */}
                    {hasChildren ? (
                        <div 
                            onClick={() => toggleMenu(key)}
                            className={`flex items-center px-4 py-2 cursor-pointer rounded-md transition-colors ${
                                isMenuActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                            }`}
                        >
                            {menu.icon && <i className={`las ${menu.icon} text-xl mr-3`}></i>}
                            <span className="font-medium">{menu.label}</span>
                            <i className={`las ${isExpanded ? 'la-angle-down' : 'la-angle-right'} ml-auto`}></i>
                        </div>
                    ) : (
                        <Link 
                            href={menu.href || '#'}
                            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                                isActive(menu.href) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                            }`}
                        >
                            {menu.icon && <i className={`las ${menu.icon} text-xl mr-3`}></i>}
                            <span className="font-medium">{menu.label}</span>
                        </Link>
                    )}
                    
                    {/* Submenu */}
                    {hasChildren && (
                        <div className={`pl-10 mt-1 space-y-1 ${isExpanded ? 'block' : 'hidden'}`}>
                            {Object.entries(menu.childrens).map(([childKey, child]) => (
                                <Link
                                    key={childKey}
                                    href={child.href || '#'}
                                    className={`block px-4 py-2 text-sm rounded-md transition-colors ${
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
        <div className="sidebar w-64 bg-white h-full overflow-y-auto border-r">
            <div className="p-4 border-b">
                <h1 className="text-xl font-bold text-gray-800">Your App</h1>
            </div>
            <nav className="p-4">
                {renderMenuItems()}
            </nav>
        </div>
    );
}