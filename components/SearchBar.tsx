'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => Promise<any>;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isSearching) {
      setIsSearching(true);
      try {
        await onSearch(query);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a location..."
        className="w-full p-2 pl-10 bg-white rounded-md shadow-sm"
        disabled={isSearching}
      />
      <Search 
        className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isSearching ? 'text-gray-400' : 'text-gray-600'}`} 
        size={16} 
      />
    </form>
  );
} 