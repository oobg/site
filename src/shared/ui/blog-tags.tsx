import React from 'react';

interface BlogTagsProps {
  tags: string[];
  className?: string;
}

export const BlogTags = React.memo(({ tags, className = '' }: BlogTagsProps) => {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-gray-600/50 bg-gray-800/30 px-2.5 py-1 text-xs text-gray-400"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
});

BlogTags.displayName = 'BlogTags';
