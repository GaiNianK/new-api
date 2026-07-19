#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/1panel/apps/new-api/new-api}"
UPDATER_DIR="${UPDATER_DIR:-/opt/new-api-safe-updater}"
BACKUP_DIR="${BACKUP_DIR:-/opt/1panel/backups/new-api-safe-update}"
UPSTREAM_REPO="${UPSTREAM_REPO:-https://github.com/QuantumNous/new-api.git}"
UPSTREAM_REF="${UPSTREAM_REF:-refs/tags/v1.0.0-rc.21}"
FORK_REPO="${FORK_REPO:-https://github.com/GaiNianK/new-api.git}"
CUSTOM_REF="${CUSTOM_REF:-feat/happyhorse-second-billing}"
CUSTOM_COMMIT="${CUSTOM_COMMIT:-6a15d9b}"
IMAGE_REPO="${IMAGE_REPO:-gainiank/new-api}"
GOPROXY="${GOPROXY:-https://goproxy.cn,direct}"
SMOKE_PORT="${SMOKE_PORT:-3001}"
SWAP_FILE="${SWAP_FILE:-/swapfile-new-api-build}"
SWAP_SIZE_GB="${SWAP_SIZE_GB:-4}"
KEEP_BACKUPS="${KEEP_BACKUPS:-5}"
LOCK_FILE="/var/lock/new-api-safe-update.lock"

MODE="${1:---help}"
REPO_DIR="$UPDATER_DIR/repository"
WORKTREE_DIR="$UPDATER_DIR/worktree"
LOG_DIR="$UPDATER_DIR/logs"
COMPOSE_FILE="$APP_DIR/docker-compose.yml"
CREATED_SWAP=0
SMOKE_CONTAINER=""

log() {
  printf '[%s] %s\n' "$(date '+%F %T')" "$*"
}

die() {
  log "ERROR: $*"
  exit 1
}

usage() {
  cat <<'EOF'
Usage:
  new-api-safe-update --check   Check deployment and upstream availability only
  new-api-safe-update --update  Build, back up, switch, verify, and roll back on failure

Optional environment overrides:
  CUSTOM_COMMIT, CUSTOM_REF, KEEP_BACKUPS, SWAP_SIZE_GB
EOF
}

require_root() {
  [[ ${EUID:-$(id -u)} -eq 0 ]] || die "run as root"
}

require_commands() {
  local command_name
  for command_name in docker git curl sed grep tar flock; do
    command -v "$command_name" >/dev/null 2>&1 || die "missing command: $command_name"
  done
  docker compose version >/dev/null 2>&1 || die "docker compose plugin is unavailable"
}

current_container() {
  docker compose --env-file "$APP_DIR/.env" -f "$COMPOSE_FILE" ps -q new-api
}

current_image() {
  local container_id
  container_id="$(current_container)"
  [[ -n "$container_id" ]] || return 1
  docker inspect -f '{{.Config.Image}}' "$container_id"
}

check_local_status() {
  curl -fsS --max-time 15 http://127.0.0.1:3000/api/status | grep -q '"success"[[:space:]]*:[[:space:]]*true'
}

deployment_check() {
  [[ -f "$COMPOSE_FILE" ]] || die "compose file not found: $COMPOSE_FILE"
  [[ -f "$APP_DIR/.env" ]] || die "1Panel environment file not found: $APP_DIR/.env"

  local container_id image state health upstream_head
  container_id="$(current_container)"
  [[ -n "$container_id" ]] || die "new-api service is not running"
  image="$(docker inspect -f '{{.Config.Image}}' "$container_id")"
  state="$(docker inspect -f '{{.State.Status}}' "$container_id")"
  health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$container_id")"
  check_local_status || die "local /api/status check failed"
  upstream_head="$(git ls-remote "$UPSTREAM_REPO" "$UPSTREAM_REF" | awk '{print $1}')"
  [[ -n "$upstream_head" ]] || die "cannot query upstream main"

  log "container=$container_id"
  log "image=$image"
  log "state=$state health=$health"
  log "upstream_ref=$UPSTREAM_REF commit=${upstream_head:0:12}"
  log "disk_available=$(df -h "$APP_DIR" | awk 'NR==2 {print $4}')"
  log "check passed; no production changes were made"
}

prepare_swap() {
  if [[ "$(swapon --noheadings --show=NAME 2>/dev/null | wc -l)" -gt 0 ]]; then
    log "existing swap detected"
    return
  fi
  log "creating temporary ${SWAP_SIZE_GB} GiB swap"
  if command -v fallocate >/dev/null 2>&1; then
    fallocate -l "${SWAP_SIZE_GB}G" "$SWAP_FILE"
  else
    dd if=/dev/zero of="$SWAP_FILE" bs=1M count="$((SWAP_SIZE_GB * 1024))" status=progress
  fi
  chmod 600 "$SWAP_FILE"
  mkswap "$SWAP_FILE" >/dev/null
  swapon "$SWAP_FILE"
  CREATED_SWAP=1
}

cleanup() {
  local exit_code=$?
  if [[ -n "$SMOKE_CONTAINER" ]]; then
    docker rm -f "$SMOKE_CONTAINER" >/dev/null 2>&1 || true
  fi
  if [[ -d "$WORKTREE_DIR" && -d "$REPO_DIR/.git" ]]; then
    git -C "$REPO_DIR" worktree remove --force "$WORKTREE_DIR" >/dev/null 2>&1 || true
  fi
  if [[ $CREATED_SWAP -eq 1 ]]; then
    swapoff "$SWAP_FILE" >/dev/null 2>&1 || true
    rm -f "$SWAP_FILE"
  fi
  exit "$exit_code"
}

prepare_source() {
  mkdir -p "$UPDATER_DIR" "$LOG_DIR" "$BACKUP_DIR"
  if [[ ! -d "$REPO_DIR/.git" ]]; then
    log "cloning source repository"
    git clone --filter=blob:none --no-checkout "$UPSTREAM_REPO" "$REPO_DIR"
    git -C "$REPO_DIR" remote add fork "$FORK_REPO"
  fi

  git -C "$REPO_DIR" remote set-url origin "$UPSTREAM_REPO"
  if git -C "$REPO_DIR" remote get-url fork >/dev/null 2>&1; then
    git -C "$REPO_DIR" remote set-url fork "$FORK_REPO"
  else
    git -C "$REPO_DIR" remote add fork "$FORK_REPO"
  fi
  log "fetching upstream and custom branch"
  UPSTREAM_COMMIT="$(git ls-remote "$UPSTREAM_REPO" "$UPSTREAM_REF" | awk '{print $1}')"
  [[ -n "$UPSTREAM_COMMIT" ]] || die "cannot resolve upstream ref $UPSTREAM_REF"
  git -C "$REPO_DIR" fetch --prune origin "$UPSTREAM_REF"
  UPSTREAM_COMMIT="$(git -C "$REPO_DIR" rev-parse 'FETCH_HEAD^{commit}')"
  git -C "$REPO_DIR" fetch --prune fork "$CUSTOM_REF"
  git -C "$REPO_DIR" cat-file -e "$CUSTOM_COMMIT^{commit}" 2>/dev/null || die "custom commit $CUSTOM_COMMIT is unavailable"

  git -C "$REPO_DIR" worktree prune
  [[ ! -e "$WORKTREE_DIR" ]] || die "stale worktree exists: $WORKTREE_DIR"
  git -C "$REPO_DIR" worktree add --detach "$WORKTREE_DIR" "$UPSTREAM_COMMIT"
  git -C "$WORKTREE_DIR" -c user.name='New API Safe Updater' -c user.email='updater@localhost' cherry-pick "$CUSTOM_COMMIT" || {
    git -C "$WORKTREE_DIR" cherry-pick --abort >/dev/null 2>&1 || true
    die "custom patch conflicts with the latest upstream; production was not changed"
  }
  if grep -q '^RUN go mod download$' "$WORKTREE_DIR/Dockerfile" && ! grep -q '^ENV GOPROXY=' "$WORKTREE_DIR/Dockerfile"; then
    sed -i "/^RUN go mod download$/i ENV GOPROXY=${GOPROXY}" "$WORKTREE_DIR/Dockerfile"
  fi
}

build_image() {
  local upstream_short version image
  upstream_short="${UPSTREAM_COMMIT:0:10}"
  version="happyhorse-rc21-${upstream_short}-${CUSTOM_COMMIT:0:7}"
  image="$IMAGE_REPO:$version"
  printf '%s\n' "$version" > "$WORKTREE_DIR/VERSION"
  log "building $image; production remains online"
  DOCKER_BUILDKIT=0 nice -n 10 docker build --pull -t "$image" "$WORKTREE_DIR" 2>&1 | tee "$LOG_DIR/build-$version.log"
  docker image inspect "$image" >/dev/null 2>&1 || die "built image is unavailable"
  printf '%s' "$image"
}

smoke_test() {
  local image="$1"
  SMOKE_CONTAINER="new-api-update-smoke-$$"
  log "starting isolated smoke test on 127.0.0.1:$SMOKE_PORT"
  docker run -d --name "$SMOKE_CONTAINER" -p "127.0.0.1:${SMOKE_PORT}:3000" "$image" >/dev/null
  local attempt
  for attempt in $(seq 1 30); do
    if curl -fsS --max-time 5 "http://127.0.0.1:${SMOKE_PORT}/api/status" | grep -q '"success"[[:space:]]*:[[:space:]]*true'; then
      docker rm -f "$SMOKE_CONTAINER" >/dev/null
      SMOKE_CONTAINER=""
      log "isolated smoke test passed"
      return
    fi
    sleep 2
  done
  docker logs "$SMOKE_CONTAINER" --tail 100 || true
  die "isolated smoke test failed; production was not changed"
}

write_compose_image() {
  local image="$1"
  grep -qE '^[[:space:]]*image:[[:space:]]*[^[:space:]]+' "$COMPOSE_FILE" || die "compose image line not found"
  sed -i -E "s|^([[:space:]]*image:[[:space:]]*).*$|\\1${image}|" "$COMPOSE_FILE"
  grep -qF "image: $image" "$COMPOSE_FILE" || die "failed to update compose image"
}

wait_for_production() {
  local attempt container_id state health
  for attempt in $(seq 1 45); do
    container_id="$(current_container)"
    if [[ -n "$container_id" ]]; then
      state="$(docker inspect -f '{{.State.Status}}' "$container_id" 2>/dev/null || true)"
      health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$container_id" 2>/dev/null || true)"
      if [[ "$state" == "running" && "$health" == "healthy" ]] && check_local_status; then
        return 0
      fi
    fi
    sleep 2
  done
  return 1
}

prune_backups() {
  local count=0 backup
  while IFS= read -r backup; do
    count=$((count + 1))
    if [[ $count -gt $KEEP_BACKUPS ]]; then
      rm -rf -- "$backup"
    fi
  done < <(find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name '20*' -printf '%T@ %p\n' | sort -nr | cut -d' ' -f2-)
}

switch_production() {
  local image="$1" timestamp backup old_image
  timestamp="$(date '+%Y%m%d-%H%M%S')"
  backup="$BACKUP_DIR/$timestamp"
  old_image="$(current_image)"
  mkdir -p "$backup"
  cp -a "$COMPOSE_FILE" "$APP_DIR/.env" "$backup/"

  log "stopping production briefly for a consistent data backup"
  docker compose --env-file "$APP_DIR/.env" -f "$COMPOSE_FILE" stop new-api
  tar -C "$APP_DIR" -czf "$backup/data-and-logs.tar.gz" data logs
  printf '%s\n' "$old_image" > "$backup/previous-image.txt"

  write_compose_image "$image"
  log "switching production to $image"
  if ! docker compose --env-file "$APP_DIR/.env" -f "$COMPOSE_FILE" up -d --no-build new-api || ! wait_for_production; then
    log "new version failed health checks; rolling back to $old_image"
    cp -a "$backup/docker-compose.yml" "$COMPOSE_FILE"
    docker compose --env-file "$APP_DIR/.env" -f "$COMPOSE_FILE" up -d --no-build new-api || true
    wait_for_production || die "automatic rollback did not become healthy; inspect docker logs immediately"
    die "update failed and was rolled back successfully"
  fi

  local running_image
  running_image="$(current_image)"
  [[ "$running_image" == "$image" ]] || die "running image mismatch after update"
  prune_backups
  log "update completed successfully"
  log "running_image=$running_image"
  log "backup=$backup"
}

run_update() {
  prepare_swap
  prepare_source
  local image
  image="$(build_image | tee /dev/stderr | tail -n 1)"
  [[ "$image" == "$IMAGE_REPO:"* ]] || die "could not determine built image tag"
  smoke_test "$image"
  switch_production "$image"
}

require_root
require_commands
exec 9>"$LOCK_FILE"
flock -n 9 || die "another updater process is already running"

case "$MODE" in
  --check)
    deployment_check
    ;;
  --update)
    trap cleanup EXIT INT TERM
    deployment_check
    run_update
    ;;
  --help|-h)
    usage
    ;;
  *)
    usage
    exit 2
    ;;
esac
