import { Note } from '../models/note.model.js';
import { DomainPin } from '../models/pin.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/async-handler.js';
import { parsePaginationQuery, createPaginationMeta } from '../utils/pagination.js';
import { sanitizeNoteHtml } from '../utils/sanitize.js';

// ── GET /restore ────────────────────────────────────────────────────────
// Paginated restore: Fetch notes and all domain pins for current user
export const restoreUserNotes = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page, limit, skip, sort } = parsePaginationQuery(req.validatedQuery);
  const filter = { userId };

  const [notes, totalNotes] = await Promise.all([
    Note.find(filter).sort(sort).skip(skip).limit(limit).select('-__v'),
    Note.countDocuments(filter),
  ]);
  const pins = await DomainPin.find({ userId }).select('-__v');

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { notes, pins },
        'All user notes restored successfully',
        createPaginationMeta({ page, limit, total: totalNotes }),
      ),
    );
});

// ── POST /backup ────────────────────────────────────────────────────────
// Backup single note with LWW conflict protection and HTML sanitization
export const backupNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { urlKey, domain, fullUrl, title, content, color, updatedAt, isDeleted } = req.body;

  // Soft-delete path: mark note as deleted in cloud
  if (isDeleted) {
    const incomingTime = updatedAt || Date.now();
    const existing = await Note.findOne({ userId, urlKey });

    // LWW check on soft-delete: only apply if incoming is newer
    if (existing && existing.updatedAt > incomingTime) {
      return res
        .status(409)
        .json(new ApiResponse(409, existing, 'Conflict: server has a newer version'));
    }

    await Note.findOneAndUpdate(
      { userId, urlKey },
      { isDeleted: true, updatedAt: incomingTime, $inc: { version: 1 } },
      { upsert: true },
    );
    return res.status(200).json(new ApiResponse(200, null, 'Note deleted in cloud backup'));
  }

  // Upsert path: sanitize content and apply LWW
  const incomingTime = updatedAt || Date.now();
  const existing = await Note.findOne({ userId, urlKey });

  // LWW conflict protection: reject if server has a newer version
  if (existing && existing.updatedAt > incomingTime) {
    return res
      .status(409)
      .json(new ApiResponse(409, existing, 'Conflict: server has a newer version'));
  }

  const sanitizedContent = sanitizeNoteHtml(content || '');

  const updatedNote = await Note.findOneAndUpdate(
    { userId, urlKey },
    {
      userId,
      urlKey,
      domain,
      fullUrl,
      title: title || '',
      content: sanitizedContent,
      color: color || 'default',
      updatedAt: incomingTime,
      isDeleted: false,
      $inc: { version: 1 },
    },
    { new: true, upsert: true },
  );

  return res.status(200).json(new ApiResponse(200, updatedNote, 'Note backed up successfully'));
});

// ── POST /pin ───────────────────────────────────────────────────────────
// Backup or unpin domain mapping
export const backupDomainPin = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { domain, urlKey, title, fullUrl, isUnpin } = req.body;

  if (isUnpin) {
    await DomainPin.findOneAndDelete({ userId, domain });
    return res.status(200).json(new ApiResponse(200, null, 'Domain pin removed in cloud backup'));
  }

  const updatedPin = await DomainPin.findOneAndUpdate(
    { userId, domain },
    {
      userId,
      domain,
      urlKey,
      title: title || '',
      fullUrl: fullUrl || '',
      updatedAt: Date.now(),
    },
    { new: true, upsert: true },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPin, 'Domain pin backed up successfully'));
});

// ── GET /backup-explorer ────────────────────────────────────────────────
// Paginated Cloud Backup Explorer: active notes, deleted notes, pins, stats
export const getCloudBackupExplorer = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page, limit } = parsePaginationQuery(req.validatedQuery);
  const skip = (page - 1) * limit;
  const sortOrder = req.validatedQuery?.sortOrder === 'asc' ? 1 : -1;
  const domainFilter = req.validatedQuery?.domain;

  const activeFilter = { userId, isDeleted: false };
  const deletedFilter = { userId, isDeleted: true };
  if (domainFilter) {
    activeFilter.domain = domainFilter;
    deletedFilter.domain = domainFilter;
  }

  const [activeNotes, totalActive, deletedNotes, totalDeleted, pins] = await Promise.all([
    Note.find(activeFilter).sort({ updatedAt: sortOrder }).skip(skip).limit(limit).select('-__v'),
    Note.countDocuments(activeFilter),
    Note.find(deletedFilter).sort({ updatedAt: sortOrder }).skip(skip).limit(limit).select('-__v'),
    Note.countDocuments(deletedFilter),
    DomainPin.find({ userId }).sort({ updatedAt: -1 }).select('-__v'),
  ]);

  const uniqueDomains = Array.from(new Set(activeNotes.map((note) => note.domain)));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        activeNotes,
        deletedNotes,
        pins,
        stats: {
          totalActiveNotes: totalActive,
          totalDeletedNotes: totalDeleted,
          totalPins: pins.length,
          totalDomains: uniqueDomains.length,
        },
      },
      'Cloud backup data retrieved successfully',
      {
        active: createPaginationMeta({ page, limit, total: totalActive }),
        deleted: createPaginationMeta({ page, limit, total: totalDeleted }),
      },
    ),
  );
});

// ── POST /restore-deleted ───────────────────────────────────────────────
// Restore a soft-deleted note in Cloud MongoDB
export const restoreDeletedNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { urlKey } = req.body;

  const restored = await Note.findOneAndUpdate(
    { userId, urlKey },
    { isDeleted: false, updatedAt: Date.now(), $inc: { version: 1 } },
    { new: true },
  );
  if (!restored) throw new ApiError(404, 'Note not found in cloud backup');

  return res
    .status(200)
    .json(new ApiResponse(200, restored, 'Note restored from trash successfully'));
});

// ── POST /purge ─────────────────────────────────────────────────────────
// Permanently delete (purge) a note and clean up any orphaned domain pin
export const purgeCloudNote = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { urlKey } = req.body;

  const deleted = await Note.findOneAndDelete({ userId, urlKey });
  if (!deleted) throw new ApiError(404, 'Note not found in cloud backup');

  // Clean up orphaned domain pin that referenced this note's urlKey
  await DomainPin.deleteOne({ userId, urlKey });

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Note permanently purged from cloud storage'));
});
