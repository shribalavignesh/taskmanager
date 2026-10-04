import React from 'react';

const CATEGORIES = [
  'All',
  'Web Development',
  'Programming',
  'Technology',
  'AI & Data',
  'Design',
  'Career',
];

export default function CategoryPills({ selectedCategory, onSelectCategory }) {
  return (
    <div className="category-bar">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
          onClick={() => onSelectCategory(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
