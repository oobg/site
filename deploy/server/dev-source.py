#!/usr/bin/env python3
"""Prepare and verify the exact source context used by Raven dev Docker builds."""

from __future__ import annotations

import hashlib
import os
from pathlib import Path
import shutil
import stat
import subprocess
import sys


EXCLUDED_ROOT_DIRS = {".git", ".next", "node_modules", "docs", ".superpowers"}


def die(message: str) -> "None":
    raise SystemExit(f"error: {message}")


def excluded(relative: Path) -> bool:
    parts = relative.parts
    if not parts:
        return False
    if parts[0] in EXCLUDED_ROOT_DIRS:
        return True
    name = relative.name
    return (
        relative == Path(".raven-release")
        or name == ".env"
        or name.startswith(".env.")
        or name.endswith(".env")
    )


def entries(root: Path) -> list[Path]:
    selected: list[Path] = []
    for directory, dirnames, filenames in os.walk(root, topdown=True, followlinks=False):
        current = Path(directory)
        relative_dir = current.relative_to(root)
        original_dirnames = sorted(dirnames)
        dirnames[:] = sorted(
            name
            for name in dirnames
            if not excluded(relative_dir / name)
            and not (current / name).is_symlink()
        )
        for name in sorted(original_dirnames + filenames):
            path = current / name
            relative = path.relative_to(root)
            if excluded(relative) or (path.is_dir() and not path.is_symlink()):
                continue
            if path.is_file() or path.is_symlink():
                selected.append(relative)
    return sorted(set(selected), key=lambda path: path.as_posix().encode())


def fingerprint(root: Path) -> str:
    digest = hashlib.sha256()
    for relative in entries(root):
        path = root / relative
        if path.is_symlink():
            # POSIX ignores symlink permission bits. macOS reports the source
            # mode while Linux commonly reports 0777, so normalize it.
            mode = "777"
            kind = b"L"
            content_hash = hashlib.sha256(os.readlink(path).encode()).digest()
        else:
            mode = format(stat.S_IMODE(path.lstat().st_mode), "o")
            kind = b"F"
            content_hash = hashlib.sha256(path.read_bytes()).digest()
        for field in (kind, mode.encode(), relative.as_posix().encode(), content_hash):
            digest.update(field)
            digest.update(b"\0")
    return digest.hexdigest()


def git_output(root: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(root), *args],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
    )
    return result.stdout.strip()


def git_visible_paths(root: Path) -> set[Path]:
    result = subprocess.run(
        ["git", "-C", str(root), "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )
    return {Path(item.decode()) for item in result.stdout.split(b"\0") if item}


def prepare(source: Path, destination: Path) -> None:
    if destination.exists() or destination.is_symlink():
        die("snapshot destination already exists")
    try:
        destination.relative_to(source)
    except ValueError:
        pass
    else:
        die("snapshot destination must be outside the source checkout")
    base_sha = git_output(source, "rev-parse", "HEAD")
    if len(base_sha) != 40 or any(char not in "0123456789abcdef" for char in base_sha):
        die("source HEAD is not a 40-character Git SHA")
    initial_status = git_output(source, "status", "--porcelain=v1")
    selected_entries = entries(source)
    visible_paths = git_visible_paths(source)
    included_ignored = any(path not in visible_paths for path in selected_entries)
    source_state = "dirty" if initial_status or included_ignored else "clean"
    source_sha = fingerprint(source)

    destination.mkdir(parents=True, mode=0o700)
    for relative in selected_entries:
        source_path = source / relative
        destination_path = destination / relative
        destination_path.parent.mkdir(parents=True, exist_ok=True)
        if source_path.is_symlink():
            destination_path.symlink_to(os.readlink(source_path))
        else:
            shutil.copy2(source_path, destination_path)

    if git_output(source, "rev-parse", "HEAD") != base_sha:
        die("source HEAD changed while preparing the snapshot")
    if git_output(source, "status", "--porcelain=v1") != initial_status:
        die("source Git status changed while preparing the snapshot")
    if fingerprint(source) != source_sha:
        die("source files changed while preparing the snapshot")
    if fingerprint(destination) != source_sha:
        die("prepared snapshot fingerprint does not match source")
    manifest = (
        f"BASE_GIT_SHA={base_sha}\n"
        f"SOURCE_STATE={source_state}\n"
        f"SOURCE_SHA256={source_sha}\n"
    )
    (destination / ".raven-release").write_text(manifest, encoding="utf-8")
    print(f"prepared {source_state} Raven dev snapshot at {destination} ({source_sha})")


def main() -> None:
    if len(sys.argv) == 3 and sys.argv[1] == "digest":
        root = Path(sys.argv[2]).resolve(strict=True)
        print(fingerprint(root))
        return
    if len(sys.argv) == 4 and sys.argv[1] == "prepare":
        source = Path(sys.argv[2]).resolve(strict=True)
        destination = Path(sys.argv[3]).resolve(strict=False)
        prepare(source, destination)
        return
    die(f"usage: {sys.argv[0]} digest ROOT | prepare GIT_SOURCE NEW_SNAPSHOT")


if __name__ == "__main__":
    main()
