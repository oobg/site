import React from 'react';

interface BlogCategoryProps {
  category: string;
  className?: string;
}

export const BlogCategory = React.memo(({ category, className = '' }: BlogCategoryProps) => (
  <div className={className}>
    <span className="inline-block rounded-md bg-primary-600/80 px-3 py-1 text-xs font-semibold text-white">
      {category}
    </span>
  </div>
));

BlogCategory.displayName = 'BlogCategory';
