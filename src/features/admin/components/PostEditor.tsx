'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { ImageSquare, UploadSimple } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '@constants/routes';
import articleStyles from '@components/content/ArticleBody.module.css';
import { normalizeSlug } from '@features/admin/services/slug';
import type { PostActionState, PostStatus } from '@features/admin/types/posts-admin.types';
import type { BlogCategory } from '@features/posts/types/posts.types';
import { initialPostActionState } from '@features/admin/types/posts-admin.types';
import styles from './PostEditor.module.css';

type PostDraft = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  body: string;
  status: PostStatus;
  category_id?: string;
  tags?: string[];
  cover_image_key?: string | null;
  cover_image_url?: string | null;
  cover_position_x?: number;
  cover_position_y?: number;
  cover_alt?: string | null;
};

const errorMessage = (value: unknown) =>
  typeof value === 'object' && value !== null && 'error' in value && typeof value.error === 'string'
    ? value.error
    : null;

const previewHtmlFrom = (value: unknown) =>
  typeof value === 'object' && value !== null && 'html' in value && typeof value.html === 'string'
    ? value.html
    : null;

const uploadUrlFrom = (value: unknown) => {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('url' in value) ||
    typeof value.url !== 'string'
  )
    return null;
  return /^\/assets\/posts\/[0-9-]+\/[0-9a-f-]+\.(?:jpg|png|gif|webp)$/.test(value.url)
    ? value.url
    : null;
};

function fieldError(state: PostActionState, name: string) {
  return state.fieldErrors?.[name]?.[0];
}

export function PostEditor({
  post,
  action,
  categories = [],
}: {
  post?: PostDraft;
  categories?: BlogCategory[];
  action: (previousState: PostActionState, formData: FormData) => Promise<PostActionState>;
}) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [description, setDescription] = useState(post?.description ?? '');
  const [body, setBody] = useState(post?.body ?? '');
  const [status, setStatus] = useState<PostStatus>(post?.status ?? 'draft');
  const [categoryId, setCategoryId] = useState(
    post?.category_id ?? categories.find((category) => category.is_default)?.id ?? '',
  );
  const [tags, setTags] = useState(post?.tags?.join(', ') ?? '');
  const [coverKey, setCoverKey] = useState(post?.cover_image_key ?? '');
  const [coverUrl, setCoverUrl] = useState(post?.cover_image_url ?? '');
  const [coverAlt, setCoverAlt] = useState(post?.cover_alt ?? '');
  const [coverX, setCoverX] = useState(post?.cover_position_x ?? 0.5);
  const [coverY, setCoverY] = useState(post?.cover_position_y ?? 0.5);
  const [dirty, setDirty] = useState(false);
  const [slugEdited, setSlugEdited] = useState(Boolean(post?.slug));
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewMessage, setPreviewMessage] = useState('미리보기를 준비하고 있어요.');
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const bodyValueRef = useRef(body);
  const previewSequenceRef = useRef(0);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, formAction, pending] = useActionState(
    async (previousState: PostActionState, formData: FormData): Promise<PostActionState> => {
      let nextState: PostActionState;
      try {
        nextState = await action(previousState, formData);
      } catch {
        const failed: PostActionState = {
          status: 'error',
          message: '요청을 처리하지 못했습니다.',
        };
        return failed;
      }
      if (nextState.status === 'success') {
        setDirty(false);
        await queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
        await queryClient.invalidateQueries({ queryKey: ['post'] });
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
    const sequence = ++previewSequenceRef.current;
    if (editorTab !== 'preview' || !body.trim()) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPreviewMessage('미리보기를 업데이트하는 중이에요.');
      try {
        const response = await fetch('/api/admin/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown: body }),
          signal: controller.signal,
        });
        const result: unknown = await response.json();
        if (controller.signal.aborted || sequence !== previewSequenceRef.current) return;
        const html = previewHtmlFrom(result);
        if (!response.ok || html === null) {
          throw new Error(errorMessage(result) ?? '미리보기를 만들지 못했습니다.');
        }
        setPreviewHtml(html);
        setPreviewMessage('');
      } catch (error) {
        if (controller.signal.aborted || sequence !== previewSequenceRef.current) return;
        setPreviewMessage(error instanceof Error ? error.message : '미리보기를 만들지 못했습니다.');
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [body, editorTab]);

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
      const result: unknown = await response.json();
      const uploadedUrl = uploadUrlFrom(result);
      if (!response.ok || uploadedUrl === null) {
        throw new Error(errorMessage(result) ?? '이미지를 업로드하지 못했습니다.');
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
      const markdown = `![${alt}](${uploadedUrl})`;
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

  async function uploadCover(file: File) {
    setUploading(true);
    setUploadMessage('대표 이미지를 올리는 중이에요.');
    try {
      const payload = new FormData();
      payload.set('file', file);
      const response = await fetch('/api/admin/uploads', { method: 'POST', body: payload });
      const result = (await response.json()) as {
        path?: unknown;
        publicUrl?: unknown;
        error?: unknown;
      };
      if (!response.ok || typeof result.path !== 'string' || typeof result.publicUrl !== 'string') {
        throw new Error(errorMessage(result) ?? '대표 이미지를 업로드하지 못했습니다.');
      }
      setCoverKey(result.path.replace(/^\//, ''));
      setCoverUrl(result.publicUrl);
      if (!coverAlt) setCoverAlt(file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
      setDirty(true);
      setUploadMessage('대표 이미지를 올렸어요.');
    } catch (error) {
      setUploadMessage(
        error instanceof Error ? error.message : '대표 이미지를 업로드하지 못했습니다.',
      );
    } finally {
      setUploading(false);
    }
  }

  const busy = pending || uploading;
  const visiblePreviewMessage = body.trim()
    ? previewMessage
    : '본문을 입력하면 여기에 미리보기가 표시돼요.';

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
        <h2 className={styles.groupHeading}>기본 정보</h2>
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
        <div className={styles.field}>
          <label htmlFor="post-slug">슬러그</label>
          <span className={styles.slugControl}>
            <input
              id="post-slug"
              aria-describedby="slug-help"
              aria-invalid={Boolean(fieldError(state, 'slug'))}
              name="slug"
              value={slug}
              onBlur={(event) => setSlug(normalizeSlug(event.currentTarget.value))}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(event.target.value);
              }}
              onCompositionEnd={(event) => setSlug(normalizeSlug(event.currentTarget.value))}
              autoComplete="off"
              required
            />
            <button
              className={styles.slugButton}
              type="button"
              disabled={busy || !title.trim()}
              onClick={() => {
                setSlugEdited(true);
                setSlug(normalizeSlug(title));
                setDirty(true);
              }}
            >
              제목으로 생성
            </button>
          </span>
          <small id="slug-help">
            {fieldError(state, 'slug') ??
              (post
                ? '기존 주소를 유지해요. 바꾸려면 제목으로 생성하거나 직접 수정하세요.'
                : '제목으로 자동 생성돼요. 필요하면 직접 수정할 수 있어요.')}
          </small>
        </div>
        <label className={`${styles.field} ${styles.wide}`}>
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
        <h2 className={styles.groupHeading}>분류</h2>
        <label className={styles.field}>
          <span>카테고리</span>
          <select
            name="category_id"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>태그</span>
          <input
            name="tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="react, nextjs"
          />
          <small>쉼표로 나눠 입력해요. 저장할 때 소문자와 중복을 정리합니다.</small>
        </label>
        <h2 className={styles.groupHeading} id="cover-heading">
          대표 이미지
        </h2>
        <section className={`${styles.field} ${styles.coverField}`} aria-labelledby="cover-heading">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- owner-selected CDN URL is not a configured image host
            <img
              src={coverUrl}
              alt={coverAlt || ''}
              style={{
                objectPosition: `${coverX * 100}% ${coverY * 100}%`,
                maxWidth: '320px',
                aspectRatio: '16 / 9',
                objectFit: 'cover',
              }}
            />
          ) : null}
          <input type="hidden" name="cover_image_key" value={coverKey} />
          <input type="hidden" name="cover_image_url" value={coverUrl} />
          <label>
            가로 위치
            <input
              type="range"
              name="cover_position_x"
              min="0"
              max="1"
              step="0.01"
              value={coverX}
              onChange={(event) => setCoverX(Number(event.target.value))}
            />
          </label>
          <label>
            세로 위치
            <input
              type="range"
              name="cover_position_y"
              min="0"
              max="1"
              step="0.01"
              value={coverY}
              onChange={(event) => setCoverY(Number(event.target.value))}
            />
          </label>
          <label>
            대체 텍스트
            <input
              name="cover_alt"
              value={coverAlt}
              onChange={(event) => setCoverAlt(event.target.value)}
              placeholder="이미지 내용을 설명해 주세요"
            />
          </label>
          <label className={styles.uploadButton} aria-disabled={busy}>
            대표 이미지 선택
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadCover(file);
                event.target.value = '';
              }}
            />
          </label>
        </section>
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
          className={styles.editorTabs}
          role="tablist"
          aria-label="본문 편집 보기"
          onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next =
              event.key === 'Home'
                ? 'write'
                : event.key === 'End'
                  ? 'preview'
                  : editorTab === 'write'
                    ? 'preview'
                    : 'write';
            setEditorTab(next);
            const tabs = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
            tabs[next === 'write' ? 0 : 1]?.focus();
          }}
        >
          <button
            id="editor-write-tab"
            type="button"
            role="tab"
            aria-controls="editor-write-panel"
            aria-selected={editorTab === 'write'}
            tabIndex={editorTab === 'write' ? 0 : -1}
            onClick={() => setEditorTab('write')}
          >
            작성
          </button>
          <button
            id="editor-preview-tab"
            type="button"
            role="tab"
            aria-controls="editor-preview-panel"
            aria-selected={editorTab === 'preview'}
            tabIndex={editorTab === 'preview' ? 0 : -1}
            onClick={() => setEditorTab('preview')}
          >
            미리보기
          </button>
        </div>
        <div className={styles.editorColumns}>
          <div
            id="editor-write-panel"
            role="tabpanel"
            aria-labelledby="editor-write-tab"
            hidden={editorTab !== 'write'}
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
              onChange={(event) => {
                const value = event.target.value;
                setBody(value);
                if (!value.trim()) {
                  setPreviewHtml('');
                  setPreviewMessage('본문을 입력하면 여기에 미리보기가 표시돼요.');
                }
              }}
              onInvalid={() => setEditorTab('write')}
              spellCheck
              required
            />
          </div>
          <section
            id="editor-preview-panel"
            role="tabpanel"
            aria-labelledby="editor-preview-tab"
            hidden={editorTab !== 'preview'}
            className={styles.preview}
            onClick={(event) => event.preventDefault()}
          >
            {previewHtml ? (
              <div
                className={articleStyles.prose}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : null}
            {visiblePreviewMessage ? (
              <p className={styles.previewMessage} role="status">
                {visiblePreviewMessage}
              </p>
            ) : null}
          </section>
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
          <button
            className={styles.submit}
            type="submit"
            disabled={busy}
            onClick={() => setEditorTab('write')}
          >
            {pending ? '저장 중...' : post ? '변경사항 저장' : '글 저장'}
          </button>
        </div>
      </footer>
    </form>
  );
}
