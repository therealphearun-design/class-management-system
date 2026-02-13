import React from 'react';
import {
  HiOutlineMenu,
  HiOutlineBell,
  HiOutlineMail,
  HiOutlineCog,
  HiOutlineSearch,
} from 'react-icons/hi';
import Avatar from '../common/Avatar';

export default function Header({ onMenuToggle }) {
  return (
    <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors"
        >
          <HiOutlineMenu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Search (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 min-w-[280px]">
          <HiOutlineSearch className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students, classes..."
            className="bg-transparent border-none outline-none text-sm text-gray-600 w-full placeholder-gray-400"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Icon buttons */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <HiOutlineMail className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <HiOutlineBell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
        </button>

        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block">
          <HiOutlineCog className="w-5 h-5 text-gray-500" />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 mx-2 hidden sm:block" />

        {/* Profile */}
        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-700">Po Phearun</p>
            <p className="text-xs text-gray-400">Designation</p>
          </div>
          <Avatar
            name="Po Phearun"
            size="sm"
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Brittany"
          />
        </div>
      </div>
    </header>
  );
}