import { ForumsTag } from '@/types';

interface ThreadTagsProps {
  tags: ForumsTag[];
  className?: string;
}

export default function ThreadTags({ tags, className = '' }: ThreadTagsProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80"
          style={{
            backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
            color: tag.color || '#374151',
            borderColor: tag.color ? `${tag.color}40` : '#d1d5db'
          }}
          title={tag.description}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}