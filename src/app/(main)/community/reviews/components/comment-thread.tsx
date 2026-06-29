'use client';

import ConfirmDialog from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatRelativeFromKstIso } from '@/lib/kst';
import {
  useAddComment,
  useDeleteComment,
} from '@/lib/services/community/use-review-comments';
import type { CommentNode } from '@/types/community';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

// 인라인 댓글 작성 폼 (최상위 댓글 + 대댓글 공용).
function CommentComposer({
  postId,
  parentId,
  placeholder,
  onDone,
}: {
  postId: string;
  parentId?: string;
  placeholder: string;
  onDone?: () => void;
}) {
  const [text, setText] = useState('');
  const add = useAddComment(postId);

  const submit = () => {
    const content = text.trim();
    if (!content) return;
    add.mutate(
      { content, ...(parentId ? { parentId } : {}) },
      {
        onSuccess: () => {
          setText('');
          onDone?.();
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={2}
        maxLength={1000}
        className="resize-none text-sm"
      />
      <div className="flex justify-end gap-2">
        {onDone && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            취소
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={submit}
          disabled={add.isPending || !text.trim()}
        >
          등록
        </Button>
      </div>
    </div>
  );
}

function CommentItem({
  node,
  postId,
  maxDepth,
}: {
  node: CommentNode;
  postId: string;
  maxDepth: number;
}) {
  const { data: session } = useSession();
  const myId = session?.user?.id;
  const isAdmin = (session?.user?.role ?? 'FREE') === 'ADMIN';
  const canDelete = myId === node.author.id || isAdmin;
  const canReply = Boolean(myId) && node.depth < maxDepth;

  const [replying, setReplying] = useState(false);
  const del = useDeleteComment(postId);

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {node.author.name ?? '익명'}
        </span>
        <span>{formatRelativeFromKstIso(node.createdAt)}</span>
      </div>
      <p className="text-sm break-words whitespace-pre-wrap">{node.content}</p>
      <div className="flex items-center gap-1">
        {canReply && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setReplying((v) => !v)}
          >
            답글
          </Button>
        )}
        {canDelete && (
          <ConfirmDialog
            title="댓글을 삭제할까요?"
            description="삭제하면 이 댓글과 답글이 모두 사라집니다."
            onConfirm={() => del.mutate(node.id)}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-muted-foreground"
              >
                삭제
              </Button>
            }
          />
        )}
      </div>

      {replying && (
        <div className="mt-1">
          <CommentComposer
            postId={postId}
            parentId={node.id}
            placeholder="답글을 입력하세요"
            onDone={() => setReplying(false)}
          />
        </div>
      )}

      {node.children.length > 0 && (
        <ul className="mt-2 flex flex-col gap-3 border-l border-border pl-3 sm:pl-4">
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              postId={postId}
              maxDepth={maxDepth}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CommentThread({
  postId,
  nodes,
  maxDepth,
  isLoading,
}: {
  postId: string;
  nodes: CommentNode[];
  maxDepth: number;
  isLoading?: boolean;
}) {
  const { data: session } = useSession();
  const canWrite = Boolean(session?.user);

  return (
    <div className="flex flex-col gap-3">
      {canWrite ? (
        <CommentComposer postId={postId} placeholder="댓글을 입력하세요" />
      ) : (
        <p className="text-xs text-muted-foreground">
          로그인하면 댓글을 남길 수 있어요.
        </p>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">댓글을 불러오는 중…</p>
      ) : nodes.length === 0 ? (
        <p className="text-xs text-muted-foreground">아직 댓글이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {nodes.map((n) => (
            <CommentItem key={n.id} node={n} postId={postId} maxDepth={maxDepth} />
          ))}
        </ul>
      )}
    </div>
  );
}
