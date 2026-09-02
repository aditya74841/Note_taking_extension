import { Note } from '../models/note.model.js';
import { DomainPin } from '../models/pin.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// One-Time Restore: Fetch all notes and domain pins for current user
export const restoreUserNotes = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const notes = await Note.find({ userId, isDeleted: false }).select('-__v');
    const pins = await DomainPin.find({ userId }).select('-__v');

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          notes,
          pins,
        },
        'All user notes restored successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Backup single note (upsert or soft-delete)
export const backupNote = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { urlKey, domain, fullUrl, title, content, color, updatedAt, isDeleted } = req.body;

    if (!urlKey) {
      throw new ApiError(400, 'urlKey is required');
    }

    if (isDeleted) {
      await Note.findOneAndUpdate(
        { userId, urlKey },
        { isDeleted: true, updatedAt: updatedAt || Date.now() },
        { upsert: true }
      );
      return res
        .status(200)
        .json(new ApiResponse(200, null, 'Note deleted in cloud backup'));
    }

    const updatedNote = await Note.findOneAndUpdate(
      { userId, urlKey },
      {
        userId,
        urlKey,
        domain,
        fullUrl,
        title: title || '',
        content: content || '',
        color: color || 'default',
        updatedAt: updatedAt || Date.now(),
        isDeleted: false,
      },
      { new: true, upsert: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, updatedNote, 'Note backed up successfully'));
  } catch (error) {
    next(error);
  }
};

// Backup or unpin domain mapping
export const backupDomainPin = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { domain, urlKey, title, fullUrl, isUnpin } = req.body;

    if (!domain) {
      throw new ApiError(400, 'domain is required');
    }

    if (isUnpin) {
      await DomainPin.findOneAndDelete({ userId, domain });
      return res
        .status(200)
        .json(new ApiResponse(200, null, 'Domain pin removed in cloud backup'));
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
      { new: true, upsert: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, updatedPin, 'Domain pin backed up successfully'));
  } catch (error) {
    next(error);
  }
};
