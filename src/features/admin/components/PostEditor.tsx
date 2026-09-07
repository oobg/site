'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { ImageSquare, UploadSimple } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@constants/routes';
import type { PostActionState, PostStatus } from '@features/admin/types/posts-admin.types';
import { initialPostActionState } from '@features/admin/types/posts-admin.types';
import styles from './PostEditor.module.css';

type PostDraft = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  body: string;
  status: PostStatus;
};

type UploadResponse = { path: string; url: string } | { error: string };

function normalizeSlug(value: string) {
  return value
    .normalize('NFC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^가-힣a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function fieldError(state: PostActionState, name: string) {
  return state.fieldErrors?.[name]?.[0];
}

export function PostEditor({
  post,
  action,
}: {
  post?: PostDraft;
  action: (previousState: PostActionState, formData: FormData) => Promise<PostActionState>;
}) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [description, setDescription] = useState(post?.description ?? '');
  const [body, setBody] = useState(post?.body ?? '');
  const [status, setStatus] = useState<PostStatus>(post?.status ?? 'draft');
  const [dirty, setDirty] = useState(false);
  const [slugEdited, setSlugEdited] = useState(Boolean(post?.slug));
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const bodyValueRef = useRef(body);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (previousState: PostActionState, formData: FormData) => {
      const nextState = await action(previousState, formData);
      if (nextState.status === 'success') {
        setDirty(false);
        if (!post && nextState.postId) router.replace(ROUTES.ADMIN.POST(nextState.postId));
      }
      return nextState;
    },
    initialPostActionState,
  );

  useEffect(() => {
    bodyValueRef.current = body;
  }, [body]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    const warnLink = (event: MouseEvent) => {
      if (!dirty || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey)
        return;
      const target = event.target;
      const link = target instanceof Element ? target.closest('a[href]') : null;
      if (!link || window.confirm('저장하지 않은 변경이 있어요. 이 페이지를 나갈까요?')) return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', warnLink, true);
    return () => {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('click', warnLink, true);
    };
  }, [dirty]);

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) {
      setUploadMessage('이미지 파일만 올릴 수 있어요.');
      return;
    }

    setUploading(true);
    setUploadMessage('이미지를 올리는 중이에요.');
    const selectionStart = bodyRef.current?.selectionStart;
    const selectionEnd = bodyRef.current?.selectionEnd;
    try {
      const payload = new FormData();
      payload.set('file', file);
      const response = await fetch('/api/admin/uploads', { method: 'POST', body: payload });
      const result = (await response.json()) as UploadResponse;
      if (!response.ok || 'error' in result) {
        throw new Error('error' in result ? result.error : '이미지를 업로드하지 못했습니다.');
      }

      const textarea = bodyRef.current;
      const currentBody = bodyValueRef.current;
      const start = Math.min(selectionStart ?? currentBody.length, currentBody.length);
      const end = Math.min(selectionEnd ?? currentBody.length, currentBody.length);
      const alt =
        file.name
          .replace(/\.[^.]+$/, '')
          .replace(/[-_]+/g, ' ')
          .replace(/[\[\]()\r\n]/g, '')
          .trim() || '업로드한 이미지';
      const markdown = `![${alt}](${result.url})`;
      const prefix = start > 0 && currentBody[start - 1] !== '\n' ? '\n\n' : '';
      const suffix = end < currentBody.length && currentBody[end] !== '\n' ? '\n\n' : '';
      const next = `${currentBody.slice(0, start)}${prefix}${markdown}${suffix}${currentBody.slice(end)}`;
      bodyValueRef.current = next;
      setBody(next);
      setDirty(true);
      setUploadMessage('본문에 이미지 링크를 넣었어요.');
      requestAnimationFrame(() => {
        const cursor = start + prefix.length + markdown.length;
        textarea?.focus();
        textarea?.setSelectionRange(cursor, cursor);
      });
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : '이미지를 업로드하지 못했습니다.');
    } finally {
      setUploading(false);
    }
  }

  const busy = pending || uploading;

  return (
    <form
      action={formAction}
      className={styles.form}
      onChange={() => setDirty(true)}
      onSubmit={(event) => {
        if (uploading) event.preventDefault();
      }}
    >
      {post?.id ? <input type="hidden" name="id" value={post.id} /> : null}
      <div className={styles.fields}>
        <label className={styles.field}>
          <span>제목</span>
          <input
            aria-describedby={fieldError(state, 'title') ? 'title-error' : undefined}
            aria-invalid={Boolean(fieldError(state, 'title'))}
            name="title"
            value={title}
            onChange={(event) => {
              const value = event.target.value;
              setTitle(value);
              if (!slugEdited) setSlug(normalizeSlug(value));
            }}
            autoComplete="off"
            required
          />
          {fieldError(state, 'title') ? (
            <small id="title-error">{fieldError(state, 'title')}</small>
          ) : null}
        </label>

        <label className={styles.field}>
          <span>슬러그</span>
          <input
            aria-describedby="slug-help"
            aria-invalid={Boolean(fieldError(state, 'slug'))}
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(normalizeSlug(event.target.value));
            }}
            autoComplete="off"
            required
          />
          <small id="slug-help">
            {fieldError(state, 'slug') ?? '한글, 영문 소문자, 숫자와 하이픈을 사용할 수 있어요.'}
          </small>
        </label>

        <label className={styles.field}>
          <span>설명</span>
          <textarea
            aria-describedby={fieldError(state, 'description') ? 'description-error' : undefined}
            aria-invalid={Boolean(fieldError(state, 'description'))}
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            required
          />
          {fieldError(state, 'description') ? (
            <small id="description-error">{fieldError(state, 'description')}</small>
          ) : null}
        </label>
      </div>

      <div className={styles.editorBlock}>
        <div className={styles.editorHeading}>
          <div>
            <label htmlFor="post-body">본문</label>
            <p>Markdown으로 작성해요.</p>
          </div>
          <label className={styles.uploadButton} aria-disabled={busy}>
            <UploadSimple aria-hidden size={17} weight="bold" />
            이미지 선택
            <input
              accept="image/jpeg,image/png,image/gif,image/webp"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.target.value = '';
              }}
              type="file"
            />
          </label>
        </div>
        <div
          className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null))
              setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file && !busy) void upload(file);
          }}
        >
          {dragging ? (
            <div className={styles.dropHint} aria-hidden>
              <ImageSquare size={24} /> 놓아서 본문에 삽입
            </div>
          ) : null}
          <textarea
            ref={bodyRef}
            id="post-body"
            aria-describedby="body-help"
            aria-invalid={Boolean(fieldError(state, 'body'))}
            className={styles.body}
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            spellCheck
            required
          />
        </div>
        <p id="body-help" className={styles.helper} aria-live="polite">
          {fieldError(state, 'body') ||
            uploadMessage ||
            '이미지를 끌어 놓으면 현재 커서 위치에 경로가 들어가요.'}
        </p>
      </div>

      <footer className={styles.footer}>
        <label className={styles.statusField}>
          <span>상태</span>
          <select
            value={status}
            name="status"
            disabled={busy}
            onChange={(event) => setStatus(event.target.value as PostStatus)}
          >
            <option value="draft">초안</option>
            <option value="published">공개</option>
          </select>
        </label>
        <div className={styles.submitArea}>
          <span className={styles.saveState} aria-live="polite">
            {uploading
              ? '이미지를 올리는 중이에요.'
              : state.message || (dirty ? '저장하지 않은 변경이 있어요.' : '')}
          </span>
          <button className={styles.submit} type="submit" disabled={busy}>
            {pending ? '저장 중...' : post ? '변경사항 저장' : '글 저장'}
          </button>
        </div>
      </footer>
    </form>
  );
}
