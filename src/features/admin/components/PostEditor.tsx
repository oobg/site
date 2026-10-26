'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import {
  Code,
  ImageSquare,
  LinkSimple,
  Quotes,
  TextB,
  UploadSimple,
  X,
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '@constants/routes';
import articleStyles from '@components/content/ArticleBody.module.css';
import { CodeCopy } from '@components/content/CodeCopy';
import { ContentEnhancements } from '@components/content/ContentEnhancements';
import { normalizeSlug } from '@features/admin/services/slug';
import { htmlToMarkdown } from '@features/admin/utils/htmlToMarkdown';
import type { PostActionState, PostStatus } from '@features/admin/types/posts-admin.types';
import type { BlogCategory } from '@features/posts/types/posts.types';
import { initialPostActionState } from '@features/admin/types/posts-admin.types';
import styles from './PostEditor.module.css';
import { useAdminNavigationGuard } from './AdminNavigationProvider';
import { DeletePostButton } from './DeletePostButton';

type PostDraft = {
  id?: string;
  updated_at?: string;
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

type EditorSnapshot = {
  version: 1;
  expectedUpdatedAt?: string;
  title: string;
  slug: string;
  description: string;
  body: string;
  status: PostStatus;
  categoryId: string;
  tags: string;
  coverKey: string;
  coverUrl: string;
  coverAlt: string;
  coverX: number;
  coverY: number;
  slugEdited: boolean;
  savedAt: string;
};

const snapshotKeyFor = (post?: PostDraft) => `admin-post-editor-draft:${post?.id ?? 'new'}`;

function readEditorSnapshot(key: string): EditorSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      typeof value !== 'object' ||
      value === null ||
      !('version' in value) ||
      value.version !== 1 ||
      !('title' in value) ||
      typeof value.title !== 'string' ||
      !('slug' in value) ||
      typeof value.slug !== 'string' ||
      !('description' in value) ||
      typeof value.description !== 'string' ||
      !('body' in value) ||
      typeof value.body !== 'string' ||
      !('status' in value) ||
      (value.status !== 'draft' && value.status !== 'published') ||
      !('categoryId' in value) ||
      typeof value.categoryId !== 'string' ||
      !('tags' in value) ||
      typeof value.tags !== 'string' ||
      !('coverKey' in value) ||
      typeof value.coverKey !== 'string' ||
      !('coverUrl' in value) ||
      typeof value.coverUrl !== 'string' ||
      !('coverAlt' in value) ||
      typeof value.coverAlt !== 'string' ||
      !('coverX' in value) ||
      typeof value.coverX !== 'number' ||
      !('coverY' in value) ||
      typeof value.coverY !== 'number' ||
      !('slugEdited' in value) ||
      typeof value.slugEdited !== 'boolean' ||
      !('savedAt' in value) ||
      typeof value.savedAt !== 'string'
    ) {
      return null;
    }
    return value as EditorSnapshot;
  } catch {
    return null;
  }
}

function removeEditorSnapshot(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // sessionStorage may be unavailable in private browsing or restricted contexts.
  }
}

const errorMessage = (value: unknown) => {
  if (typeof value !== 'object' || value === null || !('error' in value)) return null;
  if (typeof value.error === 'string') return value.error;
  const error = value.error;
  return typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
    ? error.message
    : null;
};

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

const fieldTargets: Record<string, string> = {
  title: 'post-title',
  slug: 'post-slug',
  description: 'post-description',
  body: 'post-body',
  status: 'post-status',
  category_id: 'post-category_id',
  tags: 'post-tags',
  cover_image_key: 'cover-heading',
  cover_image_url: 'cover-heading',
  cover_position_x: 'post-cover_position_x',
  cover_position_y: 'post-cover_position_y',
  cover_alt: 'post-cover_alt',
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
  const snapshotKey = snapshotKeyFor(post);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState(post?.updated_at ?? '');
  const [title, setTitle] = useState(post?.title ?? '');
  const [savedTitle, setSavedTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [description, setDescription] = useState(post?.description ?? '');
  const [body, setBody] = useState(post?.body ?? '');
  const [status, setStatus] = useState<PostStatus>(post?.status ?? 'draft');
  const [persistedStatus, setPersistedStatus] = useState<PostStatus>(post?.status ?? 'draft');
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
  const [previewReady, setPreviewReady] = useState(!body.trim());
  const [previewFailed, setPreviewFailed] = useState(false);
  const [previewGeneration, setPreviewGeneration] = useState(0);
  const [previewMessage, setPreviewMessage] = useState('미리보기를 준비하고 있어요.');
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  const [snapshotNotice, setSnapshotNotice] = useState<
    'restored' | 'saving' | 'saved' | 'error' | null
  >(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);
  const bodyValueRef = useRef(body);
  const previewSequenceRef = useRef(0);
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const previewReadyRef = useRef(!body.trim());
  const previewControllerRef = useRef<AbortController | null>(null);
  const editRevisionRef = useRef(0);
  const skipNextSnapshotWriteRef = useRef(false);
  const loadedSnapshotKeyRef = useRef<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  useAdminNavigationGuard(dirty);

  const invalidatePreview = useCallback(() => {
    previewSequenceRef.current += 1;
    previewControllerRef.current?.abort();
  }, []);

  const initializeVisualEditor = useCallback(
    (source: string) => {
      invalidatePreview();
      const ready = !source.trim();
      previewReadyRef.current = ready;
      setPreviewReady(ready);
      setPreviewFailed(false);
      setPreviewMessage(ready ? '' : '미리보기를 준비하고 있어요.');
      setPreviewGeneration((generation) => generation + 1);
      if (ready && visualEditorRef.current) {
        visualEditorRef.current.innerHTML = '';
        setPreviewHtml('');
      }
    },
    [invalidatePreview],
  );

  function changeEditorTab(next: 'write' | 'preview') {
    if (next === editorTab) return;
    invalidatePreview();
    if (next === 'preview') initializeVisualEditor(bodyValueRef.current);
    setEditorTab(next);
  }

  useEffect(() => {
    if (loadedSnapshotKeyRef.current === snapshotKey) return;
    const snapshot = readEditorSnapshot(snapshotKey);
    if (!snapshot) return;

    const timer = window.setTimeout(() => {
      loadedSnapshotKeyRef.current = snapshotKey;
      // Never adopt a fresh server revision for an old recovered draft.
      setExpectedUpdatedAt(snapshot.expectedUpdatedAt ?? '');
      setTitle(snapshot.title);
      setSlug(snapshot.slug);
      setDescription(snapshot.description);
      initializeVisualEditor(snapshot.body);
      setBody(snapshot.body);
      bodyValueRef.current = snapshot.body;
      setStatus(snapshot.status);
      setCategoryId(snapshot.categoryId);
      setTags(snapshot.tags);
      setCoverKey(snapshot.coverKey);
      setCoverUrl(snapshot.coverUrl);
      setCoverAlt(snapshot.coverAlt);
      setCoverX(snapshot.coverX);
      setCoverY(snapshot.coverY);
      setSlugEdited(snapshot.slugEdited);
      setDirty(true);
      setSnapshotNotice('restored');
      skipNextSnapshotWriteRef.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [snapshotKey, initializeVisualEditor]);

  const [state, formAction, pending] = useActionState(
    async (previousState: PostActionState, formData: FormData): Promise<PostActionState> => {
      const savedRevision = editRevisionRef.current;
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
        if (nextState.updatedAt) setExpectedUpdatedAt(nextState.updatedAt);
        setSavedTitle(String(formData.get('title') ?? title));
        const submittedStatus = formData.get('status');
        if (submittedStatus === 'draft' || submittedStatus === 'published') {
          setStatus(submittedStatus);
          setPersistedStatus(submittedStatus);
        }
        setDirty(editRevisionRef.current !== savedRevision);
        if (editRevisionRef.current === savedRevision) {
          removeEditorSnapshot(snapshotKey);
          setSnapshotNotice(null);
        }
        try {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['blog-posts'] }),
            queryClient.invalidateQueries({ queryKey: ['post'] }),
          ]);
        } catch {
          nextState = {
            ...nextState,
            message: `${nextState.message} 화면의 최신 목록은 새로고침하면 확인할 수 있어요.`,
          };
        }
        if (!post && nextState.postId && editRevisionRef.current === savedRevision) {
          router.replace(ROUTES.ADMIN.POST(nextState.postId));
        }
      }
      return nextState;
    },
    initialPostActionState,
  );

  useEffect(() => {
    if (!dirty || pending) return;
    if (skipNextSnapshotWriteRef.current) {
      skipNextSnapshotWriteRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      const snapshot: EditorSnapshot = {
        version: 1,
        expectedUpdatedAt,
        title,
        slug,
        description,
        body,
        status,
        categoryId,
        tags,
        coverKey,
        coverUrl,
        coverAlt,
        coverX,
        coverY,
        slugEdited,
        savedAt: new Date().toISOString(),
      };
      try {
        window.sessionStorage.setItem(snapshotKey, JSON.stringify(snapshot));
        setSnapshotNotice('saved');
      } catch {
        setSnapshotNotice('error');
      }
    }, 500);
    setSnapshotNotice('saving');
    return () => window.clearTimeout(timer);
  }, [
    body,
    categoryId,
    coverAlt,
    coverKey,
    coverUrl,
    coverX,
    coverY,
    description,
    expectedUpdatedAt,
    dirty,
    pending,
    slug,
    slugEdited,
    snapshotKey,
    status,
    tags,
    title,
  ]);

  useEffect(() => {
    titleRef.current?.focus();
  }, [post?.id]);

  const focusCoverLightboxClose = useCallback((element: HTMLButtonElement | null) => {
    if (!element) return;
    queueMicrotask(() => {
      if (element.isConnected) {
        element.focus({ preventScroll: true });
      }
    });
  }, []);

  useEffect(() => {
    const sequence = ++previewSequenceRef.current;
    if (editorTab !== 'preview' || !body.trim()) return;
    const controller = new AbortController();
    previewControllerRef.current = controller;
    const isCurrent = () =>
      !controller.signal.aborted &&
      sequence === previewSequenceRef.current &&
      bodyValueRef.current === body;
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
        if (!isCurrent()) return;
        const html = previewHtmlFrom(result);
        if (!response.ok || html === null) {
          throw new Error(errorMessage(result) ?? '미리보기를 만들지 못했습니다.');
        }
        // Only initialization owns the DOM. Background results never replace live editing nodes.
        if (!previewReadyRef.current) {
          const editor = visualEditorRef.current;
          if (!editor) return;
          editor.innerHTML = html;
          setPreviewHtml(html);
          previewReadyRef.current = true;
          setPreviewReady(true);
        }
        setPreviewFailed(false);
        setPreviewMessage('');
      } catch (error) {
        if (!isCurrent()) return;
        setPreviewFailed(true);
        setPreviewMessage(error instanceof Error ? error.message : '미리보기를 만들지 못했습니다.');
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [body, editorTab, previewGeneration]);

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) {
      setUploadMessage('이미지 파일만 올릴 수 있어요.');
      return;
    }

    setUploading(true);
    setUploadMessage('이미지를 올리는 중이에요.');
    const sourceBody = bodyValueRef.current;
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
      // Typing during an upload invalidates the old selection; append without replacing new text.
      const unchanged = currentBody === sourceBody;
      const start = unchanged
        ? Math.min(selectionStart ?? currentBody.length, currentBody.length)
        : currentBody.length;
      const end = unchanged
        ? Math.min(selectionEnd ?? currentBody.length, currentBody.length)
        : currentBody.length;
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
      initializeVisualEditor(next);
      bodyValueRef.current = next;
      setBody(next);
      editRevisionRef.current += 1;
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
      const result: unknown = await response.json();
      if (
        !response.ok ||
        typeof result !== 'object' ||
        result === null ||
        !('path' in result) ||
        typeof result.path !== 'string' ||
        !('publicUrl' in result) ||
        typeof result.publicUrl !== 'string'
      ) {
        throw new Error(errorMessage(result) ?? '대표 이미지를 업로드하지 못했습니다.');
      }
      setCoverKey(result.path.replace(/^\//, ''));
      setCoverUrl(result.publicUrl);
      setCoverAlt((current) => current || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
      editRevisionRef.current += 1;
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

  function wrapSelection(prefix: string, suffix = prefix, fallback = '텍스트') {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.slice(start, end) || fallback;
    const next = `${body.slice(0, start)}${prefix}${selected}${suffix}${body.slice(end)}`;
    initializeVisualEditor(next);
    bodyValueRef.current = next;
    setBody(next);
    editRevisionRef.current += 1;
    setDirty(true);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  }

  const busy = pending || uploading;
  const visiblePreviewMessage = body.trim()
    ? previewMessage
    : '본문을 입력하면 여기에 미리보기가 표시돼요.';
  const secondaryStatus: PostStatus =
    persistedStatus === 'published' && status === 'published' ? 'published' : 'draft';
  const secondaryLabel =
    persistedStatus === 'published'
      ? secondaryStatus === 'published'
        ? '저장'
        : '초안으로 전환'
      : post
        ? '초안 저장'
        : '초안 만들기';

  function discardSnapshot() {
    removeEditorSnapshot(snapshotKey);
    const initialCategory =
      post?.category_id ?? categories.find((category) => category.is_default)?.id ?? '';
    setExpectedUpdatedAt(post?.updated_at ?? '');
    setTitle(post?.title ?? '');
    setSlug(post?.slug ?? '');
    setDescription(post?.description ?? '');
    initializeVisualEditor(post?.body ?? '');
    setBody(post?.body ?? '');
    bodyValueRef.current = post?.body ?? '';
    setStatus(post?.status ?? 'draft');
    setPersistedStatus(post?.status ?? 'draft');
    setCategoryId(initialCategory);
    setTags(post?.tags?.join(', ') ?? '');
    setCoverKey(post?.cover_image_key ?? '');
    setCoverUrl(post?.cover_image_url ?? '');
    setCoverAlt(post?.cover_alt ?? '');
    setCoverX(post?.cover_position_x ?? 0.5);
    setCoverY(post?.cover_position_y ?? 0.5);
    setSlugEdited(Boolean(post?.slug));
    editRevisionRef.current += 1;
    setDirty(false);
    setSnapshotNotice(null);
  }

  const snapshotMessage =
    snapshotNotice === 'restored'
      ? '이 브라우저 탭의 임시 보관 내용을 복구했어요. 서버에 저장된 내용은 아직 바뀌지 않았어요.'
      : snapshotNotice === 'saving'
        ? '이 탭에 임시 보관 중…'
        : snapshotNotice === 'saved'
          ? '이 탭에 임시 보관됨 · 서버 저장 전'
          : snapshotNotice === 'error'
            ? '이 탭에 임시 보관하지 못했어요. 서버에 저장하거나 내용을 복사해 주세요.'
            : null;

  return (
    <form
      action={formAction}
      aria-busy={pending}
      className={styles.form}
      inert={pending ? true : undefined}
      onChange={() => {
        editRevisionRef.current += 1;
        setDirty(true);
      }}
      onSubmit={(event) => {
        if (event.target !== event.currentTarget) return;
        if (uploading) event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const submittedStatus = (submitter?.dataset.status ?? secondaryStatus) as PostStatus;
        if (
          persistedStatus === 'published' &&
          submittedStatus === 'draft' &&
          !window.confirm('초안으로 바꾸면 공개 목록에서 이 글이 내려가요. 계속할까요?')
        ) {
          event.preventDefault();
          return;
        }
        if (submittedStatus && statusInputRef.current) {
          statusInputRef.current.value = submittedStatus;
        }
      }}
    >
      {snapshotMessage ? (
        <div className={styles.snapshotNotice} aria-live="polite">
          <span>{snapshotMessage}</span>
          {snapshotNotice === 'restored' ? (
            <span className={styles.snapshotActions}>
              <button type="button" onClick={() => setSnapshotNotice(null)}>
                계속 작성
              </button>
              <button type="button" onClick={discardSnapshot}>
                임시 저장 버리기
              </button>
            </span>
          ) : null}
        </div>
      ) : null}
      {post?.id ? (
        <>
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="expectedUpdatedAt" value={expectedUpdatedAt} />
        </>
      ) : null}
      {state.fieldErrors?.expectedUpdatedAt ? (
        <section className={styles.recovery} role="alert" aria-labelledby="conflict-title">
          <h2 id="conflict-title">최신 글을 확인해 주세요</h2>
          <p>{state.message} 자동으로 덮어쓰지 않습니다.</p>
          <p>이 탭의 작성 내용은 유지됩니다. 최신 글과 비교한 뒤 필요한 내용을 옮겨 주세요.</p>
          {post?.id ? (
            <a href={ROUTES.ADMIN.POST(post.id)} target="_blank" rel="noopener noreferrer">
              최신 글을 새 탭에서 확인
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => {
              try {
                window.sessionStorage.setItem(
                  snapshotKey,
                  JSON.stringify({
                    version: 1,
                    expectedUpdatedAt,
                    title,
                    slug,
                    description,
                    body,
                    status,
                    categoryId,
                    tags,
                    coverKey,
                    coverUrl,
                    coverAlt,
                    coverX,
                    coverY,
                    slugEdited,
                    savedAt: new Date().toISOString(),
                  }),
                );
                window.location.reload();
              } catch {
                setSnapshotNotice('error');
              }
            }}
          >
            임시 보관을 유지하고 다시 불러오기
          </button>
        </section>
      ) : null}
      {Object.entries(state.fieldErrors ?? {}).some(([name]) => name !== 'expectedUpdatedAt') ? (
        <section className={styles.errorSummary} role="alert" aria-labelledby="field-errors-title">
          <h2 id="field-errors-title" tabIndex={-1}>
            입력값을 확인해 주세요
          </h2>
          <ul>
            {Object.entries(state.fieldErrors ?? {})
              .filter(([name]) => name !== 'expectedUpdatedAt')
              .map(([name, errors]) => (
                <li key={name}>
                  <a
                    href={`#${fieldTargets[name] ?? 'field-errors-title'}`}
                    onClick={(event) => {
                      event.preventDefault();
                      if (name === 'body') changeEditorTab('write');
                      requestAnimationFrame(() =>
                        document
                          .getElementById(fieldTargets[name] ?? 'field-errors-title')
                          ?.focus(),
                      );
                    }}
                  >
                    {errors[0]}
                  </a>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
      <input ref={statusInputRef} type="hidden" name="status" value={status} />
      <footer className={styles.footer}>
        <span className={styles.breadcrumb}>
          <Link href={ROUTES.ADMIN.HOME}>글 관리</Link>
          <span aria-hidden>/</span>
          <span>{post ? '글 수정' : '새 글'}</span>
        </span>
        <span className={styles.saveState} aria-live="polite">
          {uploading
            ? '이미지를 올리는 중이에요.'
            : state.message ||
              (dirty
                ? '서버에 저장하지 않은 변경이 있어요.'
                : post
                  ? '서버에서 불러온 내용'
                  : '서버 저장 전')}
        </span>
        <div className={styles.submitArea}>
          <button
            className={styles.save}
            type="submit"
            data-status={secondaryStatus}
            disabled={busy}
          >
            {pending ? '저장 중...' : secondaryLabel}
          </button>
          <button className={styles.submit} type="submit" data-status="published" disabled={busy}>
            공개하기
          </button>
        </div>
      </footer>
      <div className={styles.workspace}>
        <div className={styles.mainFields}>
          <h2 className={styles.groupHeading}>기본 정보</h2>
          <label className={`${styles.field} ${styles.titleField}`}>
            <span id="post-title-label">제목</span>
            <input
              id="post-title"
              aria-labelledby="post-title-label"
              ref={titleRef}
              aria-describedby={
                fieldError(state, 'title') ? 'title-help title-error' : 'title-help'
              }
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
            <small id="title-help">160자까지 입력할 수 있어요.</small>
            {fieldError(state, 'title') ? (
              <small id="title-error">{fieldError(state, 'title')}</small>
            ) : null}
          </label>

          <label className={styles.field}>
            <span id="post-description-label">설명</span>
            <textarea
              aria-labelledby="post-description-label"
              aria-describedby={
                fieldError(state, 'description')
                  ? 'description-help description-error'
                  : 'description-help'
              }
              aria-invalid={Boolean(fieldError(state, 'description'))}
              id="post-description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              required
            />
            <small id="description-help">500자까지 입력할 수 있어요.</small>
            {fieldError(state, 'description') ? (
              <small id="description-error">{fieldError(state, 'description')}</small>
            ) : null}
          </label>
        </div>

        <div className={styles.editorBlock}>
          <div
            className={styles.editorTabs}
            role="tablist"
            aria-label="본문 편집 모드"
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
              changeEditorTab(next);
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
              onClick={() => changeEditorTab('write')}
            >
              마크다운
            </button>
            <button
              id="editor-preview-tab"
              type="button"
              role="tab"
              aria-controls="editor-preview-panel"
              aria-selected={editorTab === 'preview'}
              tabIndex={editorTab === 'preview' ? 0 : -1}
              onClick={() => changeEditorTab('preview')}
            >
              텍스트 편집
            </button>
          </div>
          <p className={styles.modeHint}>
            {editorTab === 'write'
              ? '마크다운 원문을 편집하고 있어요.'
              : '편집 가능한 미리보기예요. 본문을 직접 바꾸면 마크다운 원문에도 반영돼요.'}
          </p>
          <div className={styles.toolbar} role="toolbar" aria-label="Markdown 서식">
            <button
              type="button"
              disabled={busy || editorTab !== 'write'}
              title={editorTab !== 'write' ? '마크다운 모드에서 사용할 수 있어요.' : undefined}
              onClick={() => wrapSelection('## ', '', '소제목')}
              aria-label="소제목"
            >
              H2
            </button>
            <button
              type="button"
              disabled={busy || editorTab !== 'write'}
              title={editorTab !== 'write' ? '마크다운 모드에서 사용할 수 있어요.' : undefined}
              onClick={() => wrapSelection('**', '**')}
              aria-label="굵게"
            >
              <TextB aria-hidden size={18} weight="bold" />
            </button>
            <button
              type="button"
              disabled={busy || editorTab !== 'write'}
              title={editorTab !== 'write' ? '마크다운 모드에서 사용할 수 있어요.' : undefined}
              onClick={() => wrapSelection('[', '](https://)', '링크 텍스트')}
              aria-label="링크"
            >
              <LinkSimple aria-hidden size={18} weight="bold" />
            </button>
            <button
              type="button"
              disabled={busy || editorTab !== 'write'}
              title={editorTab !== 'write' ? '마크다운 모드에서 사용할 수 있어요.' : undefined}
              onClick={() => wrapSelection('> ', '', '인용문')}
              aria-label="인용문"
            >
              <Quotes aria-hidden size={18} weight="fill" />
            </button>
            <button
              type="button"
              disabled={busy || editorTab !== 'write'}
              title={editorTab !== 'write' ? '마크다운 모드에서 사용할 수 있어요.' : undefined}
              onClick={() => wrapSelection('`', '`', '코드')}
              aria-label="인라인 코드"
            >
              <Code aria-hidden size={18} weight="bold" />
            </button>
            <label
              className={styles.toolbarUpload}
              aria-disabled={busy || editorTab !== 'write'}
              title={editorTab !== 'write' ? '마크다운 모드에서 사용할 수 있어요.' : undefined}
            >
              <ImageSquare aria-hidden size={19} />
              <span className={styles.visuallyHidden}>본문 이미지 선택</span>
              <input
                accept="image/jpeg,image/png,image/gif,image/webp"
                disabled={busy || editorTab !== 'write'}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                  event.target.value = '';
                }}
                type="file"
              />
            </label>
            {editorTab === 'preview' ? (
              <span className={styles.toolbarHint}>
                서식 도구는 마크다운 모드에서 사용할 수 있어요.
              </span>
            ) : null}
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
                data-editor-scroll-region
                aria-label="본문"
                aria-describedby="body-help"
                aria-invalid={Boolean(fieldError(state, 'body'))}
                className={styles.body}
                name="body"
                value={body}
                onChange={(event) => {
                  const value = event.target.value;
                  initializeVisualEditor(value);
                  bodyValueRef.current = value;
                  setBody(value);
                }}
                onInvalid={() => changeEditorTab('write')}
                spellCheck
                required
              />
            </div>
            <section
              id="editor-preview-panel"
              data-editor-scroll-region
              role="tabpanel"
              aria-labelledby="editor-preview-tab"
              hidden={editorTab !== 'preview'}
              className={styles.preview}
              onClick={(event) => {
                if ((event.target as Element).closest('a')) event.preventDefault();
              }}
            >
              <div
                ref={visualEditorRef}
                className={`${articleStyles.prose} ${styles.visualEditor}`}
                contentEditable={!busy && previewReady}
                suppressContentEditableWarning
                role="textbox"
                aria-label="본문 텍스트 편집"
                aria-multiline="true"
                aria-readonly={busy || !previewReady}
                aria-describedby="body-help visual-editor-help"
                data-empty={!body.trim() ? 'true' : undefined}
                onInput={(event) => {
                  if (busy || !previewReadyRef.current || editorTab !== 'preview') return;
                  invalidatePreview();
                  const markdown = htmlToMarkdown(event.currentTarget);
                  bodyValueRef.current = markdown;
                  setBody(markdown);
                  editRevisionRef.current += 1;
                  setDirty(true);
                  setPreviewMessage('');
                  setPreviewFailed(false);
                }}
              />
              <p className={styles.previewMessage} role="status" aria-live="polite">
                {visiblePreviewMessage || '미리보기가 최신 내용이에요.'}
              </p>
              {previewFailed ? (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      invalidatePreview();
                      setPreviewFailed(false);
                      setPreviewGeneration((generation) => generation + 1);
                    }}
                  >
                    다시 시도
                  </button>
                  <button type="button" onClick={() => changeEditorTab('write')}>
                    마크다운으로 편집
                  </button>
                </div>
              ) : null}
              <span id="visual-editor-help" className={styles.visuallyHidden}>
                렌더링된 본문을 직접 수정할 수 있습니다. 변경 내용은 마크다운 원문에 반영됩니다.
              </span>
            </section>
            <CodeCopy />
            <ContentEnhancements contentKey={previewHtml} />
          </div>
          <p id="body-help" className={styles.helper} aria-live="polite">
            {fieldError(state, 'body') ||
              uploadMessage ||
              '이미지를 끌어 놓으면 현재 커서 위치에 경로가 들어가요.'}
          </p>
        </div>

        <aside className={styles.settings} aria-label="글 설정">
          <h2 className={styles.groupHeading}>발행 설정</h2>
          <p className={styles.modeHint}>
            {persistedStatus === 'published'
              ? '공개 글의 변경 사항은 저장하거나 공개하기를 누르면 바로 반영돼요.'
              : '초안은 나만 볼 수 있어요. 공개하기를 누르면 공개 목록에 올라가요.'}
            {secondaryStatus === 'draft' && persistedStatus === 'published'
              ? ' 초안으로 전환하면 공개 목록에서 내려가요.'
              : ''}
          </p>
          <label className={styles.statusField}>
            <span>상태</span>
            <select
              id="post-status"
              aria-invalid={Boolean(fieldError(state, 'status'))}
              value={status}
              disabled={busy}
              onChange={(event) => setStatus(event.target.value as PostStatus)}
            >
              <option value="draft">초안</option>
              <option value="published">공개</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>카테고리</span>
            <select
              aria-invalid={Boolean(fieldError(state, 'category_id'))}
              id="post-category_id"
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
            <span id="post-tags-label">태그</span>
            <input
              aria-invalid={Boolean(fieldError(state, 'tags'))}
              id="post-tags"
              aria-labelledby="post-tags-label"
              aria-describedby="tags-help"
              name="tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="설계, 협업"
            />
            <small id="tags-help">
              쉼표로 구분하며 저장할 때 중복을 정리해요. 태그는 30개까지, 하나에 80자까지 입력할 수
              있어요.
            </small>
          </label>

          <div className={styles.field}>
            <label htmlFor="post-slug">URL</label>
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
                  editRevisionRef.current += 1;
                  setDirty(true);
                }}
              >
                재생성
              </button>
            </span>
            <small id="slug-help">
              {fieldError(state, 'slug') ??
                (post ? '기존 주소를 유지해요.' : '제목으로 자동 생성돼요.')}{' '}
              160자까지 입력할 수 있어요.
            </small>
          </div>
          <h2 className={styles.groupHeading} id="cover-heading" tabIndex={-1}>
            대표 이미지
          </h2>
          <section
            className={`${styles.field} ${styles.coverField}`}
            aria-labelledby="cover-heading"
          >
            {coverUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- owner-selected CDN URL is not a configured image host */}
                <img
                  src={coverUrl}
                  alt={coverAlt || ''}
                  style={{
                    objectPosition: `${coverX * 100}% ${coverY * 100}%`,
                    aspectRatio: '1.9',
                    objectFit: 'cover',
                  }}
                />
                <div className={styles.coverRatios}>
                  <span>목록 · 데스크톱 추천 1.9:1</span>
                  <details>
                    <summary>다른 노출 비율 미리보기</summary>
                    {[
                      { label: '글 상세 16:9', ratio: '16 / 9' },
                      { label: '모바일 목록 6:5', ratio: '6 / 5' },
                      { label: '모바일 추천 16:10', ratio: '16 / 10' },
                    ].map(({ label, ratio }) => (
                      <figure key={label}>
                        <figcaption>{label}</figcaption>
                        {/* eslint-disable-next-line @next/next/no-img-element -- owner-selected asset crop preview */}
                        <img
                          src={coverUrl}
                          alt=""
                          style={{
                            aspectRatio: ratio,
                            objectPosition: `${coverX * 100}% ${coverY * 100}%`,
                          }}
                        />
                      </figure>
                    ))}
                  </details>
                </div>
                <Dialog.Root>
                  <Dialog.Trigger className={styles.coverZoomButton} type="button">
                    크게 보기
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Backdrop className={styles.coverLightboxBackdrop} />
                    <Dialog.Viewport className={styles.coverLightboxViewport}>
                      <Dialog.Popup className={styles.coverLightbox} initialFocus={false}>
                        <Dialog.Title className={styles.coverLightboxTitle}>
                          대표 이미지 크게 보기
                        </Dialog.Title>
                        <Dialog.Close
                          ref={focusCoverLightboxClose}
                          className={styles.coverLightboxClose}
                          type="button"
                          aria-label="대표 이미지 크게 보기 닫기"
                        >
                          <X aria-hidden size={22} />
                        </Dialog.Close>
                        {/* eslint-disable-next-line @next/next/no-img-element -- owner-selected CDN URL is not a configured image host */}
                        <img
                          className={styles.coverLightboxImage}
                          src={coverUrl}
                          alt={coverAlt || ''}
                        />
                      </Dialog.Popup>
                    </Dialog.Viewport>
                  </Dialog.Portal>
                </Dialog.Root>
              </>
            ) : (
              <div className={styles.coverPlaceholder} aria-hidden>
                <ImageSquare size={24} />
              </div>
            )}
            <input type="hidden" name="cover_image_key" value={coverKey} />
            <input type="hidden" name="cover_image_url" value={coverUrl} />
            <label>
              <span>가로 위치</span>
              <input
                type="range"
                id="post-cover_position_x"
                name="cover_position_x"
                min="0"
                max="1"
                step="0.01"
                value={coverX}
                onChange={(event) => setCoverX(Number(event.target.value))}
              />
            </label>
            <label>
              <span>세로 위치</span>
              <input
                type="range"
                id="post-cover_position_y"
                name="cover_position_y"
                min="0"
                max="1"
                step="0.01"
                value={coverY}
                onChange={(event) => setCoverY(Number(event.target.value))}
              />
            </label>
            <label>
              <span>대체 텍스트</span>
              <input
                id="post-cover_alt"
                aria-invalid={Boolean(fieldError(state, 'cover_alt'))}
                aria-describedby="cover-alt-help"
                name="cover_alt"
                value={coverAlt}
                onChange={(event) => setCoverAlt(event.target.value)}
                placeholder="이미지 내용을 설명해 주세요"
              />
            </label>
            <p id="cover-alt-help" className={styles.modeHint}>
              이미지를 볼 수 없는 독자에게 전할 내용을 적어 주세요. 장식용이면 비워 둘 수 있어요.
              300자까지 입력할 수 있어요.
            </p>
            <label className={styles.uploadButton} aria-disabled={busy}>
              <UploadSimple aria-hidden size={17} />
              이미지 변경
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

          <details className={styles.settingsDetails}>
            <summary>주소와 검색 정보</summary>
            <div className={styles.detailsContent}>
              <p>공개 주소는 URL 값으로 만들고 검색 설명은 상단 설명을 사용해요.</p>
            </div>
          </details>
          {post?.id ? <DeletePostButton id={post.id} title={savedTitle || title} /> : null}
        </aside>
      </div>
    </form>
  );
}
