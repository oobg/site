import React from 'react';
import { formatDate } from '@src/shared/utils/date';
import { UserIcon } from '@src/shared/ui/icons';

interface BlogMetaProps {
  createdBy: string;
  created: string;
  edited?: string;
  views?: number;
  className?: string;
}

export const BlogMeta = React.memo(({
  createdBy, created, edited, views, className = '',
}: BlogMetaProps) => (
  <div className={`flex flex-col gap-2 text-sm ${className}`}>
    <div className="flex items-center gap-2">
      <span className="text-gray-500">작성자:</span>
      <div className="inline-flex items-center gap-2 rounded-lg bg-gray-800/40 px-3 py-1.5">
        <UserIcon className="h-4 w-4 text-primary-400" />
        <span className="font-medium text-gray-300">{createdBy}</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-gray-500">생성일:</span>
      <span className="text-gray-400">{formatDate(created)}</span>
    </div>
    {edited && edited !== created && (
      <div className="flex items-center gap-2">
        <span className="text-gray-500">수정일:</span>
        <span className="text-gray-400">{formatDate(edited)}</span>
      </div>
    )}
    {views !== undefined && (
      <div className="flex items-center gap-2">
        <span className="text-gray-500">조회수:</span>
        <span className="text-gray-400">{views.toLocaleString()}</span>
      </div>
    )}
  </div>
));

BlogMeta.displayName = 'BlogMeta';
