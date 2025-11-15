import React from 'react';
import { formatDate } from '@src/shared/utils/date';
import { UserIcon } from '@src/shared/ui/icons';

interface BlogMetaProps {
  createdBy: string;
  created: string;
  edited?: string;
  className?: string;
}

export const BlogMeta = React.memo(({
  createdBy, created, edited, className = '',
}: BlogMetaProps) => (
  <div className={`flex flex-wrap items-center gap-3 text-sm ${className}`}>
    <div className="inline-flex items-center gap-2 rounded-lg bg-gray-800/40 px-3 py-1.5">
      <UserIcon className="h-4 w-4 text-primary-400" />
      <span className="font-medium text-gray-300">{createdBy}</span>
    </div>
    <span className="text-gray-500">•</span>
    <span className="text-gray-400">{formatDate(created)}</span>
    {edited && edited !== created && (
      <>
        <span className="text-gray-500">•</span>
        <span className="text-gray-400">수정: {formatDate(edited)}</span>
      </>
    )}
  </div>
));

BlogMeta.displayName = 'BlogMeta';
