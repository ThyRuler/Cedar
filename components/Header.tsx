import React from 'react';
import { CedarIcon } from './icons/CedarIcon';

const Header: React.FC = () => {
    return (
        <header className="bg-white dark:bg-gray-900 shadow">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <CedarIcon className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
        </header>
    );
};

export default Header;